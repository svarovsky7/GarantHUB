import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/shared/api/supabaseClient';

// универсальный хук для матрицы квартир
export default function useUnitsMatrix(projectId, building, section) {
    const [units, setUnits] = useState([]);
    const [floors, setFloors] = useState([]);
    const [unitsByFloor, setUnitsByFloor] = useState({});
    const [ticketsByUnit, setTicketsByUnit] = useState({});

    const fetchUnits = useCallback(async () => {
        if (!projectId || !building) {
            setUnits([]);
            setFloors([]);
            setUnitsByFloor({});
            setTicketsByUnit({});
            return;
        }
        // Грузим units
        let query = supabase
            .from('units')
            .select('*')
            .eq('project_id', projectId)
            .eq('building', building);
        if (section) query = query.eq('section', section);
        const { data: unitsData } = await query;
        setUnits(unitsData || []);

        // Грузим замечания с цветом статуса
        if (unitsData && unitsData.length > 0) {
            const unitIds = unitsData.map(u => u.id);
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

    useEffect(() => {
        const unique = Array.from(
            new Map(
                units
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
        units.forEach(u => {
            if (!map[u.floor]) map[u.floor] = [];
            map[u.floor].push(u);
        });
        setUnitsByFloor(map);
    }, [units]);

    const handleAddUnit = async (floor) => {
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
            building,
            section: section || null,
            floor,
            name: newName,
        };
        const { data, error } = await supabase.from('units').insert([payload]).select('*');
        if (!error) setUnits((prev) => [...prev, data[0]]);
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
        floors,
        unitsByFloor,
        handleAddUnit,
        handleAddFloor,
        units,
        setUnits,
        fetchUnits,
        ticketsByUnit, // Новый ключ
    };
}
