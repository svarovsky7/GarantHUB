import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/shared/api/supabaseClient';
import { useAuthStore } from '@/shared/store/authStore';
import { useCourtCaseStatuses } from '@/entities/courtCaseStatus';

/**
 * Универсальный хук для шахматки квартир.
 * Загружает объекты проекта и связанные сущности:
 * - активные судебные дела
 * - письма, связанные с объектами
 * - претензии с их статусами
 *
 * @param {number} projectId ID проекта
 * @param {string} building  Корпус
 */
export default function useUnitsMatrix(projectId, building) {
    const [units, setUnits] = useState([]); // объекты выбранного корпуса
    const [floors, setFloors] = useState([]);
    const [unitsByFloor, setUnitsByFloor] = useState({});
    const [casesByUnit, setCasesByUnit] = useState({});
    const [lettersByUnit, setLettersByUnit] = useState({});
    const [claimsByUnit, setClaimsByUnit] = useState({});
    const [filteredUnits, setFilteredUnits] = useState([]);

    const { data: stages = [] } = useCourtCaseStatuses();
    const closedStageId = useMemo(
        () => stages.find(s => /закры/i.test(s.name))?.id,
        [stages]
    );

    const fetchUnits = useCallback(async () => {
        if (!projectId) {
            setUnits([]);
            setFloors([]);
            setUnitsByFloor({});
            setFilteredUnits([]);
            return;
        }
        // Грузим units только для выбранного корпуса
        let query = supabase
            .from('units')
            .select('*')
            .eq('project_id', projectId);
        if (building) query = query.eq('building', building);
        const { data: unitsData } = await query;
        setUnits(unitsData || []);
        const filtered = unitsData || [];
        setFilteredUnits(filtered);

        // Грузим замечания, письма и судебные дела только для отображаемых юнитов
        if (filtered.length > 0) {
            const unitIds = filtered.map(u => u.id);

            // Court cases (не закрытые)
            const { data: casesData } = await supabase
                .from('court_case_units')
                .select('unit_id, court_cases!inner(id,status,project_id)')
                .in('unit_id', unitIds)
                .eq('court_cases.project_id', projectId);
            const casesMap = {};
            (casesData || [])
                .filter(row =>
                    row.court_cases &&
                    (!closedStageId || row.court_cases.status !== closedStageId)
                )
                .forEach(row => {
                    const uid = row.unit_id;
                    const c = row.court_cases;
                    if (!casesMap[uid]) casesMap[uid] = [];
                    casesMap[uid].push({ id: c.id });
                });
            setCasesByUnit(casesMap);

            // Letters linked with units
            const { data: letterRows } = await supabase
                .from('letter_units')
                .select('unit_id, letters!inner(id, project_id)')
                .in('unit_id', unitIds)
                .eq('letters.project_id', projectId);
            const letterMap = {};
            (letterRows || []).forEach(row => {
                letterMap[row.unit_id] = true;
            });
            setLettersByUnit(letterMap);

            // Claims linked with units
            const { data: claimRows } = await supabase
                .from('claim_units')
                .select(
                    'unit_id, claims!inner(id, project_id, is_official, claim_status_id, statuses(color))'
                )
                .in('unit_id', unitIds)
                .eq('claims.project_id', projectId);
            const claimMap = {};
            (claimRows || []).forEach(row => {
                const cl = row.claims;
                if (!cl) return;
                if (!claimMap[row.unit_id]) {
                    claimMap[row.unit_id] = {
                        color: cl.statuses?.color ?? null,
                        official: cl.is_official ?? false,
                    };
                }
            });
            setClaimsByUnit(claimMap);
        } else {
            setCasesByUnit({});
            setLettersByUnit({});
            setClaimsByUnit({});
        }
    }, [projectId, building, closedStageId]);

    useEffect(() => { fetchUnits(); }, [fetchUnits]);

        // В floors и unitsByFloor отправляем только по текущему building
    useEffect(() => {
        const currentUnits = filteredUnits;
        const unique = Array.from(
            new Map(
                currentUnits
                    .filter(u => u.floor !== null && u.floor !== undefined && u.floor !== 0)
                    .map(u => [String(u.floor), u.floor])
            ).values()
        );
        unique.sort((a, b) => {
            if (!isNaN(a) && !isNaN(b)) return b - a;
            if (!isNaN(a)) return -1;
            if (!isNaN(b)) return 1;
            return 0;
        });
        setFloors(unique);

        const map = {};
        currentUnits.forEach(u => {
            if (!map[u.floor]) map[u.floor] = [];
            map[u.floor].push(u);
        });
        setUnitsByFloor(map);
    }, [filteredUnits]);

    // Добавить квартиру (только в выбранный корпус/секцию)
    const handleAddUnit = async (floor) => {
        const userId = useAuthStore.getState().profile?.id ?? null;
        let maxNum = 0;
        if (unitsByFloor[floor] && unitsByFloor[floor].length > 0) {
            const nums = unitsByFloor[floor]
                .map(u => Number(u.name))
                .filter(v => !isNaN(v));
            if (nums.length > 0) maxNum = Math.max(...nums);
        } else {
            const idx = floors.indexOf(floor);
            let belowFloor = idx < floors.length - 1 ? floors[idx + 1] : null;
            if (belowFloor && unitsByFloor[belowFloor] && unitsByFloor[belowFloor].length > 0) {
                const nums = unitsByFloor[belowFloor]
                    .map(u => Number(u.name))
                    .filter(v => !isNaN(v));
                if (nums.length > 0) maxNum = Math.max(...nums);
            }
        }
        const newName = String(maxNum + 1);
        const payload = {
            project_id: projectId,
            building: building || null,
            floor,
            name: newName,
            person_id: userId,
        };
        const { error } = await supabase.from('units').insert([payload]);
        if (!error) {
            await fetchUnits(); // <-- только fetchUnits!
        }
    };

    const handleAddFloor = async () => {
        let candidate = null;
        const numericFloors = floors.filter(f => !isNaN(f));
        if (numericFloors.length === 0) {
            candidate = 1;
        } else {
            const max = Math.max(...numericFloors);
            candidate = max + 1;
        }
        await handleAddUnit(candidate);
    };

    // Возвращаем данные для визуализации шахматки
    return {
        // Для шахматки (только по выбранному building)
        floors,
        unitsByFloor,
        handleAddUnit,
        handleAddFloor,
        // Возвращаем объекты выбранного корпуса
        units,
        setUnits,
        fetchUnits,
        casesByUnit,
        lettersByUnit,
        claimsByUnit,
    };
}
