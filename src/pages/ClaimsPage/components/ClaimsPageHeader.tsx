import React, { Suspense } from 'react';
import { Button, Space } from 'antd';
import { SettingOutlined, PlusOutlined } from '@ant-design/icons';
import type { ClaimWithNames } from '@/shared/types/claimWithNames';
import type { ClaimFilters } from '@/shared/types/claimFilters';

// Lazy loading для компонента экспорта (содержит ExcelJS)
const ExportClaimsButton = React.lazy(() => import('@/features/claim/ExportClaimsButton'));

interface ClaimsPageHeaderProps {
  showAddForm: boolean;
  showFilters: boolean;
  claimsWithNames: ClaimWithNames[];
  filters: ClaimFilters;
  onToggleAddForm: () => void;
  onToggleFilters: () => void;
  onShowColumnsDrawer: () => void;
  usesPagination?: boolean;
}

const ClaimsPageHeader = React.memo<ClaimsPageHeaderProps>(({
  showAddForm,
  showFilters,
  claimsWithNames,
  filters,
  onToggleAddForm,
  onToggleFilters,
  onShowColumnsDrawer,
  usesPagination = false,
}) => {
  return (
    <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={onToggleAddForm}
      >
        {showAddForm ? 'Скрыть форму' : 'Добавить претензию'}
      </Button>
      
      <Button onClick={onToggleFilters}>
        {showFilters ? "Скрыть фильтры" : "Показать фильтры"}
      </Button>
      
      <Button
        icon={<SettingOutlined />}
        onClick={onShowColumnsDrawer}
        title="Настройки колонок"
      />
      
      <Suspense fallback={<Button loading>Экспорт</Button>}>
        <ExportClaimsButton claims={claimsWithNames} filters={filters} useAllData={usesPagination} />
      </Suspense>
    </div>
  );
});

ClaimsPageHeader.displayName = 'ClaimsPageHeader';

export default ClaimsPageHeader;