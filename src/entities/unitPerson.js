// src/entities/unitPerson.js
// -----------------------------------------------------------------------------
// Many-to-many: единица (unit) ↔ физлицо (person)
// Все операции фильтруются по project_id текущего пользователя
// -----------------------------------------------------------------------------
// Основано на исходной версии  :contentReference[oaicite:4]{index=4}
import { supabase } from '@/shared/api/supabaseClient';
import { useProjectId } from '@/shared/hooks/useProjectId';
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
    const projectId = useProjectId();
    return useQuery({
        queryKey: ['unit_persons', unitId, projectId],
        enabled : !!unitId && !!projectId,
        queryFn : async () => {
            const { data, error } = await supabase
                .from('unit_persons')
                .select(FIELDS)
                .eq('unit_id', unitId)
                .eq('project_id', projectId)
                .order('person_id');
            if (error) throw error;
            return data ?? [];
        },
    });
};

/* ─────────────────── CREATE ─────────────────── */
const insertLink = async ({ unit_id, person_id, project_id }) => {
    const { error } = await supabase
        .from('unit_persons')
        .upsert(
            { unit_id, person_id, project_id },
            { ignoreDuplicates: true },
        );
    if (error) throw error;
};

/** Добавить физлицо к объекту */
export const useAddUnitPerson = () => {
    const projectId = useProjectId();
    const qc        = useQueryClient();
    return useMutation({
        mutationFn: ({ unit_id, person_id }) =>
            insertLink({ unit_id, person_id, project_id: projectId }),
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: ['unit_persons', vars.unit_id, projectId] });
            qc.invalidateQueries({ queryKey: ['units', projectId] });
        },
    });
};

/* ─────────────────── DELETE ─────────────────── */
const deleteLink = async ({ unit_id, person_id, project_id }) => {
    const { error } = await supabase
        .from('unit_persons')
        .delete()
        .eq('unit_id', unit_id)
        .eq('person_id', person_id)
        .eq('project_id', project_id);
    if (error) throw error;
};

/** Удалить физлицо из объекта */
export const useDeleteUnitPerson = () => {
    const projectId = useProjectId();
    const qc        = useQueryClient();
    return useMutation({
        mutationFn: ({ unit_id, person_id }) =>
            deleteLink({ unit_id, person_id, project_id: projectId }),
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: ['unit_persons', vars.unit_id, projectId] });
            qc.invalidateQueries({ queryKey: ['units', projectId] });
        },
    });
};
