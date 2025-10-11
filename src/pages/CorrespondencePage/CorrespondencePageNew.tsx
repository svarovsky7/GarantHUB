import React, { useState, useRef, useMemo } from 'react';
import { ConfigProvider } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import dayjs from 'dayjs';
import { AddLetterFormData } from '@/features/correspondence/AddLetterForm';
import AddLetterForm from '@/features/correspondence/AddLetterForm';
import LinkLettersDialog from '@/features/correspondence/LinkLettersDialog';
import CorrespondenceTable from '@/widgets/CorrespondenceTable';
import CorrespondenceFilters from '@/widgets/CorrespondenceFilters';
const TableColumnsDrawer = React.lazy(() => import('@/widgets/TableColumnsDrawer'));
import LetterViewModal from '@/features/correspondence/LetterViewModal';
import {
  useAddLetter,
  useDeleteLetter,
  useLinkLetters,
  useUnlinkLetter,
} from '@/entities/correspondence';
import { CorrespondenceLetter } from '@/shared/types/correspondence';
import { fixForeignKeys } from '@/shared/utils/fixForeignKeys';
import { useAuthStore } from '@/shared/store/authStore';
import { useNotify } from '@/shared/hooks/useNotify';
import { CorrespondenceToolbar, CorrespondenceStats } from './ui';
import {
  useCorrespondenceData,
  useCorrespondenceFilters,
  useFilteredLetters,
  useCorrespondenceColumns,
  useCorrespondenceUrlSync,
  useCorrespondenceOptions,
} from './model';

/**
 * Refactored correspondence page with modular architecture
 */
