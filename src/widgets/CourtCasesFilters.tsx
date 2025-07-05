import React, { useMemo } from 'react';
import { Form, Select, Input, DatePicker, Switch, Button } from 'antd';
import { Project } from '@/shared/types/project';
import { Unit } from '@/shared/types/unit';
import { CourtCaseStatus } from '@/shared/types/courtCaseStatus';
import { User } from '@/shared/types/user';
import { naturalCompare } from '@/shared/utils/naturalSort';
import type { CourtCasesFiltersValues } from '@/shared/types/courtCasesFilters';

export interface CourtCasesFiltersProps {
  values: CourtCasesFiltersValues;
  onChange: (v: CourtCasesFiltersValues) => void;
  onReset: () => void;
  projects: Project[];
  units: Unit[];
  stages: CourtCaseStatus[];
  users: User[];
  idOptions: { value: number; label: string }[];
}

/** Форма фильтров судебных дел */
export default function CourtCasesFilters({
  values,
  onChange,
  onReset,
  projects,
  units,
  stages,
  users,
  idOptions,
}: CourtCasesFiltersProps) {
  return (
    <Form layout="vertical" className="filter-grid">
      <Form.Item label="ID">
        <Select
          mode="multiple"
          allowClear
          placeholder="ID"
          options={idOptions}
          value={values.ids}
          onChange={(v) => onChange({ ...values, ids: v })}
        />
      </Form.Item>
      <Form.Item label="Проект">
        <Select
          allowClear
          placeholder="Проект"
          options={projects.map((p) => ({ value: p.id, label: p.name }))}
          value={values.projectId}
          onChange={(v) =>
            onChange({ ...values, projectId: v, building: undefined, objectId: undefined })
          }
        />
      </Form.Item>
      <Form.Item label="Корпус">
        <Select
          allowClear
          placeholder="Корпус"
          options={useMemo(() => {
            const list = Array.from(
              new Set(
                units
                  .filter((u) => !values.projectId || u.project_id === values.projectId)
                  .map((u) => u.building)
                  .filter(Boolean),
              ),
            ) as string[];
            return list
              .sort(naturalCompare)
              .map((b) => ({ value: b, label: b }));
          }, [units, values.projectId])}
          value={values.building}
          onChange={(v) => onChange({ ...values, building: v, objectId: undefined })}
          disabled={!values.projectId}
        />
      </Form.Item>
      <Form.Item label="Объект">
        <Select
          allowClear
          placeholder="Объект"
          options={units
            .filter(
              (u) =>
                (!values.projectId || u.project_id === values.projectId) &&
                (!values.building || u.building === values.building),
            )
            .map((u) => ({ value: u.id, label: u.name }))}
          value={values.objectId}
          onChange={(v) => onChange({ ...values, objectId: v })}
          disabled={!values.projectId}
        />
      </Form.Item>
      <Form.Item label="Номер дела">
        <Input
          placeholder="Номер"
          value={values.number}
          onChange={(e) => onChange({ ...values, number: e.target.value })}
        />
      </Form.Item>
      <Form.Item label="Дата дела">
        <DatePicker.RangePicker
          allowClear
          style={{ width: '100%' }}
          format="DD.MM.YYYY"
          value={values.dateRange as any}
          onChange={(v) => onChange({ ...values, dateRange: v as any })}
        />
      </Form.Item>
      <Form.Item label="Статус">
        <Select
          allowClear
          placeholder="Статус"
          options={stages.map((s) => ({ value: s.id, label: s.name }))}
          value={values.status}
          onChange={(v) => onChange({ ...values, status: v })}
        />
      </Form.Item>
      <Form.Item label="Период начала устранения">
        <DatePicker.RangePicker
          allowClear
          style={{ width: '100%' }}
          format="DD.MM.YYYY"
          value={values.fixStartRange as any}
          onChange={(v) => onChange({ ...values, fixStartRange: v as any })}
        />
      </Form.Item>
      <Form.Item label="Юрист">
        <Select
          allowClear
          showSearch
          placeholder="Юрист"
          options={users.map((u) => ({ value: u.id, label: u.name }))}
          value={values.lawyerId}
          onChange={(v) => onChange({ ...values, lawyerId: v })}
        />
      </Form.Item>
      <Form.Item label="Скрыть закрытые" valuePropName="checked">
        <Switch
          checked={!!values.hideClosed}
          onChange={(checked) => onChange({ ...values, hideClosed: checked })}
        />
      </Form.Item>
      <Form.Item>
        <Button onClick={onReset} block>
          Сбросить фильтры
        </Button>
      </Form.Item>
    </Form>
  );
}
