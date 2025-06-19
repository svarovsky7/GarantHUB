import React, { useEffect } from 'react';
import { Form, DatePicker, Select, Input, Button } from 'antd';
import type { ClaimFilters } from '@/shared/types/claimFilters';

const { RangePicker } = DatePicker;

export default function ClaimsFilters({ options, onChange, initialValues = {} }: { options: any; onChange: (v: ClaimFilters) => void; initialValues?: Partial<ClaimFilters>; }) {
  const [form] = Form.useForm();
  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [initialValues, form]);

  useEffect(() => {
    onChange(form.getFieldsValue());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleValuesChange = (_, values: any) => {
    onChange(values);
  };

  const reset = () => {
    form.resetFields();
    onChange({});
  };

  return (
    <Form form={form} layout="vertical" onValuesChange={handleValuesChange} className="filter-grid" style={{ marginBottom: 20 }}>
      <Form.Item name="period" label="Период регистрации претензий">
        <RangePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item name="project" label="Проект">
        <Select allowClear options={options.projects} />
      </Form.Item>
      <Form.Item name="units" label="Объекты">
        <Select mode="multiple" allowClear options={options.units} />
      </Form.Item>
      <Form.Item name="id" label="ID">
        <Select mode="multiple" allowClear options={options.ids} />
      </Form.Item>
      <Form.Item name="status" label="Статусы">
        <Select allowClear options={options.statuses} />
      </Form.Item>
      <Form.Item name="number" label="№ претензии">
        <Input />
      </Form.Item>
      <Form.Item name="responsible" label="Ответственный инженер">
        <Select allowClear options={options.responsibleEngineers} />
      </Form.Item>
      <Form.Item>
        <Button onClick={reset} block>
          Сброс
        </Button>
      </Form.Item>
    </Form>
  );
}
