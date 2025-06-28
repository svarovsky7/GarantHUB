import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';

export interface ArchiveFile {
  id: string;
  name: string;
  path: string;
  mime: string;
}

export interface UnitArchive {
  officialDocs: ArchiveFile[];
  defectDocs: ArchiveFile[];
  courtDocs: ArchiveFile[];
  drawings: ArchiveFile[];
}

function mapFile(a: any): ArchiveFile {
  if (!a) return { id: '', name: '', path: '', mime: '' };
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
  };
}

export function useUnitArchive(unitId?: number) {
  return useQuery<UnitArchive>({
    queryKey: ['unit-archive', unitId],
    enabled: !!unitId,
    queryFn: async () => {
      const result: UnitArchive = {
        officialDocs: [],
        defectDocs: [],
        courtDocs: [],
        drawings: [],
      };
      if (!unitId) return result;

      const { data: claimRows } = await supabase
        .from('claim_units')
        .select('claim_id')
        .eq('unit_id', unitId);
      const claimIds = (claimRows ?? []).map((r: any) => r.claim_id);
      if (claimIds.length) {
        const { data } = await supabase
          .from('claim_attachments')
          .select(
            'attachments(id, storage_path, file_url:path, file_type:mime_type, original_name)',
          )
          .in('claim_id', claimIds);
        result.officialDocs = (data ?? []).map((r: any) => mapFile(r.attachments));
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
            'attachments(id, storage_path, file_url:path, file_type:mime_type, original_name)',
          )
          .in('defect_id', defectIds);
        result.defectDocs = (data ?? []).map((r: any) => mapFile(r.attachments));
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
            'attachments(id, storage_path, file_url:path, file_type:mime_type, original_name)',
          )
          .in('court_case_id', caseIds);
        result.courtDocs = (data ?? []).map((r: any) => mapFile(r.attachments));
      }

      const { data: letterRows } = await supabase
        .from('letter_units')
        .select('letter_id')
        .eq('unit_id', unitId);
      const letterIds = (letterRows ?? []).map((r: any) => r.letter_id);
      if (letterIds.length) {
        const { data } = await supabase
          .from('letter_attachments')
          .select(
            'attachments(id, storage_path, file_url:path, file_type:mime_type, original_name)',
          )
          .in('letter_id', letterIds);
        result.drawings = (data ?? []).map((r: any) => mapFile(r.attachments));
      }

      return result;
    },
    staleTime: 5 * 60_000,
  });
}
