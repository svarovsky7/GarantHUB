import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/shared/api/supabaseClient';
import { useAuthStore } from '@/shared/store/authStore';
import { useCourtCaseStatuses } from '@/entities/courtCaseStatus';

/**
 * Универсальный хук для шахматки квартир.
 * Загружает объекты проекта, связанные тикеты и активные судебные дела.
 *
 * @param {number} projectId ID проекта
 * @param {string} building  Корпус
 * @param {string} section   Секция
 */
export default function useUnitsMatrix(projectId, building, section) {
    const [units, setUnits] = useState([]); // <-- ВСЕ объекты проекта
    const [floors, setFloors] = useState([]);
    const [unitsByFloor, setUnitsByFloor] = useState({});
    const [ticketsByUnit, setTicketsByUnit] = useState({});
    const [casesByUnit, setCasesByUnit] = useState({});
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
            setTicketsByUnit({});
            setFilteredUnits([]);
            return;
        }
        // Грузим ВСЕ units по проекту
        let query = supabase
            .from('units')
            .select('*')
            .eq('project_id', projectId);
        const { data: unitsData } = await query;
        setUnits(unitsData || []);

        // Сначала фильтруем по building/section для визуализации шахматки
        let filtered = unitsData || [];
        if (building) filtered = filtered.filter(u => String(u.building) === String(building));
        if (section) filtered = filtered.filter(u => String(u.section) === String(section));
        setFilteredUnits(filtered);

        // Грузим замечания и судебные дела только для отображаемых юнитов
        if (filtered.length > 0) {
            const unitIds = filtered.map(u => u.id);
            // Tickets
            const { data: ticketsData } = await supabase
                .from('tickets')
                .select(`
                    id,
                    unit_ids,
                    status_id,
                    statuses(color)
                `)
                .overlaps('unit_ids', unitIds);
            const byUnit = {};
            (ticketsData || []).forEach(t => {
                (t.unit_ids || []).forEach(uid => {
                    if (!byUnit[uid]) byUnit[uid] = [];
                    byUnit[uid].push({
                        id: t.id,
                        status_id: t.status_id,
                        color: t.statuses?.color || null,
                    });
                });
            });
            setTicketsByUnit(byUnit);

            // Court cases (не закрытые)
            const { data: casesData } = await supabase
                .from('court_cases')
                .select('id, unit_ids, status')
                .eq('project_id', projectId)
                .overlaps('unit_ids', unitIds);
            const casesMap = {};
            (casesData || [])
                .filter(c => !closedStageId || c.status !== closedStageId)
                .forEach(c => {
                    (c.unit_ids || []).forEach(uid => {
                        if (!casesMap[uid]) casesMap[uid] = [];
                        casesMap[uid].push({ id: c.id });
                    });
                });
            setCasesByUnit(casesMap);
        } else {
            setTicketsByUnit({});
            setCasesByUnit({});
        }
    }, [projectId, building, section, closedStageId]);

    useEffect(() => { fetchUnits(); }, [fetchUnits]);

    // В floors и unitsByFloor отправляем только по текущему building/section
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
            section: section || null,
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

    return {
        // Для шахматки (только по выбранному building/section)
        floors,
        unitsByFloor,
        handleAddUnit,
        handleAddFloor,
        // Для счетчиков — ВСЕ объекты проекта
        units,
        setUnits,
        fetchUnits,
        ticketsByUnit,
        casesByUnit,
    };
}
