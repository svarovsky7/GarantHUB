import React, { useEffect, useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { Form, Input, Select, DatePicker, Switch, Button, Row, Col } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useDefectTypes } from '@/entities/defectType';
import { useDefectStatuses } from '@/entities/defectStatus';
import { useTicketStatuses } from '@/entities/ticketStatus';
import { useUnitsByProject } from '@/entities/unit';
import { useUsers } from '@/entities/user';
import { useProjects } from '@/entities/project';
import { useCreateTicket } from '@/entities/ticket';
import { useAttachmentTypes } from '@/entities/attachmentType';
import { useProjectId } from '@/shared/hooks/useProjectId';
import { useAuthStore } from '@/shared/store/authStore';
import FileDropZone from '@/shared/ui/FileDropZone';
import { useNotify } from '@/shared/hooks/useNotify';

/**
 * Форма создания замечания на основе Ant Design.
 * @param onCreated callback после успешного создания
 */
export interface TicketFormAntdProps {
  onCreated?: () => void;
  /** Начальные значения формы */
  initialValues?: Partial<{
    project_id: number;
    unit_ids: number[];
    responsible_engineer_id: string;
  }>;
}

export interface TicketFormAntdValues {
  project_id: number | null;
  unit_ids: number[];
  status_id: number | null;
  title: string;
  description: string | null;
  customer_request_no: string | null;
  customer_request_date: Dayjs | null;
  responsible_engineer_id: string | null;
  is_warranty: boolean;
  received_at: Dayjs;
  fixed_at: Dayjs | null;
  defects?: Array<{ type_id: number | null; fixed_at: Dayjs | null; fix_by: string }>;
  /** Дополнительные данные разметки, не отправляются на сервер */
  pins?: unknown;
}

