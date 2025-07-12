import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import { fetchPaged } from '@/shared/api/fetchAll';
import type { PostgrestSingleResponse } from '@supabase/supabase-js';
import { useNotify } from '@/shared/hooks/useNotify';
import { addDefectAttachments, getAttachmentsByIds, ATTACH_BUCKET } from '@/entities/attachment';
import { useAuthStore } from '@/shared/store/authStore';
import type { DefectRecord } from '@/shared/types/defect';
import type { DefectWithNames } from '@/shared/types/defectWithNames';
import type { DefectWithFiles } from '@/shared/types/defectWithFiles';
import type { DefectSummary, DefectSummaryWithDayjs } from '@/shared/types/defectSummary';
import dayjs from 'dayjs';

export interface NewDefect {
  description: string;
  type_id: number | null;
  status_id: number | null;
  project_id: number | null;
  /** Основной объект */
  unit_id: number | null;
  brigade_id: number | null;
  contractor_id: number | null;
  /** Автор создания */
  created_by: string | null;
  is_warranty: boolean;
  received_at: string | null;
  fixed_at: string | null;
  fixed_by: string | null;
  engineer_id: string | null;
}

const TABLE = 'defects';
const SUMMARY_TABLE = 'defects_summary';

/**
 * Преобразует запись из defects_summary в объект дефекта с удобными полями.
 */
function mapDefectSummary(r: DefectSummary): DefectSummaryWithDayjs {
  const toDayjs = (d: any) => (d ? (dayjs(d).isValid() ? dayjs(d) : null) : null);
  
  return {
    ...r,
    // Преобразуем строковые даты в объекты Dayjs
    receivedAt: toDayjs(r.received_at),
    fixedAt: toDayjs(r.fixed_at),
    createdAt: toDayjs(r.created_at),
    updatedAt: toDayjs(r.updated_at),
    
    // Алиасы для совместимости
    projectName: r.project_name ?? '—',
    unitName: r.unit_name,
    unitBuilding: r.unit_building,
    unitFloor: r.unit_floor,
    typeName: r.type_name,
    statusName: r.status_name ?? '—',
    statusColor: r.status_color,
    brigadeName: r.brigade_name,
    contractorName: r.contractor_name,
    engineerName: r.engineer_name,
    fixedByName: r.fixed_by_name,
    
    // Дополнительные алиасы
    defectTypeName: r.type_name,
    defectStatusName: r.status_name,
    defectStatusColor: r.status_color,
    
    // UI поля
    attachments: [],
  } as DefectSummaryWithDayjs;
}

/**
 * Хук получения списка дефектов с использованием представления defects_summary (оптимизированный).
 */
export function useDefectsSummary() {
  return useQuery<DefectSummaryWithDayjs[]>({
    queryKey: [SUMMARY_TABLE],
    queryFn: async () => {
      const rows = await fetchPaged<DefectSummary>((from, to) =>
        supabase
          .from(SUMMARY_TABLE)
          .select('*')
          .order('id', { ascending: false })
          .range(from, to),
      );
      
      return (rows ?? []).map((r: DefectSummary) => mapDefectSummary(r));
    },
    staleTime: 5 * 60_000,
  });
}

/**
 * Получить все дефекты проекта без вложений.
 * Вложения загружаются отдельно при запросе конкретного дефекта.
 * @deprecated Используйте useDefectsSummary для более быстрой работы
 */
export function useDefects() {
  return useQuery<DefectRecord[]>({
    queryKey: [TABLE],
    queryFn: async () => {
      const rows = await fetchPaged<DefectRecord>((from, to) =>
        supabase
          .from(TABLE)
        .select(
          'id, description, type_id, status_id, project_id, unit_id, created_by, updated_by, updated_at, brigade_id, contractor_id, is_warranty, received_at, fixed_at, fixed_by, engineer_id, created_at,' +
            ' defect_type:defect_types!fk_defects_type(id,name), defect_status:statuses!fk_defects_status(id,name,color), fixed_by_user:profiles!fk_defects_fixed_by(id,name)'
        )
          .order('id', { ascending: false })
          .range(from, to) as unknown as PromiseLike<PostgrestSingleResponse<DefectRecord[]>>,
      );
      return rows;
    },
    staleTime: 5 * 60_000,
  });
}

