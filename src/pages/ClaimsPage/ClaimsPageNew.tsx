import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  ConfigProvider,
  Alert,
  message,
  Typography,
} from 'antd';
import ruRU from 'antd/locale/ru_RU';
import {
  useLinkClaims,
  useUnlinkClaim,
} from '@/entities/claim';
import { useSearchParams } from 'react-router-dom';
import type { ClaimWithNames } from '@/shared/types/claimWithNames';
import ClaimsTable from '@/widgets/ClaimsTable';
import ClaimsFilters from '@/widgets/ClaimsFilters';
import ClaimFormAntd from '@/features/claim/ClaimFormAntd';
import ClaimViewModal from '@/features/claim/ClaimViewModal';
import LinkClaimsDialog from '@/features/claim/LinkClaimsDialog';
import ClaimsPageToolbar from './ui/ClaimsPageToolbar';
import { useClaimsDataOptimized as useClaimsData } from './model/useClaimsDataOptimized';
import { useClaimsFilters } from './model/useClaimsFilters';
import { useClaimsColumns } from './model/useClaimsColumns';

// Lazy loading для тяжелых компонентов
const TableColumnsDrawer = React.lazy(
  () => import('@/widgets/TableColumnsDrawer'),
);

export default function ClaimsPageNew() {
  const [searchParams] = useSearchParams();

  // Загрузка данных
  const {
    claims,
    isLoading,
    error,
    lockedUnitIds,
    filterOptions,
  } = useClaimsData();

  // Фильтрация
  const {
    showFilters,
    filters,
    filteredClaims,
    statistics,
    handleShowFilters,
    handleSubmitFilters,
    handleResetFilters,
  } = useClaimsFilters(claims);

  // Состояние UI
  const [showAddForm, setShowAddForm] = useState(
    searchParams.get('open_form') === '1',
  );
  const [viewId, setViewId] = useState<number | null>(null);
  const [linkFor, setLinkFor] = useState<ClaimWithNames | null>(null);
  const [showColumnsDrawer, setShowColumnsDrawer] = useState(false);

  // Mutations
  const linkClaims = useLinkClaims();
  const unlinkClaim = useUnlinkClaim();

  // Обработчики
  const handleView = useCallback((id: number) => setViewId(id), []);
  const handleAddChild = useCallback((parent: ClaimWithNames) => setLinkFor(parent), []);
  const handleUnlink = useCallback((id: number) => unlinkClaim.mutate(id), [unlinkClaim]);
  const handleToggleAddForm = useCallback(() => setShowAddForm(p => !p), []);
  const handleShowColumnsDrawer = useCallback(() => setShowColumnsDrawer(true), []);
  const handleCloseColumnsDrawer = useCallback(() => setShowColumnsDrawer(false), []);
  const handleCloseAddForm = useCallback(() => setShowAddForm(false), []);
  const handleCloseViewModal = useCallback(() => setViewId(null), []);

  // Колонки таблицы
  const {
    columns,
    columnsState,
    columnWidths,
    baseColumns,
    setColumnsState,
    setColumnWidths,
    handleResetColumns,
  } = useClaimsColumns({
    lockedUnitIds,
    onView: handleView,
    onAddChild: handleAddChild,
    onUnlink: handleUnlink,
  });

  // Начальные значения формы
  const initialValues = useMemo(() => ({
    project_id: searchParams.get('project_id')
      ? Number(searchParams.get('project_id')!)
      : undefined,
    unit_ids: searchParams.get('unit_id')
      ? [Number(searchParams.get('unit_id')!)]
      : [],
    engineer_id: searchParams.get('engineer_id') || undefined,
  }), [searchParams]);

  useEffect(() => {
    if (searchParams.get('open_form') === '1') {
      setShowAddForm(true);
    }
  }, [searchParams]);

  const { total, closedCount, openCount, filteredTotal } = statistics;

  return (
    <ConfigProvider locale={ruRU}>
      <>
        <ClaimsPageToolbar
          showAddForm={showAddForm}
          showFilters={showFilters}
          filteredClaims={filteredClaims}
          onToggleAddForm={handleToggleAddForm}
          onToggleFilters={handleShowFilters}
          onShowColumnsDrawer={handleShowColumnsDrawer}
        />

        {showAddForm && (
          <div style={{ marginBottom: 24 }}>
            <ClaimFormAntd
              onCreated={handleCloseAddForm}
              initialValues={initialValues}
            />
          </div>
        )}

        {showFilters && (
          <div style={{ marginBottom: 24 }}>
            <ClaimsFilters
              options={filterOptions}
              loading={isLoading}
              initialValues={filters}
              onSubmit={handleSubmitFilters}
              onReset={handleResetFilters}
            />
          </div>
        )}

        <LinkClaimsDialog
          open={!!linkFor}
          parent={linkFor}
          claims={claims}
          loading={linkClaims.isPending}
          onClose={() => setLinkFor(null)}
          onSubmit={(ids) =>
            linkClaims.mutate(
              { parentId: String(linkFor!.id), childIds: ids },
              {
                onSuccess: () => {
                  message.success('Претензии связаны');
                  setLinkFor(null);
                },
                onError: (e) => message.error(e.message),
              },
            )
          }
        />

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

        {error ? (
          <Alert type="error" message={error.message} />
        ) : (
          <ClaimsTable
            claims={filteredClaims}
            loading={isLoading}
            onView={handleView}
            onAddChild={handleAddChild}
            onUnlink={handleUnlink}
            lockedUnitIds={lockedUnitIds}
            columns={columns}
            showPagination={true}
          />
        )}

        <div style={{ marginTop: 16 }}>
          <Typography.Text style={{ display: 'block' }}>
            Всего претензий: {total}, из них закрытых: {closedCount} и не
            закрытых: {openCount}
          </Typography.Text>
          <Typography.Text style={{ display: 'block', marginTop: 4 }}>
            Отфильтровано претензий: {filteredTotal}
          </Typography.Text>
        </div>

        <ClaimViewModal
          open={viewId !== null}
          claimId={viewId}
          onClose={handleCloseViewModal}
        />
      </>
    </ConfigProvider>
  );
}
