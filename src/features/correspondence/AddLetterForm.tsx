import React, { useEffect } from 'react';
import { Form, Input, Select, DatePicker, Row, Col, Button } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { useUsers } from '@/entities/user';
import { useLetterTypes } from '@/entities/letterType';
import { useProjects } from '@/entities/project';
import { useUnitsByProject } from '@/entities/unit';
import { useContractors } from '@/entities/contractor';
import { useAttachmentTypes } from '@/entities/attachmentType';

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
  unit_ids: number[];
  attachments: { file: File; type_id: number | null }[];
  parent_id: string | null;
}

interface AddLetterFormProps {
  onSubmit: (data: AddLetterFormData) => void;
  parentId?: string | null;
}

/** Форма добавления нового письма на Ant Design */
export default function AddLetterForm({ onSubmit, parentId = null }: AddLetterFormProps) {
  const [form] = Form.useForm<Omit<AddLetterFormData, 'attachments'>>();
  const projectId = Form.useWatch('project_id', form);

  const [files, setFiles] = React.useState<{ file: File; type_id: number | null }[]>([]);

  const { data: users = [], isLoading: loadingUsers } = useUsers();
  const { data: letterTypes = [], isLoading: loadingTypes } = useLetterTypes();
  const { data: projects = [], isLoading: loadingProjects } = useProjects();
  const { data: units = [], isLoading: loadingUnits } = useUnitsByProject(projectId);
  const { data: contractors = [], isLoading: loadingContractors } =
    useContractors();
  const { data: attachmentTypes = [], isLoading: loadingAttachmentTypes } =
    useAttachmentTypes();

  useEffect(() => {
    form.setFieldValue('unit_ids', []);
  }, [projectId, form]);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arr = Array.from(e.target.files || []).map((f) => ({ file: f, type_id: null }));
    setFiles((p) => [...p, ...arr]);
    e.target.value = '';
  };

  const setType = (idx: number, val: number | null) =>
    setFiles((p) => p.map((f, i) => (i === idx ? { ...f, type_id: val } : f)));

  const removeFile = (idx: number) =>
    setFiles((p) => p.filter((_, i) => i !== idx));

  const submit = (values: Omit<AddLetterFormData, 'attachments'>) => {
    onSubmit({
      ...values,
      date: values.date ?? dayjs(),
      attachments: files,
      parent_id: parentId,
    });
    form.resetFields();
    setFiles([]);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={submit}
      initialValues={{ type: 'incoming', date: dayjs(), unit_ids: [] }}
      autoComplete="off"
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
            <Input placeholder="Введите номер письма" autoComplete="off" />
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
            <Select
              showSearch
              loading={loadingContractors}
              placeholder="Выберите корреспондента"
              optionFilterProp="children"
              allowClear
            >
              <Select.OptGroup label="Компании">
                {contractors.map((c) => (
                  <Select.Option key={`c-${c.id}`} value={c.name}>
                    {c.name}
                  </Select.Option>
                ))}
              </Select.OptGroup>
            </Select>
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
          <Form.Item name="unit_ids" label="Объекты">
            <Select
              mode="multiple"
              loading={loadingUnits}
              options={units.map((u) => ({ value: u.id, label: u.name }))}
              placeholder="Выберите объекты"
              disabled={!projectId}
            />
          </Form.Item>
        </Col>
        <Col span={8} />
      </Row>
      <Form.Item name="subject" label="Тема письма">
        <Input placeholder="Введите тему письма" autoComplete="off" />
      </Form.Item>
      <Form.Item name="content" label="Содержание">
        <Input.TextArea
          rows={3}
          placeholder="Введите содержание письма"
          autoComplete="off"
        />
      </Form.Item>
      <Form.Item label="Вложения">
        <input type="file" multiple onChange={handleFiles} />
        {files.map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', marginTop: 4 }}>
            <span style={{ marginRight: 8 }}>{f.file.name}</span>
            <Select
              style={{ width: 160 }}
              placeholder="Тип файла"
              value={f.type_id ?? undefined}
              onChange={(v) => setType(i, v)}
              allowClear
              loading={loadingAttachmentTypes}
            >
              {attachmentTypes.map((t) => (
                <Select.Option key={t.id} value={t.id}>
                  {t.name}
                </Select.Option>
              ))}
            </Select>
            <Button type="text" danger onClick={() => removeFile(i)}>
              Удалить
            </Button>
          </div>
        ))}
      </Form.Item>
      <Form.Item style={{ textAlign: 'right' }}>
        <Button type="primary" htmlType="submit">
          Добавить письмо
        </Button>
      </Form.Item>
    </Form>
  );
}
