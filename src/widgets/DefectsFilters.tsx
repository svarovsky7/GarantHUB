import React, { useEffect, useState } from 'react';
import { 
  Form, 
  Select, 
  Button, 
  DatePicker, 
  Switch,
  Card,
  Row,
  Col,
  Collapse,
  Badge,
  Input
} from 'antd';
import type { DefectFilters } from '@/shared/types/defectFilters';

const { RangePicker } = DatePicker;

/** Ключ в localStorage для флага скрытия закрытых дефектов */
const LS_HIDE_CLOSED_KEY = 'defectsHideClosed';

interface Options {
  ids: { label: string; value: number }[];
  claimIds: { label: string; value: number }[];
  units: { label: string; value: number }[];
  projects: { label: string; value: number }[];
  types: { label: string; value: number }[];
  statuses: { label: string; value: number }[];
  fixBy: { label: string; value: string }[];
  engineers: { label: string; value: string }[];
  authors: { label: string; value: string }[];
  buildings: { label: string; value: string }[];
}

/** Форма фильтров дефектов */
export default function DefectsFilters({
  options,
  onChange,
  initialValues = {},
}: {
  options: Options;
  onChange: (v: DefectFilters) => void;
  initialValues?: Partial<DefectFilters>;
}) {
  const [form] = Form.useForm();
  const [extraCount, setExtraCount] = useState(0);
  
  useEffect(() => {
    form.setFieldsValue(initialValues);
    calcExtra();
  }, [initialValues, form]);

  useEffect(() => {
    try {
      const hideClosed = JSON.parse(
        localStorage.getItem(LS_HIDE_CLOSED_KEY) || 'false',
      );
      form.setFieldValue('hideClosed', hideClosed);
    } catch {}
    onChange(form.getFieldsValue());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const extraKeys: (keyof DefectFilters)[] = [
    'id',
    'claimId',
    'author',
    'building',
    'units',
    'period',
    'createdPeriod',
    'fixedPeriod',
    'typeId',
    'fixBy',
    'hasFiles',
  ];

  const calcExtra = () => {
    const vals = form.getFieldsValue();
    const count = extraKeys.reduce((acc, key) => {
      const v = vals[key];
      if (Array.isArray(v)) return acc + (v.length ? 1 : 0);
      if (v === undefined || v === null || v === "" || v === false) return acc;
      return acc + 1;
    }, 0);
    setExtraCount(count);
  };

  const handleValuesChange = (_: any, values: DefectFilters) => {
    calcExtra();
    onChange(values);
    if (Object.prototype.hasOwnProperty.call(values, 'hideClosed')) {
      try {
        localStorage.setItem(
          LS_HIDE_CLOSED_KEY,
          JSON.stringify(values.hideClosed),
        );
      } catch {}
    }
  };

  const reset = () => {
    form.resetFields();
    setExtraCount(0);
    try {
      localStorage.setItem(LS_HIDE_CLOSED_KEY, 'false');
    } catch {}
    onChange({});
  };

  const badge = <Badge count={extraCount} size="small" />;

  return (
    <Card bordered={false} size="small" style={{ maxWidth: 1040 }}>
      <Form form={form} layout="vertical" onValuesChange={handleValuesChange}>
        <Row gutter={12}>
          <Col span={5}>
            <Form.Item name="engineer" label="Закрепленный инженер">
              <Select allowClear options={options.engineers} showSearch optionFilterProp="label" />
            </Form.Item>
          </Col>
          <Col span={5}>
            <Form.Item name="projectId" label="Проект">
              <Select 
                mode="multiple" 
                allowClear 
                options={options.projects} 
                showSearch 
                optionFilterProp="label"
                onChange={(value) => {
                  // При изменении проекта очищаем зависимые поля
                  if (!value || value.length === 0) {
                    form.setFieldsValue({ 
                      units: undefined,
                      building: undefined 
                    });
                  }
                }}
              />
            </Form.Item>
          </Col>
          <Col span={5}>
            <Form.Item name="statusId" label="Статус">
              <Select mode="multiple" allowClear options={options.statuses} showSearch optionFilterProp="label" />
            </Form.Item>
          </Col>
          <Col span={5}>
            <Form.Item name="typeId" label="Тип">
              <Select mode="multiple" allowClear options={options.types} showSearch optionFilterProp="label" />
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
            <Collapse ghost>
              <Collapse.Panel header="Доп. фильтры" key="more" extra={badge}>
                <Row gutter={12}>
                  <Col span={6}>
                    <Form.Item name="id" label="ID дефекта">
                      <Select mode="multiple" allowClear options={options.ids} showSearch optionFilterProp="label" />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item name="claimId" label="ID претензии">
                      <Select mode="multiple" allowClear options={options.claimIds} showSearch optionFilterProp="label" />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item name="author" label="Автор">
                      <Select allowClear options={options.authors} showSearch optionFilterProp="label" />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item name="fixBy" label="Кем устраняется">
                      <Select mode="multiple" allowClear options={options.fixBy} showSearch optionFilterProp="label" />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={12}>
                  <Col span={6}>
                    <Form.Item name="building" label="Корпус">
                      <Select 
                        mode="multiple" 
                        allowClear 
                        options={options.buildings} 
                        showSearch 
                        optionFilterProp="label"
                        disabled={!form.getFieldValue('projectId') || form.getFieldValue('projectId').length === 0}
                        placeholder={form.getFieldValue('projectId') && form.getFieldValue('projectId').length > 0 ? "Выберите корпус" : "Сначала выберите проект"}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item name="units" label="Объекты">
                      <Select 
                        mode="multiple" 
                        allowClear 
                        options={options.units} 
                        showSearch 
                        optionFilterProp="label"
                        disabled={!form.getFieldValue('projectId') || form.getFieldValue('projectId').length === 0}
                        placeholder={form.getFieldValue('projectId') && form.getFieldValue('projectId').length > 0 ? "Выберите объекты" : "Сначала выберите проект"}
                      />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item name="hasFiles" label="Наличие файлов">
                      <Select allowClear placeholder="Все">
                        <Select.Option value="with">С файлами</Select.Option>
                        <Select.Option value="without">Без файлов</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={12}>
                  <Col span={6}>
                    <Form.Item name="period" label="Дата получения">
                      <RangePicker size="small" format="DD.MM.YYYY" style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item name="createdPeriod" label="Добавлено">
                      <RangePicker size="small" format="DD.MM.YYYY" style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col span={6}>
                    <Form.Item name="fixedPeriod" label="Дата устранения">
                      <RangePicker size="small" format="DD.MM.YYYY" style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>
              </Collapse.Panel>
            </Collapse>
          </Col>
        </Row>

        <Row justify="end" gutter={12}>
          <Col>
            <Button onClick={reset}>Сброс</Button>
          </Col>
        </Row>
      </Form>
    </Card>
  );
}
