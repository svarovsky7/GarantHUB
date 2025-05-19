import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/shared/api/supabaseClient';
import { useAuthStore } from '@/shared/store/authStore';

// Универсальный хук для матрицы квартир
export default function useUnitsMatrix(projectId, building, section) {
    const [units, setUnits] = useState([]); // <-- ВСЕ объекты проекта
    const [floors, setFloors] = useState([]);
    const [unitsByFloor, setUnitsByFloor] = useState({});
    const [ticketsByUnit, setTicketsByUnit] = useState({});
    const [filteredUnits, setFilteredUnits] = useState([]);

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

        // Грузим замечания с цветом статуса только для отображаемых юнитов
        if (filtered.length > 0) {
            const unitIds = filtered.map(u => u.id);
            const { data: ticketsData } = await supabase
                .from('tickets')
                .select(`
                    id,
                    unit_id,
                    status_id,
                    ticket_statuses(color)
                `)
                .in('unit_id', unitIds);
            const byUnit = {};
            (ticketsData || []).forEach(t => {
                if (!byUnit[t.unit_id]) byUnit[t.unit_id] = [];
                byUnit[t.unit_id].push({
                    id: t.id,
                    status_id: t.status_id,
                    color: t.ticket_statuses?.color || null,
                });
            });
            setTicketsByUnit(byUnit);
        } else {
            setTicketsByUnit({});
        }
    }, [projectId, building, section]);

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
    };
}
