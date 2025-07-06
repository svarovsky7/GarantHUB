import React, { useEffect } from 'react';
import { Form, DatePicker, Select, Input, Button, Switch } from 'antd';
import type { ClaimFilters } from '@/shared/types/claimFilters';

const { RangePicker } = DatePicker;

export default function ClaimsFilters({ options, onChange, initialValues = {} }: { options: any; onChange: (v: ClaimFilters) => void; initialValues?: Partial<ClaimFilters>; }) {
  const LS_HIDE_CLOSED = 'claimsHideClosed';
  const [form] = Form.useForm();
  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [initialValues, form]);

  useEffect(() => {
    try {
      const hideClosed = JSON.parse(localStorage.getItem(LS_HIDE_CLOSED) || 'false');
      form.setFieldValue('hideClosed', hideClosed);
    } catch {}
    onChange(form.getFieldsValue());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleValuesChange = (_: any, values: any) => {
    onChange(values);
    if (Object.prototype.hasOwnProperty.call(values, 'hideClosed')) {
      try {
        localStorage.setItem(LS_HIDE_CLOSED, JSON.stringify(values.hideClosed));
      } catch {}
    }
  };

  const reset = () => {
    form.resetFields();
    onChange({});
  };

  return (
    <Form form={form} layout="vertical" onValuesChange={handleValuesChange}>
      <div className="claims-filter-grid">
        <div className="claims-filter-col">
          <Form.Item name="id" label="ID претензии">
            <Select mode="multiple" allowClear options={options.ids} />
          </Form.Item>
          <Form.Item name="claim_no" label="№ претензии">
            <Input />
          </Form.Item>
          <Form.Item name="status" label="Статус">
            <Select allowClear options={options.statuses} />
          </Form.Item>
        </div>
        <div className="claims-filter-col">
          <Form.Item name="author" label="Автор">
            <Select allowClear options={options.authors} />
          </Form.Item>
          <Form.Item name="responsible" label="Закрепленный инженер">
            <Select allowClear options={options.responsibleEngineers} />
          </Form.Item>
          <Form.Item name="period" label="Дата регистрации претензии">
            <RangePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
          </Form.Item>
        </div>
        <div className="claims-filter-col">
          <Form.Item name="claimedPeriod" label="Дата претензии">
            <RangePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="acceptedPeriod" label="Дата получения Застройщиком">
            <RangePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="resolvedPeriod" label="Дата устранения">
            <RangePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
          </Form.Item>
        </div>
        <div className="claims-filter-col">
          <Form.Item name="project" label="Проект">
            <Select allowClear options={options.projects} />
          </Form.Item>
          <Form.Item name="building" label="Корпус">
            <Select allowClear options={options.buildings} />
          </Form.Item>
          <Form.Item name="units" label="Объекты">
            <Select mode="multiple" allowClear options={options.units} />
          </Form.Item>
        </div>
      </div>
      <div className="claims-filter-footer">
        <Form.Item name="description" label="Дополнительная информация">
          <Input />
        </Form.Item>
        <Form.Item name="hideClosed" label="Скрыть закрытые" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item>
          <Button onClick={reset} block>
            Сброс
          </Button>
        </Form.Item>
      </div>
    </Form>
  );
}
