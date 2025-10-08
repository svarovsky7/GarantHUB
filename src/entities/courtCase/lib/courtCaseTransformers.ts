import type { CourtCaseSummary, CourtCaseSummaryWithDayjs } from '@/shared/types/courtCaseSummary';
import { supabase } from '@/shared/api/supabaseClient';
import dayjs from 'dayjs';

const CASES_TABLE = 'court_cases';
const ATTACH_BUCKET = import.meta.env.VITE_ATTACH_BUCKET || 'attachments';

/**
 * Преобразует запись из court_cases_summary в объект судебного дела с удобными полями.
 */
export function mapCourtCaseSummary(r: CourtCaseSummary): CourtCaseSummaryWithDayjs {
  const toDayjs = (d: any) => (d ? (dayjs(d).isValid() ? dayjs(d) : null) : null);

  return {
    ...r,
    // Преобразуем строковые даты в объекты Dayjs
    fixStartDate: toDayjs(r.fix_start_date),
    fixEndDate: toDayjs(r.fix_end_date),
    createdAt: toDayjs(r.created_at),
    updatedAt: toDayjs(r.updated_at),
    caseDate: toDayjs(r.date),

    // Алиасы для совместимости
    projectName: r.project_name ?? '—',
    statusName: r.status_name ?? '—',
    statusColor: r.status_color,
    responsibleLawyerName: r.lawyer_name,
    caseUid: r.case_uid,

    // Инициализируем пустые массивы (заполняются отдельно при необходимости)
    unit_ids: [],
    defect_ids: [],
    party_ids: [],
    claim_ids: [],

    // UI поля
    unitNames: '',
    unitNumbers: '',
    buildings: '',
    attachments: [],
  } as CourtCaseSummaryWithDayjs;
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
 * Проверяет уникальность номера судебного дела.
 * @param number Номер для проверки
 * @returns `true`, если номер свободен
 */
export async function isCaseNumberUnique(number: string): Promise<boolean> {
  const { data, error } = await supabase
    .from(CASES_TABLE)
    .select('id')
    .eq('number', number)
    .maybeSingle();
  if (error && error.code !== 'PGRST116') throw error;
  return !data?.id;
}
