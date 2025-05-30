import React, { useState } from 'react';
import dayjs from 'dayjs';
import { Form, Input, Select, DatePicker, Switch, Button, Row, Col } from 'antd';
import { useTicketTypes } from '@/entities/ticketType';
import { useTicketStatuses } from '@/entities/ticketStatus';
import { useUnitsByProject } from '@/entities/unit';
import { useUsers } from '@/entities/user';
import { useCreateTicket } from '@/entities/ticket';
import { useAttachmentTypes } from '@/entities/attachmentType';
import type { Ticket } from '@/shared/types/ticket';
import { useProjectId } from '@/shared/hooks/useProjectId';

/**
 * Форма создания замечания на основе Ant Design.
 * @param onCreated callback после успешного создания
 */
export default function TicketFormAntd({ onCreated }: { onCreated?: () => void }) {
  const [form] = Form.useForm();
  const projectId = useProjectId();
  const { data: types = [] } = useTicketTypes();
  const { data: statuses = [] } = useTicketStatuses();
  const { data: units = [] } = useUnitsByProject(projectId); // requires enabled but hook handles null
  const { data: users = [] } = useUsers();
  const { data: attachmentTypes = [] } = useAttachmentTypes();
  const create = useCreateTicket();
  const [files, setFiles] = useState<{ file: File; type_id: number | null }[]>([]);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arr = Array.from(e.target.files || []).map((f) => ({ file: f, type_id: null }));
    setFiles((p) => [...p, ...arr]);
    e.target.value = '';
  };
  const setType = (idx: number, val: number | null) =>
    setFiles((p) => p.map((f, i) => (i === idx ? { ...f, type_id: val } : f)));
  const removeFile = (idx: number) => setFiles((p) => p.filter((_, i) => i !== idx));

  const onFinish = async (values: any) => {
    try {
      await create.mutateAsync({
        ...values,
        project_id: projectId,
        attachments: files,
        received_at: values.received_at.format('YYYY-MM-DD'),
        fixed_at: values.fixed_at ? values.fixed_at.format('YYYY-MM-DD') : null,
        customer_request_date: values.customer_request_date
          ? values.customer_request_date.format('YYYY-MM-DD')
          : null,
      } as Ticket & { attachments: any[] });
      form.resetFields();
      setFiles([]);
      onCreated?.();
    } catch (e: any) {
      // antd message already handled in mutation
      console.error(e);
    }
  };

  return (
    <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off">
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name="unit_id" label="Объект" rules={[{ required: true }]}> 
            <Select options={units.map((u) => ({ value: u.id, label: u.name }))} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="type_id" label="Тип" rules={[{ required: true }]}> 
            <Select options={types.map((t) => ({ value: t.id, label: t.name }))} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="status_id" label="Статус" rules={[{ required: true }]}> 
            <Select options={statuses.map((s) => ({ value: s.id, label: s.name }))} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name="responsible_engineer_id" label="Ответственный инженер">
            <Select
              allowClear
              options={users.map((u) => ({ value: u.id, label: u.name }))}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="is_warranty" label="Гарантия" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name="received_at" label="Дата получения" rules={[{ required: true }]}> 
            <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="fixed_at" label="Дата устранения">
            <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="customer_request_date" label="Дата заявки">
            <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item name="customer_request_no" label="№ заявки">
        <Input />
      </Form.Item>
      <Form.Item name="title" label="Краткое описание" rules={[{ required: true }]}> 
        <Input />
      </Form.Item>
      <Form.Item name="description" label="Подробное описание">
        <Input.TextArea rows={2} />
      </Form.Item>
      <Form.Item label="Файлы">
        <input type="file" multiple onChange={handleFiles} />
        {files.map((f, i) => (
          <Row key={i} gutter={8} align="middle" style={{ marginTop: 4 }}>
            <Col flex="auto">
              <span>{f.file.name}</span>
            </Col>
            <Col flex="160px">
              <Select
                style={{ width: '100%' }}
                placeholder="Тип файла"
                value={f.type_id ?? undefined}
                onChange={(v) => setType(i, v)}
                allowClear
              >
                {attachmentTypes.map((t) => (
                  <Select.Option key={t.id} value={t.id}>
                    {t.name}
                  </Select.Option>
                ))}
              </Select>
            </Col>
            <Col>
              <Button type="text" danger onClick={() => removeFile(i)}>
                Удалить
              </Button>
            </Col>
          </Row>
        ))}
      </Form.Item>
      <Form.Item style={{ textAlign: 'right' }}>
        <Button type="primary" htmlType="submit" loading={create.isPending}>
          Создать
        </Button>
      </Form.Item>
    </Form>
  );
}
