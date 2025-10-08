import { Button } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import ExportClaimsButton from '@/features/claim/ExportClaimsButton';
import type { ClaimWithNames } from '@/shared/types/claimWithNames';

interface ClaimsPageToolbarProps {
  showAddForm: boolean;
  showFilters: boolean;
  filteredClaims: ClaimWithNames[];
  onToggleAddForm: () => void;
  onToggleFilters: () => void;
  onShowColumnsDrawer: () => void;
}

/**
 * Панель инструментов страницы претензий
 */
export default function ClaimsPageToolbar({
  showAddForm,
  showFilters,
  filteredClaims,
  onToggleAddForm,
  onToggleFilters,
  onShowColumnsDrawer,
}: ClaimsPageToolbarProps) {
  return (
    <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
      <Button type="primary" onClick={onToggleAddForm}>
        {showAddForm ? 'Скрыть форму' : 'Добавить претензию'}
      </Button>

      <Button onClick={onToggleFilters}>
        {showFilters ? 'Скрыть фильтры' : 'Показать фильтры'}
      </Button>

      <Button icon={<SettingOutlined />} onClick={onShowColumnsDrawer} />

      <ExportClaimsButton claims={filteredClaims} />
    </div>
  );
}
