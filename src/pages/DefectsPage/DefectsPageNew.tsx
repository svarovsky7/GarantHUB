import React, { useState, useCallback, useMemo } from 'react';
import { ConfigProvider, Card, Typography, Alert } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import DefectsTable from '@/widgets/DefectsTable';
import DefectsFilters from '@/widgets/DefectsFilters';
import DefectsPageToolbar from './ui/DefectsPageToolbar';
import { useDefectsDataOptimized as useDefectsData } from './model/useDefectsDataOptimized';
import { useDefectsFilters } from './model/useDefectsFilters';
import { useDefectsColumns } from './model/useDefectsColumns';
import { useDefectsSummary } from '@/entities/defect';
import { useUnitsByIds } from '@/entities/unit';

// Lazy loading для тяжелых модальных компонентов
const DefectViewModal = React.lazy(() => import('@/features/defect/DefectViewModal'));
const DefectFixModal = React.lazy(() => import('@/features/defect/DefectFixModal'));
const TableColumnsDrawer = React.lazy(() => import('@/widgets/TableColumnsDrawer'));

export default function DefectsPageNew() {
  // 🚀 Состояние пагинации
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Загрузка данных с серверной пагинацией И фильтрацией
  const [filters, setFilters] = useState<any>({});

  // 🚀 Состояние серверной сортировки
  const [sortField, setSortField] = useState<string>('id'); // Поле БД для запроса
  const [sortOrder, setSortOrder] = useState<'ascend' | 'descend'>('descend');
  const [frontendSortField, setFrontendSortField] = useState<string>('id'); // Поле фронтенда для UI

  // 🚀 Загружаем ВСЕ дефекты для опций фильтров (без пагинации)
  const { data: allDefectsForFilters = [] } = useDefectsSummary();

  // 🚀 Извлекаем все уникальные unit_ids из всех дефектов для загрузки
  const allUnitIds = useMemo(() => {
    const ids = new Set<number>();
    allDefectsForFilters.forEach(defect => {
      const unitIds = defect.unit_ids || [];
      unitIds.forEach(id => ids.add(id));
    });
    console.log(`📦 Извлечено ${ids.size} уникальных unit_ids из ${allDefectsForFilters.length} дефектов`);
    return Array.from(ids);
  }, [allDefectsForFilters]);

  // 🚀 Загружаем ТОЛЬКО units, которые используются в дефектах (независимо от проекта)
  const { data: allUnitsForFilters = [] } = useUnitsByIds(allUnitIds);

  // Загружаем текущую страницу с фильтрацией и сортировкой
  const {
    defects,
    total,
    isLoading,
    isError,
    error,
    lockedUnitIds,
    units: unitsForData,
    projects,
  } = useDefectsData(page, pageSize, filters, sortField, sortOrder);

  // 🔒 Фильтруем units по разрешенным проектам
  const allowedProjectIds = useMemo(() => new Set(projects.map(p => p.id)), [projects]);
  const filteredUnitsForFilters = useMemo(() => {
    return allUnitsForFilters.filter(unit => allowedProjectIds.has(unit.project_id));
  }, [allUnitsForFilters, allowedProjectIds]);

  // 🚀 Фильтрация - передаем ВСЕ дефекты + units, отфильтрованные по разрешенным проектам
  const {
    showFilters,
    filterOptions,
    handleToggleFilters,
  } = useDefectsFilters({
    defects: allDefectsForFilters,
    units: filteredUnitsForFilters, // ✅ Только units из разрешенных проектов
    projects,
    currentFilters: filters
  });

  // Состояние UI
  const [viewId, setViewId] = useState<number | null>(null);
  const [fixId, setFixId] = useState<number | null>(null);
  const [showColumnsDrawer, setShowColumnsDrawer] = useState(false);

  // Обработчики
  const handleView = useCallback((id: number) => setViewId(id), []);
  const handleFix = useCallback((id: number) => setFixId(id), []);
  const handleShowColumnsDrawer = useCallback(() => setShowColumnsDrawer(true), []);
  const handleCloseColumnsDrawer = useCallback(() => setShowColumnsDrawer(false), []);
  const handleCloseViewModal = useCallback(() => setViewId(null), []);
  const handleCloseFixModal = useCallback(() => setFixId(null), []);

  const handleSubmitFilters = useCallback((newFilters: any) => {
    setFilters(newFilters);
    setPage(1); // Сбросить на первую страницу при изменении фильтров
  }, []);

  // 🗺️ Маппинг полей фронтенда -> БД для корректной серверной сортировки
  const mapSortField = useCallback((field: string): string => {
    const fieldMap: Record<string, string> = {
      'defectTypeName': 'type_id', // Сортировка по типу через JOIN
      'defectStatusName': 'status_id', // Сортировка по статусу через JOIN
      'unitNamesList': 'unit_names', // Сортировка по массиву имен объектов
      'projectNames': 'project_names', // Сортировка по массиву имен проектов
      'buildingNames': 'building_names', // Сортировка по массиву имен корпусов
      'fixByName': 'brigade_id', // Приоритет бригаде, но можно улучшить
      'claimIds': 'claim_ids', // Сортировка по массиву ID претензий
    };

    return fieldMap[field] || field; // Если нет в мапе, используем как есть
  }, []);

  // 🚀 Обработчик изменения таблицы (сортировка и пагинация)
  const handleTableChange = useCallback((pagination: any, filters: any, sorter: any) => {
    console.log('🔄 Изменение таблицы:', { pagination, sorter });

    // Проверяем, изменилась ли сортировка
    if (sorter && sorter.field) {
      // Преобразуем поле фронтенда в поле БД
      const dbField = mapSortField(sorter.field);
      // Сравниваем с текущим фронтенд-полем, чтобы избежать лишних обновлений
      const sortChanged = sorter.field !== frontendSortField || sorter.order !== sortOrder;

      if (sortChanged) {
        console.log('✅ Сортировка изменилась:', {
          old: { field: sortField, order: sortOrder },
          new: { field: dbField, order: sorter.order },
          frontendField: sorter.field,
        });
        setSortField(dbField);
        setFrontendSortField(sorter.field); // Сохраняем оригинальное поле для UI
        setSortOrder(sorter.order || 'descend');
        setPage(1); // Сбросить на первую страницу только при изменении сортировки
      }
    } else if (!sorter.field && sortField !== 'id') {
      // Сортировка сброшена - возвращаемся к дефолтной
      console.log('🔄 Сортировка сброшена');
      setSortField('id');
      setFrontendSortField('id');
      setSortOrder('descend');
      setPage(1);
    }

    // Пагинация обрабатывается отдельным handlePageChange
  }, [sortField, sortOrder, frontendSortField, mapSortField]);

  // Колонки таблицы
  const {
    columns,
    columnsState,
    columnWidths,
    baseColumns,
    setColumnsState,
    setColumnWidths,
    handleResetColumns,
  } = useDefectsColumns({
    lockedUnitIds,
    onView: handleView,
    onFix: handleFix,
  });

  // 🚀 Обработчики пагинации
  const handlePageChange = useCallback((newPage: number, newPageSize?: number) => {
    setPage(newPage);
    if (newPageSize && newPageSize !== pageSize) {
      setPageSize(newPageSize);
      setPage(1); // Сбросить на первую страницу при изменении размера
    }
  }, [pageSize]);

  return (
    <ConfigProvider locale={ruRU}>
      <>
        <DefectsPageToolbar
          showFilters={showFilters}
          filteredDefects={defects}
          filters={filters}
          onToggleFilters={handleToggleFilters}
          onShowColumnsDrawer={handleShowColumnsDrawer}
        />

        {showFilters && (
          <div style={{ marginBottom: 24 }}>
            <DefectsFilters
              options={filterOptions}
              initialValues={filters}
              onChange={handleSubmitFilters}
            />
          </div>
        )}

        <React.Suspense fallback={null}>
          <TableColumnsDrawer
            open={showColumnsDrawer}
            columns={columnsState}
            widths={
              Object.fromEntries(
                Object.keys(baseColumns).map((k) => [k, columnWidths[k] ?? baseColumns[k].width])
              ) as Record<string, number>
            }
            onWidthsChange={setColumnWidths}
            onChange={setColumnsState}
            onClose={handleCloseColumnsDrawer}
            onReset={handleResetColumns}
          />
        </React.Suspense>

        {isError ? (
          <Alert type="error" message={error?.message || 'Ошибка загрузки данных'} />
        ) : (
          <Card>
            <DefectsTable
              defects={defects}
              filters={filters}
              columns={columns}
              loading={isLoading}
              // 🚀 Серверная пагинация
              pagination={{
                current: page,
                pageSize,
                total,
                onChange: handlePageChange,
              }}
              // 🚀 Серверная сортировка
              onChange={handleTableChange}
              sortState={{
                field: frontendSortField, // Используем фронтенд-поле для отображения в UI
                order: sortOrder,
              }}
            />

            <div style={{ marginTop: 16 }}>
              <Typography.Text style={{ display: 'block' }}>
                Найдено дефектов: {total}
              </Typography.Text>
              <Typography.Text style={{ display: 'block', marginTop: 4 }}>
                Показано на странице: {defects.length}
              </Typography.Text>
            </div>
          </Card>
        )}

        <React.Suspense fallback={null}>
          <DefectViewModal
            open={viewId !== null}
            defectId={viewId}
            onClose={handleCloseViewModal}
          />
        </React.Suspense>

        <React.Suspense fallback={null}>
          <DefectFixModal
            open={fixId !== null}
            defectId={fixId}
            onClose={handleCloseFixModal}
          />
        </React.Suspense>
      </>
    </ConfigProvider>
  );
}
