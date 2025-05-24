// src/widgets/TicketsFilters.js

import React, { useEffect } from "react";
import { Form, DatePicker, Select, Input, Button } from "antd";

const { RangePicker } = DatePicker;
const { Option } = Select;

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
      data-oid=":ow1_-k"
    >
      <Form.Item name="period" label="Период" data-oid="05iz:r7">
        <RangePicker
          format="DD.MM.YYYY"
          style={{ width: "100%" }}
          data-oid="b.n.vg6"
        />
      </Form.Item>
      <Form.Item name="project" label="Проект" data-oid="3hg:cz7">
        <Select allowClear options={options.projects} data-oid="5svce4y" />
      </Form.Item>
      <Form.Item name="unit" label="Объект" data-oid="-pto0ot">
        <Select allowClear options={options.units} data-oid="i_g:46b" />
      </Form.Item>
      <Form.Item name="warranty" label="Гарантия" data-oid="z8n34mg">
        <Select allowClear data-oid="w.xtto8">
          <Option value="yes" data-oid="5yq64r6">
            Да
          </Option>
          <Option value="no" data-oid="82bmp0j">
            Нет
          </Option>
        </Select>
      </Form.Item>
      <Form.Item name="status" label="Статусы" data-oid="k15gi_g">
        <Select allowClear options={options.statuses} data-oid="sdsd10l" />
      </Form.Item>
      <Form.Item name="type" label="Тип замечания" data-oid="v:r13lz">
        <Select allowClear options={options.types} data-oid=".7on6ku" />
      </Form.Item>
      <Form.Item name="author" label="Кем добавлено" data-oid="w3j9v8x">
        <Select allowClear options={options.authors} data-oid="d5djtym" />
      </Form.Item>
      <Form.Item name="ticketId" label="Номер замечания" data-oid="9io3ze7">
        <Input placeholder="ID" data-oid=":w_ycw5" />
      </Form.Item>
      <Form.Item
        name="requestNo"
        label="№ заявки от Заказчика"
        data-oid="dnx.ncb"
      >
        <Input data-oid="ht8.w9v" />
      </Form.Item>
      <Form.Item
        name="requestPeriod"
        label="Дата регистрации заявки"
        data-oid="3_7ep93"
      >
        <RangePicker
          format="DD.MM.YYYY"
          style={{ width: "100%" }}
          data-oid="md-hq-6"
        />
      </Form.Item>
      <Form.Item
        name="days"
        label="Прошло дней с Даты получения"
        data-oid="gppiib4"
      >
        <Input data-oid="k5-k105" />
      </Form.Item>
      <Form.Item
        name="responsible"
        label="Ответственный инженер"
        data-oid="cp1q57w"
      >
        <Select
          allowClear
          options={options.responsibleEngineers}
          data-oid="36ep0wv"
        />
      </Form.Item>
      <Form.Item data-oid="b2cl35t">
        <Button onClick={reset} block data-oid="hitdtt:">
          Сброс
        </Button>
      </Form.Item>
    </Form>
  );
}
