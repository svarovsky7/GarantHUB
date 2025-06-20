import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import { useProjectFilter } from '@/shared/hooks/useProjectFilter';
import type { CourtCase, Defect } from '@/shared/types/courtCase';
import type { NewCaseFile } from '@/shared/types/caseFile';
import { addCaseAttachments, getAttachmentsByIds, ATTACH_BUCKET } from '../attachment';

const CASES_TABLE = 'court_cases';
const DEFECTS_TABLE = 'defects';
const CASE_DEFECTS_TABLE = 'court_case_defects';
const CASE_LINKS_TABLE = 'court_case_links';

export function useCourtCases() {
  const { projectId, projectIds, onlyAssigned } = useProjectFilter();
  return useQuery({
    queryKey: [CASES_TABLE, projectId, projectIds.join(',')],
    queryFn: async () => {
      let query = supabase.from(CASES_TABLE).select('*');
      if (onlyAssigned) {
        query = query.in('project_id', projectIds.length ? projectIds : [-1]);
      }
      query = query.order('created_at', { ascending: false });
      const { data, error } = await query;
      if (error) throw error;
      const { data: links, error: linkErr } = await supabase
        .from(CASE_LINKS_TABLE)
        .select('parent_id, child_id');
      if (linkErr) throw linkErr;
      const linkMap = new Map<number, number>();
      (links ?? []).forEach((l) => linkMap.set(l.child_id, l.parent_id));
      return (data ?? []).map((row: any) => ({
        ...row,
        parent_id: linkMap.get(row.id) ?? null,
      })) as CourtCase[];
    },
    staleTime: 5 * 60_000,
  });
}


export function useAddCourtCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<CourtCase, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from(CASES_TABLE)
        .insert(payload)
        .select('*')
        .single();
      if (error) throw error;
      return data as CourtCase;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [CASES_TABLE] }),
  });
}

export function useUpdateCourtCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<CourtCase> }) => {
      const { data, error } = await supabase
        .from(CASES_TABLE)
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      return data as CourtCase;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [CASES_TABLE] }),
  });
}

export function useDeleteCourtCase() {
  const { projectId } = useProjectFilter();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, project_id }: { id: number; project_id?: number }) => {
      const { data: courtCase } = await supabase
        .from(CASES_TABLE)
        .select('attachment_ids, project_id')
        .eq('id', id)
        .single();

      const ids = (courtCase?.attachment_ids ?? []) as number[];

      if (ids.length) {
        const files = await getAttachmentsByIds(ids);
        if (files?.length) {
          await supabase.storage
            .from(ATTACH_BUCKET)
            .remove(files.map((f) => f.storage_path));
        }
        await supabase.from('attachments').delete().in('id', ids);
      }

      const projectIdToMatch = project_id ?? projectId ?? courtCase.project_id;
      const { error } = await supabase
        .from(CASES_TABLE)
        .delete()
        .eq('id', id)
        .eq('project_id', projectIdToMatch);
      if (error) throw error;
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [CASES_TABLE] }),
  });
}


export function useCaseDefects(caseId: number) {
  return useQuery({
    queryKey: [CASE_DEFECTS_TABLE, caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(CASE_DEFECTS_TABLE)
        .select(
          'defect_id, defects(id, description, defect_type_id, defect_status_id, received_at, fixed_at)'
        )
        .eq('case_id', caseId);
      if (error) throw error;
      const rows = data ?? [];
      return rows.map((r: any) => ({
        id: r.defects.id,
        description: r.defects.description,
        defect_type_id: r.defects.defect_type_id,
        defect_status_id: r.defects.defect_status_id,
        received_at: r.defects.received_at,
        fixed_at: r.defects.fixed_at,
        case_id: caseId,
      })) as Defect[];
    },
    enabled: !!caseId,
    staleTime: 5 * 60_000,
  });
}

export function useAddDefect() {
  const qc = useQueryClient();
  return useMutation({
    /**
     * Creates a defect record and links it to a court case.
     * `project_id` is required by DB constraints, so it must be provided.
     */
    mutationFn: async (
      payload: { case_id: number; project_id: number } & Omit<Defect, 'id' | 'case_id'>,
    ) => {
      const { data, error } = await supabase
        .from(DEFECTS_TABLE)
        .insert({
          project_id: payload.project_id,
          description: payload.description,
          defect_type_id: payload.defect_type_id,
          defect_status_id: payload.defect_status_id,
          received_at: payload.received_at,
          fixed_at: payload.fixed_at,
        })
        .select('id')
        .single();
      if (error) throw error;
      const defId = data.id;
      const { error: linkErr } = await supabase
        .from(CASE_DEFECTS_TABLE)
        .insert({ case_id: payload.case_id, defect_id: defId });
      if (linkErr) throw linkErr;
      qc.invalidateQueries({ queryKey: [CASE_DEFECTS_TABLE, payload.case_id] });
      return {
        id: defId,
        description: payload.description,
        defect_type_id: payload.defect_type_id,
        defect_status_id: payload.defect_status_id,
        received_at: payload.received_at,
        fixed_at: payload.fixed_at,
      } as Defect;
    },
  });
}

