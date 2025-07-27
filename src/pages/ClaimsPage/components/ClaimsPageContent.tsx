import React from 'react';
import { Alert, Typography } from 'antd';
import ClaimFormAntd from '@/features/claim/ClaimFormAntd';
import ClaimsTable from '@/widgets/ClaimsTable';
import ClaimsPagePagination from './ClaimsPagePagination';
import type { ClaimWithNames } from '@/shared/types/claimWithNames';
import type { ClaimFilters } from '@/shared/types/claimFilters';
import type { ClaimTableData } from '../types/ClaimTableData';
import type { ColumnsType } from 'antd/es/table';

interface ClaimsPageContentProps {
  // Add Form
  showAddForm: boolean;
  initialValues: any;
  onCloseAddForm: () => void;

  // Filters
  showFilters: boolean;
  filters: ClaimFilters;
  filterOptions: any;
  filtersLoading: boolean;
  onSubmitFilters: (filters: ClaimFilters) => void;
  onResetFilters: () => void;

  // Table
  claimsWithNames: ClaimWithNames[];
  columns: ColumnsType<ClaimTableData>;
  isLoading: boolean;
  error: Error | null;
  onView: (id: number) => void;
  onAddChild: (claim: ClaimWithNames) => void;

  // Stats
  totalClaims: number;
  closedClaims: number;
  openClaims: number;
  readyToExport: number;

  // Pagination
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
    usesPagination: boolean;
  };
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

const ClaimsPageContent = React.memo<ClaimsPageContentProps>(({
  showAddForm,
  initialValues,
  onCloseAddForm,
  showFilters,
  filters,
  filterOptions,
  filtersLoading,
  onSubmitFilters,
  onResetFilters,
  claimsWithNames,
  columns,
  isLoading,
  error,
  onView,
  onAddChild,
  totalClaims,
  closedClaims,
  openClaims,
  readyToExport,
  pagination,
  onPageChange,
  onPageSizeChange,
}) => {
  return (
    <>
      {showAddForm && (
        <div style={{ marginBottom: 24 }}>
          <ClaimFormAntd
            onCreated={onCloseAddForm}
            initialValues={initialValues}
          />
        </div>
      )}


      {error ? (
        <Alert type="error" message={error.message} />
      ) : (
        <ClaimsTable
          claims={claimsWithNames}
          loading={isLoading}
          onView={onView}
          onAddChild={onAddChild}
          columns={columns}
          showPagination={!pagination}
        />
      )}

      <div style={{ marginTop: 16 }}>
        <Typography.Text style={{ display: 'block', marginTop: 8 }}>
          Всего претензий: {totalClaims}, из них закрытых: {closedClaims} и открытых: {openClaims}
        </Typography.Text>
        <Typography.Text style={{ display: 'block', marginTop: 4 }}>
          {pagination?.usesPagination 
            ? `Претензий на текущей странице: ${readyToExport}`
            : `Готовых претензий к выгрузке: ${readyToExport}`
          }
        </Typography.Text>
      </div>

      {pagination && onPageChange && onPageSizeChange && (
        <ClaimsPagePagination
          pagination={pagination}
          totalRecords={pagination.total}
          filteredRecords={readyToExport}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      )}
    </>
  );
});

ClaimsPageContent.displayName = 'ClaimsPageContent';

export default ClaimsPageContent;