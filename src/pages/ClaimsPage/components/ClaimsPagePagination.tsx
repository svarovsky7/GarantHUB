import React from 'react';
import { Pagination, Select, Space, Typography } from 'antd';

interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
  usesPagination: boolean;
}

interface ClaimsPagePaginationProps {
  pagination: PaginationState;
  totalRecords: number;
  filteredRecords: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

const ClaimsPagePagination = React.memo<ClaimsPagePaginationProps>(({
  pagination,
  totalRecords,
  filteredRecords,
  onPageChange,
  onPageSizeChange,
}) => {
  // Don't show pagination if not using server-side pagination
  if (!pagination.usesPagination) {
    return null;
  }

  const current = pagination.page + 1; // Convert 0-based to 1-based
  const pageSize = pagination.pageSize;
  const total = pagination.total;

  const handlePageChange = (page: number) => {
    onPageChange(page - 1); // Convert 1-based to 0-based
  };

  const handlePageSizeChange = (value: number) => {
    onPageSizeChange(value);
  };

  const startRecord = pagination.page * pageSize + 1;
  const endRecord = Math.min((pagination.page + 1) * pageSize, total);

  return (
    <div style={{ 
      marginTop: 16, 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 16 
    }}>
      <Space>
        <Typography.Text>
          Размер страницы:
        </Typography.Text>
        <Select
          value={pageSize}
          onChange={handlePageSizeChange}
          options={[
            { value: 25, label: '25' },
            { value: 50, label: '50' },
            { value: 100, label: '100' },
            { value: 200, label: '200' },
          ]}
          style={{ width: 80 }}
        />
      </Space>

      <Space>
        <Typography.Text type="secondary">
          Показано {startRecord}-{endRecord} из {total} записей
          {filteredRecords !== totalRecords && ` (отфильтровано из ${totalRecords})`}
        </Typography.Text>
      </Space>

      <Pagination
        current={current}
        pageSize={pageSize}
        total={total}
        onChange={handlePageChange}
        showSizeChanger={false}
        showQuickJumper
        showTotal={(total, range) => 
          `${range[0]}-${range[1]} из ${total}`
        }
        size="small"
      />
    </div>
  );
});

ClaimsPagePagination.displayName = 'ClaimsPagePagination';

export default ClaimsPagePagination;