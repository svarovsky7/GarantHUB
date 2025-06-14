import React, { useEffect } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { Form, Input, Select, DatePicker, Button, Row, Col, Skeleton } from 'antd';
import { useProjects } from '@/entities/project';
import { useUnitsByProject } from '@/entities/unit';
import { useUsers } from '@/entities/user';
import { useLitigationStages } from '@/entities/litigationStage';
import { useAttachmentTypes } from '@/entities/attachmentType';
import { useCourtCase, useUpdateCourtCaseFull } from '@/entities/courtCase';
import type { CourtCase } from '@/shared/types/courtCase';
import FileDropZone from '@/shared/ui/FileDropZone';
import AttachmentEditorTable from '@/shared/ui/AttachmentEditorTable';
import { useCaseAttachments } from './model/useCaseAttachments';
import { useNotify } from '@/shared/hooks/useNotify';

export interface CourtCaseFormAntdEditProps {
  caseId: string;
  /** Данные дела, если уже загружены */
  caseData?: CourtCase;
  onCancel?: () => void;
  onSaved?: () => void;
  embedded?: boolean;
}

export interface CourtCaseFormValues {
  project_id: number | null;
  unit_ids: number[];
  number: string;
  date: Dayjs | null;
  plaintiff_id: number | null;
  defendant_id: number | null;
  responsible_lawyer_id: string | null;
  status: number;
  fix_start_date: Dayjs | null;
  fix_end_date: Dayjs | null;
  description: string;
}

/** Форма редактирования судебного дела */
export default function CourtCaseFormAntdEdit({ caseId, caseData, onCancel, onSaved, embedded = false }: CourtCaseFormAntdEditProps) {
  const [form] = Form.useForm<CourtCaseFormValues>();
  const { data: fetchedCase } = useCourtCase(caseData ? undefined : caseId);
  const courtCase = caseData ?? fetchedCase;
  console.debug('CourtCaseFormAntdEdit caseId:', caseId);
  console.debug('CourtCaseFormAntdEdit fetched case:', courtCase);
  const update = useUpdateCourtCaseFull();
  const notify = useNotify();

  const { data: projects = [] } = useProjects();
  const projectId = Form.useWatch('project_id', form);
  const { data: units = [] } = useUnitsByProject(projectId);
  const { data: users = [] } = useUsers();
  const { data: stages = [] } = useLitigationStages();
  const { data: attachmentTypes = [] } = useAttachmentTypes();

  const attachments = useCaseAttachments({ courtCase, attachmentTypes });

  useEffect(() => {
    if (!courtCase) return;
    console.debug('CourtCaseFormAntdEdit setFields with case:', courtCase);
    form.setFieldsValue({
      project_id: courtCase.project_id,
      unit_ids: courtCase.unit_ids,
      number: courtCase.number,
      date: courtCase.date ? dayjs(courtCase.date) : null,
      plaintiff_id: courtCase.plaintiff_id ?? null,
      defendant_id: courtCase.defendant_id ?? null,
      responsible_lawyer_id: courtCase.responsible_lawyer_id ?? null,
      status: courtCase.status,
      fix_start_date: courtCase.fix_start_date ? dayjs(courtCase.fix_start_date) : null,
      fix_end_date: courtCase.fix_end_date ? dayjs(courtCase.fix_end_date) : null,
      description: courtCase.description,
    });
  }, [courtCase]);

  const handleFiles = (files: File[]) => attachments.addFiles(files);

  const onFinish = async (values: CourtCaseFormValues) => {
    try {
      if (attachments.newFiles.some((f) => f.type_id == null) || attachments.remoteFiles.some((f) => (attachments.changedTypes[f.id] ?? null) == null)) {
        notify.error('Укажите тип файла для всех вложений');
        return;
      }
      await update.mutateAsync({
        id: Number(caseId),
        updates: {
          project_id: values.project_id!,
          unit_ids: values.unit_ids,
          number: values.number,
          date: values.date ? values.date.format('YYYY-MM-DD') : null,
          plaintiff_id: values.plaintiff_id!,
          defendant_id: values.defendant_id!,
          responsible_lawyer_id: values.responsible_lawyer_id,
          status: values.status,
          fix_start_date: values.fix_start_date ? values.fix_start_date.format('YYYY-MM-DD') : null,
          fix_end_date: values.fix_end_date ? values.fix_end_date.format('YYYY-MM-DD') : null,
          description: values.description,
        },
        newAttachments: attachments.newFiles,
        removedAttachmentIds: attachments.removedIds.map(Number),
        updatedAttachments: Object.entries(attachments.changedTypes).map(([id, t]) => ({ id: Number(id), type_id: t })),
      });
      attachments.markPersisted();
      notify.success('Дело обновлено');
      onSaved?.();
    } catch (e: any) {
      notify.error(e.message);
    }
  };

  if (!courtCase) return <Skeleton active />;

  return (
    <Form form={form} layout="vertical" onFinish={onFinish} style={{ maxWidth: embedded ? 'none' : 640 }} autoComplete="off">
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="project_id" label="Проект" rules={[{ required: true }]}> 
            <Select options={projects.map((p) => ({ value: p.id, label: p.name }))} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="unit_ids" label="Объекты" rules={[{ required: true }]}> 
            <Select mode="multiple" options={units.map((u) => ({ value: u.id, label: u.name }))} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="responsible_lawyer_id" label="Ответственный юрист" rules={[{ required: true }]}> 
            <Select options={users.map((u) => ({ value: u.id, label: u.name }))} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="status" label="Статус" rules={[{ required: true }]}> 
            <Select options={stages.map((s) => ({ value: s.id, label: s.name }))} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="number" label="Номер" rules={[{ required: true }]}> <Input /> </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="date" label="Дата" rules={[{ required: true }]}> <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} /> </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="plaintiff_id" label="Истец" rules={[{ required: true }]}> <Input /> </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="defendant_id" label="Ответчик" rules={[{ required: true }]}> <Input /> </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="fix_start_date" label="Дата начала устранения"> <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} /> </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="fix_end_date" label="Дата окончания устранения"> <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} /> </Form.Item>
        </Col>
      </Row>
      <Form.Item name="description" label="Описание"> <Input.TextArea rows={2} /> </Form.Item>
      <Form.Item label="Файлы">
        <FileDropZone onFiles={handleFiles} />
        <AttachmentEditorTable
          remoteFiles={attachments.remoteFiles.map((f) => ({ id: String(f.id), name: f.name, path: f.path, typeId: attachments.changedTypes[f.id] ?? f.attachment_type_id, typeName: f.attachment_type_name }))}
          newFiles={attachments.newFiles.map((f) => ({ file: f.file, typeId: f.type_id }))}
          attachmentTypes={attachmentTypes}
          onRemoveRemote={(id) => attachments.removeRemote(id)}
          onRemoveNew={(idx) => attachments.removeNew(idx)}
          onChangeRemoteType={(id, t) => attachments.changeRemoteType(id, t)}
          onChangeNewType={(idx, t) => attachments.changeNewType(idx, t)}
        />
      </Form.Item>
      <Form.Item style={{ textAlign: 'right' }}>
        {onCancel && <Button style={{ marginRight: 8 }} onClick={onCancel}>Отмена</Button>}
        <Button type="primary" htmlType="submit" loading={update.isPending}>Сохранить</Button>
      </Form.Item>
    </Form>
  );
}
