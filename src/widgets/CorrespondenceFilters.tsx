import React, { useEffect, useState, useMemo, useCallback } from 'react';
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

const { RangePicker } = DatePicker;

interface Option { value: number | string; label: string; }

export interface CorrespondenceFiltersProps {
  form: any;
  filters: any;
  onChange: (_: any, values: any) => void;
  users: Option[];
  letterTypes: Option[];
  projects: Option[];
  projectUnits: Option[];
  buildingOptions: Option[];
  contactOptions: Option[];
  statuses: Option[];
  idOptions: Option[];
  onReset: () => void;
}

// Мемоизированный селект для производительности
const MemoizedSelect = React.memo<{ options: any; [key: string]: any }>(({ options, ...props }) => (
  <Select 
    allowClear 
    showSearch 
    filterOption={(input, option) =>
      String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
    } 
    {...props} 
    options={options} 
  />
));

const MemoizedMultiSelect = React.memo<{ options: any; [key: string]: any }>(({ options, ...props }) => (
  <Select 
    mode="multiple" 
    allowClear 
    showSearch 
    maxTagCount="responsive" 
    filterOption={(input, option) =>
      String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
    } 
    {...props} 
    options={options} 
  />
));

/** Форма фильтров корреспонденции */
export default function CorrespondenceFilters({
  form,
  filters,
  onChange,
  users,
  letterTypes,
  projects,
  projectUnits,
  buildingOptions,
  contactOptions,
  statuses,
  idOptions,
  onReset,
}: CorrespondenceFiltersProps) {
  const [extraCount, setExtraCount] = useState(0);

  // Дополнительные фильтры
  const extraKeys = ['id', 'period', 'building', 'sender', 'receiver', 'subject', 'content'];

  useEffect(() => {
    const count = extraKeys.reduce((acc, key) => {
      const v = filters[key];
      if (Array.isArray(v)) return acc + (v.length ? 1 : 0);
      if (v === undefined || v === null || v === "" || v === false) return acc;
      return acc + 1;
    }, 0);
    setExtraCount(count);
  }, [filters]);

  const badge = <Badge count={extraCount} size="small" />;

  const typeOptions = [
    { value: 'incoming', label: 'Входящее' },
    { value: 'outgoing', label: 'Исходящее' }
  ];

  return (
    <Card variant="borderless" size="small" style={{ maxWidth: 1040 }}>
      <Form
        form={form}
        layout="vertical"
        onValuesChange={onChange}
        initialValues={filters}
      >
        <Row gutter={12}>
          <Col span={5}>
            <Form.Item name="type" label="Тип письма">
              <MemoizedSelect 
                options={typeOptions}
                placeholder="Все типы"
              />
            </Form.Item>
          </Col>
          <Col span={5}>
            <Form.Item name="category" label="Категория">
              <MemoizedSelect 
                options={letterTypes}
                placeholder="Категория"
              />
            </Form.Item>
          </Col>
          <Col span={5}>
            <Form.Item name="project" label="Проект">
              <MemoizedSelect
                options={projects}
                placeholder="Проект"
                onChange={() => form.setFieldValue('unit', undefined)}
              />
            </Form.Item>
          </Col>
          <Col span={5}>
            <Form.Item name="status" label="Статус">
              <MemoizedSelect 
                options={statuses}
                placeholder="Статус"
              />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item name="hideClosed" label="Скрыть закрытые" valuePropName="checked">
              <Switch size="small" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={12}>
          <Col flex="auto">
            <Collapse 
              ghost
              items={[
                {
                  key: 'more',
                  label: 'Доп. фильтры',
                  extra: badge,
                  children: (
                    <>
                      <Row gutter={12}>
                        <Col span={5}>
                          <Form.Item name="id" label="ID">
                            <MemoizedMultiSelect
                              options={idOptions}
                              placeholder="ID"
                            />
                          </Form.Item>
                        </Col>
                        <Col span={5}>
                          <Form.Item name="building" label="Корпус">
                            <MemoizedSelect
                              options={buildingOptions}
                              placeholder="Корпус"
                              onChange={() => form.setFieldValue('unit', undefined)}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={5}>
                          <Form.Item name="unit" label="Объект">
                            <MemoizedSelect
                              options={projectUnits}
                              placeholder="Объект"
                              disabled={!form.getFieldValue('project') && !form.getFieldValue('building')}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={5}>
                          <Form.Item name="responsible" label="Ответственный">
                            <MemoizedSelect 
                              options={users}
                              placeholder="Ответственный"
                            />
                          </Form.Item>
                        </Col>
                        <Col span={4}>
                          <Form.Item name="period" label="Период">
                            <RangePicker 
                              format="DD.MM.YYYY" 
                              style={{ width: '100%' }}
                              size="small"
                              placeholder={['От', 'До']}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                      <Row gutter={12}>
                        <Col span={6}>
                          <Form.Item name="sender" label="Отправитель">
                            <MemoizedSelect
                              options={contactOptions}
                              placeholder="Отправитель"
                            />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item name="receiver" label="Получатель">
                            <MemoizedSelect
                              options={contactOptions}
                              placeholder="Получатель"
                            />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item name="subject" label="В теме">
                            <Input 
                              allowClear 
                              autoComplete="off" 
                              placeholder="Поиск в теме..."
                            />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item name="content" label="В содержании">
                            <Input 
                              allowClear 
                              autoComplete="off" 
                              placeholder="Поиск в тексте..."
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                    </>
                  )
                }
              ]}
            />
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
