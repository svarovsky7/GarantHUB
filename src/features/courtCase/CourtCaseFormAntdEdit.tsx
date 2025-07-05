import React, { useEffect } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import {
  Form,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
  Button,
  Skeleton,
  AutoComplete,
} from 'antd';
import { useVisibleProjects } from '@/entities/project';
import { useUnitsByProject } from '@/entities/unit';
import { useUsers } from '@/entities/user';
import { useCourtCaseStatuses } from '@/entities/courtCaseStatus';
import { useCourtCase, useUpdateCourtCaseFull } from '@/entities/courtCase';
import { useCaseUids, getOrCreateCaseUid } from '@/entities/courtCaseUid';
import FileDropZone from '@/shared/ui/FileDropZone';
import AttachmentEditorTable from '@/shared/ui/AttachmentEditorTable';
import { useCaseAttachments } from './model/useCaseAttachments';
import { useNotify } from '@/shared/hooks/useNotify';
import { downloadZip } from '@/shared/utils/downloadZip';
import { signedUrl } from '@/entities/courtCase';
import { useChangedFields } from '@/shared/hooks/useChangedFields';
import CaseClaimsEditorTable from '@/widgets/CaseClaimsEditorTable';
import CasePartiesEditorTable from '@/widgets/CasePartiesEditorTable';

export interface CourtCaseFormAntdEditProps {
  caseId: string;
  onCancel?: () => void;
  onSaved?: () => void;
  embedded?: boolean;
}

