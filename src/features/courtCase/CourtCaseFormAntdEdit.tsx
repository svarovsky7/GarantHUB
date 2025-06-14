import React, { useEffect } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { Form, Input, Select, DatePicker, Button, Row, Col, Skeleton } from 'antd';
import { useProjects } from '@/entities/project';
import { useUnitsByProject } from '@/entities/unit';
import { useContractors } from '@/entities/contractor';
import { useUsers } from '@/entities/user';
import { useLitigationStages } from '@/entities/litigationStage';
import { usePersons } from '@/entities/person';
import { useAttachmentTypes } from '@/entities/attachmentType';
import { useCourtCase, useUpdateCourtCaseFull } from '@/entities/courtCase';
import FileDropZone from '@/shared/ui/FileDropZone';
import AttachmentEditorTable from '@/shared/ui/AttachmentEditorTable';
import { useCaseAttachments } from './model/useCaseAttachments';
import { useNotify } from '@/shared/hooks/useNotify';

export interface CourtCaseFormAntdEditProps {
  caseId: string | number;
  onSaved?: () => void;
  onCancel?: () => void;
  embedded?: boolean;
}

/** Форма редактирования судебного дела на Ant Design */
export default function CourtCaseFormAntdEdit({
  caseId,
  onSaved,
  onCancel,
  embedded = false,
}: CourtCaseFormAntdEditProps) {
  const [form] = Form.useForm();
  const { data: courtCase } = useCourtCase(caseId);
  const update = useUpdateCourtCaseFull();
  const notify = useNotify();

  const { data: projects = [] } = useProjects();
  const projectId = Form.useWatch('project_id', form);
  const { data: units = [] } = useUnitsByProject(projectId);
  const { data: contractors = [] } = useContractors();
  const { data: users = [] } = useUsers();
  const { data: stages = [] } = useLitigationStages();
  const { data: persons = [] } = usePersons();
  const { data: attachmentTypes = [] } = useAttachmentTypes();

  const attachments = useCaseAttachments({ courtCase, attachmentTypes });

  useEffect(() => {
    if (!courtCase) return;
    form.setFieldsValue({
      project_id: courtCase.project_id,
      unit_ids: courtCase.unit_ids,
      number: courtCase.number,
      date: courtCase.date ? dayjs(courtCase.date) : null,
      plaintiff_id: courtCase.plaintiff_id,
      defendant_id: courtCase.defendant_id,
      responsible_lawyer_id: courtCase.responsible_lawyer_id,
      status: courtCase.status,
      fix_start_date: courtCase.fix_start_date ? dayjs(courtCase.fix_start_date) : null,
      fix_end_date: courtCase.fix_end_date ? dayjs(courtCase.fix_end_date) : null,
      description: courtCase.description,
    });
    attachments.reset();
  }, [courtCase]);

  const handleFiles = (files: File[]) => attachments.addFiles(files);

  const onFinish = async (values: any) => {
    try {
      await update.mutateAsync({
        id: Number(caseId),
        updates: {
          project_id: values.project_id,
          unit_ids: values.unit_ids,
          number: values.number,
          date: values.date ? (values.date as Dayjs).format('YYYY-MM-DD') : null,
          plaintiff_id: values.plaintiff_id,
          defendant_id: values.defendant_id,
          responsible_lawyer_id: values.responsible_lawyer_id,
          status: values.status,
          fix_start_date: values.fix_start_date ? (values.fix_start_date as Dayjs).format('YYYY-MM-DD') : null,
          fix_end_date: values.fix_end_date ? (values.fix_end_date as Dayjs).format('YYYY-MM-DD') : null,
          description: values.description,
        } as any,
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
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      style={{ maxWidth: embedded ? 'none' : 640 }}
      autoComplete="off"
    >
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name="project_id" label="Проект" rules={[{ required: true }]}> 
            <Select options={projects.map((p) => ({ value: p.id, label: p.name }))} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="unit_ids" label="Объекты" rules={[{ required: true }]}> 
            <Select mode="multiple" options={units.map((u) => ({ value: u.id, label: u.name }))} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="responsible_lawyer_id" label="Ответственный юрист" rules={[{ required: true }]}> 
            <Select options={users.map((u) => ({ value: u.id, label: u.name }))} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name="number" label="Номер дела" rules={[{ required: true }]}> <Input /> </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="date" label="Дата" rules={[{ required: true }]}> 
            <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="status" label="Статус" rules={[{ required: true }]}> 
            <Select options={stages.map((s) => ({ value: s.id, label: s.name }))} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="plaintiff_id" label="Истец" rules={[{ required: true }]}> 
            <Select options={persons.map((p) => ({ value: p.id, label: p.full_name }))} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="defendant_id" label="Ответчик" rules={[{ required: true }]}> 
            <Select
              options={[
                ...contractors.map((c) => ({ value: c.id, label: c.name })),
                ...persons.map((p) => ({ value: p.id, label: p.full_name })),
              ]}
            />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="fix_start_date" label="Дата начала устранения"> 
            <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="fix_end_date" label="Дата завершения устранения"> 
            <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item name="description" label="Описание"> <Input.TextArea rows={2} /> </Form.Item>
      <Form.Item label="Файлы">
        <FileDropZone onFiles={handleFiles} />
        <AttachmentEditorTable
          remoteFiles={attachments.remoteFiles.map((f) => ({
            id: String(f.id),
            name: f.name,
            path: f.path,
            typeId: attachments.changedTypes[f.id] ?? f.attachment_type_id,
            typeName: f.attachment_type_name,
          }))}
          newFiles={attachments.newFiles.map((f) => ({ file: f.file, typeId: f.type_id }))}
          attachmentTypes={attachmentTypes}
          onRemoveRemote={(id) => attachments.removeRemote(id)}
          onRemoveNew={(idx) => attachments.removeNew(idx)}
          onChangeRemoteType={(id, t) => attachments.changeRemoteType(id, t)}
          onChangeNewType={(idx, t) => attachments.changeNewType(idx, t)}
        />
      </Form.Item>
      <Form.Item style={{ textAlign: 'right' }}>
        {onCancel && (
          <Button style={{ marginRight: 8 }} onClick={onCancel} disabled={update.isPending}>
            Отмена
          </Button>
        )}
        <Button type="primary" htmlType="submit" loading={update.isPending}>
          Сохранить
        </Button>
      </Form.Item>
    </Form>
  );
}
