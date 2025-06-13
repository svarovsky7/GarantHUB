import React from 'react';
import { Form, Select, Input, DatePicker, Switch, Button } from 'antd';

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
}: CorrespondenceFiltersProps) {
  return (
    <Form
      form={form}
      layout="vertical"
      onValuesChange={onChange}
      initialValues={filters}
      className="filter-grid"
    >
      <Form.Item name="period" label="Период">
        <DatePicker.RangePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
      </Form.Item>
      <Form.Item name="type" label="Тип письма">
        <Select allowClear placeholder="Все типы">
          <Select.Option value="incoming">Входящее</Select.Option>
          <Select.Option value="outgoing">Исходящее</Select.Option>
        </Select>
      </Form.Item>
      <Form.Item name="id" label="ID">
        <Select mode="multiple" allowClear options={idOptions} placeholder="ID" />
      </Form.Item>
      <Form.Item name="category" label="Категория">
        <Select allowClear options={letterTypes} />
      </Form.Item>
      <Form.Item name="project" label="Проект">
        <Select
          showSearch
          allowClear
          options={projects}
          onChange={() => form.setFieldValue('unit', undefined)}
        />
      </Form.Item>
      <Form.Item name="unit" label="Объект">
        <Select
          showSearch
          allowClear
          options={projectUnits}
          disabled={!form.getFieldValue('project')}
        />
      </Form.Item>
      <Form.Item name="sender" label="Отправитель">
        <Select
          showSearch
          allowClear
          options={contactOptions}
          filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
        />
      </Form.Item>
      <Form.Item name="receiver" label="Получатель">
        <Select
          showSearch
          allowClear
          options={contactOptions}
          filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
        />
      </Form.Item>
      <Form.Item name="subject" label="В теме">
        <Input allowClear autoComplete="off" />
      </Form.Item>
      <Form.Item name="content" label="В содержании">
        <Input allowClear autoComplete="off" />
      </Form.Item>
      <Form.Item name="status" label="Статус писем">
        <Select allowClear options={statuses} />
      </Form.Item>
      <Form.Item name="responsible" label="Ответственный">
        <Select showSearch allowClear options={users} />
      </Form.Item>
      <Form.Item name="hideClosed" label="Скрыть закрытые" valuePropName="checked">
        <Switch />
      </Form.Item>
      <Form.Item>
        <Button onClick={onReset} block>
          Сбросить фильтры
        </Button>
      </Form.Item>
    </Form>
  );
}
