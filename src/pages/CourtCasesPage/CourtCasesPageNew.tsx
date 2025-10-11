import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import "dayjs/locale/ru";
import { ConfigProvider } from "antd";
import ruRU from "antd/locale/ru_RU";
import type { CourtCase } from "@/shared/types/courtCase";
import { useRolePermission } from "@/entities/rolePermission";
import { useAuthStore } from "@/shared/store/authStore";
import type { RoleName } from "@/shared/types/rolePermission";
import { useLinkCases } from "@/entities/courtCase";
import LinkCasesDialog from "@/features/courtCase/LinkCasesDialog";
import AddCourtCaseFormAntd from "@/features/courtCase/AddCourtCaseFormAntd";
import CourtCaseViewModal from "@/features/courtCase/CourtCaseViewModal";
import CourtCasesFilters from "@/widgets/CourtCasesFilters";
import { CourtCasesToolbar, CourtCasesTable, CourtCasesStats } from "./ui";
import {
  useCourtCasesData,
  useCourtCasesFilters,
  useCourtCasesColumns,
} from "./model";

const TableColumnsDrawer = React.lazy(
  () => import("@/widgets/TableColumnsDrawer")
);

dayjs.locale("ru");
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

/**
 * Court Cases Page - Refactored
 *
 * Main page for managing court cases with:
 * - Table with parent-child relationships
 * - Filters (project, unit, status, lawyer, etc.)
 * - Export to Excel
 * - Add/Edit/Delete operations
 * - Column customization
 * - Statistics display
 */
export default function CourtCasesPageNew() {
  const [searchParams, setSearchParams] = useSearchParams();
  const role = useAuthStore((s) => s.profile?.role as RoleName | undefined);
  const { data: perm } = useRolePermission(role);

  // Local UI state
  const [linkFor, setLinkFor] = useState<CourtCase | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [pageSize, setPageSize] = useState(100);
  const [showColumnsDrawer, setShowColumnsDrawer] = useState(false);
  const [viewId, setViewId] = useState<number | null>(null);
  const hideOnScroll = useRef(false);

  const linkCases = useLinkCases();

  // Open add form from URL parameter
  useEffect(() => {
    if (searchParams.get("open_form") === "1") {
      setShowAddForm(true);
    }
  }, [searchParams]);

  // Open view modal from URL parameter
  useEffect(() => {
    const caseId = searchParams.get("case_id");
    if (caseId) setViewId(Number(caseId));
  }, [searchParams]);

  // Fetch and enrich court cases data
  const {
    cases,
    isLoading,
    projects,
    units,
    users,
    stages,
    closedStageId,
    stats,
  } = useCourtCasesData();

  // Manage filters state and options
  const {
    filters,
    setFilters,
    resetFilters,
    showFilters,
    setShowFilters,
    initialValues,
    filteredCases,
    filterOptions,
  } = useCourtCasesFilters({
    cases,
    projects,
    units,
    stages,
    users,
    closedStageId,
  });

  // Manage table columns configuration
  const {
    columns,
    columnsState,
    setColumnsState,
    columnWidths,
    setColumnWidths,
    baseColumns,
    handleResetColumns,
  } = useCourtCasesColumns({
    perm,
    onView: setViewId,
    onLink: setLinkFor,
  });

  // Handle view modal close
  const handleCloseView = () => {
    setViewId(null);
    const params = new URLSearchParams(searchParams);
    params.delete("case_id");
    setSearchParams(params, { replace: true });
  };

  // Handle link cases submission
  const handleLinkCases = (ids: string[]) => {
    if (linkFor) {
      linkCases.mutate({ parentId: String(linkFor.id), childIds: ids });
    }
  };

  // Prepare stages lookup for export
  const stagesLookup = Object.fromEntries(stages.map((s) => [s.id, s.name]));

  return (
    <ConfigProvider locale={ruRU}>
      <>
        {/* Toolbar */}
        <CourtCasesToolbar
          canEdit={perm?.edit_tables.includes("court_cases") ?? false}
          showAddForm={showAddForm}
          showFilters={showFilters}
          onToggleAddForm={() => setShowAddForm((p) => !p)}
          onToggleFilters={() => setShowFilters((p) => !p)}
          onOpenColumnsDrawer={() => setShowColumnsDrawer(true)}
          exportData={filteredCases}
          stages={stagesLookup}
          closedStageId={closedStageId}
        />

        {/* Add Form */}
        {showAddForm && (
          <AddCourtCaseFormAntd
            initialValues={initialValues}
            onCreated={() => {
              setShowAddForm(false);
              hideOnScroll.current = true;
            }}
          />
        )}

        {/* Link Cases Dialog */}
        <LinkCasesDialog
          open={!!linkFor}
          parent={linkFor}
          cases={cases}
          onClose={() => setLinkFor(null)}
          onSubmit={handleLinkCases}
        />

        {/* Columns Drawer */}
        <React.Suspense fallback={null}>
          <TableColumnsDrawer
            open={showColumnsDrawer}
            columns={columnsState}
            widths={
              Object.fromEntries(
                Object.keys(baseColumns).map((k) => [
                  k,
                  columnWidths[k] ?? baseColumns[k].width,
                ])
              ) as Record<string, number>
            }
            onWidthsChange={setColumnWidths}
            onChange={setColumnsState}
            onClose={() => setShowColumnsDrawer(false)}
            onReset={handleResetColumns}
          />
        </React.Suspense>

        {/* View Modal */}
        <CourtCaseViewModal
          open={viewId !== null}
          caseId={viewId}
          onClose={handleCloseView}
        />

        {/* Main Content */}
        <div
          style={{ marginTop: 24 }}
          onWheel={() => {
            if (hideOnScroll.current) {
              setShowAddForm(false);
              hideOnScroll.current = false;
            }
          }}
        >
          {/* Filters */}
          {showFilters && (
            <div style={{ marginBottom: 24, maxWidth: 1040 }}>
              <CourtCasesFilters
                values={filters}
                onChange={setFilters}
                onReset={resetFilters}
                projects={filterOptions.projects}
                units={filterOptions.units}
                stages={filterOptions.statuses}
                users={filterOptions.users}
                idOptions={filterOptions.ids}
              />
            </div>
          )}

          {/* Table */}
          <CourtCasesTable
            data={filteredCases}
            columns={columns}
            loading={isLoading}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
          />

          {/* Statistics */}
          <CourtCasesStats
            total={stats.total}
            closedCount={stats.closedCount}
            openCount={stats.openCount}
            readyToExport={filteredCases.length}
          />
        </div>
      </>
    </ConfigProvider>
  );
}
