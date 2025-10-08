import { useState, useMemo, useCallback } from 'react';
import type { ClaimFilters } from '@/shared/types/claimFilters';
import type { ClaimWithNames } from '@/shared/types/claimWithNames';
import { filterClaims } from '@/shared/utils/claimFilter';

/**
 * Хук для управления фильтрацией претензий
 */
export function useClaimsFilters(claims: ClaimWithNames[]) {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ClaimFilters>({});

  // Фильтрованные претензии
  const filteredClaims = useMemo(
    () => filterClaims(claims, filters),
    [claims, filters],
  );

  // Мемоизированная статистика
  const statistics = useMemo(() => {
    const total = claims.length;
    const closedCount = claims.filter((c) => /закры/i.test(c.statusName ?? '')).length;
    const openCount = total - closedCount;
    const filteredTotal = filteredClaims.length;
    return { total, closedCount, openCount, filteredTotal };
  }, [claims, filteredClaims]);

  const handleShowFilters = useCallback(() => setShowFilters(p => !p), []);
  const handleSubmitFilters = useCallback((newFilters: ClaimFilters) => {
    setFilters(newFilters);
  }, []);
  const handleResetFilters = useCallback(() => {
    setFilters({});
  }, []);

  return {
    showFilters,
    filters,
    filteredClaims,
    statistics,
    handleShowFilters,
    handleSubmitFilters,
    handleResetFilters,
  };
}
