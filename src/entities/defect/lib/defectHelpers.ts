import { supabase } from '@/shared/api/supabaseClient';
import type { DefectSummary, DefectSummaryWithDayjs } from '@/shared/types/defectSummary';
import { ATTACH_BUCKET } from '@/entities/attachment';
import dayjs from 'dayjs';

const TABLE = 'defects';

/**
 * Преобразует запись из defects_summary в объект дефекта с удобными полями.
 */
export function mapDefectSummary(r: DefectSummary): DefectSummaryWithDayjs {
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
 * Создает подписанный URL для доступа к файлу в хранилище.
 */
export async function signedUrl(path: string, filename = ''): Promise<string> {
  const { data, error } = await supabase.storage
    .from(ATTACH_BUCKET)
    .createSignedUrl(path, 60, { download: filename || undefined });
  if (error) throw error;
  return data.signedUrl;
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
    .update({ updated_by: null })
    .eq('id', defectId);
}