export default function CourtCaseFormAntdEdit({
  caseId,
  onCancel,
  onSaved,
  embedded = false,
}: CourtCaseFormAntdEditProps) {
  const [form] = Form.useForm();
  const { data: courtCase } = useCourtCase(caseId);
  const { data: projects = [] } = useVisibleProjects();
  const projectId = Form.useWatch('project_id', form);
  const { data: units = [] } = useUnitsByProject(projectId);
  const { data: users = [] } = useUsers();
  const { data: stages = [] } = useCourtCaseStatuses();
  const { data: caseUids = [] } = useCaseUids();
  const update = useUpdateCourtCaseFull();
  const notify = useNotify();
  const attachments = useCaseAttachments({ courtCase });
  const { changedFields, handleValuesChange: handleChanged } = useChangedFields(
    form,
    [courtCase],
  );


  const highlight = (name: string) =>
    changedFields[name]
      ? { background: '#fffbe6', padding: 4, borderRadius: 2 }
      : {};

  useEffect(() => {
    if (!courtCase) return;
    form.setFieldsValue({
      project_id: courtCase.project_id,
      unit_ids: courtCase.unit_ids,
      number: courtCase.number,
      date: dayjs(courtCase.date),
      responsible_lawyer_id: courtCase.responsible_lawyer_id ?? undefined,
      status: courtCase.status,
      fix_start_date: courtCase.fix_start_date ? dayjs(courtCase.fix_start_date) : null,
      fix_end_date: courtCase.fix_end_date ? dayjs(courtCase.fix_end_date) : null,
      description: courtCase.description,
      case_uid: courtCase.caseUid ?? undefined,
    });
    
  }, [courtCase, form]);

  const handleFiles = (files: File[]) => attachments.addFiles(files);


  const handleDownloadArchive = async () => {
    const files = [
      ...attachments.remoteFiles.map((f) => ({
        name: f.original_name ?? f.name,
        getFile: async () => {
          const url = await signedUrl(f.path, f.original_name ?? f.name);
          const res = await fetch(url);
          return res.blob();
        },
      })),
      ...attachments.newFiles.map((f) => ({
        name: f.file.name,
        getFile: async () => f.file,
      })),
    ];
    if (files.length) {
      await downloadZip(files, `case-${caseId}-files.zip`);
    }
  };

  const onFinish = async (values: any) => {
    try {
      const uidId = await getOrCreateCaseUid(values.case_uid);
      const uploaded = await update.mutateAsync({
        id: Number(caseId),
        updates: {
          project_id: values.project_id,
          unit_ids: values.unit_ids,
          number: values.number,
          date: values.date ? (values.date as Dayjs).format('YYYY-MM-DD') : courtCase?.date,
          responsible_lawyer_id: values.responsible_lawyer_id ?? null,
          status: values.status,
          fix_start_date: values.fix_start_date ? (values.fix_start_date as Dayjs).format('YYYY-MM-DD') : null,
          fix_end_date: values.fix_end_date ? (values.fix_end_date as Dayjs).format('YYYY-MM-DD') : null,
          description: values.description || '',
          case_uid_id: uidId,
        },
        newAttachments: attachments.newFiles,
        removedAttachmentIds: attachments.removedIds.map(Number),
      });
      if (uploaded?.length) {
        attachments.appendRemote(
          uploaded.map((u: any) => ({
            id: u.id,
            name: u.original_name || u.storage_path.split('/').pop() || 'file',
            original_name: u.original_name ?? null,
            path: u.storage_path,
            url: u.file_url,
            mime_type: u.file_type,
          })),
        );
      }
      attachments.markPersisted();
      notify.success('Дело обновлено');
      onSaved?.();
    } catch (e: any) {
      notify.error(e.message);
    }
  };

  if (!courtCase) return <Skeleton active />;

  return (
    <>
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      onValuesChange={handleChanged}
      style={{ maxWidth: embedded ? 'none' : 640 }}
      autoComplete="off"
    >
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            name="project_id"
            label="Проект"
            rules={[{ required: true }]}
            style={highlight('project_id')}
          >
            <Select options={projects.map((p) => ({ value: p.id, label: p.name }))} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="unit_ids"
            label="Объекты"
            rules={[{ required: true }]}
            style={highlight('unit_ids')}
          >
            <Select mode="multiple" options={units.map((u) => ({ value: u.id, label: u.name }))} disabled={!projectId} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="responsible_lawyer_id"
            label="Ответственный юрист"
            rules={[{ required: true }]}
            style={highlight('responsible_lawyer_id')}
          >
            <Select options={users.map((u) => ({ value: u.id, label: u.name }))} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            name="case_uid"
            label="Уникальный идентификатор"
            rules={[{ required: true }]}
            style={highlight('case_uid')}
          >
            <AutoComplete
              allowClear
              placeholder="UID"
              options={caseUids.map((u) => ({ value: u.uid }))}
              filterOption={(input, option) =>
                String(option?.value ?? '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
            />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            name="number"
            label="Номер дела"
            rules={[{ required: true }]}
            style={highlight('number')}
          >
            <Input />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="date"
            label="Дата"
            rules={[{ required: true }]}
            style={highlight('date')}
          >
            <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item
            name="status"
            label="Статус"
            rules={[{ required: true }]}
            style={highlight('status')}
          >
            <Select options={stages.map((s) => ({ value: s.id, label: s.name }))} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="fix_start_date"
            label="Дата начала устранения"
            style={highlight('fix_start_date')}
          >
            <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="fix_end_date"
            label="Дата завершения устранения"
            dependencies={["fix_start_date"]}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const start = getFieldValue('fix_start_date');
                  if (!value || !start || value.isSameOrAfter(start, 'day')) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Дата завершения меньше даты начала'));
                },
              }),
            ]}
            style={highlight('fix_end_date')}
          >
            <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={24}>
          <Form.Item name="description" label="Описание" style={highlight('description')}>
            <Input.TextArea rows={1} />
          </Form.Item>
        </Col>
      </Row>
      {courtCase && (
        <div style={{ marginBottom: 16 }}>
          <CasePartiesEditorTable caseId={Number(caseId)} projectId={courtCase.project_id} />
        </div>
      )}
      <div style={{ marginBottom: 16 }}>
        <CaseClaimsEditorTable caseId={Number(caseId)} />
      </div>
      <Form.Item label="Файлы" style={attachments.attachmentsChanged ? { background: '#fffbe6', padding: 4, borderRadius: 2 } : {}}>
        <FileDropZone onFiles={handleFiles} />
        <Button
          size="small"
          style={{ marginTop: 8, marginBottom: 8 }}
          onClick={handleDownloadArchive}
          disabled={!attachments.remoteFiles.length && !attachments.newFiles.length}
        >
          Скачать архив
        </Button>
        <AttachmentEditorTable
          remoteFiles={attachments.remoteFiles.map((f) => ({
            id: String(f.id),
            name: f.name,
            path: f.path,
            mime: f.mime_type,
            description: f.description,
          }))}
          newFiles={attachments.newFiles.map((f) => ({
            file: f.file,
            mime: f.file.type,
            description: f.description,
          }))}
          onRemoveRemote={(id) => attachments.removeRemote(id)}
          onRemoveNew={(idx) => attachments.removeNew(idx)}
          onDescNew={(idx, d) => attachments.setDescription(idx, d)}
          showDetails
          getSignedUrl={(path, name) => signedUrl(path, name)}
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

    </>
  );
}
