import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import { useAuthStore } from '@/shared/store/authStore';
import { useProjectId } from '@/shared/hooks/useProjectId';

export interface DashboardSummary {
  claims: EntityStats;
  defects: EntityStats;
  courtCases: EntityStats;
  letters: EntityStats;
  engineerCalls: EntityStats;
  recentActivity: ActivityItem[];
  upcomingDeadlines: DeadlineItem[];
}

export interface EntityStats {
  total: number;
  active: number;
  completed: number;
  overdue: number;
  myResponsibility: number;
}

export interface ActivityItem {
  id: string;
  entityType: 'claim' | 'defect' | 'court_case' | 'letter' | 'engineer_call';
  entityId: string;
  title: string;
  action: string;
  timestamp: string;
  projectName?: string;
}

export interface DeadlineItem {
  id: string;
  entityType: 'claim' | 'defect' | 'court_case' | 'letter' | 'engineer_call';
  entityId: string;
  title: string;
  deadline: string;
  daysRemaining: number;
  status: string;
}

/**
 * Получить данные для личного кабинета пользователя
 */
export function usePersonalDashboard() {
  const profile = useAuthStore((s) => s.profile);
  const projectId = useProjectId();
  const isAdmin = profile?.role === 'ADMIN';

  return useQuery({
    queryKey: ['personal-dashboard', profile?.id, projectId],
    queryFn: async () => {
      if (!profile?.id) throw new Error('User not authenticated');

      // Получаем претензии
      const claimsQuery = supabase
        .from('claims')
        .select('*, claim_status:statuses!claims_claim_status_id_fkey(name, color)')
        .or(`created_by.eq.${profile.id},engineer_id.eq.${profile.id}`);

      if (!isAdmin && projectId) {
        claimsQuery.eq('project_id', projectId);
      }

      const { data: claims = [], error: claimsError } = await claimsQuery;
      if (claimsError) console.error('Error fetching claims:', claimsError);

      // Получаем дефекты
      const defectsQuery = supabase
        .from('defects')
        .select('*, defect_status:statuses!defects_status_id_fkey(name, color)')
        .or(`created_by.eq.${profile.id},engineer_id.eq.${profile.id}`);

      if (!isAdmin && projectId) {
        defectsQuery.eq('project_id', projectId);
      }

      const { data: defects = [], error: defectsError } = await defectsQuery;
      if (defectsError) console.error('Error fetching defects:', defectsError);

      // Получаем судебные дела
      const courtCasesQuery = supabase
        .from('court_cases')
        .select('*, court_status:statuses!court_cases_status_fkey(name, color)')
        .or(`created_by.eq.${profile.id},responsible_lawyer_id.eq.${profile.id}`);

      if (!isAdmin && projectId) {
        courtCasesQuery.eq('project_id', projectId);
      }

      const { data: courtCases = [], error: courtCasesError } = await courtCasesQuery;
      if (courtCasesError) console.error('Error fetching court cases:', courtCasesError);

      // Получаем письма
      const lettersQuery = supabase
        .from('letters')
        .select('*, letter_status:statuses!letters_status_id_fkey(name, color)')
        .or(`created_by.eq.${profile.id},responsible_user_id.eq.${profile.id}`);

      if (!isAdmin && projectId) {
        lettersQuery.eq('project_id', projectId);
      }

      const { data: letters = [], error: lettersError } = await lettersQuery;
      if (lettersError) console.error('Error fetching letters:', lettersError);

      // Получаем вызовы инженеров
      const engineerCallsQuery = supabase
        .from('engineer_calls')
        .select('*')
        .or(`created_by.eq.${profile.id},engineer_id.eq.${profile.id}`);

      if (!isAdmin && projectId) {
        engineerCallsQuery.eq('project_id', projectId);
      }

      const { data: engineerCalls = [], error: engineerCallsError } = await engineerCallsQuery;
      if (engineerCallsError) console.error('Error fetching engineer calls:', engineerCallsError);

      // Формируем статистику
      const now = new Date();
      
      const getStats = (items: any[], responsibleField: string) => ({
        total: items.length,
        active: items.filter(item => 
          !['completed', 'closed', 'resolved', 'Проведено', 'Отменено'].includes(item.status || item.claim_status?.name || item.defect_status?.name || item.court_status?.name || item.letter_status?.name)
        ).length,
        completed: items.filter(item => 
          ['completed', 'closed', 'resolved', 'Проведено'].includes(item.status || item.claim_status?.name || item.defect_status?.name || item.court_status?.name || item.letter_status?.name)
        ).length,
        overdue: items.filter(item => {
          const deadline = item.resolved_on || item.fixed_at || item.fix_end_date || item.response_deadline || item.end_datetime;
          return deadline && new Date(deadline) < now && 
            !['completed', 'closed', 'resolved', 'Проведено'].includes(item.status || item.claim_status?.name || item.defect_status?.name || item.court_status?.name || item.letter_status?.name);
        }).length,
        myResponsibility: items.filter(item => item[responsibleField] === profile.id).length,
      });

      // Формируем последнюю активность (последние 10 элементов)
      const allItems = [
        ...claims.map(c => ({ ...c, entityType: 'claim' as const, timestamp: c.created_at })),
        ...defects.map(d => ({ ...d, entityType: 'defect' as const, timestamp: d.created_at })),
        ...courtCases.map(cc => ({ ...cc, entityType: 'court_case' as const, timestamp: cc.created_at })),
        ...letters.map(l => ({ ...l, entityType: 'letter' as const, timestamp: l.created_at })),
        ...engineerCalls.map(ec => ({ ...ec, entityType: 'engineer_call' as const, timestamp: ec.created_at })),
      ];

      const recentActivity = allItems
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10)
        .map(item => ({
          id: `${item.entityType}-${item.id}`,
          entityType: item.entityType,
          entityId: item.id,
          title: item.claim_no || item.description || item.number || item.subject || item.title || 'Без названия',
          action: 'Создано',
          timestamp: item.timestamp,
        }));

      // Формируем предстоящие дедлайны
      const upcomingDeadlines: DeadlineItem[] = [];
      
      // Дедлайны претензий
      claims.forEach(claim => {
        if (claim.resolved_on && new Date(claim.resolved_on) > now) {
          const deadline = new Date(claim.resolved_on);
          upcomingDeadlines.push({
            id: `claim-${claim.id}`,
            entityType: 'claim',
            entityId: claim.id,
            title: claim.claim_no || 'Претензия',
            deadline: claim.resolved_on,
            daysRemaining: Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
            status: claim.claim_status?.name || 'Неизвестно',
          });
        }
      });

      // Дедлайны дефектов
      defects.forEach(defect => {
        if (defect.fixed_at && new Date(defect.fixed_at) > now) {
          const deadline = new Date(defect.fixed_at);
          upcomingDeadlines.push({
            id: `defect-${defect.id}`,
            entityType: 'defect',
            entityId: defect.id,
            title: defect.description || 'Дефект',
            deadline: defect.fixed_at,
            daysRemaining: Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
            status: defect.defect_status?.name || 'Неизвестно',
          });
        }
      });

      // Дедлайны судебных дел
      courtCases.forEach(courtCase => {
        if (courtCase.fix_end_date && new Date(courtCase.fix_end_date) > now) {
          const deadline = new Date(courtCase.fix_end_date);
          upcomingDeadlines.push({
            id: `court_case-${courtCase.id}`,
            entityType: 'court_case',
            entityId: courtCase.id,
            title: courtCase.number || 'Судебное дело',
            deadline: courtCase.fix_end_date,
            daysRemaining: Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
            status: courtCase.court_status?.name || 'Неизвестно',
          });
        }
      });

      // Дедлайны вызовов инженеров
      engineerCalls.forEach(call => {
        if (call.end_datetime && new Date(call.end_datetime) > now) {
          const deadline = new Date(call.end_datetime);
          upcomingDeadlines.push({
            id: `engineer_call-${call.id}`,
            entityType: 'engineer_call',
            entityId: call.id,
            title: call.title || 'Вызов инженера',
            deadline: call.end_datetime,
            daysRemaining: Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
            status: call.status || 'Запланировано',
          });
        }
      });

      // Сортируем дедлайны по близости
      upcomingDeadlines.sort((a, b) => a.daysRemaining - b.daysRemaining);

      return {
        claims: getStats(claims, 'engineer_id'),
        defects: getStats(defects, 'engineer_id'),
        courtCases: getStats(courtCases, 'responsible_lawyer_id'),
        letters: getStats(letters, 'responsible_user_id'),
        engineerCalls: getStats(engineerCalls, 'engineer_id'),
        recentActivity,
        upcomingDeadlines: upcomingDeadlines.slice(0, 10), // Топ 10 ближайших дедлайнов
      };
    },
    enabled: !!profile?.id,
    staleTime: 5 * 60 * 1000, // 5 минут
    refetchInterval: 2 * 60 * 1000, // Обновляем каждые 2 минуты
  });
}