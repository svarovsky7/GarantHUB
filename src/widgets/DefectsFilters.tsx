import React, { useEffect } from 'react';
import { Form, Select, Button, DatePicker, Switch } from 'antd';
import type { DefectFilters } from '@/shared/types/defectFilters';

const { RangePicker } = DatePicker;

/** Ключ в localStorage для флага скрытия закрытых дефектов */
const LS_HIDE_CLOSED_KEY = 'defectsHideClosed';

interface Options {
  ids: { label: string; value: number }[];
  units: { label: string; value: number }[];
  projects: { label: string; value: number }[];
  types: { label: string; value: number }[];
  statuses: { label: string; value: number }[];
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

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === LS_HIDE_CLOSED_KEY) {
        try {
          form.setFieldValue('hideClosed', JSON.parse(e.newValue || 'false'));
          onChange(form.getFieldsValue());
        } catch {}
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [form, onChange]);

  const handleValuesChange = (_: any, values: DefectFilters) => {
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
    onChange({});
  };

  return (
    <Form form={form} layout="vertical" onValuesChange={handleValuesChange} className="filter-grid">
      <Form.Item name="id" label="ID дефекта">
        <Select mode="multiple" allowClear options={options.ids} showSearch optionFilterProp="label" />
      </Form.Item>
      <Form.Item name="projectId" label="Проекты">
        <Select mode="multiple" allowClear options={options.projects} showSearch optionFilterProp="label" />
      </Form.Item>
      <Form.Item name="units" label="Объекты">
        <Select mode="multiple" allowClear options={options.units} showSearch optionFilterProp="label" />
      </Form.Item>
      <Form.Item name="statusId" label="Статус">
        <Select mode="multiple" allowClear options={options.statuses} showSearch optionFilterProp="label" />
      </Form.Item>
      <Form.Item name="typeId" label="Тип">
        <Select mode="multiple" allowClear options={options.types} showSearch optionFilterProp="label" />
      </Form.Item>
      <Form.Item name="period" label="Дата получения">
        <RangePicker style={{ width: '100%' }} format="DD.MM.YYYY" />
      </Form.Item>
      <Form.Item name="fixBy" label="Кем устраняется">
        <Select mode="multiple" allowClear options={options.fixBy} showSearch optionFilterProp="label" />
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
