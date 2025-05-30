// src/widgets/TicketsFilters.js

import React, { useEffect } from "react";
import { Form, DatePicker, Select, Input, Button } from "antd";

const { RangePicker } = DatePicker;
const { Option } = Select;

/**
 * Фильтры таблицы замечаний.
 * @param options списки для Select
 * @param onChange callback, возвращающий значения формы
 */

export default function TicketsFilters({ options, onChange }) {
  const [form] = Form.useForm();

  useEffect(() => {
    onChange(form.getFieldsValue());
    // eslint-disable-next-line
  }, []);

  const handleValuesChange = (_, values) => {
    onChange(values);
  };

  const reset = () => {
    form.resetFields();
    onChange({});
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onValuesChange={handleValuesChange}
      style={{
        marginBottom: 20,
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
        gap: 12,
        alignItems: "end",
      }}
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
      <Form.Item>
        <Button onClick={reset} block>
          Сброс
        </Button>
      </Form.Item>
    </Form>
  );
}
