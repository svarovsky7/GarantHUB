import { supabase } from '@/shared/api/supabaseClient';

/**
 * Проверяет статус претензии и при необходимости переводит связанные
 * дефекты в статус "Закрыто".
 */
export async function closeDefectsForClaim(claimId: number, statusId: number | null) {
  if (!statusId) return;
  const { data: claimStatus } = await supabase
    .from('statuses')
    .select('name')
    .eq('id', statusId)
    .maybeSingle();
  if (!claimStatus || !/закры/i.test(claimStatus.name)) return;

  const { data: closedDefStatus } = await supabase
    .from('statuses')
    .select('id')
    .eq('entity', 'defect')
    .ilike('name', '%закры%')
    .maybeSingle();
  if (!closedDefStatus?.id) return;

  const { data: defectRows } = await supabase
    .from('claim_defects')
    .select('defect_id')
    .eq('claim_id', claimId);
  const defectIds = (defectRows ?? []).map((d: any) => d.defect_id);
  if (!defectIds.length) return;

  await supabase.from('defects').update({ status_id: closedDefStatus.id }).in('id', defectIds);
}

/**
 * Помечает все дефекты претензии как относящиеся к досудебной.
 * @param claimId идентификатор претензии
 */
export async function markClaimDefectsPreTrial(claimId: number) {
  await supabase
    .from('claim_defects')
    .update({ pre_trial_claim: true })
    .eq('claim_id', claimId)
    .eq('pre_trial_claim', false);
}
