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
  // Загрузка данных
  const {
    defects,
    isLoading,
    isError,
    error,
    lockedUnitIds,
    units,
    projects,
  } = useDefectsData();

  // Фильтрация
  const {
    showFilters,
    filters,
    filteredDefects,
    filterOptions,
    handleToggleFilters,
    handleSubmitFilters,
    handleResetFilters,
  } = useDefectsFilters({ defects, units, projects });

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

  const total = defects.length;
  const filtered = filteredDefects.length;

  return (
    <ConfigProvider locale={ruRU}>
      <>
        <DefectsPageToolbar
          showFilters={showFilters}
          filteredDefects={filteredDefects}
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
              defects={filteredDefects}
              filters={filters}
              columns={columns}
              loading={isLoading}
            />

            <div style={{ marginTop: 16 }}>
              <Typography.Text style={{ display: 'block' }}>
                Всего дефектов: {total}
              </Typography.Text>
              <Typography.Text style={{ display: 'block', marginTop: 4 }}>
                Отфильтровано дефектов: {filtered}
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