/** Получить дефект по ID */

/**
 * Получить один дефект с вложениями и связными названиями
 * типа и статуса.
 */
export function useDefect(id?: number) {
  return useQuery<DefectWithFiles | null>({
    queryKey: ['defect', id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE)
        .select(
          'id, description, type_id, status_id, project_id, unit_id, created_by, updated_by, updated_at, brigade_id, contractor_id, is_warranty, received_at, fixed_at, fixed_by, engineer_id, created_at,' +
          ' defect_type:defect_types!fk_defects_type(id,name), defect_status:statuses!fk_defects_status(id,name,color), fixed_by_user:profiles!fk_defects_fixed_by(id,name)'
        )
        .eq('id', id as number)
        .single();
      if (error) throw error;
      const { data: attachRows, error: attachErr } = await supabase
        .from('defect_attachments')
        .select(
          'attachments(id, storage_path, file_url:path, file_type:mime_type, original_name, description, created_at, created_by, uploaded_by)'
        )
        .eq('defect_id', id as number);
      if (attachErr) throw attachErr;
      const attachments = (attachRows ?? []).map((r: any) => r.attachments);
      return {
        ...(data as any),
        attachments,
      } as DefectWithFiles;
    },
    staleTime: 5 * 60_000,
  });
}

/**
 * Получить статусы дефектов по их идентификаторам.
 * Возвращает `id` и название статуса.
 */
/**
 * Получить количество файлов для каждого дефекта
 */
export function useDefectFileCounts(defectIds: number[]) {
  return useQuery<Record<number, number>>({
    queryKey: ['defect-file-counts', defectIds],
    enabled: defectIds.length > 0,
    queryFn: async () => {
      if (defectIds.length === 0) return {};
      
      const { data, error } = await supabase
        .from('defect_attachments')
        .select('defect_id')
        .in('defect_id', defectIds);
        
      if (error) throw error;
      
      const counts: Record<number, number> = {};
      defectIds.forEach(id => counts[id] = 0);
      
      (data ?? []).forEach((row: any) => {
        counts[row.defect_id] = (counts[row.defect_id] || 0) + 1;
      });
      
      return counts;
    },
    staleTime: 5 * 60_000,
  });
}

export function useDefectsByIds(ids?: number[]) {
  return useQuery<{ id: number; statusName: string | null }[]>({
    queryKey: ['defects-by-ids', (ids ?? []).join(',')],
    enabled: Array.isArray(ids) && ids.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE)
        .select('id, defect_status:statuses!fk_defects_status(name)')
        .in('id', ids as number[]);
      if (error) throw error;
      return (data ?? []).map((d: any) => ({
        id: d.id,
        statusName: d.defect_status?.name ?? null,
      }));
    },
    staleTime: 5 * 60_000,
  });
}

/**
 * Получить дефекты по их идентификаторам со связанными названиями
 * типа и статуса.
 */
export function useDefectsWithNames(ids?: number[]) {
  return useQuery<DefectWithNames[]>({
    queryKey: ['defects-with-names', (ids ?? []).join(',')],
    enabled: Array.isArray(ids) && ids.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE)
        .select(
          'id, description, type_id, status_id, project_id, unit_id, created_by, updated_by, updated_at, brigade_id, contractor_id, is_warranty, received_at, fixed_at, fixed_by, engineer_id, defect_type:defect_types!fk_defects_type(id,name), defect_status:statuses!fk_defects_status(id,name,color), fixed_by_user:profiles!fk_defects_fixed_by(id,name)'
        )
        .in('id', ids as number[]);
      if (error) throw error;
      return (data ?? []).map((d: any) => ({
        id: d.id,
        description: d.description,
        type_id: d.type_id,
        status_id: d.status_id,
        project_id: d.project_id,
        unit_id: d.unit_id,
        created_by: d.created_by,
        updated_by: d.updated_by,
        updated_at: d.updated_at,
        brigade_id: d.brigade_id,
        contractor_id: d.contractor_id,
        is_warranty: d.is_warranty,
        received_at: d.received_at,
        fixed_at: d.fixed_at,
        fixed_by: d.fixed_by,
        engineer_id: d.engineer_id,
        defectTypeName: d.defect_type?.name ?? null,
        defectStatusName: d.defect_status?.name ?? null,
        defectStatusColor: d.defect_status?.color ?? null,
        fixedByUserName: d.fixed_by_user?.name ?? null,
      })) as DefectWithNames[];
    },
    staleTime: 5 * 60_000,
  });
}

