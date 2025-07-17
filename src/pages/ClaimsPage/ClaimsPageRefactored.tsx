import React from "react";
import { ConfigProvider } from "antd";
import ruRU from "antd/locale/ru_RU";
import { useRolePermission } from "@/entities/rolePermission";
import { useAuthStore } from "@/shared/store/authStore";
import type { RoleName } from "@/shared/types/rolePermission";

// Page components
import ClaimsPageHeader from './components/ClaimsPageHeader';
import ClaimsPageContent from './components/ClaimsPageContent';
import ClaimsPageDialogs from './components/ClaimsPageDialogs';
import { useClaimsPageState } from './hooks/useClaimsPageState';
import { useClaimsTableColumns } from './hooks/useClaimsTableColumns';
import { useClaimsData } from './hooks/useClaimsData';

const ClaimsPageRefactored = React.memo(() => {
  const role = useAuthStore((s) => s.profile?.role as RoleName | undefined);
  const { data: perm } = useRolePermission(role);

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

  // Data fetching
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
  } = useClaimsData(filters, perm);

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
      // TODO: Implement delete handler
      console.log('Delete claim:', id);
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
  }), [showAddForm, showFilters, claimsWithNames, filters, handleToggleAddForm, handleToggleFilters, handleShowColumnsDrawer]);

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
  }), [showAddForm, initialValues, handleCloseAddForm, showFilters, filters, filterOptions, filtersLoading, applyFilters, resetFilters, claimsWithNames, columns, isLoading, error, handleView, handleAddChild, totalClaims, closedClaims, openClaims, readyToExport]);

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

ClaimsPageRefactored.displayName = 'ClaimsPageRefactored';

export default ClaimsPageRefactored;