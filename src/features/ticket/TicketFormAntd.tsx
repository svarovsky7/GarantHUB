import React, { useEffect, useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import minMax from 'dayjs/plugin/minMax';

dayjs.extend(minMax);
import { Form, Input, Select, DatePicker, Switch, Button, Row, Col } from 'antd';
import { useTicketStatuses } from '@/entities/ticketStatus';
import { useUnitsByProject } from '@/entities/unit';
import { useUsers } from '@/entities/user';
import { useVisibleProjects } from '@/entities/project';
import { useCreateTicket } from '@/entities/ticket';
import { useCreateDefects, type NewDefect } from '@/entities/defect';
import { useProjectId } from '@/shared/hooks/useProjectId';
import { useAuthStore } from '@/shared/store/authStore';
import FileDropZone from '@/shared/ui/FileDropZone';
import { useNotify } from '@/shared/hooks/useNotify';
import DefectEditableTable from '@/widgets/DefectEditableTable';

/** Ключ в localStorage для последнего выбранного проекта */
const LS_LAST_PROJECT_KEY = 'ticketsLastProject';

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
  received_at: Dayjs;
  fixed_at: Dayjs | null;
  defects?: Array<{
    type_id: number | null;
    fixed_at: Dayjs | null;
    brigade_id: number | null;
    contractor_id: number | null;
    description?: string;
    status_id?: number | null;
    received_at?: Dayjs | null;
  }>;
  /** Дополнительные данные разметки, не отправляются на сервер */
  pins?: unknown;
}

export default function TicketFormAntd({ onCreated, initialValues = {} }: TicketFormAntdProps) {
  const [form] = Form.useForm<TicketFormAntdValues>();
  const globalProjectId = useProjectId();
  const projectIdWatch = Form.useWatch('project_id', form) ?? globalProjectId;
  const projectId = projectIdWatch != null ? Number(projectIdWatch) : null;

  const { data: statuses = [] } = useTicketStatuses();
  const { data: projects = [] } = useVisibleProjects();
  const { data: units = [] } = useUnitsByProject(projectId);
  const { data: users = [] } = useUsers();
  const create = useCreateTicket();
  const createDefects = useCreateDefects();
  const notify = useNotify();
  const [files, setFiles] = useState<{ file: File }[]>([]);
  const profileId = useAuthStore((s) => s.profile?.id);
  const [fixedAtManual, setFixedAtManual] = useState(false);
  const defectsWatch = Form.useWatch('defects', form);

  useEffect(() => {
    if (fixedAtManual) return;
    const dates = (defectsWatch || [])
      .map((d) => d?.fixed_at)
      .filter(Boolean) as Dayjs[];
    if (!dates.length) return;
    const max = dayjs.max(dates);
    const current = form.getFieldValue('fixed_at');
    if (!current || !dayjs(current).isSame(max, 'day')) {
      form.setFieldValue('fixed_at', max);
    }
  }, [defectsWatch, fixedAtManual, form]);

  useEffect(() => {
    if (initialValues.project_id != null) {
      form.setFieldValue('project_id', initialValues.project_id);
    } else if (globalProjectId) {
      form.setFieldValue('project_id', Number(globalProjectId));
    } else {
      try {
        const saved = localStorage.getItem(LS_LAST_PROJECT_KEY);
        if (saved) {
          form.setFieldValue('project_id', JSON.parse(saved));
        }
      } catch {}
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
    const arr = dropped.map((f) => ({ file: f }));
    setFiles((p) => [...p, ...arr]);
  };
  const setType = (_idx: number, _val: number | null) => {};
  const removeFile = (idx: number) => setFiles((p) => p.filter((_, i) => i !== idx));

  const onFinish = async (values: TicketFormAntdValues) => {
    try {
      const { pins, defects: _defects, ...rest } = values;
      if (!_defects || _defects.length === 0) {
        notify.error('Добавьте хотя бы один дефект');
        return;
      }
      const newDefs: NewDefect[] = (_defects || []).map((d) => ({
        description: d.description || '',
        defect_type_id: d.type_id ?? null,
        defect_status_id: d.status_id ?? null,
        brigade_id: d.brigade_id ?? null,
        contractor_id: d.contractor_id ?? null,
        is_warranty: d.is_warranty ?? false,
        received_at: d.received_at ? d.received_at.format('YYYY-MM-DD') : null,
        fixed_at: d.fixed_at ? d.fixed_at.format('YYYY-MM-DD') : null,
        fixed_by: null,
      }));
      const defectIds = await createDefects.mutateAsync(newDefs);
      const payload = {
        ...rest,
        project_id: values.project_id ?? globalProjectId,
        attachments: files,
        defect_ids: defectIds,
        received_at: values.received_at.format('YYYY-MM-DD'),
        fixed_at: values.fixed_at ? values.fixed_at.format('YYYY-MM-DD') : null,
        customer_request_date: values.customer_request_date
          ? values.customer_request_date.format('YYYY-MM-DD')
          : null,
      };
      await create.mutateAsync(payload as any);
      try {
        localStorage.setItem(
          LS_LAST_PROJECT_KEY,
          JSON.stringify(payload.project_id),
        );
      } catch {}
      form.resetFields();
      setFiles([]);
      setFixedAtManual(false);
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
            <Select
              allowClear
              showSearch
              filterOption={(i, o) =>
                (o?.label ?? '').toLowerCase().includes(i.toLowerCase())
              }
              options={projects.map((p) => ({ value: p.id, label: p.name }))}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="unit_ids" label="Объекты" rules={[{ required: true }]}> 
            <Select
              mode="multiple"
              showSearch
              filterOption={(i, o) =>
                (o?.label ?? '').toLowerCase().includes(i.toLowerCase())
              }
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
            <Select
              allowClear
              showSearch
              filterOption={(i, o) =>
                (o?.label ?? '').toLowerCase().includes(i.toLowerCase())
              }
              options={users.map((u) => ({ value: u.id, label: u.name }))}
            />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name="status_id" label="Статус" rules={[{ required: true }]}>
            <Select
              showSearch
              filterOption={(i, o) =>
                (o?.label ?? '').toLowerCase().includes(i.toLowerCase())
              }
              options={statuses.map((s) => ({ value: s.id, label: s.name }))}
            />
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
          <DefectEditableTable
            fields={fields}
            add={add}
            remove={remove}
            projectId={projectId}
            showFiles={false}
          />
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
            <DatePicker
              format="DD.MM.YYYY"
              style={{ width: '100%' }}
              onChange={(v) => {
                setFixedAtManual(true);
                form.setFieldValue('fixed_at', v);
              }}
            />
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
            <Col flex="160px">{f.file.type}</Col>
            <Col>
              <Button type="text" danger onClick={() => removeFile(i)}>
                Удалить
              </Button>
            </Col>
          </Row>
        ))}
      </Form.Item>
      <Form.Item style={{ textAlign: 'right' }}>
        <Button
          type="primary"
          htmlType="submit"
          loading={create.isPending}
          size="large"
          block
        >
          Создать замечание
        </Button>
      </Form.Item>
    </Form>
  );
}