/**
 * Создать несколько дефектов одним запросом и вернуть массив их идентификаторов.
 * Возвращаемые ID могут быть строками при большом значении, поэтому
 * преобразуем их к `number` для единообразия.
 */
export function useCreateDefects() {
  const qc = useQueryClient();
  const notify = useNotify();
  return useMutation<number[], Error, NewDefect[]>({
    async mutationFn(defects) {
      if (!defects.length) return [];
      const userId = useAuthStore.getState().profile?.id ?? null;
      const rows = defects.map((d) => ({
        ...d,
        created_by: d.created_by ?? userId,
      }));
      const { data, error } = await supabase
        .from(TABLE)
        .insert(rows)
        .select('id');
      if (error) throw error;
      return (data as { id: string | number }[]).map((d) => Number(d.id));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TABLE] });
      qc.invalidateQueries({ queryKey: [SUMMARY_TABLE] });
    },
    onError: (e) => notify.error(e.message),
  });
}

/** Удалить дефект */
export function useDeleteDefect() {
  const qc = useQueryClient();
  const notify = useNotify();
  return useMutation<number, Error, number>({
    mutationFn: async (id: number) => {
      // Remove defect from related claims to keep data consistent
      await supabase.from('claim_defects').delete().eq('defect_id', id);

      const { error } = await supabase.from(TABLE).delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: (id) => {
      qc.invalidateQueries({ queryKey: [TABLE] });
      qc.invalidateQueries({ queryKey: [SUMMARY_TABLE] });
      qc.invalidateQueries({ queryKey: ['defect', id] });
      qc.invalidateQueries({ queryKey: ['defects-with-names'] });
      qc.invalidateQueries({ queryKey: ['defects-by-ids'] });
      qc.invalidateQueries({ queryKey: ['claims'] });
    },
    onError: (e) => notify.error(e.message),
  });
}

/**
 * Обновить данные дефекта
 */
export function useUpdateDefect() {
  const qc = useQueryClient();
  const notify = useNotify();
  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: number;
      updates: Partial<
        Pick<
          DefectRecord,
          | 'description'
          | 'type_id'
          | 'status_id'
          | 'brigade_id'
          | 'contractor_id'
          | 'is_warranty'
          | 'received_at'
          | 'fixed_at'
        >
      >;
    }) => {
      const userId = useAuthStore.getState().profile?.id ?? null;
      const { error } = await supabase
        .from(TABLE)
        .update({ ...updates, updated_by: userId ?? undefined })
        .eq('id', id);
      if (error) throw error;
      return { id, ...updates };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TABLE] });
      qc.invalidateQueries({ queryKey: [SUMMARY_TABLE] });
    },
    onError: (e: any) => notify.error(`Ошибка обновления дефекта: ${e.message}`),
  });
}

/** Обновить статус дефекта */
export function useUpdateDefectStatus() {
  const qc = useQueryClient();
  const notify = useNotify();
  return useMutation<{ id: number; status_id: number | null }, Error, { id: number; statusId: number | null }>({
    mutationFn: async ({ id, statusId }) => {
      const userId = useAuthStore.getState().profile?.id ?? null;
      const { data, error } = await supabase
        .from(TABLE)
        .update({ status_id: statusId, updated_by: userId ?? undefined })
        .eq('id', id)
        .select('id, status_id')
        .single();
      if (error) throw error;
      return data as { id: number; status_id: number | null };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TABLE] });
      qc.invalidateQueries({ queryKey: [SUMMARY_TABLE] });
    },
    onError: (e) => notify.error(`Ошибка обновления статуса: ${e.message}`),
  });
}

