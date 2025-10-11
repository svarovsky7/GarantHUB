import React from 'react';
import { Button } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import ExportLettersButton from '@/features/correspondence/ExportLettersButton';
import type { CorrespondenceLetter } from '@/shared/types/correspondence';
import type { User } from '@/shared/types/user';
import type { LetterType } from '@/shared/types/letterType';
import type { Project } from '@/shared/types/project';
import type { Unit } from '@/shared/types/unit';
import type { LetterStatus } from '@/shared/types/letterStatus';

interface CorrespondenceToolbarProps {
  showAddForm: boolean;
  showFilters: boolean;
  onToggleAddForm: () => void;
  onToggleFilters: () => void;
  onOpenColumnsDrawer: () => void;
  filteredLetters: CorrespondenceLetter[];
  users: User[];
  letterTypes: LetterType[];
  projects: Project[];
  units: Unit[];
  statuses: LetterStatus[];
}

/**
 * Toolbar with action buttons for correspondence page
 */
const CorrespondenceToolbar: React.FC<CorrespondenceToolbarProps> = ({
  showAddForm,
  showFilters,
  onToggleAddForm,
  onToggleFilters,
  onOpenColumnsDrawer,
  filteredLetters,
  users,
  letterTypes,
  projects,
  units,
  statuses,
}) => {
  return (
    <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
      <Button type="primary" onClick={onToggleAddForm}>
        {showAddForm ? 'Скрыть форму' : 'Добавить письмо'}
      </Button>

      <Button onClick={onToggleFilters}>
        {showFilters ? 'Скрыть фильтры' : 'Показать фильтры'}
      </Button>

      <Button icon={<SettingOutlined />} onClick={onOpenColumnsDrawer} />

      <ExportLettersButton
        letters={filteredLetters}
        users={users}
        letterTypes={letterTypes}
        projects={projects}
        units={units}
        statuses={statuses}
      />
    </div>
  );
};

export default React.memo(CorrespondenceToolbar);