export default function CorrespondencePageNew() {
  // Authentication
  const userId = useAuthStore((s) => s.profile?.id);
  const notify = useNotify();

  // Filters and URL state
  const {
    filters,
    setFilters,
    showFilters,
    setShowFilters,
    form,
    handleFiltersChange,
    resetFilters,
    searchParams,
    setSearchParams,
  } = useCorrespondenceFilters();

  // Data fetching
  const {
    letters,
    users,
    letterTypes,
    statuses,
    contractors,
    persons,
    projects,
    projectUnits,
    allUnits,
    lockedUnitIds,
    closedStatusId,
  } = useCorrespondenceData(filters.project);

  // Mutations
  const add = useAddLetter();
  const remove = useDeleteLetter();
  const linkLetters = useLinkLetters();
  const unlinkLetter = useUnlinkLetter();

  // Local UI state
  const [linkFor, setLinkFor] = useState<CorrespondenceLetter | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showColumnsDrawer, setShowColumnsDrawer] = useState(false);
  const [viewId, setViewId] = useState<string | null>(null);
  const hideOnScroll = useRef(false);

  // Initial form values from URL params
  const initialValues = useMemo(() => ({
    project_id: searchParams.get('project_id')
      ? Number(searchParams.get('project_id')!)
      : undefined,
    unit_ids: searchParams.get('unit_id')
      ? [Number(searchParams.get('unit_id')!)]
      : [],
    responsible_user_id: searchParams.get('responsible_user_id') || undefined,
  }), [searchParams]);

  // Sync URL parameters with state
  useCorrespondenceUrlSync({
    searchParams,
    letters,
    setFilters,
    form,
    setViewId,
    setShowAddForm,
  });

  // Dropdown options
  const { contactOptions, idOptions, buildingOptions } = useCorrespondenceOptions(
    letters,
    contractors,
    persons,
    allUnits,
  );

  // Filtered data
  const filtered = useFilteredLetters(letters, filters, allUnits, closedStatusId);

  // Column management
  const {
    columns,
    columnsState,
    setColumnsState,
    columnWidths,
    setColumnWidths,
    baseColumns,
    handleResetColumns,
  } = useCorrespondenceColumns({
    onDelete: handleDelete,
    onAddChild: setLinkFor,
    onUnlink: handleUnlink,
    onView: setViewId,
    allUnits,
  });

  // Handlers
  function handleAdd(data: AddLetterFormData) {
    const safeData = fixForeignKeys(
      {
        ...data,
        attachments: data.attachments.map((f) => ({ file: f.file, type_id: null })),
        responsible_user_id: data.responsible_user_id || null,
        date: data.date ? data.date.toISOString() : dayjs().toISOString(),
        created_by: userId || null,
      },
      ['responsible_user_id', 'letter_type_id', 'project_id', 'status_id'],
    );

    add.mutate(safeData, {
      onSuccess: () => {
        notify.success('Письмо добавлено');
        hideOnScroll.current = true;
      },
    });
  }

  function handleDelete(id: string) {
    if (!window.confirm('Удалить письмо?')) return;
    remove.mutate(id, {
      onSuccess: () => notify.success('Письмо удалено'),
    });
  }

  function handleUnlink(id: string) {
    unlinkLetter.mutate(id, {
      onSuccess: () => notify.success('Письмо исключено из связи'),
    });
  }

  // Statistics
  const total = letters.length;
  const closedCount = useMemo(
    () => letters.filter((l) => closedStatusId != null && l.status_id === closedStatusId).length,
    [letters, closedStatusId],
  );
  const openCount = total - closedCount;
  const readyToExport = filtered.length;

  return (
    <ConfigProvider locale={ruRU}>
      <CorrespondenceToolbar
        showAddForm={showAddForm}
        showFilters={showFilters}
        onToggleAddForm={() => setShowAddForm((p) => !p)}
        onToggleFilters={() => setShowFilters((p) => !p)}
        onOpenColumnsDrawer={() => setShowColumnsDrawer(true)}
        filteredLetters={filtered}
        users={users}
        letterTypes={letterTypes}
        projects={projects}
        units={allUnits}
        statuses={statuses}
      />

      {showAddForm && (
        <div style={{ marginBottom: 24 }}>
          <AddLetterForm onSubmit={handleAdd} initialValues={initialValues} />
        </div>
      )}

      <LinkLettersDialog
        open={!!linkFor}
        parent={linkFor}
        letters={letters}
        onClose={() => setLinkFor(null)}
        onSubmit={(ids) => {
          if (!linkFor) return;
          linkLetters.mutate(
            { parentId: linkFor.id, childIds: ids },
            {
              onSuccess: () => {
                notify.success('Письма связаны');
                setLinkFor(null);
              },
            },
          );
        }}
      />

      <React.Suspense fallback={null}>
        <TableColumnsDrawer
          open={showColumnsDrawer}
          columns={columnsState}
          widths={
            Object.fromEntries(
              Object.keys(baseColumns).map((k) => [
                k,
                columnWidths[k] ?? baseColumns[k].width,
              ]),
            ) as Record<string, number>
          }
          onWidthsChange={setColumnWidths}
          onChange={setColumnsState}
          onClose={() => setShowColumnsDrawer(false)}
          onReset={handleResetColumns}
        />
      </React.Suspense>

      <div
        style={{ marginTop: 24 }}
        onWheel={() => {
          if (hideOnScroll.current) {
            setShowAddForm(false);
            hideOnScroll.current = false;
          }
        }}
      >
        {showFilters && (
          <div style={{ marginBottom: 24 }}>
            <CorrespondenceFilters
              form={form}
              filters={filters}
              onChange={handleFiltersChange}
              users={users.map((u) => ({ value: u.id, label: u.name }))}
              letterTypes={letterTypes.map((t) => ({ value: t.id, label: t.name }))}
              projects={projects.map((p) => ({ value: p.id, label: p.name }))}
              projectUnits={projectUnits.map((u) => ({ value: u.id, label: u.name }))}
              buildingOptions={buildingOptions}
              contactOptions={contactOptions}
              statuses={statuses.map((s) => ({ value: s.id, label: s.name }))}
              idOptions={idOptions}
              onReset={resetFilters}
            />
          </div>
        )}

        <CorrespondenceTable
          letters={filtered}
          onDelete={handleDelete}
          onAddChild={setLinkFor}
          onUnlink={handleUnlink}
          onView={(id) => setViewId(id)}
          users={users}
          letterTypes={letterTypes}
          projects={projects}
          units={allUnits}
          statuses={statuses}
          columns={columns}
          lockedUnitIds={lockedUnitIds}
        />

        <CorrespondenceStats
          total={total}
          closedCount={closedCount}
          openCount={openCount}
          readyToExport={readyToExport}
        />
      </div>

      <LetterViewModal
        open={viewId !== null}
        letterId={viewId}
        onClose={() => {
          setViewId(null);
          const params = new URLSearchParams(searchParams);
          params.delete('letter_id');
          setSearchParams(params, { replace: true });
        }}
      />
    </ConfigProvider>
  );
}