/** Обновить признак устранения дефекта */

/** Обновить данные устранения дефекта */
export function useFixDefect() {
  const qc = useQueryClient();
  const notify = useNotify();
  return useMutation({
    mutationFn: async ({
      id,
      brigade_id,
      contractor_id,
      fixed_at,
      engineer_id,
      attachments = [],
      removedAttachmentIds = [],
      updatedAttachments = [],
    }: {
      id: number;
      brigade_id: number | null;
      contractor_id: number | null;
      fixed_at: string | null;
      engineer_id: string | null;
      attachments: { file: File; type_id: number | null }[];
      removedAttachmentIds?: number[];
      updatedAttachments?: { id: number; type_id: number | null }[];
    }) => {
      const { data: current } = await supabase
        .from('defect_attachments')
        .select('attachment_id, attachments(storage_path)')
        .eq('defect_id', id);
      let ids: number[] = (current ?? []).map((r: any) => r.attachment_id);
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
        await supabase
          .from('defect_attachments')
          .delete()
          .eq('defect_id', id)
          .in('attachment_id', removedAttachmentIds);
        ids = ids.filter((i) => !removedAttachmentIds.includes(Number(i)));
      }
      let uploaded: any[] = [];
      if (attachments.length) {
        uploaded = await addDefectAttachments(
          attachments.map((a: any) => ({
            file: a.file,
            type_id: a.type_id ?? null,
            description: a.description,
          })),
          id,
        );
        const rows = uploaded.map((u) => ({
          defect_id: id,
          attachment_id: u.id,
        }));
        if (rows.length) await supabase.from('defect_attachments').insert(rows);
        ids = ids.concat(uploaded.map((u) => u.id));
      }
      if (updatedAttachments.length) {
        // attachment type updates removed
      }
      const userId = useAuthStore.getState().profile?.id ?? null;
      const { data: st } = await supabase
        .from('statuses')
        .select('id')
        .ilike('name', '%провер%')
        .eq('entity', 'defect')
        .maybeSingle();
      const checkingId = st?.id ?? null;
      const { error } = await supabase
        .from(TABLE)
        .update({
          brigade_id,
          contractor_id,
          fixed_at,
          engineer_id,
          fixed_by: userId,
          status_id: checkingId,
          updated_by: userId ?? undefined,
        })
        .eq('id', id);
      if (error) throw error;

      // \u041F\u043E\u0441\u043B\u0435 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u044F \u0434\u0435\u0444\u0435\u043A\u0442\u0430 \u043F\u0440\u043E\u0432\u0435\u0440\u044F\u0435\u043C, \u043D\u0435 \u0441\u043E\u0434\u0435\u0440\u0436\u0438\u0442 \u043B\u0438 \u043F\u0440\u0435\u0442\u0435\u043D\u0437\u0438\u044F \u0432\u0441\u0435 \u0434\u0435\u0444\u0435\u043A\u0442\u044B \u0432 \u0441\u0442\u0430\u0442\u0443\u0441\u0435 "\u043D\u0430 \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0443".
      const { data: claimRows } = await supabase
        .from('claim_defects')
        .select('claim_id')
        .eq('defect_id', id);
      const claimIds = (claimRows ?? []).map((r: any) => r.claim_id);

      if (claimIds.length) {
        const { data: claimStatusRow } = await supabase
          .from('statuses')
          .select('id')
          .ilike('name', '%\u043F\u0440\u043E\u0432\u0435\u0440%')
          .eq('entity', 'claim')
          .maybeSingle();
        const claimCheckingId = claimStatusRow?.id ?? null;

        if (claimCheckingId) {
          const updateIds: number[] = [];
          for (const cId of claimIds) {
            const { data: defRows } = await supabase
              .from('claim_defects')
              .select('defect_id')
              .eq('claim_id', cId);
            const defectIds = (defRows ?? []).map((d: any) => d.defect_id);

            const { data: statuses } = defectIds.length
              ? await supabase
                  .from('defects')
                  .select('statuses!fk_defects_status(name)')
                  .in('id', defectIds)
              : { data: [] };

            const allFixed = (statuses ?? []).every((s: any) => {
              const name = s.statuses?.name?.toLowerCase() ?? '';
              return /\u043F\u0440\u043E\u0432\u0435\u0440|\u0437\u0430\u043A\u0440\u044B/.test(name);
            });

            if (allFixed) updateIds.push(cId);
          }
          if (updateIds.length) {
            await supabase
              .from('claims')
              .update({ claim_status_id: claimCheckingId })
              .in('id', updateIds);
          }
        }
      }

      return uploaded;
    },
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: [TABLE] });
      qc.invalidateQueries({ queryKey: [SUMMARY_TABLE] });
      qc.invalidateQueries({ queryKey: ['defect', vars.id] });
      qc.invalidateQueries({ queryKey: ['defects-by-ids'] });
      qc.invalidateQueries({ queryKey: ['claims'] });
      notify.success('Дефект обновлён');
    },
    onError: (e: any) => notify.error(`Ошибка обновления: ${e.message}`),
  });
}

