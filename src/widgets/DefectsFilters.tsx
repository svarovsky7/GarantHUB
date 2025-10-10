import React, { useEffect } from 'react';
import { Form, Select, Row, Col, Button, Space, Card, Switch } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import type { DefectFilters } from '@/shared/types/defectFilters';

interface Options {
  projects: { label: string; value: number }[];
  units: { label: string; value: number }[];
  statuses: { label: string; value: number }[];
  types: { label: string; value: number }[];
  ids: { label: string; value: number }[];
  claimIds: { label: string; value: number }[];
}

interface Props {
  options: Options;
  initialValues?: Partial<DefectFilters>;
  onChange: (values: DefectFilters) => void;
}

const LS_HIDE_CLOSED_KEY = 'defectsHideClosed';

/**
 * Упрощенные фильтры дефектов - только 6 основных полей + переключатель "Скрыть закрытые".
 * Поля фильтруют все записи из БД и также фильтруют друг друга (каскадная фильтрация).
 */
export default function DefectsFilters({ options, onChange, initialValues = {} }: Props) {
  const [form] = Form.useForm();

  // Инициализация формы начальными значениями
  useEffect(() => {
    // Восстанавливаем значение hideClosed из localStorage
    try {
      const hideClosed = JSON.parse(
        localStorage.getItem(LS_HIDE_CLOSED_KEY) || 'false',
      );
      form.setFieldsValue({ ...initialValues, hideClosed });
    } catch {
      form.setFieldsValue(initialValues);
    }
  }, [form, initialValues]);

  const handleValuesChange = (_: any, allValues: any) => {
    // Преобразуем значения формы в DefectFilters
    const filters: DefectFilters = {
      projectId: allValues.projectId?.length > 0 ? allValues.projectId : undefined,
      units: allValues.units?.length > 0 ? allValues.units : undefined,
      statusId: allValues.statusId?.length > 0 ? allValues.statusId : undefined,
      typeId: allValues.typeId?.length > 0 ? allValues.typeId : undefined,
      id: allValues.id?.length > 0 ? allValues.id : undefined,
      claimId: allValues.claimId?.length > 0 ? allValues.claimId : undefined,
      hideClosed: allValues.hideClosed || false,
    };

    // Сохраняем hideClosed в localStorage
    if (Object.prototype.hasOwnProperty.call(allValues, 'hideClosed')) {
      try {
        localStorage.setItem(LS_HIDE_CLOSED_KEY, JSON.stringify(allValues.hideClosed));
      } catch {}
    }

    onChange(filters);
  };

  const handleReset = () => {
    form.resetFields();
    try {
      localStorage.setItem(LS_HIDE_CLOSED_KEY, 'false');
    } catch {}
    onChange({});
  };

  return (
    <Card size="small" style={{ border: 'none' }}>
      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleValuesChange}
        initialValues={{
          projectId: [],
          units: [],
          statusId: [],
          typeId: [],
          id: [],
          claimId: [],
          hideClosed: false,
        }}
      >
        <Row gutter={12} align="bottom">
          <Col span={4}>
            <Form.Item name="projectId" label="Проект">
              <Select
                mode="multiple"
                placeholder="Все проекты"
                options={options.projects}
                allowClear
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                maxTagCount="responsive"
              />
            </Form.Item>
          </Col>

          <Col span={4}>
            <Form.Item name="units" label="Объект">
              <Select
                mode="multiple"
                placeholder="Все объекты"
                options={options.units}
                allowClear
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                maxTagCount="responsive"
              />
            </Form.Item>
          </Col>

          <Col span={4}>
            <Form.Item name="statusId" label="Статус">
              <Select
                mode="multiple"
                placeholder="Все статусы"
                options={options.statuses}
                allowClear
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                maxTagCount="responsive"
              />
            </Form.Item>
          </Col>

          <Col span={4}>
            <Form.Item name="typeId" label="Тип">
              <Select
                mode="multiple"
                placeholder="Все типы"
                options={options.types}
                allowClear
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                maxTagCount="responsive"
              />
            </Form.Item>
          </Col>

          <Col span={4}>
            <Form.Item name="id" label="ID дефекта">
              <Select
                mode="multiple"
                placeholder="Все ID"
                options={options.ids}
                allowClear
                showSearch
                filterOption={(input, option) =>
                  String(option?.label ?? '').includes(input)
                }
                maxTagCount="responsive"
              />
            </Form.Item>
          </Col>

          <Col span={4}>
            <Form.Item name="claimId" label="ID претензии">
              <Select
                mode="multiple"
                placeholder="Все ID"
                options={options.claimIds}
                allowClear
                showSearch
                filterOption={(input, option) =>
                  String(option?.label ?? '').includes(input)
                }
                maxTagCount="responsive"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={12}>
          <Col span={12}>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleReset}
                size="small"
              >
                Сбросить фильтры
              </Button>
            </Space>
          </Col>
          <Col span={12} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <Form.Item name="hideClosed" label="Скрыть закрытые" valuePropName="checked" style={{ marginBottom: 0 }}>
              <Switch size="small" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Card>
  );
}
