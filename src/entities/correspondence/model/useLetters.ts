import { useQuery } from '@tanstack/react-query';
import { useProjectFilter } from '@/shared/hooks/useProjectFilter';
import { supabase } from '@/shared/api/supabaseClient';
import type { CorrespondenceLetter, CorrespondenceAttachment } from '@/shared/types/correspondence';
import { getSenderName, getReceiverName } from '../lib/contactResolver';
import { transformAttachment } from '../lib/letterTransformers';

const LETTERS_TABLE = 'letters';
const LINKS_TABLE = 'letter_links';
const LETTER_UNITS_TABLE = 'letter_units';
const LETTER_ATTACH_TABLE = 'letter_attachments';

/**
 * Получить список всех писем с вложениями и связями.
 */
export function useLetters() {
  const { projectIds, onlyAssigned, enabled } = useProjectFilter();

  return useQuery({
    queryKey: [LETTERS_TABLE, projectIds.join(',')],
    enabled,
    queryFn: async () => {
      let query = supabase
        .from(LETTERS_TABLE)
        .select(
          `id, project_id, number, letter_type_id, direction, status_id, letter_date, subject, content, sender_person_id, sender_contractor_id, receiver_person_id, receiver_contractor_id, responsible_user_id, created_at, created_by`
        );
      if (onlyAssigned) {
        query = query.in('project_id', projectIds.length ? projectIds : [-1]);
      }
      const { data, error } = await query.order('id', { ascending: false });
      if (error) throw error;

      const letterIds = (data ?? []).map((r: any) => r.id) as number[];

      const { data: links, error: linkErr } = await supabase
        .from(LINKS_TABLE)
        .select('id, parent_id, child_id');
      if (linkErr) throw linkErr;

      const { data: unitRows, error: unitErr } = letterIds.length
        ? await supabase
            .from(LETTER_UNITS_TABLE)
            .select('letter_id, unit_id')
            .in('letter_id', letterIds)
        : { data: [], error: null };
      if (unitErr) throw unitErr;
      const unitMap: Record<number, number[]> = {};
      (unitRows ?? []).forEach((u: any) => {
        if (!unitMap[u.letter_id]) unitMap[u.letter_id] = [];
        unitMap[u.letter_id].push(u.unit_id);
      });

      const { data: attachRows, error: attErr } = letterIds.length
        ? await supabase
            .from(LETTER_ATTACH_TABLE)
            .select(
              'letter_id, attachments(id, storage_path, file_url:path, file_type:mime_type, original_name, description, created_at, created_by, uploaded_by)'
            )
            .in('letter_id', letterIds)
        : { data: [], error: null };
      if (attErr) throw attErr;
      const attachmentsMap: Record<number, CorrespondenceAttachment[]> = {};
      (attachRows ?? []).forEach((row: any) => {
        const file = row.attachments;
        if (!file) return;
        const arr = attachmentsMap[row.letter_id] ?? [];
        arr.push(transformAttachment(file));
        attachmentsMap[row.letter_id] = arr;
      });

      const personIds = Array.from(
        new Set((data ?? []).flatMap((r: any) => [r.sender_person_id, r.receiver_person_id].filter(Boolean)))
      );
      const contractorIds = Array.from(
        new Set((data ?? []).flatMap((r: any) => [r.sender_contractor_id, r.receiver_contractor_id].filter(Boolean)))
      );
      const personsMap: Record<number, string> = {};
      if (personIds.length) {
        const { data: persons, error: pErr } = await supabase
          .from('persons')
          .select('id, full_name')
          .in('id', personIds as number[]);
        if (pErr) throw pErr;
        (persons ?? []).forEach((p: any) => {
          personsMap[p.id] = p.full_name;
        });
      }
      const contractorsMap: Record<number, string> = {};
      if (contractorIds.length) {
        const { data: cons, error: cErr } = await supabase
          .from('contractors')
          .select('id, name')
          .in('id', contractorIds as number[]);
        if (cErr) throw cErr;
        (cons ?? []).forEach((c: any) => {
          contractorsMap[c.id] = c.name;
        });
      }
      const linkMap = new Map<number, number>();
      (links ?? []).forEach((lnk) => linkMap.set(lnk.child_id, lnk.parent_id));
      return (data ?? []).map((row: any) => {
        const type =
          (row.direction as 'incoming' | 'outgoing') ||
          (row.receiver_person_id != null || row.receiver_contractor_id != null
            ? 'outgoing'
            : 'incoming');
        const sender =
          personsMap[row.sender_person_id] ||
          contractorsMap[row.sender_contractor_id] ||
          '';
        const receiver =
          personsMap[row.receiver_person_id] ||
          contractorsMap[row.receiver_contractor_id] ||
          '';
        const attachments = attachmentsMap[row.id] ?? [];
        return {
          id: String(row.id),
          type,
          parent_id: linkMap.get(row.id) != null ? String(linkMap.get(row.id)) : null,
          responsible_user_id: row.responsible_user_id
            ? String(row.responsible_user_id)
            : null,
          status_id: row.status_id ?? null,
          letter_type_id: row.letter_type_id ?? null,
          project_id: row.project_id ?? null,
          unit_ids: unitMap[row.id] ?? [],
          attachment_ids: attachments.map((a) => Number(a.id)),
          number: row.number,
          date: row.letter_date,
          sender,
          receiver,
          subject: row.subject ?? '',
          content: row.content ?? '',
          created_by: row.created_by ?? null,
          created_at: row.created_at ?? null,

          attachments,
        } as CorrespondenceLetter;
      });
    },
    staleTime: 5 * 60_000,
  });
}

