import React, { useState, useCallback } from 'react';
import { ConfigProvider, Card, Typography, Alert } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import DefectsTable from '@/widgets/DefectsTable';
import DefectsFilters from '@/widgets/DefectsFilters';
import DefectsPageToolbar from './ui/DefectsPageToolbar';
import { useDefectsDataOptimized as useDefectsData } from './model/useDefectsDataOptimized';
import { useDefectsFilters } from './model/useDefectsFilters';
import { useDefectsColumns } from './model/useDefectsColumns';

// Lazy loading для тяжелых модальных компонентов
const DefectViewModal = React.lazy(() => import('@/features/defect/DefectViewModal'));
const DefectFixModal = React.lazy(() => import('@/features/defect/DefectFixModal'));
const TableColumnsDrawer = React.lazy(() => import('@/widgets/TableColumnsDrawer'));

export default function DefectsPageNew() {
  // 🚀 Состояние пагинации
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // 🚀 Фильтрация (теперь управляется отдельно для серверной фильтрации)
  const {
    showFilters,
    filters,
    filteredDefects: _unused, // Не используем - фильтруется на сервере
    filterOptions,
    handleToggleFilters,
    handleSubmitFilters,
    handleResetFilters,
  } = useDefectsFilters({ defects: [], units: [], projects: [] });

  // Загрузка данных с серверной пагинацией И фильтрацией
  const {
    defects,
    total,
    isLoading,
    isError,
    error,
    lockedUnitIds,
    units,
    projects,
  } = useDefectsData(page, pageSize, filters);

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
