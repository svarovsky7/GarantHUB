import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import type { ArchiveFile, UnitArchive } from '@/shared/types/unitArchive';

function mapFile(a: any, entityId?: number): ArchiveFile {
  if (!a) return { id: '', name: '', path: '', mime: '', entityId };
  let name = a.original_name;
  if (!name) {
    try {
      name = decodeURIComponent(
        a.storage_path.split('/').pop()?.replace(/^\d+_/, '') || a.storage_path,
      );
    } catch {
      name = a.storage_path;
    }
  }
  return {
    id: String(a.id),
    name,
    path: a.file_url,
    mime: a.file_type,
    entityId,
  };
}

export function useUnitArchive(unitId?: number) {
  return useQuery<UnitArchive>({
    queryKey: ['unit-archive', unitId],
    enabled: !!unitId,
    queryFn: async () => {
      const result: UnitArchive = {
        objectDocs: [],
        remarkDocs: [],
        defectDocs: [],
        courtDocs: [],
      };
      if (!unitId) return result;

      const { data: letterRows } = await supabase
        .from('letter_units')
        .select('letter_id')
        .eq('unit_id', unitId);
      const letterIds = (letterRows ?? []).map((r: any) => r.letter_id);
      if (letterIds.length) {
        const { data } = await supabase
          .from('letter_attachments')
          .select(
            'letter_id, attachments(id, storage_path, file_url:path, file_type:mime_type, original_name)',
          )
          .in('letter_id', letterIds);
        result.objectDocs = (data ?? []).map((r: any) =>
          mapFile(r.attachments, r.letter_id),
        );
      }

      const { data: claimRows } = await supabase
        .from('claim_units')
        .select('claim_id')
        .eq('unit_id', unitId);
      const claimIds = (claimRows ?? []).map((r: any) => r.claim_id);
      if (claimIds.length) {
        const { data } = await supabase
          .from('claim_attachments')
          .select(
            'claim_id, attachments(id, storage_path, file_url:path, file_type:mime_type, original_name)',
          )
          .in('claim_id', claimIds);
        result.remarkDocs = (data ?? []).map((r: any) =>
          mapFile(r.attachments, r.claim_id),
        );
      }

      const { data: defectRows } = await supabase
        .from('defects')
        .select('id')
        .eq('unit_id', unitId);
      const defectIds = (defectRows ?? []).map((r: any) => r.id);
      if (defectIds.length) {
        const { data } = await supabase
          .from('defect_attachments')
          .select(
            'defect_id, attachments(id, storage_path, file_url:path, file_type:mime_type, original_name)',
          )
          .in('defect_id', defectIds);
        result.defectDocs = (data ?? []).map((r: any) =>
          mapFile(r.attachments, r.defect_id),
        );
      }

      const { data: caseRows } = await supabase
        .from('court_case_units')
        .select('court_case_id')
        .eq('unit_id', unitId);
      const caseIds = (caseRows ?? []).map((r: any) => r.court_case_id);
      if (caseIds.length) {
        const { data } = await supabase
          .from('court_case_attachments')
          .select(
            'court_case_id, attachments(id, storage_path, file_url:path, file_type:mime_type, original_name)',
          )
          .in('court_case_id', caseIds);
        result.courtDocs = (data ?? []).map((r: any) =>
          mapFile(r.attachments, r.court_case_id),
        );
      }

      return result;
    },
    staleTime: 5 * 60_000,
  });
}
