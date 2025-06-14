import React, { useEffect } from 'react';
import { Form, Select, Button, DatePicker } from 'antd';
import type { DefectFilters } from '@/shared/types/defectFilters';

const { RangePicker } = DatePicker;

interface Options {
  ids: { label: string; value: number }[];
  tickets: { label: string; value: number }[];
  units: { label: string; value: number }[];
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
        <Select mode="multiple" allowClear options={options.ids} />
      </Form.Item>
      <Form.Item name="ticketId" label="№ замечания">
        <Select mode="multiple" allowClear options={options.tickets} />
      </Form.Item>
      <Form.Item name="units" label="Объекты">
        <Select mode="multiple" allowClear options={options.units} />
      </Form.Item>
      <Form.Item name="period" label="Дата создания">
        <RangePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
      </Form.Item>
      <Form.Item>
        <Button onClick={reset} block>
          Сброс
        </Button>
      </Form.Item>
    </Form>
  );
}
