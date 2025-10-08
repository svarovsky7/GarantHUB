import React from 'react';
import { Button } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import type { DefectWithInfo } from '@/shared/types/defect';
import type { DefectFilters } from '@/shared/types/defectFilters';

// Lazy loading для компонента экспорта (содержит ExcelJS)
const ExportDefectsButton = React.lazy(() => import('@/features/defect/ExportDefectsButton'));

interface DefectsPageToolbarProps {
  showFilters: boolean;
  filteredDefects: DefectWithInfo[];
  filters: DefectFilters;
  onToggleFilters: () => void;
  onShowColumnsDrawer: () => void;
}

/**
 * Панель инструментов страницы дефектов
 */
export default function DefectsPageToolbar({
  showFilters,
  filteredDefects,
  filters,
  onToggleFilters,
  onShowColumnsDrawer,
}: DefectsPageToolbarProps) {
  return (
    <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
      <Button onClick={onToggleFilters}>
        {showFilters ? 'Скрыть фильтры' : 'Показать фильтры'}
      </Button>

      <Button icon={<SettingOutlined />} onClick={onShowColumnsDrawer} />

      <React.Suspense fallback={null}>
        <ExportDefectsButton defects={filteredDefects} filters={filters} />
      </React.Suspense>
    </div>
  );
}