/**
 * Получить детальную информацию о письме по ID.
 */
export function useLetter(letterId: number | string | undefined) {
  const id = Number(letterId);
  return useQuery({
    queryKey: ['letter', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(LETTERS_TABLE)
        .select(
          `id, project_id, number, letter_type_id, direction, status_id, letter_date, subject, content, sender_person_id, sender_contractor_id, receiver_person_id, receiver_contractor_id, responsible_user_id, created_at, created_by`
        )
        .eq('id', id)
        .single();
      if (error) throw error;
      const { data: link } = await supabase
        .from(LINKS_TABLE)
        .select('parent_id')
        .eq('child_id', id)
        .maybeSingle();
      const type =
        (data?.direction as 'incoming' | 'outgoing') ||
        (data?.receiver_person_id != null || data?.receiver_contractor_id != null
          ? 'outgoing'
          : 'incoming');

      const sender = await getSenderName(data?.sender_person_id ?? null, data?.sender_contractor_id ?? null);
      const receiver = await getReceiverName(data?.receiver_person_id ?? null, data?.receiver_contractor_id ?? null);

      const { data: units } = await supabase
        .from(LETTER_UNITS_TABLE)
        .select('unit_id')
        .eq('letter_id', id);
      const unitIds = (units ?? []).map((u: any) => u.unit_id);

      const { data: attachRows } = await supabase
        .from(LETTER_ATTACH_TABLE)
        .select('attachment_id, attachments(id, storage_path, file_url:path, file_type:mime_type, original_name, description, created_at, created_by, uploaded_by)')
        .eq('letter_id', id);
      const attachments = (attachRows ?? []).map((row: any) => {
        const f = row.attachments;
        return transformAttachment(f);
      });
      return {
        id: String(data!.id),
        type,
        parent_id: link?.parent_id != null ? String(link.parent_id) : null,
        responsible_user_id: data?.responsible_user_id ? String(data.responsible_user_id) : null,
        status_id: data?.status_id ?? null,
        letter_type_id: data?.letter_type_id ?? null,
        project_id: data?.project_id ?? null,
        unit_ids: unitIds,
        attachment_ids: attachments.map((f) => Number(f.id)),
        number: data!.number,
        date: data!.letter_date,
        sender,
        receiver,
        subject: data?.subject ?? '',
        content: data?.content ?? '',
        created_by: data?.created_by ?? null,
        created_at: data?.created_at ?? null,
        attachments,
      } as CorrespondenceLetter & { attachments: any[] };
    },
    staleTime: 5 * 60_000,
  });
}
