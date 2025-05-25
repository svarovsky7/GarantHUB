import React, { useEffect } from 'react';
import { Form, Input, Select, DatePicker, Row, Col, Button } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { useUsers } from '@/entities/user';
import { useLetterTypes } from '@/entities/letterType';
import { useProjects } from '@/entities/project';
import { useUnitsByProject } from '@/entities/unit';

export interface AddLetterFormData {
  type: 'incoming' | 'outgoing';
  number: string;
  date: Dayjs | null;
  correspondent: string;
  subject: string;
  content: string;
  responsible_user_id: string | null;
  letter_type_id: number | null;
  project_id: number | null;
  unit_id: number | null;
}

interface AddLetterFormProps {
  onSubmit: (data: AddLetterFormData) => void;
}

/** Форма добавления нового письма на Ant Design */
export default function AddLetterForm({ onSubmit }: AddLetterFormProps) {
  const [form] = Form.useForm<AddLetterFormData>();
  const projectId = Form.useWatch('project_id', form);

  const { data: users = [], isLoading: loadingUsers } = useUsers();
  const { data: letterTypes = [], isLoading: loadingTypes } = useLetterTypes();
  const { data: projects = [], isLoading: loadingProjects } = useProjects();
  const { data: units = [], isLoading: loadingUnits } = useUnitsByProject(projectId);

  useEffect(() => {
    form.setFieldValue('unit_id', null);
  }, [projectId, form]);

  const submit = (values: AddLetterFormData) => {
    onSubmit({ ...values, date: values.date ?? dayjs() });
    form.resetFields();
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={submit}
      initialValues={{ type: 'incoming', date: dayjs() }}
    >
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name="type" label="Тип письма">
            <Select placeholder="Выберите тип письма">
              <Select.Option value="incoming">Входящее</Select.Option>
              <Select.Option value="outgoing">Исходящее</Select.Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="number"
            label="Номер письма"
            rules={[{ required: true, message: 'Укажите номер письма' }]}
          >
            <Input placeholder="Введите номер письма" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="date"
            label="Дата"
            rules={[{ required: true, message: 'Укажите дату' }]}
          >
            <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name="correspondent" label="Корреспондент">
            <Input placeholder="Укажите отправителя/получателя" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="responsible_user_id" label="Ответственный">
            <Select
              loading={loadingUsers}
              options={users.map((u) => ({ value: u.id, label: u.name }))}
              allowClear
              placeholder="Выберите ответственного"
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="letter_type_id" label="Категория письма">
            <Select
              loading={loadingTypes}
              options={letterTypes.map((t) => ({ value: t.id, label: t.name }))}
              allowClear
              placeholder="Выберите категорию"
            />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name="project_id" label="Проект">
            <Select
              loading={loadingProjects}
              options={projects.map((p) => ({ value: p.id, label: p.name }))}
              allowClear
              placeholder="Выберите проект"
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="unit_id" label="Объект">
            <Select
              loading={loadingUnits}
              options={units.map((u) => ({ value: u.id, label: u.name }))}
              allowClear
              placeholder="Выберите объект"
              disabled={!projectId}
            />
          </Form.Item>
        </Col>
        <Col span={8} />
      </Row>
      <Form.Item name="subject" label="Тема письма">
        <Input placeholder="Введите тему письма" />
      </Form.Item>
      <Form.Item name="content" label="Содержание">
        <Input.TextArea rows={3} placeholder="Введите содержание письма" />
      </Form.Item>
      <Form.Item style={{ textAlign: 'right' }}>
        <Button type="primary" htmlType="submit">
          Добавить письмо
        </Button>
      </Form.Item>
    </Form>
  );
}
