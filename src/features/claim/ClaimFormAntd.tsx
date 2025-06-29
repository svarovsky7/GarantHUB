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
  Tooltip,
  Space,
  Popconfirm,
} from 'antd';

import ClaimAttachmentsBlock from './ClaimAttachmentsBlock';
import dayjs from 'dayjs';
import { useVisibleProjects } from '@/entities/project';
import { useUnitsByProject } from '@/entities/unit';
import { useDebounce } from '@/shared/hooks/useDebounce';
import { useUsers } from '@/entities/user';
import { useClaimStatuses } from '@/entities/claimStatus';
import { useCreateClaim } from '@/entities/claim';
import { addDefectAttachments } from '@/entities/attachment';
import { supabase } from '@/shared/api/supabaseClient';
import { useProjectId } from '@/shared/hooks/useProjectId';
import { useNotify } from '@/shared/hooks/useNotify';
import DefectEditableTable from '@/widgets/DefectEditableTable';
import { useCreateDefects, type NewDefect } from '@/entities/defect';
import type { NewDefectFile } from '@/shared/types/defectFile';
import type { NewClaimFile } from '@/shared/types/claimFile';
import { useAuthStore } from '@/shared/store/authStore';
import type { RoleName } from '@/shared/types/rolePermission';
import { useRolePermission } from '@/entities/rolePermission';
import { PRETRIAL_FLAG } from '@/shared/types/rolePermission';
import { useCaseUids } from '@/entities/caseUid';
import useProjectBuildings from '@/shared/hooks/useProjectBuildings';

export interface ClaimFormAntdProps {
  onCreated?: () => void;
  /** Начальные значения формы */
  initialValues?: Partial<Omit<ClaimFormValues, 'defects'>>;
  /** Показывать форму добавления дефектов */
  showDefectsForm?: boolean;
  /** Показывать блок загрузки файлов */
  showAttachments?: boolean;
}

export interface ClaimFormValues {
  project_id: number | null;
  unit_ids: number[];
  building: string | null;
  claim_status_id: number | null;
  claim_no: string;
  claimed_on: dayjs.Dayjs | null;
  accepted_on: dayjs.Dayjs | null;
  registered_on: dayjs.Dayjs | null;
  /** Срок устранения всех дефектов */
  resolved_on: dayjs.Dayjs | null;
  engineer_id: string | null;
  owner: string | null;
  case_uid_id: number | null;
  /** Является ли претензия досудебной */
  pre_trial_claim: boolean;
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
  const [files, setFiles] = useState<NewClaimFile[]>([]);
  const [defectFiles, setDefectFiles] = useState<Record<number, NewDefectFile[]>>({});
  const globalProjectId = useProjectId();
  const projectIdWatch = Form.useWatch('project_id', form) ?? globalProjectId;
  const projectId = projectIdWatch != null ? Number(projectIdWatch) : null;

  const { data: projects = [] } = useVisibleProjects();
  const { buildings = [] } = useProjectBuildings(projectId);
  const buildingWatch = Form.useWatch('building', form) ?? null;
  const buildingDebounced = useDebounce(buildingWatch);
  const { data: units = [] } = useUnitsByProject(
    projectId,
    buildingDebounced ?? undefined,
  );
  const { data: users = [] } = useUsers();
  const { data: statuses = [] } = useClaimStatuses();
  const create = useCreateClaim();
  const notify = useNotify();
  const createDefects = useCreateDefects();
  const role = useAuthStore((s) => s.profile?.role as RoleName | undefined);
  const { data: perm } = useRolePermission(role);
  const allowPretrial = perm?.pages.includes(PRETRIAL_FLAG);
  const defectsWatch = Form.useWatch('defects', form);
  const acceptedOnWatch = Form.useWatch('accepted_on', form) ?? null;
  const { data: caseUids = [] } = useCaseUids();
  const preTrialWatch = Form.useWatch('pre_trial_claim', form);

  const handleDropFiles = (dropped: File[]) => {
    setFiles((p) => [...p, ...dropped.map((file) => ({ file, description: '' }))]);
  };
  const removeFile = (idx: number) => setFiles((p) => p.filter((_, i) => i !== idx));
  const changeFileDesc = (idx: number, d: string) =>
    setFiles((p) => p.map((f, i) => (i === idx ? { ...f, description: d } : f)));
  const changeDefectFiles = (idx: number, fs: NewDefectFile[]) => {
    setDefectFiles((p) => ({ ...p, [idx]: fs }));
  };

