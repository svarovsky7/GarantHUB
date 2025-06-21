import React, { useEffect, useState } from 'react';
import {
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Row,
  Col,
  Tag,
} from 'antd';
import FileDropZone from '@/shared/ui/FileDropZone';
import AttachmentEditorTable from '@/shared/ui/AttachmentEditorTable';
import { useAttachmentTypes } from '@/entities/attachmentType';
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
  /** Показывать форму добавления дефектов */
  showDefectsForm?: boolean;
}

export interface ClaimFormValues {
  project_id: number | null;
  unit_ids: number[];
  status_id: number | null;
  number: string;
  claim_date: dayjs.Dayjs | null;
  received_by_developer_at: dayjs.Dayjs | null;
  registered_at: dayjs.Dayjs | null;
  fixed_at: dayjs.Dayjs | null;
  responsible_engineer_id: string | null;
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

export default function ClaimFormAntd({ onCreated, initialValues = {}, showDefectsForm = true }: ClaimFormAntdProps) {
  const [form] = Form.useForm<ClaimFormValues>();
  const [files, setFiles] = useState<{ file: File; type_id: number | null }[]>([]);
  const { data: attachmentTypes = [] } = useAttachmentTypes();
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

  const handleDropFiles = (dropped: File[]) => {
    setFiles((p) => [...p, ...dropped.map((f) => ({ file: f, type_id: null }))]);
  };
  const setType = (idx: number, val: number | null) =>
    setFiles((p) => p.map((f, i) => (i === idx ? { ...f, type_id: val } : f)));
  const removeFile = (idx: number) => setFiles((p) => p.filter((_, i) => i !== idx));

  useEffect(() => {
    if (initialValues.project_id != null) {
      form.setFieldValue('project_id', initialValues.project_id);
    } else if (globalProjectId) {
      form.setFieldValue('project_id', Number(globalProjectId));
    }
    if (initialValues.unit_ids) form.setFieldValue('unit_ids', initialValues.unit_ids);
    if (initialValues.responsible_engineer_id)
      form.setFieldValue('responsible_engineer_id', initialValues.responsible_engineer_id);
    if (initialValues.status_id != null) form.setFieldValue('status_id', initialValues.status_id);
    if (initialValues.number) form.setFieldValue('number', initialValues.number);
    if (initialValues.claim_date) form.setFieldValue('claim_date', dayjs(initialValues.claim_date));
    if (initialValues.received_by_developer_at)
      form.setFieldValue('received_by_developer_at', dayjs(initialValues.received_by_developer_at));
    if (initialValues.registered_at) form.setFieldValue('registered_at', dayjs(initialValues.registered_at));
    if (initialValues.fixed_at) form.setFieldValue('fixed_at', dayjs(initialValues.fixed_at));
  }, [globalProjectId, form, initialValues]);

  /**
   * Если статус не указан, подставляем первым из списка.
   */
  useEffect(() => {
    if (
      statuses.length &&
      !initialValues.status_id &&
      !form.getFieldValue('status_id')
    ) {
      form.setFieldValue('status_id', statuses[0].id);
    }
  }, [statuses, form, initialValues.status_id]);

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
    if (files.some((f) => f.type_id == null)) {
      notify.error('Выберите тип файла для всех документов');
      return;
    }
    await create.mutateAsync({
      ...rest,
      defect_ids: defectIds,
      attachments: files,
      project_id: values.project_id ?? globalProjectId,
      claim_date: values.claim_date ? values.claim_date.format('YYYY-MM-DD') : null,
      received_by_developer_at: values.received_by_developer_at ? values.received_by_developer_at.format('YYYY-MM-DD') : null,
      registered_at: values.registered_at ? values.registered_at.format('YYYY-MM-DD') : null,
      fixed_at: values.fixed_at ? values.fixed_at.format('YYYY-MM-DD') : null,
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
          <Form.Item name="responsible_engineer_id" label="Ответственный инженер" rules={[{ required: true }]}> 
            <Select allowClear showSearch options={users.map((u) => ({ value: u.id, label: u.name }))} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
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
        <Col span={8}>
          <Form.Item name="received_by_developer_at" label="Дата получения претензии Застройщиком">
            <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            name="registered_at"
            label={
              <span>
                Дата регистрации претензии
                <Tag
                  color="blue"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    const val = form.getFieldValue('registered_at');
                    if (val) {
                      form.setFieldValue('fixed_at', dayjs(val).add(45, 'day'));
                    }
                  }}
                  style={{ cursor: 'pointer', marginLeft: 8 }}
                >
                  +45 дней
                </Tag>
              </span>
            }
          >
            <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="fixed_at" label="Дата устранения претензии">
            <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="status_id" label="Статус" rules={[{ required: true }]}> 
            <Select showSearch options={statuses.map((s) => ({ value: s.id, label: s.name }))} />
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
      <Form.Item label="Файлы">
        <FileDropZone onFiles={handleDropFiles} />
        <AttachmentEditorTable
          newFiles={files.map((f) => ({ file: f.file, typeId: f.type_id, mime: f.file.type }))}
          attachmentTypes={attachmentTypes.map((t) => ({ id: t.id, name: t.name }))}
          onRemoveNew={removeFile}
          onChangeNewType={setType}
        />
      </Form.Item>
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
