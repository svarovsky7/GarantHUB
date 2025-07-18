import React from 'react';
import { ConfigProvider, message } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import { useRolePermission } from '@/entities/rolePermission';
import { useAuthStore } from '@/shared/store/authStore';
import { useDeleteClaim } from '@/entities/claim';
import type { RoleName } from '@/shared/types/rolePermission';

// Page components
import ClaimsPageHeader from './components/ClaimsPageHeader';
import ClaimsPageContent from './components/ClaimsPageContent';
import ClaimsPageDialogs from './components/ClaimsPageDialogs';
import { useClaimsPageState } from './hooks/useClaimsPageState';
import { useClaimsTableColumns } from './hooks/useClaimsTableColumns';
import { useClaimsDataPaginated } from './hooks/useClaimsDataPaginated';

const ClaimsPagePaginated = React.memo(() => {
  const role = useAuthStore((s) => s.profile?.role as RoleName | undefined);
  const { data: perm } = useRolePermission(role);
  const { mutateAsync: deleteClaim, isPending: isDeleting } = useDeleteClaim();

  // Page state management
  const {
    showAddForm,
    showFilters,
    showColumnsDrawer,
    viewId,
    linkFor,
    filters,
    initialValues,
    handleToggleAddForm,
    handleCloseAddForm,
    handleToggleFilters,
    handleShowColumnsDrawer,
    handleCloseColumnsDrawer,
    handleView,
    handleCloseView,
    handleAddChild,
    handleCloseLinkDialog,
    handleLinkClaims,
    applyFilters,
    resetFilters,
    isLinking,
  } = useClaimsPageState();

  // Data fetching with pagination
  const {
    claims,
    isLoading,
    error,
    claimsWithNames,
    filterOptions,
    filtersLoading,
    totalClaims,
    closedClaims,
    openClaims,
    readyToExport,
    pagination,
    goToPage,
    nextPage,
    prevPage,
    setPageSize,
  } = useClaimsDataPaginated(filters, perm);

  // Table columns management
  const {
    columns,
    columnsState,
    columnWidths,
    baseColumns,
    setColumnsState,
    setColumnWidths,
    handleResetColumns,
  } = useClaimsTableColumns({
    onView: (id: number) => handleView(String(id)),
    onLink: handleAddChild,
    onDelete: async (id: number) => {
      try {
        await deleteClaim({ id });
        message.success('Претензия удалена');
      } catch (error) {
        message.error('Ошибка при удалении претензии');
        console.error('Delete error:', error);
      }
    }
  });


  // Memoize heavy props to prevent unnecessary re-renders
  const headerProps = React.useMemo(() => ({
    showAddForm,
    showFilters,
    claimsWithNames,
    filters,
    onToggleAddForm: handleToggleAddForm,
    onToggleFilters: handleToggleFilters,
    onShowColumnsDrawer: handleShowColumnsDrawer,
    usesPagination: pagination.usesPagination,
  }), [showAddForm, showFilters, claimsWithNames, filters, handleToggleAddForm, handleToggleFilters, handleShowColumnsDrawer, pagination.usesPagination]);

  const contentProps = React.useMemo(() => ({
    showAddForm,
    initialValues,
    onCloseAddForm: handleCloseAddForm,
    showFilters,
    filters,
    filterOptions,
    filtersLoading,
    onSubmitFilters: applyFilters,
    onResetFilters: resetFilters,
    claimsWithNames,
    columns,
    isLoading,
    error,
    onView: (id: number) => handleView(String(id)),
    onAddChild: handleAddChild,
    totalClaims,
    closedClaims,
    openClaims,
    readyToExport,
    pagination,
    onPageChange: goToPage,
    onPageSizeChange: setPageSize,
  }), [showAddForm, initialValues, handleCloseAddForm, showFilters, filters, filterOptions, filtersLoading, applyFilters, resetFilters, claimsWithNames, columns, isLoading, error, handleView, handleAddChild, totalClaims, closedClaims, openClaims, readyToExport, pagination, goToPage, setPageSize]);

  const dialogProps = React.useMemo(() => ({
    linkFor,
    claimsWithNames,
    isLinking,
    onCloseLinkDialog: handleCloseLinkDialog,
    onLinkClaims: handleLinkClaims,
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
  }), [linkFor, claimsWithNames, isLinking, handleCloseLinkDialog, handleLinkClaims, viewId, handleCloseView, showColumnsDrawer, columnsState, columnWidths, baseColumns, handleCloseColumnsDrawer, setColumnsState, setColumnWidths, handleResetColumns]);

  return (
    <ConfigProvider locale={ruRU}>
      <div className="claims-page">
        <ClaimsPageHeader {...headerProps} />
        <ClaimsPageContent {...contentProps} />
        <ClaimsPageDialogs {...dialogProps} />
      </div>
    </ConfigProvider>
  );
});

ClaimsPagePaginated.displayName = 'ClaimsPagePaginated';

export default ClaimsPagePaginated;