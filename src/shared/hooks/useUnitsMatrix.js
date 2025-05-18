import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/shared/api/supabaseClient';

// универсальный хук для матрицы квартир
export default function useUnitsMatrix(projectId, building, section) {
    const [units, setUnits] = useState([]);
    const [floors, setFloors] = useState([]);
    const [unitsByFloor, setUnitsByFloor] = useState({});

    // Вынос fetchUnits наружу для возможности вызова из родителя после удаления
    const fetchUnits = useCallback(async () => {
        if (!projectId || !building) {
            setUnits([]);
            setFloors([]);
            setUnitsByFloor({});
            return;
        }
        let query = supabase
            .from('units')
            .select('*')
            .eq('project_id', projectId)
            .eq('building', building);
        if (section) query = query.eq('section', section);
        const { data } = await query;
        setUnits(data || []);
    }, [projectId, building, section]);

    useEffect(() => { fetchUnits(); }, [fetchUnits]);

    useEffect(() => {
        // floors (без 0)
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

        // unitsByFloor
        const map = {};
        units.forEach(u => {
            if (!map[u.floor]) map[u.floor] = [];
            map[u.floor].push(u);
        });
        setUnitsByFloor(map);
    }, [units]);

    // --- добавление этажа и квартиры ---
    const handleAddUnit = async (floor) => {
        let maxNum = 0;
        if (unitsByFloor[floor] && unitsByFloor[floor].length > 0) {
            // На этаже уже есть квартиры — берём максимальный номер на этом этаже
            const nums = unitsByFloor[floor]
                .map(u => Number(u.name))
                .filter(v => !isNaN(v));
            if (nums.length > 0) maxNum = Math.max(...nums);
        } else {
            // На этаже нет квартир — ищем этаж ниже
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

    // Теперь новый этаж = максимальный этаж + 1 (вверх)
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
        units, // для кастомных компонент-гридов
        setUnits,
        fetchUnits,
    };
}