/**
 * Снять подтверждение об устранении дефекта и вернуть статус "В РАБОТЕ".
 */
export function useCancelDefectFix() {
  const qc = useQueryClient();
  const notify = useNotify();
  return useMutation<number, Error, number>({
    async mutationFn(id) {
      const { data: st } = await supabase
        .from('statuses')
        .select('id')
        .ilike('name', '%работ%')
        .eq('entity', 'defect')
        .maybeSingle();
      const inWorkId = st?.id ?? null;

      const { error } = await supabase
        .from(TABLE)
        .update({
          brigade_id: null,
          contractor_id: null,
          fixed_at: null,
          fixed_by: null,
          status_id: inWorkId,
          updated_by: useAuthStore.getState().profile?.id ?? undefined,
        })
        .eq('id', id);
      if (error) throw error;

      // \u041E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0435 \u0441\u0442\u0430\u0442\u0443\u0441\u043E\u0432 \u043F\u0440\u0435\u0442\u0435\u043D\u0437\u0438\u0439,
      // \u0435\u0441\u043B\u0438 \u0434\u043E\u043F\u0443\u0441\u0442\u0438\u043C\u043E \u0434\u0435\u0444\u0435\u043A\u0442\u044B
      // \u0431\u043E\u043B\u044C\u0448\u0435 \u043D\u0435 \u0432\u0441\u0435 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u044B.
      const { data: claimRows } = await supabase
        .from('claim_defects')
        .select('claim_id')
        .eq('defect_id', id);
      const claimIds = (claimRows ?? []).map((r: any) => r.claim_id);

      if (claimIds.length) {
        const { data: clSt } = await supabase
          .from('statuses')
          .select('id')
          .ilike('name', '%работ%')
          .eq('entity', 'claim')
          .maybeSingle();
        const claimInWorkId = clSt?.id ?? null;

        if (claimInWorkId) {
          const updateIds: number[] = [];
          for (const cId of claimIds) {
            const { data: defRows } = await supabase
              .from('claim_defects')
              .select('defect_id')
              .eq('claim_id', cId);
            const defectIds = (defRows ?? []).map((d: any) => d.defect_id);

            const { data: statuses } = defectIds.length
              ? await supabase
                  .from('defects')
                  .select('statuses!fk_defects_status(name)')
                  .in('id', defectIds)
              : { data: [] };

            const allFixed = (statuses ?? []).every((s: any) => {
              const name = s.statuses?.name?.toLowerCase() ?? '';
              return /\u043F\u0440\u043E\u0432\u0435\u0440|\u0437\u0430\u043A\u0440\u044B/.test(name);
            });

            if (!allFixed) updateIds.push(cId);
          }
          if (updateIds.length) {
            await supabase
              .from('claims')
              .update({ claim_status_id: claimInWorkId })
              .in('id', updateIds);
          }
        }
      }

      return id;
    },
    onSuccess: (_id) => {
      qc.invalidateQueries({ queryKey: [TABLE] });
      qc.invalidateQueries({ queryKey: [SUMMARY_TABLE] });
      qc.invalidateQueries({ queryKey: ['defect', _id] });
      qc.invalidateQueries({ queryKey: ['defects-by-ids'] });
      qc.invalidateQueries({ queryKey: ['claims'] });
      notify.success('Подтверждение снято');
    },
    onError: (e: any) => notify.error(`Ошибка обновления: ${e.message}`),
  });
}

