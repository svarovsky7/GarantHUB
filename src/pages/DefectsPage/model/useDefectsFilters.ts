import { useState, useMemo, useCallback, useEffect } from 'react';
import type { DefectFilters } from '@/shared/types/defectFilters';
import type { DefectWithInfo } from '@/shared/types/defect';
import type { DefectSummaryWithDayjs } from '@/shared/types/defectSummary';
import { naturalCompare } from '@/shared/utils/naturalSort';

const LS_FILTERS_VISIBLE_KEY = 'defectsFiltersVisible';

interface UseDefectsFiltersParams {
  defects: DefectWithInfo[] | DefectSummaryWithDayjs[];
  units: any[];
  projects: any[];
  currentFilters?: DefectFilters; // Текущие фильтры для каскадной фильтрации
}

/**
 * Хук для управления фильтрацией дефектов
 * - Поддерживает упрощенную структуру фильтров (только 6 полей)
 * - Принимает DefectWithInfo[] или DefectSummaryWithDayjs[] для опций
 * - Для опций фильтров передавайте ВСЕ дефекты из базы (используйте useDefectsSummary)
 * - Поддерживает каскадную фильтрацию опций на основе currentFilters
 */
export function useDefectsFilters({ defects, units, projects, currentFilters = {} }: UseDefectsFiltersParams) {
  const [showFilters, setShowFilters] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_FILTERS_VISIBLE_KEY);
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  // Сохранение состояния видимости фильтров
  useEffect(() => {
    try {
      localStorage.setItem(LS_FILTERS_VISIBLE_KEY, JSON.stringify(showFilters));
    } catch {}
  }, [showFilters]);

  // Опции для фильтров - теперь только 6 полей
  const filterOptions = useMemo(() => {
    console.group('🔍 ДИАГНОСТИКА ФИЛЬТРОВ - ДЕТАЛЬНОЕ ЛОГИРОВАНИЕ');
    console.log('📊 Входные данные:', {
      'Всего дефектов загружено': defects.length,
      'Всего units загружено': units.length,
      'Всего projects загружено': projects.length,
      'Текущие фильтры (currentFilters)': currentFilters,
    });

    const uniq = (values: (string | number | null | undefined)[]) =>
      Array.from(new Set(values.filter(Boolean) as (string | number)[])).sort(naturalCompare);

    const mapNumOptions = (vals: (number | null | undefined)[]) =>
      uniq(vals).map((v) => ({ label: String(v), value: Number(v) }));

    const uniqPairs = (pairs: [number | null, string | null][]) => {
      const map = new Map<number, string>();
      pairs.forEach(([id, name]) => {
        if (id != null && name) map.set(id, name);
      });
      return Array.from(map.entries())
        .sort((a, b) => naturalCompare(a[1], b[1]))
        .map(([value, label]) => ({ value, label }));
    };

    const unitOptionsMap = new Map(units.map((u) => [u.id, u.name]));

    console.log('📦 Созданные мапы:', {
      'unitOptionsMap размер': unitOptionsMap.size,
      'Первые 10 units': Array.from(unitOptionsMap.entries()).slice(0, 10),
    });

    console.log('🚀 Проекты для фильтра:', {
      'Загружено проектов': projects.length,
      'Первые 5': projects.slice(0, 5).map(p => p.name),
      'Источник': 'Используем уже загруженный массив projects (быстро!)',
    });

    // 🔍 Проверка: есть ли в мапе объект 22007
    if (unitOptionsMap.has(22007)) {
      console.log('✅ Объект 22007 НАЙДЕН в unitOptionsMap:', unitOptionsMap.get(22007));
    } else {
      console.log('❌ Объект 22007 НЕ НАЙДЕН в unitOptionsMap');
    }

    // Фильтруем опции на основе текущих фильтров для каскадной фильтрации
    let filteredForOptions = defects;

    console.log('🎯 Каскадная фильтрация:');

    // Если выбран проект, фильтруем объекты только для выбранных проектов
    if (currentFilters.projectId && currentFilters.projectId.length > 0) {
      console.log('  📌 Применяем фильтр по проектам:', currentFilters.projectId);
      const beforeFilter = filteredForOptions.length;
      filteredForOptions = filteredForOptions.filter(d =>
        ((d as any).projectIds || (d as any).project_ids)?.some(pid => currentFilters.projectId?.includes(pid))
      ) as DefectSummaryWithDayjs[] | DefectWithInfo[];
      console.log(`  ✅ После фильтрации по проектам: ${beforeFilter} → ${filteredForOptions.length} дефектов`);
    }

    // Если выбран объект, фильтруем все остальное для выбранных объектов
    if (currentFilters.units && currentFilters.units.length > 0) {
      console.log('  📌 Применяем фильтр по объектам:', currentFilters.units);
      const beforeFilter = filteredForOptions.length;
      filteredForOptions = filteredForOptions.filter(d =>
        ((d as any).unitIds || (d as any).unit_ids)?.some(uid => currentFilters.units?.includes(uid))
      ) as DefectSummaryWithDayjs[] | DefectWithInfo[];
      console.log(`  ✅ После фильтрации по объектам: ${beforeFilter} → ${filteredForOptions.length} дефектов`);
    }

    // Если выбран статус, фильтруем для выбранных статусов
    if (currentFilters.statusId && currentFilters.statusId.length > 0) {
      console.log('  📌 Применяем фильтр по статусам:', currentFilters.statusId);
      const beforeFilter = filteredForOptions.length;
      filteredForOptions = filteredForOptions.filter(d =>
        currentFilters.statusId?.includes(d.status_id)
      ) as DefectSummaryWithDayjs[] | DefectWithInfo[];
      console.log(`  ✅ После фильтрации по статусам: ${beforeFilter} → ${filteredForOptions.length} дефектов`);
    }

    // Если выбран тип, фильтруем для выбранных типов
    if (currentFilters.typeId && currentFilters.typeId.length > 0) {
      console.log('  📌 Применяем фильтр по типам:', currentFilters.typeId);
      const beforeFilter = filteredForOptions.length;
      filteredForOptions = filteredForOptions.filter(d =>
        currentFilters.typeId?.includes(d.type_id)
      ) as DefectSummaryWithDayjs[] | DefectWithInfo[];
      console.log(`  ✅ После фильтрации по типам: ${beforeFilter} → ${filteredForOptions.length} дефектов`);
    }

    // Формируем финальные опции для units
    // Показываем ВСЕ unit_ids из дефектов, даже если они не загружены в unitOptionsMap
    const finalUnitIds = Array.from(
      new Set(filteredForOptions.flatMap((d) => (d as any).unitIds || (d as any).unit_ids || []))
    );

    const finalUnitsOptions = finalUnitIds
      .map((id) => ({
        label: unitOptionsMap.get(id) ?? `Объект #${id}`,
        value: id
      }))
      .sort((a, b) => naturalCompare(a.label, b.label));

    console.log('🎯 Финальные опции объектов:', {
      'Всего опций': finalUnitsOptions.length,
      'Первые 10': finalUnitsOptions.slice(0, 10),
      'Опции с "Объект #"': finalUnitsOptions.filter(o => o.label.startsWith('Объект #')).length,
      'Пример "Объект #"': finalUnitsOptions.filter(o => o.label.startsWith('Объект #')).slice(0, 5),
    });

    // 🔍 Проверка: есть ли объект 22007 в финальных опциях
    const option22007 = finalUnitsOptions.find(o => o.value === 22007);
    if (option22007) {
      console.log('✅ Объект 22007 ЕСТЬ в финальных опциях:', option22007);
    } else {
      console.log('❌ Объект 22007 ОТСУТСТВУЕТ в финальных опциях');
      console.log('   Проверка: есть ли 22007 в finalUnitIds?', finalUnitIds.includes(22007));
    }

    console.groupEnd();

    return {
      // Проекты - используем уже загруженный массив projects (быстро!)
      projects: projects
        .map((p) => ({ label: p.name, value: p.id }))
        .sort((a, b) => naturalCompare(a.label, b.label)),

      // Объекты - фильтруются по выбранным проектам
      units: finalUnitsOptions,

      // Статусы - фильтруются по другим выбранным фильтрам
      statuses: uniqPairs(filteredForOptions.map((d) => [d.status_id, (d as any).defectStatusName || (d as any).statusName]) as [number | null, string | null][]),

      // Типы - фильтруются по другим выбранным фильтрам
      types: uniqPairs(filteredForOptions.map((d) => [d.type_id, (d as any).defectTypeName || (d as any).typeName]) as [number | null, string | null][]),

      // ID дефектов - фильтруются по другим выбранным фильтрам
      ids: mapNumOptions(filteredForOptions.map((d) => d.id)),

      // ID претензий - фильтруются по другим выбранным фильтрам
      claimIds: mapNumOptions(filteredForOptions.flatMap((d) => (d as any).claimIds || (d as any).claim_ids || [])),
    };
  }, [defects, units, projects, currentFilters]);

  const handleToggleFilters = useCallback(() => setShowFilters(p => !p), []);

  return {
    showFilters,
    filterOptions,
    handleToggleFilters,
  };
}
