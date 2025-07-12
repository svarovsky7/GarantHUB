import React, { useEffect, useState } from 'react';
import {
  Form,
  DatePicker,
  Select,
  Input,
  Button,
  Switch,
  Card,
  Row,
  Col,
  Collapse,
  Badge,
  Skeleton,
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
  contactOptions: Option[];
  statuses: Option[];
  idOptions: Option[];
  onReset: () => void;
  loading?: boolean;
}

/** Форма фильтров корреспонденции */
export default function CorrespondenceFilters({
  form,
  filters,
  onChange,
  users,
  letterTypes,
  projects,
  projectUnits,
  contactOptions,
  statuses,
  idOptions,
  onReset,
  loading,
}: CorrespondenceFiltersProps) {
  const [extraCount, setExtraCount] = useState(0);

  const extraKeys = [
    'id',
    'sender',
    'receiver',
    'subject',
    'content',
    'unit',
  ];

  const calcExtra = () => {
    const vals = form.getFieldsValue();
    const count = extraKeys.reduce((acc, key) => {
      const v = vals[key];
      if (Array.isArray(v)) return acc + (v.length ? 1 : 0);
      if (v === undefined || v === null || v === '' || v === false) return acc;
      return acc + 1;
    }, 0);
    setExtraCount(count);
  };

  useEffect(() => {
    form.setFieldsValue(filters);
    calcExtra();
  }, [filters, form]);

  const handleValuesChange = (changed: any, all: any) => {
    calcExtra();
    onChange(changed, all);
  };

  const handleReset = () => {
    form.resetFields();
    setExtraCount(0);
    onReset();
  };

  const badge = <Badge count={extraCount} size="small" />;

  return (
    <Card variant="borderless" size="small" style={{ maxWidth: 1040 }}>
      {loading ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : (
        <Form
          form={form}
          layout="vertical"
          onValuesChange={handleValuesChange}
          initialValues={filters}
          onFinish={() => {}}
        >
          <Row gutter={12}>
            <Col span={5}>
              <Form.Item name="responsible" label="Ответственный">
                <Select 
                  showSearch 
                  allowClear 
                  options={users} 
                />
              </Form.Item>
            </Col>
            <Col span={5}>
              <Form.Item name="project" label="Проект">
                <Select
                  showSearch
                  allowClear
                  options={projects}
                  onChange={(value) => {
                    if (!value) {
                      form.setFieldsValue({ unit: undefined });
                    }
                  }}
                />
              </Form.Item>
            </Col>
            <Col span={5}>
              <Form.Item name="type" label="Тип письма">
                <Select allowClear placeholder="Все типы">
                  <Select.Option value="incoming">Входящее</Select.Option>
                  <Select.Option value="outgoing">Исходящее</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={5}>
              <Form.Item name="status" label="Статус">
                <Select allowClear options={statuses} />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item
                name="hideClosed"
                label="СКРЫТЬ ЗАКРЫТЫЕ"
                valuePropName="checked"
              >
                <Switch size="small" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col flex="auto">
              <Collapse 
                ghost
                items={[{
                  key: 'more',
                  label: 'Доп. фильтры',
                  extra: badge,
                  children: (
                    <>
                      <Row gutter={12}>
                    <Col span={6}>
                      <Form.Item name="id" label="ID письма">
                        <Select
                          mode="multiple"
                          allowClear
                          options={idOptions}
                          placeholder="ID"
                        />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item name="category" label="Категория">
                        <Select allowClear options={letterTypes} />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item name="unit" label="Объект">
                        <Select
                          showSearch
                          allowClear
                          options={projectUnits}
                          disabled={!form.getFieldValue('project')}
                          placeholder={form.getFieldValue('project') ? "Выберите объект" : "Сначала выберите проект"}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item name="period" label="Период">
                        <RangePicker
                          size="small"
                          format="DD.MM.YYYY"
                          style={{ width: '100%' }}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                  <Row gutter={12}>
                    <Col span={6}>
                      <Form.Item name="sender" label="Отправитель">
                        <Select
                          showSearch
                          allowClear
                          options={contactOptions}
                          filterOption={(input, option) => 
                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                          }
                        />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item name="receiver" label="Получатель">
                        <Select
                          showSearch
                          allowClear
                          options={contactOptions}
                          filterOption={(input, option) => 
                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                          }
                        />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item name="subject" label="В теме">
                        <Input allowClear autoComplete="off" />
                      </Form.Item>
                    </Col>
                    <Col span={6}>
                      <Form.Item name="content" label="В содержании">
                        <Input allowClear autoComplete="off" />
                      </Form.Item>
                    </Col>
                      </Row>
                    </>
                  )
                }]}
              />
            </Col>
          </Row>

          <Row justify="end" gutter={12}>
            <Col>
              <Button onClick={handleReset}>Сброс</Button>
            </Col>
            <Col>
              <Button type="primary" htmlType="submit">
                Найти
              </Button>
            </Col>
          </Row>
        </Form>
      )}
    </Card>
  );
}
