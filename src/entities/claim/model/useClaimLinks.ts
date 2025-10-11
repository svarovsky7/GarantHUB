import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import { TABLE, SUMMARY_TABLE, LINK_TABLE } from './mappers';

export function useClaimLinks() {
  return useQuery({
    queryKey: [LINK_TABLE],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(LINK_TABLE)
        .select('id, parent_id, child_id');
      if (error) throw error;
      return (data ?? []) as import('@/shared/types/claimLink').ClaimLink[];
    },
    staleTime: 5 * 60_000,
  });
}

export function useLinkClaims() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ parentId, childIds }: { parentId: string; childIds: string[] }) => {
      const ids = childIds.map((c) => Number(c));
      if (ids.length === 0) return;

      // Delete existing links with chunking for large ID arrays
      console.log(`[useLinkClaims] Deleting links for ${ids.length} child claims`);
      for (let i = 0; i < ids.length; i += 1000) {
        const chunk = ids.slice(i, i + 1000);
        console.log(`[useLinkClaims] Deleting links chunk of ${chunk.length} IDs`);
        await supabase.from(LINK_TABLE).delete().in('child_id', chunk);
      }

      const rows = ids.map((child_id) => ({ parent_id: Number(parentId), child_id }));
      await supabase.from(LINK_TABLE).insert(rows);
      qc.invalidateQueries({ queryKey: [LINK_TABLE] });
      qc.invalidateQueries({ queryKey: [TABLE], exact: false });
      qc.invalidateQueries({ queryKey: [SUMMARY_TABLE], exact: false });
      qc.invalidateQueries({ queryKey: [SUMMARY_TABLE + '-all'], exact: false });
      qc.invalidateQueries({ queryKey: ['claims-optimized'], exact: false });
    },
  });
}

export function useUnlinkClaim() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number | string) => {
      const childId = Number(id);
      await supabase.from(LINK_TABLE).delete().eq('child_id', childId);
      qc.invalidateQueries({ queryKey: [LINK_TABLE] });
      qc.invalidateQueries({ queryKey: [TABLE], exact: false });
      qc.invalidateQueries({ queryKey: [SUMMARY_TABLE], exact: false });
      qc.invalidateQueries({ queryKey: [SUMMARY_TABLE + '-all'], exact: false });
      qc.invalidateQueries({ queryKey: ['claims-optimized'], exact: false });
    },
  });
}
