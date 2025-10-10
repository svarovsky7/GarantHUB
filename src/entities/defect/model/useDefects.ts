import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/api/supabaseClient';
import { fetchPaged } from '@/shared/api/fetchAll';
import type { PostgrestSingleResponse } from '@supabase/supabase-js';
import type { DefectRecord } from '@/shared/types/defect';
import type { DefectWithNames } from '@/shared/types/defectWithNames';
import type { DefectWithFiles } from '@/shared/types/defectWithFiles';
import type { DefectSummary, DefectSummaryWithDayjs } from '@/shared/types/defectSummary';
import type { DefectFilters } from '@/shared/types/defectFilters';
import { mapDefectSummary } from '../lib/defectHelpers';

const TABLE = 'defects';
const SUMMARY_TABLE = 'defects_summary';

/**
 * 🚀 МАКСИМАЛЬНО ОПТИМИЗИРОВАННЫЙ хук с серверной пагинацией И фильтрацией
 *
 * УЛУЧШЕНИЯ v2:
 * - Загружает только текущую страницу (50-100 записей вместо 6000+)
 * - Получает точный count для пагинации
 * - **СЕРВЕРНАЯ ФИЛЬТРАЦИЯ**: Фильтры применяются на уровне SQL (работают по всей БД!)
 * - **СЕРВЕРНАЯ СОРТИРОВКА**: Сортировка применяется на уровне SQL (работает по всей БД!)
 * - Устраняет водопадную загрузку данных
 *
 * @param page - номер страницы (начиная с 1)
 * @param pageSize - размер страницы (по умолчанию 50)
 * @param filters - фильтры для серверной фильтрации
 * @param sortField - поле для сортировки (по умолчанию 'id')
 * @param sortOrder - порядок сортировки ('ascend' | 'descend', по умолчанию 'descend')
 */
export function useDefectsSummaryPaginated(
  page = 1,
  pageSize = 50,
  filters?: DefectFilters,
  sortField = 'id',
  sortOrder: 'ascend' | 'descend' = 'descend'
) {
  return useQuery<{ data: DefectSummaryWithDayjs[]; total: number }>({
    queryKey: [SUMMARY_TABLE, 'paginated', page, pageSize, filters, sortField, sortOrder],
    queryFn: async () => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from(SUMMARY_TABLE)
        .select('*', { count: 'exact' });

      // 🚀 Применяем серверные фильтры
      if (filters) {
        // ID фильтры
        if (filters.id && filters.id.length > 0) {
          query = query.in('id', filters.id);
        }
        if (filters.projectId && filters.projectId.length > 0) {
          query = query.in('project_id', filters.projectId);
        }
        if (filters.typeId && filters.typeId.length > 0) {
          query = query.in('type_id', filters.typeId);
        }
        if (filters.statusId && filters.statusId.length > 0) {
          query = query.in('status_id', filters.statusId);
        }
        if (filters.units && filters.units.length > 0) {
          query = query.overlaps('unit_ids', filters.units);
        }
        if (filters.claimId && filters.claimId.length > 0) {
          query = query.overlaps('claim_ids', filters.claimId);
        }

        // Текстовые фильтры
        if (filters.author) {
          query = query.eq('created_by', filters.author);
        }
        if (filters.engineer) {
          query = query.eq('engineer_id', filters.engineer);
        }
        if (filters.building && filters.building.length > 0) {
          query = query.overlaps('building_names', filters.building);
        }
        if (filters.fixBy && filters.fixBy.length > 0) {
          // fixBy может быть бригадой или подрядчиком
          query = query.or(`brigade_id.in.(${filters.fixBy.join(',')}),contractor_id.in.(${filters.fixBy.join(',')})`);
        }

        // Период получения
        if (filters.period && filters.period.length === 2) {
          const [start, end] = filters.period;
          if (start) query = query.gte('received_at', start.format('YYYY-MM-DD'));
          if (end) query = query.lte('received_at', end.format('YYYY-MM-DD'));
        }

        // Период создания
        if (filters.createdPeriod && filters.createdPeriod.length === 2) {
          const [start, end] = filters.createdPeriod;
          if (start) query = query.gte('created_at', start.format('YYYY-MM-DD'));
          if (end) query = query.lte('created_at', end.format('YYYY-MM-DD'));
        }

        // Период устранения
        if (filters.fixedPeriod && filters.fixedPeriod.length === 2) {
          const [start, end] = filters.fixedPeriod;
          if (start) query = query.gte('fixed_at', start.format('YYYY-MM-DD'));
          if (end) query = query.lte('fixed_at', end.format('YYYY-MM-DD'));
        }

        // Скрыть закрытые
        if (filters.hideClosed) {
          // Предполагаем, что закрытые дефекты имеют статус с "ЗАКРЫ" в названии
          query = query.not('status_name', 'ilike', '%ЗАКРЫ%');
        }

        // Фильтр по наличию файлов
        if (filters.hasFiles === 'with') {
          query = query.gt('attachments_count', 0);
        } else if (filters.hasFiles === 'without') {
          query = query.eq('attachments_count', 0);
        }
      }

      // 🚀 Применяем серверную сортировку
      query = query.order(sortField, { ascending: sortOrder === 'ascend' });

      query = query.range(from, to);

      const { data: rows, error, count } = await query;

      if (error) throw error;

      return {
        data: (rows ?? []).map((r: DefectSummary) => mapDefectSummary(r)),
        total: count ?? 0,
      };
    },
    staleTime: 5 * 60_000,
  });
}

/**
 * Хук получения списка дефектов с использованием представления defects_summary (оптимизированный).
 * @deprecated Используйте useDefectsSummaryPaginated для лучшей производительности
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

/**
 * Получить один дефект с вложениями и связными названиями типа и статуса.
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
 * Получить количество файлов для каждого дефекта
 */
export function useDefectFileCounts(defectIds: number[]) {
  return useQuery<Record<number, number>>({
    queryKey: ['defect-file-counts', defectIds],
    enabled: defectIds.length > 0,
    queryFn: async () => {
      if (defectIds.length === 0) return {};

      const counts: Record<number, number> = {};
      defectIds.forEach(id => counts[id] = 0);

      // Разбиваем большой массив на части по 1000 элементов для избежания слишком длинных URL
      const chunkSize = 1000;
      const chunks = [];
      for (let i = 0; i < defectIds.length; i += chunkSize) {
        chunks.push(defectIds.slice(i, i + chunkSize));
      }

      // Выполняем запросы для каждой части
      for (const chunk of chunks) {
        const { data, error } = await supabase
          .from('defect_attachments')
          .select('defect_id')
          .in('defect_id', chunk);

        if (error) throw error;

        (data ?? []).forEach((row: any) => {
          counts[row.defect_id] = (counts[row.defect_id] || 0) + 1;
        });
      }

      return counts;
    },
    staleTime: 5 * 60_000,
  });
}

/**
 * Получить статусы дефектов по их идентификаторам.
 */
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
 * Получить дефекты по их идентификаторам со связанными названиями типа и статуса.
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
