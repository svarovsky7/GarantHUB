import React, { Suspense } from 'react';
import { Button } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import type { CorrespondenceLetter } from '@/shared/types/correspondence';

// Lazy loading для компонента экспорта (содержит ExcelJS)
const ExportLettersButton = React.lazy(() => import('@/features/correspondence/ExportLettersButton'));
import type { User } from '@/shared/types/user';
import type { LetterType } from '@/shared/types/letterType';
import type { Project } from '@/shared/types/project';
import type { Unit } from '@/shared/types/unit';
import type { LetterStatus } from '@/shared/types/letterStatus';

interface CorrespondencePageHeaderProps {
  showAddForm: boolean;
  showFilters: boolean;
  filteredLetters: CorrespondenceLetter[];
  users: User[];
  letterTypes: LetterType[];
  projects: Project[];
  units: Unit[];
  statuses: LetterStatus[];
  onToggleAddForm: () => void;
  onToggleFilters: () => void;
  onShowColumnsDrawer: () => void;
}

const CorrespondencePageHeader = React.memo<CorrespondencePageHeaderProps>(({
  showAddForm,
  showFilters,
  filteredLetters,
  users,
  letterTypes,
  projects,
  units,
  statuses,
  onToggleAddForm,
  onToggleFilters,
  onShowColumnsDrawer,
}) => {
  return (
    <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
      <Button
        type="primary"
        onClick={onToggleAddForm}
      >
        {showAddForm ? 'Скрыть форму' : 'Добавить письмо'}
      </Button>
      
      <Button onClick={onToggleFilters}>
        {showFilters ? 'Скрыть фильтры' : 'Показать фильтры'}
      </Button>
      
      <Button
        icon={<SettingOutlined />}
        onClick={onShowColumnsDrawer}
        title="Настройки колонок"
      />
      
      <Suspense fallback={<Button loading>Экспорт</Button>}>
        <ExportLettersButton
          letters={filteredLetters}
          users={users}
          letterTypes={letterTypes}
          projects={projects}
          units={units}
          statuses={statuses}
        />
      </Suspense>
    </div>
  );
});

CorrespondencePageHeader.displayName = 'CorrespondencePageHeader';

export default CorrespondencePageHeader;