import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import { fetchByChunks } from '@/shared/api/fetchAll';
import type { CourtCaseParty } from '@/shared/types/courtCaseParty';

const TABLE = 'court_case_parties';

const FIELDS =
  'id, case_id, person_id, contractor_id, project_id, role, created_at,' +
  ' persons(full_name, passport_series, passport_number, phone, email),' +
  ' contractors(name, inn)';

type CasePartyWithRelations = CourtCaseParty & {
  persons?: {
    full_name: string;
    passport_series?: string | null;
    passport_number?: string | null;
    phone?: string | null;
    email?: string | null;
  } | null;
  contractors?: { name: string; inn?: string | null } | null;
};

export function useCaseParties(caseId?: number | null) {
  return useQuery({
    queryKey: [TABLE, caseId],
    enabled: !!caseId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE)
        .select(FIELDS)
        .eq('case_id', caseId as number)
        .order('id');
      if (error) throw error;
      return (data ?? []) as unknown as CasePartyWithRelations[];
    },
    staleTime: 5 * 60_000,
  });
}

export function useCasePartiesByCaseIds(caseIds: number[]) {
  return useQuery({
    queryKey: [TABLE, 'by-ids', caseIds.join(',')],
    enabled: Array.isArray(caseIds) && caseIds.length > 0,
    queryFn: async () => {
      const rows = await fetchByChunks(caseIds, (chunk) =>
        supabase.from(TABLE).select(FIELDS).in('case_id', chunk),
      );
      return (rows ?? []) as unknown as CasePartyWithRelations[];
    },
    staleTime: 5 * 60_000,
  });
}

export function useAddCaseParties() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rows: Omit<CourtCaseParty, 'id' | 'created_at'>[]) => {
      if (!rows.length) return [] as CourtCaseParty[];
      const { data, error } = await supabase
        .from(TABLE)
        .insert(rows)
        .select(FIELDS);
      if (error) throw error;
      return (data ?? []) as unknown as CourtCaseParty[];
    },
    onSuccess: (rows) => {
      if (rows.length) {
        qc.invalidateQueries({ queryKey: [TABLE] });
      }
    },
  });
}

export function useUpdateCaseParty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<CourtCaseParty> }) => {
      const { data, error } = await supabase
        .from(TABLE)
        .update(updates)
        .eq('id', id)
        .select(FIELDS)
        .single();
      if (error) throw error;
      return data as unknown as CourtCaseParty;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TABLE] });
    },
  });
}

export function useDeleteCaseParty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data, error } = await supabase
        .from(TABLE)
        .select('case_id')
        .eq('id', id)
        .single();
      if (error) throw error;
      const caseId = data.case_id as number;
      const { error: delErr } = await supabase.from(TABLE).delete().eq('id', id);
      if (delErr) throw delErr;
      return caseId;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [TABLE] }),
  });
}
