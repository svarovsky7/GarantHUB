import { useMemo } from 'react';
import dayjs from 'dayjs';

export function usePersonalCabinetStats(
  claims: any[],
  allDefects: any[],
  letters: any[],
  engineerCalls: any[]
) {
  return useMemo(() => {
    const activeClaims = claims.filter(c =>
      c.claim_status?.name !== 'Закрыта' && c.claim_status?.name !== 'Отклонена'
    ).length;

    const activeDefects = allDefects.filter(d =>
      d.status?.name !== 'Устранен' && d.status?.name !== 'Закрыт'
    ).length;

    const unreadLetters = letters.filter(l =>
      l.status?.name === 'Новое' || l.status?.name === 'Не прочитано'
    ).length;

    const upcomingCalls = engineerCalls.filter(c =>
      dayjs(c.start_datetime).isAfter(dayjs()) && c.status !== 'completed'
    ).length;

    return {
      activeClaims,
      totalClaims: claims.length,
      activeDefects,
      totalDefects: allDefects.length,
      unreadLetters,
      totalLetters: letters.length,
      upcomingCalls,
      totalCalls: engineerCalls.length
    };
  }, [claims, allDefects, letters, engineerCalls]);
}
