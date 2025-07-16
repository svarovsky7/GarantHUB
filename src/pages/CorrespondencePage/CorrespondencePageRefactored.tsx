import React from 'react';
import { ConfigProvider } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import { useAddLetter, useDeleteLetter } from '@/entities/correspondence';
import { AddLetterFormData } from '@/features/correspondence/AddLetterForm';
import { fixForeignKeys } from '@/shared/utils/fixForeignKeys';
import { useAuthStore } from '@/shared/store/authStore';
import { useNotify } from '@/shared/hooks/useNotify';
import dayjs from 'dayjs';

// Page components
import CorrespondencePageHeader from './components/CorrespondencePageHeader';
import CorrespondencePageContent from './components/CorrespondencePageContent';
import CorrespondencePageDialogs from './components/CorrespondencePageDialogs';
import { useCorrespondencePageState } from './hooks/useCorrespondencePageState';
import { useCorrespondenceData } from './hooks/useCorrespondenceData';
import { useCorrespondenceTableColumns } from './hooks/useCorrespondenceTableColumns';

const CorrespondencePageRefactored = React.memo(() => {
  const userId = useAuthStore((s) => s.profile?.id);
  const notify = useNotify();
  const add = useAddLetter();
  const remove = useDeleteLetter();

  // Page state management
  const {
    showAddForm,
    showFilters,
    showColumnsDrawer,
    viewId,
    linkFor,
    form,
    filters,
    initialValues,
    hideOnScrollRef,
    handleToggleAddForm,
    handleToggleFilters,
    handleShowColumnsDrawer,
    handleCloseColumnsDrawer,
    handleView,
    handleCloseView,
    handleAddChild,
    handleCloseLinkDialog,
    handleLinkLetters,
    handleUnlink,
    handleFiltersChange,
    resetFilters,
    handleHideFormOnScroll,
  } = useCorrespondencePageState();

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
    filteredLetters,
    contactOptions,
    idOptions,
    buildingOptions,
    totalLetters,
    closedCount,
    openCount,
    readyToExport,
  } = useCorrespondenceData(filters);

  // Delete handler
  const handleDelete = React.useCallback((id: string) => {
    if (!window.confirm('Удалить письмо?')) return;
    remove.mutate(id, {
      onSuccess: () => notify.success('Письмо удалено'),
    });
  }, [remove, notify]);

  // Table columns management
  const {
    columns,
    columnsState,
    columnWidths,
    baseColumns,
    setColumnsState,
    setColumnWidths,
    handleResetColumns,
  } = useCorrespondenceTableColumns(
    allUnits,
    handleView,
    handleAddChild,
    handleUnlink,
    handleDelete,
  );

  // Add handler
  const handleAdd = React.useCallback((data: AddLetterFormData) => {
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
        hideOnScrollRef.current = true;
      },
    });
  }, [add, notify, userId, hideOnScrollRef]);

  // Memoize heavy props to prevent unnecessary re-renders
  const headerProps = React.useMemo(() => ({
    showAddForm,
    showFilters,
    filteredLetters,
    users,
    letterTypes,
    projects,
    units: allUnits,
    statuses,
    onToggleAddForm: handleToggleAddForm,
    onToggleFilters: handleToggleFilters,
    onShowColumnsDrawer: handleShowColumnsDrawer,
  }), [showAddForm, showFilters, filteredLetters, users, letterTypes, projects, allUnits, statuses, handleToggleAddForm, handleToggleFilters, handleShowColumnsDrawer]);

  const contentProps = React.useMemo(() => ({
    showAddForm,
    initialValues,
    onSubmitAdd: handleAdd,
    showFilters,
    form,
    filters,
    users,
    letterTypes,
    projects,
    projectUnits,
    buildingOptions,
    contactOptions,
    statuses,
    idOptions,
    onFiltersChange: handleFiltersChange,
    onResetFilters: resetFilters,
    hideOnScrollRef,
    onHideFormOnScroll: handleHideFormOnScroll,
    filteredLetters,
    allUsers: users,
    allLetterTypes: letterTypes,
    allProjects: projects,
    allUnits,
    allStatuses: statuses,
    lockedUnitIds,
    columns,
    onDelete: handleDelete,
    onAddChild: handleAddChild,
    onUnlink: handleUnlink,
    onView: handleView,
    totalLetters,
    closedCount,
    openCount,
    readyToExport,
  }), [showAddForm, initialValues, handleAdd, showFilters, form, filters, users, letterTypes, projects, projectUnits, buildingOptions, contactOptions, statuses, idOptions, handleFiltersChange, resetFilters, hideOnScrollRef, handleHideFormOnScroll, filteredLetters, allUnits, lockedUnitIds, columns, handleDelete, handleAddChild, handleUnlink, handleView, totalLetters, closedCount, openCount, readyToExport]);

  const dialogProps = React.useMemo(() => ({
    linkFor,
    letters,
    onCloseLinkDialog: handleCloseLinkDialog,
    onLinkLetters: handleLinkLetters,
    viewId,
    onCloseView: handleCloseView,
    showColumnsDrawer,
    columnsState,
    columnWidths,
    baseColumns,
    onCloseColumnsDrawer: handleCloseColumnsDrawer,
    onColumnsChange: setColumnsState,
    onWidthsChange: setColumnWidths,
    onResetColumns: handleResetColumns,
  }), [linkFor, letters, handleCloseLinkDialog, handleLinkLetters, viewId, handleCloseView, showColumnsDrawer, columnsState, columnWidths, baseColumns, handleCloseColumnsDrawer, setColumnsState, setColumnWidths, handleResetColumns]);

  return (
    <ConfigProvider locale={ruRU}>
      <div className="correspondence-page">
        <CorrespondencePageHeader {...headerProps} />
        <CorrespondencePageContent {...contentProps} />
        <CorrespondencePageDialogs {...dialogProps} />
      </div>
    </ConfigProvider>
  );
});

CorrespondencePageRefactored.displayName = 'CorrespondencePageRefactored';

export default CorrespondencePageRefactored;