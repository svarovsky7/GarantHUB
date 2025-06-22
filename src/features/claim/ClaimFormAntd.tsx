import React, { useEffect, useState } from 'react';
import {
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Row,
  Col,
  Switch,
} from 'antd';
import ClaimAttachmentsBlock from './ClaimAttachmentsBlock';
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
  initialValues?: Partial<{
    project_id: number;
    unit_ids: number[];
    engineer_id: string;
    description: string;
    resolved_on: string;
  }>;
  /** Показывать форму добавления дефектов */
  showDefectsForm?: boolean;
  /** Показывать блок загрузки файлов */
  showAttachments?: boolean;
}

export interface ClaimFormValues {
  project_id: number | null;
  unit_ids: number[];
  claim_status_id: number | null;
  claim_no: string;
  claimed_on: dayjs.Dayjs | null;
  accepted_on: dayjs.Dayjs | null;
  registered_on: dayjs.Dayjs | null;
  /** Срок устранения всех дефектов */
  resolved_on: dayjs.Dayjs | null;
  engineer_id: string | null;
  is_official: boolean;
  description: string | null;
  defects?: Array<{
    type_id: number | null;
    fixed_at: dayjs.Dayjs | null;
    brigade_id: number | null;
    contractor_id: number | null;
    is_warranty: boolean;
    description?: string;
    status_id?: number | null;
    received_at?: dayjs.Dayjs | null;
  }>;
}

export default function ClaimFormAntd({ onCreated, initialValues = {}, showDefectsForm = true, showAttachments = true }: ClaimFormAntdProps) {
  const [form] = Form.useForm<ClaimFormValues>();
  const [files, setFiles] = useState<File[]>([]);
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
  const defectsWatch = Form.useWatch('defects', form);

  const handleDropFiles = (dropped: File[]) => {
    setFiles((p) => [...p, ...dropped]);
  };
  const removeFile = (idx: number) => setFiles((p) => p.filter((_, i) => i !== idx));

  useEffect(() => {
    if (initialValues.project_id != null) {
      form.setFieldValue('project_id', initialValues.project_id);
    } else if (globalProjectId) {
      form.setFieldValue('project_id', Number(globalProjectId));
    }
    if (initialValues.unit_ids) form.setFieldValue('unit_ids', initialValues.unit_ids);
    if (initialValues.engineer_id)
      form.setFieldValue('engineer_id', initialValues.engineer_id);
    if (initialValues.claim_status_id != null) form.setFieldValue('claim_status_id', initialValues.claim_status_id);
    if (initialValues.claim_no) form.setFieldValue('claim_no', initialValues.claim_no);
    if (initialValues.claimed_on) form.setFieldValue('claimed_on', dayjs(initialValues.claimed_on));
    if (initialValues.accepted_on)
      form.setFieldValue('accepted_on', dayjs(initialValues.accepted_on));
    if (initialValues.registered_on) form.setFieldValue('registered_on', dayjs(initialValues.registered_on));
    if (initialValues.resolved_on) form.setFieldValue('resolved_on', dayjs(initialValues.resolved_on));
    if (initialValues.description) form.setFieldValue('description', initialValues.description);
    if (initialValues.is_official != null) {
      form.setFieldValue('is_official', initialValues.is_official);
    } else {
      form.setFieldValue('is_official', false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalProjectId, form]);

  // По умолчанию ставим текущую дату регистрации
  useEffect(() => {
    if (!form.getFieldValue('registered_on')) {
      form.setFieldValue('registered_on', dayjs());
    }
  }, [form]);

  /**
   * Если статус не указан, подставляем первым из списка.
   */
  useEffect(() => {
    if (
      statuses.length &&
      !initialValues.claim_status_id &&
      !form.getFieldValue('claim_status_id')
    ) {
      form.setFieldValue('claim_status_id', statuses[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statuses, form]);

  useEffect(() => {
    if (!initialValues.unit_ids) {
      form.setFieldValue('unit_ids', []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, form]);

  // Вычисляем срок устранения как максимальную дату устранения дефектов
  useEffect(() => {
    if (!defectsWatch) return;
    const dates = (defectsWatch as any[])
      .map((d) => ('fixed_at' in d && d.fixed_at ? d.fixed_at : null))
      .filter(Boolean) as dayjs.Dayjs[];
    if (dates.length) {
      const maxDate = dates.reduce((acc, cur) => (cur.isAfter(acc) ? cur : acc));
      form.setFieldValue('resolved_on', maxDate);
    } else {
      form.setFieldValue('resolved_on', null);
    }
  }, [defectsWatch, form]);

  const onFinish = async (values: ClaimFormValues) => {
    if (!showDefectsForm) return;
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
      is_warranty: d.is_warranty ?? false,
      received_at: d.received_at ? d.received_at.format('YYYY-MM-DD') : null,
      fixed_at: d.fixed_at ? d.fixed_at.format('YYYY-MM-DD') : null,
    }));
    const defectIds = await createDefects.mutateAsync(newDefs);
    await create.mutateAsync({
      ...rest,
      attachments: files,
      project_id: values.project_id ?? globalProjectId,
      claimed_on: values.claimed_on ? values.claimed_on.format('YYYY-MM-DD') : null,
      accepted_on: values.accepted_on ? values.accepted_on.format('YYYY-MM-DD') : null,
      registered_on: values.registered_on ? values.registered_on.format('YYYY-MM-DD') : null,
      resolved_on: values.resolved_on ? values.resolved_on.format('YYYY-MM-DD') : null,
      defect_ids: defectIds,
    } as any);
    form.resetFields();
    setFiles([]);
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
          <Form.Item name="engineer_id" label="Закрепленный инженер" rules={[{ required: true }]}> 
            <Select allowClear showSearch options={users.map((u) => ({ value: u.id, label: u.name }))} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name="claim_no" label="№ претензии" rules={[{ required: true }]}> 
            <Input />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="claimed_on" label="Дата претензии">
            <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="accepted_on" label="Дата получения претензии Застройщиком">
            <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name="registered_on" label="Дата регистрации претензии GARANTHUB">
            <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="resolved_on" label="Устранить до">
            <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="claim_status_id" label="Статус" rules={[{ required: true }]}>
            <Select showSearch options={statuses.map((s) => ({ value: s.id, label: s.name }))} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={24}>
          <Form.Item name="description" label="Дополнительная информация">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            name="is_official"
            label="Официальная претензия"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Col>
      </Row>
      {showDefectsForm && (
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
      )}
      {showAttachments && (
        <ClaimAttachmentsBlock
          newFiles={files}
          onFiles={handleDropFiles}
          onRemoveNew={removeFile}
        />
      )}
      {showDefectsForm && (
        <Form.Item style={{ textAlign: 'right' }}>
          <Button type="primary" htmlType="submit" loading={create.isPending}>
            Создать
          </Button>
        </Form.Item>
      )}
    </Form>
  );
}
