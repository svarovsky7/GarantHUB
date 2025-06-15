import React, { useEffect } from 'react';
import { Form, Select, Button, DatePicker, Switch } from 'antd';
import type { DefectFilters } from '@/shared/types/defectFilters';

const { RangePicker } = DatePicker;

interface Options {
  ids: { label: string; value: number }[];
  tickets: { label: string; value: number }[];
  units: { label: string; value: number }[];
  projects: { label: string; value: string }[];
  types: { label: string; value: string }[];
  statuses: { label: string; value: string }[];
  fixBy: { label: string; value: string }[];
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
  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [initialValues, form]);

  const handleValuesChange = (_: any, values: DefectFilters) => onChange(values);

  const reset = () => {
    form.resetFields();
    onChange({});
  };

  return (
    <Form form={form} layout="vertical" onValuesChange={handleValuesChange} className="filter-grid">
      <Form.Item name="id" label="ID">
        <Select mode="multiple" allowClear options={options.ids} showSearch optionFilterProp="label" />
      </Form.Item>
      <Form.Item name="ticketId" label="ID замечание">
        <Select mode="multiple" allowClear options={options.tickets} showSearch optionFilterProp="label" />
      </Form.Item>
      <Form.Item name="projectId" label="Проекты">
        <Select mode="multiple" allowClear options={options.projects} showSearch optionFilterProp="label" />
      </Form.Item>
      <Form.Item name="units" label="Объекты">
        <Select mode="multiple" allowClear options={options.units} showSearch optionFilterProp="label" />
      </Form.Item>
      <Form.Item name="typeId" label="Тип">
        <Select mode="multiple" allowClear options={options.types} showSearch optionFilterProp="label" />
      </Form.Item>
      <Form.Item name="statusId" label="Статус">
        <Select mode="multiple" allowClear options={options.statuses} showSearch optionFilterProp="label" />
      </Form.Item>
      <Form.Item name="fixBy" label="Кем устраняется">
        <Select mode="multiple" allowClear options={options.fixBy} showSearch optionFilterProp="label" />
      </Form.Item>
      <Form.Item name="period" label="Дата получения">
        <RangePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
      </Form.Item>
      <Form.Item name="hideClosed" label="Скрыть закрытые" valuePropName="checked">
        <Switch />
      </Form.Item>
      <Form.Item>
        <Button onClick={reset} block>
          Сброс
        </Button>
      </Form.Item>
    </Form>
  );
}
