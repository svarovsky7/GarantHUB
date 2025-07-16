import React from 'react';
import { Typography, Form } from 'antd';
import dayjs from 'dayjs';
import { AddLetterFormData } from '@/features/correspondence/AddLetterForm';
import AddLetterForm from '@/features/correspondence/AddLetterForm';
import CorrespondenceTable from '@/widgets/CorrespondenceTable';
import CorrespondenceFilters from '@/widgets/CorrespondenceFilters';
import type { CorrespondenceLetter } from '@/shared/types/correspondence';
import type { User } from '@/shared/types/user';
import type { LetterType } from '@/shared/types/letterType';
import type { Project } from '@/shared/types/project';
import type { Unit } from '@/shared/types/unit';
import type { LetterStatus } from '@/shared/types/letterStatus';
import type { ColumnsType } from 'antd/es/table';

interface Filters {
  period?: [dayjs.Dayjs, dayjs.Dayjs] | null;
  type?: 'incoming' | 'outgoing' | '';
  id?: number[];
  category?: number | '';
  project?: number | '';
  building?: string | '';
  unit?: number | '';
  sender?: string;
  receiver?: string;
  subject?: string;
  content?: string;
  status?: number | '';
  responsible?: string | '';
  hideClosed?: boolean;
}

interface CorrespondencePageContentProps {
  // Add Form
  showAddForm: boolean;
  initialValues: any;
  onSubmitAdd: (data: AddLetterFormData) => void;

  // Filters
  showFilters: boolean;
  form: any;
  filters: Filters;
  users: User[];
  letterTypes: LetterType[];
  projects: Project[];
  projectUnits: Unit[];
  buildingOptions: Array<{ value: string; label: string }>;
  contactOptions: Array<{ value: string; label: string }>;
  statuses: LetterStatus[];
  idOptions: Array<{ value: string; label: string }>;
  onFiltersChange: (changedFields: any, allValues: any) => void;
  onResetFilters: () => void;
  hideOnScrollRef: React.MutableRefObject<boolean>;
  onHideFormOnScroll: () => void;

  // Table
  filteredLetters: CorrespondenceLetter[];
  allUsers: User[];
  allLetterTypes: LetterType[];
  allProjects: Project[];
  allUnits: Unit[];
  allStatuses: LetterStatus[];
  lockedUnitIds: number[];
  columns: ColumnsType<any>;
  onDelete: (id: string) => void;
  onAddChild: (letter: CorrespondenceLetter) => void;
  onUnlink: (id: string) => void;
  onView: (id: string) => void;

  // Stats
  totalLetters: number;
  closedCount: number;
  openCount: number;
  readyToExport: number;
}

const CorrespondencePageContent = React.memo<CorrespondencePageContentProps>(({
  showAddForm,
  initialValues,
  onSubmitAdd,
  showFilters,
  form,
  filters,
  users,
  letterTypes,
  projects,
  projectUnits,
  buildingOptions,
  contactOptions,
  statuses,
  idOptions,
  onFiltersChange,
  onResetFilters,
  hideOnScrollRef,
  onHideFormOnScroll,
  filteredLetters,
  allUsers,
  allLetterTypes,
  allProjects,
  allUnits,
  allStatuses,
  lockedUnitIds,
  columns,
  onDelete,
  onAddChild,
  onUnlink,
  onView,
  totalLetters,
  closedCount,
  openCount,
  readyToExport,
}) => {
  return (
    <>
      {showAddForm && (
        <div style={{ marginBottom: 24 }}>
          <AddLetterForm onSubmit={onSubmitAdd} initialValues={initialValues} />
        </div>
      )}

      <div
        style={{ marginTop: 24 }}
        onWheel={() => {
          if (hideOnScrollRef.current) {
            onHideFormOnScroll();
            hideOnScrollRef.current = false;
          }
        }}
      >
        {showFilters && (
          <div style={{ marginBottom: 24 }}>
            <CorrespondenceFilters
              form={form}
              filters={filters}
              onChange={onFiltersChange}
              users={users.map((u) => ({ value: u.id, label: u.name }))}
              letterTypes={letterTypes.map((t) => ({ value: t.id, label: t.name }))}
              projects={projects.map((p) => ({ value: p.id, label: p.name }))}
              projectUnits={projectUnits.map((u) => ({ value: u.id, label: u.name }))}
              buildingOptions={buildingOptions}
              contactOptions={contactOptions}
              statuses={statuses.map((s) => ({ value: s.id, label: s.name }))}
              idOptions={idOptions}
              onReset={onResetFilters}
            />
          </div>
        )}
        
        <CorrespondenceTable
          letters={filteredLetters}
          onDelete={onDelete}
          onAddChild={onAddChild}
          onUnlink={onUnlink}
          onView={onView}
          users={allUsers}
          letterTypes={allLetterTypes}
          projects={allProjects}
          units={allUnits}
          statuses={allStatuses}
          columns={columns}
          lockedUnitIds={lockedUnitIds}
        />
        
        <Typography.Text style={{ display: 'block', marginTop: 8 }}>
          Всего писем: {totalLetters}, из них закрытых: {closedCount} и не закрытых: {openCount}
        </Typography.Text>
        <Typography.Text style={{ display: 'block', marginTop: 4 }}>
          Готовых писем к выгрузке: {readyToExport}
        </Typography.Text>
      </div>
    </>
  );
});

CorrespondencePageContent.displayName = 'CorrespondencePageContent';

export default CorrespondencePageContent;