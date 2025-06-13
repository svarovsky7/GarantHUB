// src/widgets/TicketsFilters.js

import React, { useEffect } from "react";
import { Form, DatePicker, Select, Input, Button, Switch } from "antd";

const { RangePicker } = DatePicker;
const { Option } = Select;
/** Ключ в localStorage для флага скрытия закрытых замечаний */
const LS_HIDE_CLOSED_KEY = "ticketsHideClosed";
/** Ключ в localStorage для выбранного проекта */
const LS_PROJECT_KEY = "ticketsProject";

/**
 * Фильтры таблицы замечаний.
 * @param options списки для Select
 * @param onChange callback, возвращающий значения формы
 */

export default function TicketsFilters({ options, onChange, initialValues = {} }) {
  const [form] = Form.useForm();
  useEffect(() => {
    form.setFieldsValue(initialValues);
  }, [initialValues, form]);

  useEffect(() => {
    try {
      const hideClosed = JSON.parse(localStorage.getItem(LS_HIDE_CLOSED_KEY) || "false");
      form.setFieldValue("hideClosed", hideClosed);
      const project = JSON.parse(localStorage.getItem(LS_PROJECT_KEY) || 'null');
      if (project) form.setFieldValue("project", project);
    } catch {}
    onChange(form.getFieldsValue());
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === LS_HIDE_CLOSED_KEY) {
        try {
          form.setFieldValue("hideClosed", JSON.parse(e.newValue || "false"));
          onChange(form.getFieldsValue());
        } catch {}
      }
      if (e.key === LS_PROJECT_KEY) {
        try {
          const val = JSON.parse(e.newValue || 'null');
          form.setFieldValue("project", val);
          onChange(form.getFieldsValue());
        } catch {}
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [form, onChange]);

  const handleValuesChange = (_, values) => {
    onChange(values);
    if (Object.prototype.hasOwnProperty.call(values, "hideClosed")) {
      try {
        localStorage.setItem(LS_HIDE_CLOSED_KEY, JSON.stringify(values.hideClosed));
      } catch {}
    }
    if (Object.prototype.hasOwnProperty.call(values, "project")) {
      try {
        if (values.project) {
          localStorage.setItem(LS_PROJECT_KEY, JSON.stringify(values.project));
        } else {
          localStorage.removeItem(LS_PROJECT_KEY);
        }
      } catch {}
    }
  };

  const reset = () => {
    form.resetFields();
    onChange({});
    try {
      localStorage.removeItem(LS_PROJECT_KEY);
    } catch {}
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onValuesChange={handleValuesChange}
      className="filter-grid"
      style={{ marginBottom: 20 }}
    >
      <Form.Item name="period" label="Период получения замечаний">
        <RangePicker format="DD.MM.YYYY" style={{ width: "100%" }} />
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
      <Form.Item name="warranty" label="Гарантия">
        <Select allowClear>
          <Option value="yes">Да</Option>
          <Option value="no">Нет</Option>
        </Select>
      </Form.Item>
      <Form.Item name="status" label="Статусы">
        <Select allowClear options={options.statuses} />
      </Form.Item>
      <Form.Item name="type" label="Тип замечания">
        <Select allowClear options={options.types} />
      </Form.Item>
      <Form.Item name="requestNo" label="№ заявки от Заказчика">
        <Input />
      </Form.Item>
      <Form.Item name="requestPeriod" label="Дата заявки Заказчика">
        <RangePicker format="DD.MM.YYYY" style={{ width: "100%" }} />
      </Form.Item>
      <Form.Item name="responsible" label="Ответственный инженер">
        <Select allowClear options={options.responsibleEngineers} />
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
