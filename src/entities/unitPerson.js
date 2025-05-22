// src/entities/unitPerson.js
// -----------------------------------------------------------------------------
// Many-to-many: единица (unit) ↔ физлицо (person)
// Все операции БЕЗ project_id (unit_persons связывает только unit и person)
// -----------------------------------------------------------------------------
import { supabase } from '@/shared/api/supabaseClient';
import {
    useQuery,
    useMutation,
    useQueryClient,
} from '@tanstack/react-query';

/* колонки для выборки связей + вложенный объект person */
const FIELDS =
    'unit_id, person:persons ( id, full_name, phone, email )';

/* ─────────────────── READ ─────────────────── */
/**
 * Получить всех физических лиц объекта.
 * @param {number} unitId
 */
export const useUnitPersons = (unitId) => {
    return useQuery({
        queryKey: ['unit_persons', unitId],
        enabled : !!unitId,
        queryFn : async () => {
            const { data, error } = await supabase
                .from('unit_persons')
                .select(FIELDS)
                .eq('unit_id', unitId)
                .order('person_id');
            if (error) throw error;
            return data ?? [];
        },
        staleTime: 5 * 60_000,
    });
};

/* ─────────────────── CREATE ─────────────────── */
const insertLink = async ({ unit_id, person_id }) => {
    const { error } = await supabase
        .from('unit_persons')
        .upsert(
            { unit_id, person_id },
            { ignoreDuplicates: true },
        );
    if (error) throw error;
};

/** Добавить физлицо к объекту */
export const useAddUnitPerson = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ unit_id, person_id }) =>
            insertLink({ unit_id, person_id }),
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: ['unit_persons', vars.unit_id] });
            qc.invalidateQueries({ queryKey: ['units'] });
        },
    });
};

/* ─────────────────── DELETE ─────────────────── */
const deleteLink = async ({ unit_id, person_id }) => {
    const { error } = await supabase
        .from('unit_persons')
        .delete()
        .eq('unit_id', unit_id)
        .eq('person_id', person_id);
    if (error) throw error;
};

/** Удалить физлицо из объекта */
export const useDeleteUnitPerson = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ unit_id, person_id }) =>
            deleteLink({ unit_id, person_id }),
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: ['unit_persons', vars.unit_id] });
            qc.invalidateQueries({ queryKey: ['units'] }); // <- критично для моментального обновления таблицы объектов!
        },
    });
};
