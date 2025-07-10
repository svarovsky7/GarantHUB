import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { optimizedQueries } from '../api/optimizedQueries';
import { ClaimFilters } from '@/shared/types/claimFilters';
import { DefectFilters } from '@/shared/types/defectFilters';
import { CourtCasesFilters } from '@/shared/types/courtCasesFilters';

// Хуки для оптимизированных запросов претензий
export const useOptimizedClaims = (
  projectId: number,
  filters: ClaimFilters = {},
  page = 0,
  limit = 50
) => {
  return useQuery({
    queryKey: ['claims', 'optimized', projectId, filters, page, limit],
    queryFn: async () => {
      const result = await optimizedQueries.claims.getWithDetails(projectId, filters, page, limit);
      if (result.error) throw result.error;
      return result.data || [];
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 минут
    cacheTime: 10 * 60 * 1000, // 10 минут
  });
};

// Хук для получения связанных данных претензий
export const useClaimRelatedData = (claimIds: number[]) => {
  return useQuery({
    queryKey: ['claims', 'related-data', claimIds],
    queryFn: async () => {
      if (claimIds.length === 0) return { units: [], defects: [], attachments: [] };

      const [unitsResult, defectsResult, attachmentsResult] = await Promise.all([
        optimizedQueries.claims.getUnitsForClaims(claimIds),
        optimizedQueries.claims.getDefectsForClaims(claimIds),
        optimizedQueries.claims.getAttachmentsForClaims(claimIds)
      ]);

      return {
        units: unitsResult.data || [],
        defects: defectsResult.data || [],
        attachments: attachmentsResult.data || []
      };
    },
    enabled: claimIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });
};

// Хуки для оптимизированных запросов дефектов
export const useOptimizedDefects = (
  projectId: number,
  filters: DefectFilters = {},
  page = 0,
  limit = 50
) => {
  return useQuery({
    queryKey: ['defects', 'optimized', projectId, filters, page, limit],
    queryFn: async () => {
      const result = await optimizedQueries.defects.getWithDetails(projectId, filters, page, limit);
      if (result.error) throw result.error;
      return result.data || [];
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
};

// Хук для получения вложений дефектов
export const useDefectAttachments = (defectIds: number[]) => {
  return useQuery({
    queryKey: ['defects', 'attachments', defectIds],
    queryFn: () => optimizedQueries.defects.getAttachmentsForDefects(defectIds),
    enabled: defectIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });
};

// Хуки для оптимизированных запросов судебных дел
export const useOptimizedCourtCases = (
  projectId: number,
  filters: CourtCasesFilters = {},
  page = 0,
  limit = 50
) => {
  return useQuery({
    queryKey: ['court-cases', 'optimized', projectId, filters, page, limit],
    queryFn: async () => {
      const result = await optimizedQueries.courtCases.getWithDetails(projectId, filters, page, limit);
      if (result.error) throw result.error;
      return result.data || [];
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
};

// Хук для получения связанных данных судебных дел
export const useCourtCaseRelatedData = (caseIds: number[]) => {
  return useQuery({
    queryKey: ['court-cases', 'related-data', caseIds],
    queryFn: async () => {
      if (caseIds.length === 0) return { parties: [], claims: [] };

      const [partiesResult, claimsResult] = await Promise.all([
        optimizedQueries.courtCases.getPartiesForCases(caseIds),
        optimizedQueries.courtCases.getClaimsForCases(caseIds)
      ]);

      return {
        parties: partiesResult.data || [],
        claims: claimsResult.data || []
      };
    },
    enabled: caseIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });
};

// Хуки для оптимизированных запросов корреспонденции
export const useOptimizedLetters = (
  projectId: number,
  filters: any = {},
  page = 0,
  limit = 50
) => {
  return useQuery({
    queryKey: ['letters', 'optimized', projectId, filters, page, limit],
    queryFn: async () => {
      const result = await optimizedQueries.letters.getWithDetails(projectId, filters, page, limit);
      if (result.error) throw result.error;
      return result.data || [];
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
};

// Хук для оптимизированной статистики дашборда
export const useOptimizedDashboardStats = (projectId: number) => {
  return useQuery({
    queryKey: ['dashboard', 'stats', projectId],
    queryFn: async () => {
      const result = await optimizedQueries.dashboard.getStats(projectId);
      if (result.error) throw result.error;
      return result.data;
    },
    enabled: !!projectId,
    staleTime: 2 * 60 * 1000, // 2 минуты для статистики
    cacheTime: 5 * 60 * 1000,
  });
};

// Хук для статистики проектов
export const useProjectStatistics = (projectId?: number) => {
  return useQuery({
    queryKey: ['projects', 'statistics', projectId],
    queryFn: () => optimizedQueries.dashboard.getProjectStatistics(projectId),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
};

// Хук для оптимизированной матрицы помещений
export const useOptimizedUnitsMatrix = (projectId: number) => {
  return useQuery({
    queryKey: ['units', 'matrix', projectId],
    queryFn: async () => {
      const result = await optimizedQueries.units.getMatrix(projectId);
      if (result.error) throw result.error;
      return result.data || [];
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
};

// Хук для помещений с количеством связанных записей
export const useUnitsWithCounts = (projectId: number) => {
  return useQuery({
    queryKey: ['units', 'with-counts', projectId],
    queryFn: () => optimizedQueries.units.getUnitsWithCounts(projectId),
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
};

// Хук для пакетного обновления
export const useBatchUpdate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tableName, updates }: { tableName: string; updates: any[] }) =>
      optimizedQueries.batch.updateMultiple(tableName, updates),
    onSuccess: (data, variables) => {
      // Инвалидируем связанные кэши
      queryClient.invalidateQueries({ queryKey: [variables.tableName] });
    },
  });
};

// Хук для предзагрузки связанных данных
export const usePrefetchRelatedData = () => {
  const queryClient = useQueryClient();

  return {
    prefetchClaimRelatedData: (claimIds: number[]) => {
      queryClient.prefetchQuery({
        queryKey: ['claims', 'related-data', claimIds],
        queryFn: async () => {
          const [unitsResult, defectsResult, attachmentsResult] = await Promise.all([
            optimizedQueries.claims.getUnitsForClaims(claimIds),
            optimizedQueries.claims.getDefectsForClaims(claimIds),
            optimizedQueries.claims.getAttachmentsForClaims(claimIds)
          ]);

          return {
            units: unitsResult.data || [],
            defects: defectsResult.data || [],
            attachments: attachmentsResult.data || []
          };
        },
        staleTime: 5 * 60 * 1000,
      });
    },

    prefetchDefectAttachments: (defectIds: number[]) => {
      queryClient.prefetchQuery({
        queryKey: ['defects', 'attachments', defectIds],
        queryFn: () => optimizedQueries.defects.getAttachmentsForDefects(defectIds),
        staleTime: 5 * 60 * 1000,
      });
    },

    prefetchCourtCaseRelatedData: (caseIds: number[]) => {
      queryClient.prefetchQuery({
        queryKey: ['court-cases', 'related-data', caseIds],
        queryFn: async () => {
          const [partiesResult, claimsResult] = await Promise.all([
            optimizedQueries.courtCases.getPartiesForCases(caseIds),
            optimizedQueries.courtCases.getClaimsForCases(caseIds)
          ]);

          return {
            parties: partiesResult.data || [],
            claims: claimsResult.data || []
          };
        },
        staleTime: 5 * 60 * 1000,
      });
    }
  };
};

// Хук для управления кэшем
export const useCacheManager = () => {
  const queryClient = useQueryClient();

  return {
    // Очистка кэша для конкретного проекта
    clearProjectCache: (projectId: number) => {
      queryClient.removeQueries({ queryKey: ['claims', 'optimized', projectId] });
      queryClient.removeQueries({ queryKey: ['defects', 'optimized', projectId] });
      queryClient.removeQueries({ queryKey: ['court-cases', 'optimized', projectId] });
      queryClient.removeQueries({ queryKey: ['letters', 'optimized', projectId] });
      queryClient.removeQueries({ queryKey: ['dashboard', 'stats', projectId] });
      queryClient.removeQueries({ queryKey: ['units', 'matrix', projectId] });
    },

    // Принудительное обновление данных
    refetchProjectData: (projectId: number) => {
      queryClient.refetchQueries({ queryKey: ['claims', 'optimized', projectId] });
      queryClient.refetchQueries({ queryKey: ['defects', 'optimized', projectId] });
      queryClient.refetchQueries({ queryKey: ['court-cases', 'optimized', projectId] });
      queryClient.refetchQueries({ queryKey: ['letters', 'optimized', projectId] });
      queryClient.refetchQueries({ queryKey: ['dashboard', 'stats', projectId] });
      queryClient.refetchQueries({ queryKey: ['units', 'matrix', projectId] });
    },

    // Инвалидация связанных кэшей при обновлении
    invalidateRelatedCaches: (entityType: string, projectId: number) => {
      queryClient.invalidateQueries({ queryKey: [entityType, 'optimized', projectId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats', projectId] });
      queryClient.invalidateQueries({ queryKey: ['units', 'matrix', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects', 'statistics', projectId] });
    }
  };
};

// Хук для мониторинга производительности запросов
export const useQueryPerformance = () => {
  const queryClient = useQueryClient();

  return {
    getQueryMetrics: () => {
      const queryCache = queryClient.getQueryCache();
      const queries = queryCache.getAll();

      return queries.map(query => ({
        queryKey: query.queryKey,
        state: query.state,
        dataUpdatedAt: query.dataUpdatedAt,
        errorUpdatedAt: query.errorUpdatedAt,
        fetchCount: query.state.fetchFailureCount,
        isStale: query.isStale(),
        isActive: query.isActive(),
        observersCount: query.observers.length
      }));
    },

    getSlowQueries: (threshold = 1000) => {
      const metrics = this.getQueryMetrics();
      return metrics.filter(query => {
        const lastFetchTime = query.dataUpdatedAt || query.errorUpdatedAt || 0;
        return Date.now() - lastFetchTime > threshold;
      });
    }
  };
};