export default function TicketFormAntd({ onCreated, initialValues = {} }: TicketFormAntdProps) {
  const [form] = Form.useForm<TicketFormAntdValues>();
  const globalProjectId = useProjectId();
  const projectId = Form.useWatch('project_id', form) ?? globalProjectId;

  const { data: defectTypes = [] } = useDefectTypes();
  const { data: defectStatuses = [] } = useDefectStatuses();
  const { data: statuses = [] } = useTicketStatuses();
  const { data: projects = [] } = useProjects();
  const { data: units = [] } = useUnitsByProject(projectId);
  const { data: users = [] } = useUsers();
  const { data: attachmentTypes = [] } = useAttachmentTypes();
  const create = useCreateTicket();
  const notify = useNotify();
  const [files, setFiles] = useState<{ file: File; type_id: number | null }[]>([]);
  const profileId = useAuthStore((s) => s.profile?.id);

  useEffect(() => {
    if (initialValues.project_id != null) {
      form.setFieldValue('project_id', initialValues.project_id);
    } else if (globalProjectId) {
      form.setFieldValue('project_id', globalProjectId);
    }
    if (initialValues.unit_ids) {
      form.setFieldValue('unit_ids', initialValues.unit_ids);
    }
    if (initialValues.responsible_engineer_id) {
      form.setFieldValue('responsible_engineer_id', initialValues.responsible_engineer_id);
    }
    form.setFieldValue('received_at', dayjs());
  }, [globalProjectId, form, initialValues]);

  useEffect(() => {
    if (!initialValues.unit_ids) {
      form.setFieldValue('unit_ids', []);
    }
  }, [projectId, form, initialValues.unit_ids]);

  useEffect(() => {
    if (statuses.length) {
      form.setFieldValue('status_id', statuses[0].id);
    }
  }, [statuses, form]);

  useEffect(() => {
    if (profileId && !form.getFieldValue('responsible_engineer_id')) {
      form.setFieldValue('responsible_engineer_id', profileId);
    }
  }, [profileId, form]);

  const handleDropFiles = (dropped: File[]) => {
    const arr = dropped.map((f) => ({ file: f, type_id: null }));
    setFiles((p) => [...p, ...arr]);
  };
  const setType = (idx: number, val: number | null) =>
    setFiles((p) => p.map((f, i) => (i === idx ? { ...f, type_id: val } : f)));
  const removeFile = (idx: number) => setFiles((p) => p.filter((_, i) => i !== idx));

  const onFinish = async (values: TicketFormAntdValues) => {
    if (files.some((f) => f.type_id == null)) {
      notify.error('Выберите тип файла для всех документов');
      return;
    }
    try {
      const { pins, defects: _defects, ...rest } = values;
      const payload = {
        ...rest,
        project_id: values.project_id ?? globalProjectId,
        attachments: files,
        defect_ids: (_defects || [])
          .map((d) => d.type_id ?? null)
          .filter((id): id is number => id != null),
        received_at: values.received_at.format('YYYY-MM-DD'),
        fixed_at: values.fixed_at ? values.fixed_at.format('YYYY-MM-DD') : null,
        customer_request_date: values.customer_request_date
          ? values.customer_request_date.format('YYYY-MM-DD')
          : null,
      };
      await create.mutateAsync(payload as any);
      form.resetFields();
      setFiles([]);
      onCreated?.();
    } catch (e: unknown) {
      // antd message already handled in mutation
      console.error(e);
    }
  };

  return (
    <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off">
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            name="project_id"
            label="Проект"
            rules={[{ required: true }]}
          >
            <Select allowClear options={projects.map((p) => ({ value: p.id, label: p.name }))} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="unit_ids" label="Объекты" rules={[{ required: true }]}> 
            <Select
              mode="multiple"
              options={units.map((u) => ({ value: u.id, label: u.name }))}
              disabled={!projectId}
              onChange={(vals) => {
                form.setFieldValue('unit_ids', vals);
              }}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="responsible_engineer_id"
            label="Ответственный инженер"
            rules={[{ required: true }]}
          >
            <Select allowClear options={users.map((u) => ({ value: u.id, label: u.name }))} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name="status_id" label="Статус" rules={[{ required: true }]}>
            <Select options={statuses.map((s) => ({ value: s.id, label: s.name }))} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="is_warranty" label="Гарантия" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="customer_request_no" label="№ заявки от Заказчика">
            <Input />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="customer_request_date" label="Дата заявки Заказчика">
            <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
      <Form.List name="defects">
        {(fields, { add, remove }) => (
          <>
            <table style={{ width: '100%', marginBottom: 16 }}>
              <thead>
                <tr>
                  <th style={{ width: 40 }}>ID</th>
                  <th>Описание дефекта</th>
                  <th style={{ width: 140 }}>Статус</th>
                  <th style={{ width: 140 }}>Тип</th>
                  <th style={{ width: 140 }}>Дата получения</th>
                  <th style={{ width: 140 }}>Дата устранения</th>
                  <th style={{ width: 180 }}>Кем устраняется</th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {fields.map((field, index) => (
                  <tr key={field.key}>
                    <td>{index + 1}</td>
                    <td>
                      <Form.Item name={[field.name, 'description']} noStyle>
                        <Input placeholder="Описание" />
                      </Form.Item>
                    </td>
                    <td>
                      <Form.Item name={[field.name, 'status_id']} noStyle initialValue={defectStatuses[0]?.id}>
                        <Select
                          placeholder="Статус"
                          options={defectStatuses.map((s) => ({ value: s.id, label: s.name }))}
                        />
                      </Form.Item>
                    </td>
                    <td>
                      <Form.Item name={[field.name, 'type_id']} noStyle>
                        <Select
                          placeholder="Тип"
                          options={defectTypes.map((d) => ({ value: d.id, label: d.name }))}
                        />
                      </Form.Item>
                    </td>
                    <td>
                      <Form.Item name={[field.name, 'received_at']} noStyle initialValue={dayjs()}>
                        <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
                      </Form.Item>
                    </td>
                    <td>
                      <Form.Item name={[field.name, 'fixed_at']} noStyle>
                        <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
                      </Form.Item>
                    </td>
                    <td>
                      <Form.Item name={[field.name, 'fix_by']} noStyle initialValue="own">
                        <Select
                          options={[
                            { value: 'own', label: 'Собственные силы' },
                            { value: 'contractor', label: 'Подрядчик' },
                          ]}
                        />
                      </Form.Item>
                    </td>
                    <td>
                      <Button type="text" danger onClick={() => remove(field.name)}>
                        Удалить
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />}>Добавить дефект</Button>
          </>
        )}
      </Form.List>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name="received_at" label="Дата получения" rules={[{ required: true }]}>
            <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="fixed_at" label="Дата устранения" rules={[{ required: true }]}>
            <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={8} style={{ marginBottom: 8 }}>
        {[10, 45, 60].map((d) => (
          <Col key={d}>
            <Button
              size="small"
              onClick={() => {
                const rec = form.getFieldValue('received_at');
                if (rec) {
                  form.setFieldValue('fixed_at', dayjs(rec).add(d, 'day'));
                }
              }}
            >
              +{d} дней
            </Button>
          </Col>
        ))}
      </Row>
      <Form.Item name="title" label="Краткое описание" rules={[{ required: true }]}> 
        <Input />
      </Form.Item>
      <Form.Item name="description" label="Подробное описание">
        <Input.TextArea rows={2} />
      </Form.Item>
      <Form.Item label="Файлы">
        <FileDropZone onFiles={handleDropFiles} />
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
