import { supabase } from './supabaseClient';
import type { DashboardStats } from '@/shared/types/dashboardStats';
import type { DashboardRpcParams } from '@/shared/types/dashboardRpc';

/**
 * Запрашивает агрегированную статистику дашборда через RPC-функцию `dashboard_stats`.
 */
export async function fetchDashboardStats({
  projectIds,
  closedClaimStatusId,
  closedDefectStatusId,
}: DashboardRpcParams): Promise<DashboardStats> {
  const { data, error } = await supabase.rpc('dashboard_stats', {
    project_ids: projectIds,
    closed_claim_status_id: closedClaimStatusId,
    closed_defect_status_id: closedDefectStatusId,
  });
  if (error) throw error;
  return data as DashboardStats;
}
