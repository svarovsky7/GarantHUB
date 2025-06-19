import React, { useEffect } from 'react';
import { Form, Input, Select, DatePicker, Button, Row, Col } from 'antd';
import dayjs from 'dayjs';
import { useVisibleProjects } from '@/entities/project';
import { useUnitsByProject } from '@/entities/unit';
import { useUsers } from '@/entities/user';
import { useClaimStatuses } from '@/entities/claimStatus';
import { useCreateClaim } from '@/entities/claim';
import { useProjectId } from '@/shared/hooks/useProjectId';
import { useNotify } from '@/shared/hooks/useNotify';
import DefectEditableTable from '@/widgets/DefectEditableTable';
import { useCreateDefects, type NewDefect } from '@/entities/defect';

export interface ClaimFormAntdProps {
  onCreated?: () => void;
  initialValues?: Partial<{ project_id: number; unit_ids: number[]; responsible_engineer_id: string }>;
}

export interface ClaimFormValues {
  project_id: number | null;
  unit_ids: number[];
  status_id: number | null;
  number: string;
  claim_date: dayjs.Dayjs | null;
  received_by_developer_at: dayjs.Dayjs | null;
  received_by_me_at: dayjs.Dayjs | null;
  fixed_at: dayjs.Dayjs | null;
  responsible_engineer_id: string | null;
  defects?: Array<{ type_id: number | null; fixed_at: dayjs.Dayjs | null; brigade_id: number | null; contractor_id: number | null; description?: string; status_id?: number | null; received_at?: dayjs.Dayjs | null; }>;
}

export default function ClaimFormAntd({ onCreated, initialValues = {} }: ClaimFormAntdProps) {
  const [form] = Form.useForm<ClaimFormValues>();
  const globalProjectId = useProjectId();
  const projectIdWatch = Form.useWatch('project_id', form) ?? globalProjectId;
  const projectId = projectIdWatch != null ? Number(projectIdWatch) : null;

  const { data: projects = [] } = useVisibleProjects();
  const { data: units = [] } = useUnitsByProject(projectId);
  const { data: users = [] } = useUsers();
  const { data: statuses = [] } = useClaimStatuses();
  const create = useCreateClaim();
  const notify = useNotify();
  const createDefects = useCreateDefects();

  useEffect(() => {
    if (initialValues.project_id != null) form.setFieldValue('project_id', initialValues.project_id);
    else if (globalProjectId) form.setFieldValue('project_id', Number(globalProjectId));
    if (initialValues.unit_ids) form.setFieldValue('unit_ids', initialValues.unit_ids);
    if (initialValues.responsible_engineer_id) form.setFieldValue('responsible_engineer_id', initialValues.responsible_engineer_id);
  }, [globalProjectId, form, initialValues]);

  const onFinish = async (values: ClaimFormValues) => {
    const { defects: defs, ...rest } = values;
    if (!defs || defs.length === 0) {
      notify.error('Добавьте хотя бы один дефект');
      return;
    }
    const newDefs: NewDefect[] = defs.map((d) => ({
      description: d.description || '',
      defect_type_id: d.type_id ?? null,
      defect_status_id: d.status_id ?? null,
      brigade_id: d.brigade_id ?? null,
      contractor_id: d.contractor_id ?? null,
      received_at: d.received_at ? d.received_at.format('YYYY-MM-DD') : null,
      fixed_at: d.fixed_at ? d.fixed_at.format('YYYY-MM-DD') : null,
    }));
    const defectIds = await createDefects.mutateAsync(newDefs);
    await create.mutateAsync({
      ...rest,
      defect_ids: defectIds,
      project_id: values.project_id ?? globalProjectId,
      claim_date: values.claim_date ? values.claim_date.format('YYYY-MM-DD') : null,
      received_by_developer_at: values.received_by_developer_at ? values.received_by_developer_at.format('YYYY-MM-DD') : null,
      received_by_me_at: values.received_by_me_at ? values.received_by_me_at.format('YYYY-MM-DD') : null,
      fixed_at: values.fixed_at ? values.fixed_at.format('YYYY-MM-DD') : null,
    } as any);
    form.resetFields();
    onCreated?.();
  };

  return (
    <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off">
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name="project_id" label="Проект" rules={[{ required: true }]}> 
            <Select allowClear showSearch options={projects.map((p) => ({ value: p.id, label: p.name }))} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="unit_ids" label="Объекты" rules={[{ required: true }]}> 
            <Select
              mode="multiple"
              showSearch
              filterOption={(i, o) => (o?.label ?? '').toLowerCase().includes(i.toLowerCase())}
              options={units.map((u) => ({ value: u.id, label: u.name }))}
              disabled={!projectId}
            />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="responsible_engineer_id" label="Ответственный инженер" rules={[{ required: true }]}> 
            <Select allowClear showSearch options={users.map((u) => ({ value: u.id, label: u.name }))} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name="status_id" label="Статус" rules={[{ required: true }]}> 
            <Select showSearch options={statuses.map((s) => ({ value: s.id, label: s.name }))} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="number" label="№ претензии" rules={[{ required: true }]}> 
            <Input />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="claim_date" label="Дата претензии"> 
            <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name="received_by_developer_at" label="Дата получения претензии Застройщиком"> 
            <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="received_by_me_at" label="Дата получения претензии мною"> 
            <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="fixed_at" label="Дата устранения претензии"> 
            <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
      <Form.List name="defects">
        {(fields, { add, remove }) => (
          <DefectEditableTable fields={fields} add={add} remove={remove} projectId={projectId} />
        )}
      </Form.List>
      <Form.Item style={{ textAlign: 'right' }}>
        <Button type="primary" htmlType="submit" loading={create.isPending}>
          Создать
        </Button>
      </Form.Item>
    </Form>
  );
}
