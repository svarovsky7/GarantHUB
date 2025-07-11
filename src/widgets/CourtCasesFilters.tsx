import React, { useMemo, useState } from 'react';
import { 
  Form, 
  Select, 
  Input, 
  DatePicker, 
  Switch, 
  Button,
  Card,
  Row,
  Col,
  Collapse,
  Badge
} from 'antd';
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
  const [extraCount, setExtraCount] = useState(0);

  // Дополнительные фильтры
  const extraKeys = ['ids', 'number', 'uid', 'parties', 'dateRange', 'fixStartRange', 'description'];

  React.useEffect(() => {
    const count = extraKeys.reduce((acc, key) => {
      const v = values[key as keyof CourtCasesFiltersValues];
      if (Array.isArray(v)) return acc + (v.length ? 1 : 0);
      if (v === undefined || v === null || v === "" || v === false) return acc;
      return acc + 1;
    }, 0);
    setExtraCount(count);
  }, [values]);

  const buildingOptions = useMemo(() => {
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
  }, [units, values.projectId]);

  const unitOptions = units
    .filter(
      (u) =>
        (!values.projectId || u.project_id === values.projectId) &&
        (!values.building || u.building === values.building),
    )
    .map((u) => ({ value: u.id, label: u.name }));

  const badge = <Badge count={extraCount} size="small" />;

  return (
    <Card bordered={false} size="small" style={{ maxWidth: 1040 }}>
      <Form layout="vertical">
        <Row gutter={12}>
          <Col span={5}>
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
          </Col>
          <Col span={5}>
            <Form.Item label="Корпус">
              <Select
                allowClear
                placeholder="Корпус"
                options={buildingOptions}
                value={values.building}
                onChange={(v) => onChange({ ...values, building: v, objectId: undefined })}
                disabled={!values.projectId}
              />
            </Form.Item>
          </Col>
          <Col span={5}>
            <Form.Item label="Объект">
              <Select
                allowClear
                placeholder="Объект"
                options={unitOptions}
                value={values.objectId}
                onChange={(v) => onChange({ ...values, objectId: v })}
                disabled={!values.projectId}
              />
            </Form.Item>
          </Col>
          <Col span={5}>
            <Form.Item label="Статус">
              <Select
                allowClear
                placeholder="Статус"
                options={stages.map((s) => ({ value: s.id, label: s.name }))}
                value={values.status}
                onChange={(v) => onChange({ ...values, status: v })}
              />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item label="Скрыть закрытые" valuePropName="checked">
              <Switch
                size="small"
                checked={!!values.hideClosed}
                onChange={(checked) => onChange({ ...values, hideClosed: checked })}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={12}>
          <Col flex="auto">
            <Collapse ghost>
              <Collapse.Panel header="Доп. фильтры" key="more" extra={badge}>
                <Row gutter={12}>
                  <Col span={6}>
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
                  </Col>
                  <Col span={6}>
                    <Form.Item label="Номер дела">
                      <Input
                        placeholder="Номер"
                        value={values.number}
                        onChange={(e) => onChange({ ...values, number: e.target.value })}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item label="UID">
                      <Input
                        placeholder="UID"
                        value={values.uid}
                        onChange={(e) => onChange({ ...values, uid: e.target.value })}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
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
                  </Col>
                </Row>
                <Row gutter={12}>
                  <Col span={6}>
                    <Form.Item label="Стороны">
                      <Input
                        placeholder="Истец/Ответчик"
                        value={values.parties}
                        onChange={(e) => onChange({ ...values, parties: e.target.value })}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item label="Описание">
                      <Input
                        placeholder="Описание"
                        value={values.description}
                        onChange={(e) => onChange({ ...values, description: e.target.value })}
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={12}>
                  <Col span={6}>
                    <Form.Item label="Дата дела">
                      <DatePicker.RangePicker
                        allowClear
                        size="small"
                        style={{ width: '100%' }}
                        format="DD.MM.YYYY"
                        value={values.dateRange as any}
                        onChange={(v) => onChange({ ...values, dateRange: v as any })}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item label="Период начала устранения">
                      <DatePicker.RangePicker
                        allowClear
                        size="small"
                        style={{ width: '100%' }}
                        format="DD.MM.YYYY"
                        value={values.fixStartRange as any}
                        onChange={(v) => onChange({ ...values, fixStartRange: v as any })}
                      />
                    </Form.Item>
                  </Col>
                </Row>
              </Collapse.Panel>
            </Collapse>
          </Col>
        </Row>

        <Row justify="end" gutter={12}>
          <Col>
            <Button onClick={onReset}>Сброс</Button>
          </Col>
        </Row>
      </Form>
    </Card>
  );
}
