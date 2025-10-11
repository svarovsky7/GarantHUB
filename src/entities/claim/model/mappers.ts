import type { ClaimSummary, ClaimSummaryWithDayjs } from '@/shared/types/claimSummary';
import type { ClaimWithNames } from '@/shared/types/claimWithNames';
import dayjs from 'dayjs';

export const TABLE = 'claims';
export const SUMMARY_TABLE = 'claims_summary';
export const LINK_TABLE = 'claim_links';

/**
 * Преобразует запись из claims_summary в объект претензии с удобными полями.
 */
export function mapClaimSummary(r: ClaimSummary): ClaimSummaryWithDayjs {
  const toDayjs = (d: any) => (d ? (dayjs(d).isValid() ? dayjs(d) : null) : null);

  return {
    ...r,
    // Преобразуем строковые даты в объекты Dayjs
    claimedOn: toDayjs(r.claimed_on),
    acceptedOn: toDayjs(r.accepted_on),
    registeredOn: toDayjs(r.registered_on),
    resolvedOn: toDayjs(r.resolved_on),
    createdAt: toDayjs(r.created_at),

    // Алиасы для совместимости
    projectName: r.project_name ?? '—',
    statusName: r.status_name ?? '—',
    statusColor: r.status_color,
    responsibleEngineerName: r.engineer_name,
    caseUid: r.case_uid,
    createdByName: r.created_by_name,

    // ✅ СОХРАНЯЕМ данные из VIEW (не перезаписываем!)
    unit_ids: r.unit_ids ?? [],
    defect_ids: r.defect_ids ?? [],
    parent_id: r.parent_id ?? null, // ✅ Теперь parent_id тоже в VIEW!

    // UI поля
    unitNames: '',
    unitNumbers: '',
    buildings: '',
    attachments: [],
    hasCheckingDefect: false,
  } as ClaimSummaryWithDayjs;
}

/**
 * Преобразует запись Supabase в объект претензии с удобными полями.
 * @deprecated Используйте mapClaimSummary для более быстрой работы
 */
export function mapClaim(r: any): ClaimWithNames {
  const toDayjs = (d: any) => (d ? (dayjs(d).isValid() ? dayjs(d) : null) : null);
  const attachments = Array.isArray(r.attachments)
    ? r.attachments.map((a: any) => {
        let name = a.original_name;
        if (!name) {
          try {
            name = decodeURIComponent(
              a.storage_path.split('/').pop()?.replace(/^\d+_/, '') ||
                a.storage_path,
            );
          } catch {
            name = a.storage_path;
          }
        }
        return {
          id: a.id,
          path: a.storage_path,
          original_name: a.original_name ?? null,
          name,
          url: a.file_url,
          mime_type: a.mime_type,
          description: a.description ?? null,
        } as import('@/shared/types/claimFile').RemoteClaimFile;
      })
    : [];
  return {
    id: r.id,
    parent_id: r.parent_id ?? null,
    project_id: r.project_id,
    unit_ids: r.unit_ids || [],
    claim_status_id: r.claim_status_id ?? null,
    claim_no: r.claim_no,
    claimed_on: r.claimed_on,
    accepted_on: r.accepted_on,
    registered_on: r.registered_on,
    resolved_on: r.resolved_on,
    engineer_id: r.engineer_id,
    owner: r.owner ?? null,
    case_uid_id: r.case_uid_id ?? null,
    pre_trial_claim: r.pre_trial_claim ?? false,
    defect_ids: r.defect_ids ?? [],
    description: r.description ?? '',
    created_by: r.created_by ?? null,
    createdAt: toDayjs(r.created_at),
    projectName: r.projects?.name ?? '—',
    statusName: r.statuses?.name ?? '—',
    statusColor: r.statuses?.color ?? null,
    responsibleEngineerName: null,
    caseUid: r.court_cases_uids?.uid ?? null,
    unitNames: '',
    // convert strings to dayjs for consumer convenience
    claimedOn: toDayjs(r.claimed_on),
    acceptedOn: toDayjs(r.accepted_on),
    registeredOn: toDayjs(r.registered_on),
    resolvedOn: toDayjs(r.resolved_on),
    attachments,
  } as unknown as ClaimWithNames;
}