export async function signedUrl(path: string, filename = ''): Promise<string> {
  const { data, error } = await supabase.storage
    .from(ATTACH_BUCKET)
    .createSignedUrl(path, 60, { download: filename || undefined });
  if (error) throw error;
  return data.signedUrl;
}

/** Добавить вложения к существующему дефекту */
export function useAddDefectAttachments() {
  const qc = useQueryClient();
  const notify = useNotify();
  return useMutation({
    mutationFn: async ({ defectId, files }: { defectId: number; files: File[] }) => {
      const uploaded = await addDefectAttachments(
        files.map((f) => ({ file: f, type_id: null, description: undefined })),
        defectId,
      );
      if (uploaded.length) {
        const rows = uploaded.map((u) => ({ defect_id: defectId, attachment_id: u.id }));
        await supabase.from('defect_attachments').insert(rows);
        await supabase
          .from(TABLE)
          .update({ updated_by: useAuthStore.getState().profile?.id ?? undefined })
          .eq('id', defectId);
      }
      return uploaded;
    },
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ['defect', vars.defectId] });
      qc.invalidateQueries({ queryKey: [TABLE] });
      qc.invalidateQueries({ queryKey: [SUMMARY_TABLE] });
      notify.success('Файлы загружены');
    },
    onError: (e: any) => notify.error(`Ошибка загрузки файлов: ${e.message}`),
  });
}

/** Удалить одно вложение дефекта */
export function useRemoveDefectAttachment() {
  const qc = useQueryClient();
  const notify = useNotify();
  return useMutation<void, Error, { defectId: number; attachmentId: number }>({
    mutationFn: async ({ defectId, attachmentId }) => {
      const { data: att } = await supabase
        .from('attachments')
        .select('storage_path')
        .eq('id', attachmentId)
        .single();
      if (att?.storage_path) {
        await supabase.storage.from(ATTACH_BUCKET).remove([att.storage_path]);
      }
      await supabase.from('attachments').delete().eq('id', attachmentId);
      await supabase
        .from('defect_attachments')
        .delete()
        .eq('defect_id', defectId)
        .eq('attachment_id', attachmentId);
      await supabase
        .from(TABLE)
        .update({ updated_by: useAuthStore.getState().profile?.id ?? undefined })
        .eq('id', defectId);
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['defect', vars.defectId] });
      qc.invalidateQueries({ queryKey: [TABLE] });
      qc.invalidateQueries({ queryKey: [SUMMARY_TABLE] });
      notify.success('Файл удалён');
    },
    onError: (e) => notify.error(`Ошибка удаления файла: ${e.message}`),
  });
}

/**
 * Удаляет несколько вложений дефекта за один запрос.
 */
export async function removeDefectAttachmentsBulk(
  defectId: number,
  attachmentIds: number[],
): Promise<void> {
  if (attachmentIds.length === 0) return;
  const { data: atts } = await supabase
    .from('attachments')
    .select('storage_path')
    .in('id', attachmentIds);
  const paths = (atts ?? [])
    .map((a: any) => a.storage_path)
    .filter(Boolean);
  if (paths.length) {
    await supabase.storage.from(ATTACH_BUCKET).remove(paths);
  }
  await supabase.from('attachments').delete().in('id', attachmentIds);
  await supabase
    .from('defect_attachments')
    .delete()
    .eq('defect_id', defectId)
    .in('attachment_id', attachmentIds);
  await supabase
    .from(TABLE)
    .update({ updated_by: useAuthStore.getState().profile?.id ?? undefined })
    .eq('id', defectId);
}