  useEffect(() => {
    if (initialValues.project_id != null) {
      form.setFieldValue('project_id', initialValues.project_id);
    } else if (globalProjectId) {
      form.setFieldValue('project_id', Number(globalProjectId));
    }
    if (initialValues.unit_ids) form.setFieldValue('unit_ids', initialValues.unit_ids);
    if (initialValues.building) form.setFieldValue('building', initialValues.building);
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
    if (initialValues.owner != null) form.setFieldValue('owner', initialValues.owner);
    if (initialValues.case_uid_id != null) form.setFieldValue('case_uid_id', initialValues.case_uid_id);
    if (initialValues.pre_trial_claim != null) {
      form.setFieldValue('pre_trial_claim', initialValues.pre_trial_claim);
    } else {
      form.setFieldValue('pre_trial_claim', false);
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
    form.setFieldValue('building', null);
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

  useEffect(() => {
    if (!Array.isArray(defectsWatch)) return;
    setDefectFiles((prev) => {
      const res: Record<number, NewDefectFile[]> = {};
      defectsWatch.forEach((_, i) => {
        if (prev[i]) res[i] = prev[i];
      });
      return res;
    });
  }, [defectsWatch]);


  const onFinish = async (values: ClaimFormValues) => {
    if (!showDefectsForm) return;
    const { defects: defs, building: _bld, ...rest } = values;
    if (!defs || defs.length === 0) {
      notify.error('Добавьте хотя бы один дефект');
      return;
    }
    const unitId = values.unit_ids?.[0] ?? null;
    const userId = useAuthStore.getState().profile?.id ?? null;
    const newDefs: NewDefect[] = defs.map((d) => ({
      description: d.description || '',
      type_id: d.type_id ?? null,
      status_id: d.status_id ?? null,
      project_id: projectId ?? null,
      unit_id: unitId,
      brigade_id: d.brigade_id ?? null,
      contractor_id: d.contractor_id ?? null,
      created_by: userId,
      is_warranty: d.is_warranty ?? false,
      received_at: d.received_at ? d.received_at.format('YYYY-MM-DD') : null,
      fixed_at: d.fixed_at ? d.fixed_at.format('YYYY-MM-DD') : null,
      fixed_by: null,
      case_uid_id: values.case_uid_id ?? null,
    }));
    const defectIds = await createDefects.mutateAsync(newDefs);

    for (let i = 0; i < defectIds.length; i += 1) {
      const filesFor = defectFiles[i] ?? [];
      if (filesFor.length) {
        const uploaded = await addDefectAttachments(
          filesFor.map((f) => ({ file: f.file, type_id: null, description: f.description })),
          defectIds[i],
        );
        if (uploaded.length) {
          await supabase.from('defect_attachments').insert(
            uploaded.map((u: any) => ({
              defect_id: defectIds[i],
              attachment_id: u.id,
            })),
          );
        }
      }
    }

    await create.mutateAsync({
      ...rest,
      attachments: files.map((f) => ({
        file: f.file,
        type_id: null,
        description: f.description,
      })),
      project_id: values.project_id ?? globalProjectId,
      claimed_on: values.claimed_on ? values.claimed_on.format('YYYY-MM-DD') : null,
      accepted_on: values.accepted_on ? values.accepted_on.format('YYYY-MM-DD') : null,
      registered_on: values.registered_on ? values.registered_on.format('YYYY-MM-DD') : null,
      resolved_on: values.resolved_on ? values.resolved_on.format('YYYY-MM-DD') : null,
      owner: values.owner ?? null,
      case_uid_id: values.case_uid_id ?? null,
      defect_ids: defectIds,
    } as any);
    form.resetFields();
    setFiles([]);
    setDefectFiles({});
    onCreated?.();
  };

  return (
    <>
    <Form form={form} layout="vertical" onFinish={onFinish} autoComplete="off">
      <Row gutter={16}>
        <Col span={8} hidden={!allowPretrial}>
          <Form.Item
            name="pre_trial_claim"
            label="Досудебная претензия"
            valuePropName="checked"
          >
            <Switch disabled={!allowPretrial} />
          </Form.Item>
        </Col>
        <Col span={8} hidden={!allowPretrial}>
          <Form.Item
            name="case_uid_id"
            label="Уникальный идентификатор дела"
            hidden={!preTrialWatch}
          >
            <Select
              showSearch
              allowClear
              disabled={!preTrialWatch || !allowPretrial}
              options={caseUids.map((c) => ({ value: c.id, label: c.uid }))}
            />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name="project_id" label="Проект" rules={[{ required: true }]}> 
            <Select allowClear showSearch options={projects.map((p) => ({ value: p.id, label: p.name }))} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="building" label="Корпус">
            <Select allowClear options={buildings.map((b) => ({ value: b, label: b }))} disabled={!projectId} />
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
          <Form.Item label="Собственник объекта" name="owner">
            <Input />
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
          <Form.Item
            name="registered_on"
            label="Дата регистрации претензии GARANTHUB"
            rules={[{ required: true }]}
          >
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
      {showDefectsForm && (
        <Form.List name="defects">
          {(fields, { add, remove }) => (
            <DefectEditableTable
              fields={fields}
              add={add}
              remove={remove}
              projectId={projectId}
              showFiles={false}
              fileMap={defectFiles}
              onFilesChange={changeDefectFiles}
              defaultReceivedAt={acceptedOnWatch}
            />
          )}
        </Form.List>
      )}
      {showAttachments && (
        <ClaimAttachmentsBlock
          newFiles={files}
          onFiles={handleDropFiles}
          onRemoveNew={removeFile}
          onDescNew={changeFileDesc}
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
    </>
  );
}