export function useDeleteDefect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, case_id }: { id: number; case_id: number }) => {
      const { error } = await supabase
        .from(CASE_DEFECTS_TABLE)
        .delete()
        .eq('case_id', case_id)
        .eq('defect_id', id);
      if (error) throw error;
      return { id, case_id };
    },
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: [CASE_DEFECTS_TABLE, vars.case_id] });
    },
  });
}

export function useUpdateDefect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      case_id,
      updates,
    }: {
      id: number;
      case_id: number;
      updates: Pick<
        Defect,
        'description' | 'defect_type_id' | 'defect_status_id' | 'received_at' | 'fixed_at'
      >;
    }) => {
      const { error } = await supabase
        .from(DEFECTS_TABLE)
        .update({
          description: updates.description,
          defect_type_id: updates.defect_type_id,
          defect_status_id: updates.defect_status_id,
          received_at: updates.received_at,
          fixed_at: updates.fixed_at,
        })
        .eq('id', id);
      if (error) throw error;
      return { id, case_id, ...updates };
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: [CASE_DEFECTS_TABLE, vars.case_id] });
    },
  });
}

export function useCaseLinks() {
  return useQuery({
    queryKey: [CASE_LINKS_TABLE],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(CASE_LINKS_TABLE)
        .select('id, parent_id, child_id');
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60_000,
  });
}

export function useLinkCases() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ parentId, childIds }: { parentId: string; childIds: string[] }) => {
      const ids = childIds.map((c) => Number(c));
      if (ids.length === 0) return;
      await supabase.from(CASE_LINKS_TABLE).delete().in('child_id', ids);
      const rows = ids.map((child_id) => ({ parent_id: Number(parentId), child_id }));
      await supabase.from(CASE_LINKS_TABLE).insert(rows);
      qc.invalidateQueries({ queryKey: [CASE_LINKS_TABLE] });
      qc.invalidateQueries({ queryKey: [CASES_TABLE] });
    },
  });
}

export function useUnlinkCase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const childId = Number(id);
      await supabase.from(CASE_LINKS_TABLE).delete().eq('child_id', childId);
      qc.invalidateQueries({ queryKey: [CASE_LINKS_TABLE] });
      qc.invalidateQueries({ queryKey: [CASES_TABLE] });
    },
  });
}

export function useCourtCase(caseId: number | string | undefined) {
  const id = Number(caseId);
  const qc = useQueryClient();
  return useQuery({
    queryKey: ['court_case', id],
    enabled: !!id,
    queryFn: async () => {
      console.log('[useCourtCase] fetch start', id);
      const { data, error } = await supabase
        .from(CASES_TABLE)
        .select('*')
        .eq('id', id)
        .single();
      console.log('[useCourtCase] fetch result', data, error);
      if (error) throw error;
      let attachments: any[] = [];
      if (data?.attachment_ids?.length) {
        const files = await getAttachmentsByIds(data.attachment_ids);
        attachments = files;
        console.log('[useCourtCase] attachments', files);
      }
      const result = { ...(data as any), attachments } as CourtCase & { attachments: any[] };
      console.log('[useCourtCase] final', result);
      return result;
    },
    staleTime: 5 * 60_000,
  });
}

export function useUpdateCourtCaseFull() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      newAttachments = [],
      removedAttachmentIds = [],
      updatedAttachments = [],
      updates = {},
    }: {
      id: number;
      newAttachments?: NewCaseFile[];
      removedAttachmentIds?: number[];
      updatedAttachments?: { id: number; type_id: number | null }[];
      updates?: Partial<CourtCase>;
    }) => {
      const { data: current } = await supabase
        .from(CASES_TABLE)
        .select('attachment_ids')
        .eq('id', id)
        .single();
      let ids: number[] = current?.attachment_ids ?? [];
      if (removedAttachmentIds.length) {
        const { data: atts } = await supabase
          .from('attachments')
          .select('storage_path')
          .in('id', removedAttachmentIds);
        if (atts?.length)
          await supabase.storage
            .from(ATTACH_BUCKET)
            .remove(atts.map((a) => a.storage_path));
        await supabase.from('attachments').delete().in('id', removedAttachmentIds);
        ids = ids.filter((i) => !removedAttachmentIds.includes(Number(i)));
      }
      if (Object.keys(updates).length) {
        const { error } = await supabase
          .from(CASES_TABLE)
          .update(updates)
          .eq('id', id);
        if (error) throw error;
      }
      if (updatedAttachments.length) {
        // attachment type updates removed
      }
      let uploaded: any[] = [];
      if (newAttachments.length) {
        uploaded = await addCaseAttachments(newAttachments, id);
        ids = ids.concat(uploaded.map((u) => u.id));
      }
      if (
        Object.keys(updates).length ||
        removedAttachmentIds.length ||
        newAttachments.length ||
        updatedAttachments.length
      ) {
        const { error } = await supabase
          .from(CASES_TABLE)
          .update({ attachment_ids: ids })
          .eq('id', id);
        if (error) throw error;
      }
      return uploaded;
    },
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: [CASES_TABLE] });
      qc.invalidateQueries({ queryKey: ['court_case', vars.id] });
    },
  });
}

export async function signedUrl(path: string, filename = ''): Promise<string> {
  const { data, error } = await supabase.storage
    .from(ATTACH_BUCKET)
    .createSignedUrl(path, 60, { download: filename || undefined });
  if (error) throw error;
  return data.signedUrl;
}
