import React, { useEffect, useState } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import {
  Form,
  Input,
  Select,
  DatePicker,
  Switch,
  Button,
  Row,
  Col,
  Skeleton,
} from 'antd';
import { useDefectTypes } from '@/entities/defectType';
import { useTicketStatuses } from '@/entities/ticketStatus';
import { useUnitsByProject } from '@/entities/unit';
import { useUsers } from '@/entities/user';
import { useProjects } from '@/entities/project';
import { useCreateTicket, useTicket } from '@/entities/ticket';
import { useAttachmentTypes } from '@/entities/attachmentType';
import { useProjectId } from '@/shared/hooks/useProjectId';
import { useAuthStore } from '@/shared/store/authStore';
import FileDropZone from '@/shared/ui/FileDropZone';
import AttachmentEditorTable from '@/shared/ui/AttachmentEditorTable';
import { useNotify } from '@/shared/hooks/useNotify';
import { useTicketAttachments } from './model/useTicketAttachments';
import { useUnsavedChangesWarning } from '@/shared/hooks/useUnsavedChangesWarning';
import { downloadZip } from '@/shared/utils/downloadZip';
import { signedUrl } from '@/entities/ticket';
import { useChangedFields } from '@/shared/hooks/useChangedFields';

export interface TicketFormAntdEditProps {
  ticketId?: string;
  onCreated?: () => void;
  onCancel?: () => void;
  embedded?: boolean;
  initialUnitId?: number;
}

export interface TicketFormAntdEditValues {
  project_id: number | null;
  unit_ids: number[];
  status_id: number | null;
  title: string;
  description: string | null;
  customer_request_no: string | null;
  customer_request_date: Dayjs | null;
  responsible_engineer_id: string | null;
  is_warranty: boolean;
  received_at: Dayjs | null;
  fixed_at: Dayjs | null;
}

export default function TicketFormAntdEdit({
  ticketId,
  onCreated,
  onCancel,
  embedded = false,
  initialUnitId,
}: TicketFormAntdEditProps) {
  const [form] = Form.useForm<TicketFormAntdEditValues>();
  const globalProjectId = useProjectId();
  const { data: ticket, updating, updateAsync } = useTicket(ticketId);
  const isEdit = Boolean(ticketId);

  const { data: types = [] } = useDefectTypes();
  const { data: statuses = [] } = useTicketStatuses();
  const { data: projects = [] } = useProjects();
  const { data: users = [] } = useUsers();
  const projectId = Form.useWatch('project_id', form) ?? globalProjectId;
  const { data: units = [] } = useUnitsByProject(projectId);
  const { data: attachmentTypes = [] } = useAttachmentTypes();
  const create = useCreateTicket();
  const notify = useNotify();
  const profileId = useAuthStore((s) => s.profile?.id);

  const [formTouched, setFormTouched] = useState(false);
  const { changedFields, handleValuesChange: handleChanged } = useChangedFields(
    form,
    [ticket],
  );

  const {
    remoteFiles,
    newFiles,
    changedTypes,
    removedIds,
    addFiles,
    removeNew,
    removeRemote,
    changeRemoteType,
    changeNewType,
    appendRemote,
    markPersisted,
    attachmentsChanged,
    reset: resetAttachments,
  } = useTicketAttachments({ ticket, attachmentTypes });

  const highlight = (name: keyof TicketFormAntdEditValues) =>
    changedFields[name as string]
      ? { background: '#fffbe6', padding: 4, borderRadius: 2 }
      : {};


  useEffect(() => {
    if (ticket) {
      form.setFieldsValue({
        project_id: ticket.projectId,
        unit_ids: ticket.unitIds,
        responsible_engineer_id: ticket.responsibleEngineerId ?? undefined,
        status_id: ticket.statusId ?? undefined,
        is_warranty: ticket.isWarranty,
        customer_request_no: ticket.customerRequestNo ?? undefined,
        customer_request_date: ticket.customerRequestDate ?? null,
        received_at: ticket.receivedAt ?? null,
        fixed_at: ticket.fixedAt ?? null,
        title: ticket.title,
        description: ticket.description ?? undefined,
      });
      setFormTouched(false);
    } else {
      form.setFieldsValue({
        project_id: globalProjectId ?? null,
        unit_ids: initialUnitId != null ? [initialUnitId] : [],
        responsible_engineer_id: profileId ?? undefined,
        received_at: dayjs(),
      });
      setFormTouched(false);
    }
  }, [ticket, form, globalProjectId, profileId, initialUnitId]);

  const handleFiles = (files: File[]) => addFiles(files);
  const handleValuesChange = () => {
    setFormTouched(true);
    handleChanged();
  };

  const handleDownloadArchive = async () => {
    const files = [
      ...remoteFiles.map((f) => ({
        name: f.original_name ?? f.name,
        getFile: async () => {
          const url = await signedUrl(f.path, f.original_name ?? f.name);
          const res = await fetch(url);
          return res.blob();
        },
      })),
      ...newFiles.map((f) => ({ name: f.file.name, getFile: async () => f.file })),
    ];
    if (files.length) {
      await downloadZip(files, `ticket-${ticketId ?? 'new'}-files.zip`);
    }
  };

  const handleSubmit = async (values: TicketFormAntdEditValues) => {
    if (
      newFiles.some((f) => f.type_id == null) ||
      remoteFiles.some((f) => (changedTypes[f.id] ?? null) == null)
    ) {
      notify.error('Выберите тип файла для всех документов');
      return;
    }

    const payload = {
      project_id: values.project_id ?? globalProjectId,
      unit_ids: values.unit_ids,
      status_id: values.status_id,
      title: values.title,
      description: values.description || null,
      customer_request_no: values.customer_request_no || null,
      customer_request_date: values.customer_request_date
        ? values.customer_request_date.format('YYYY-MM-DD')
        : null,
      responsible_engineer_id: values.responsible_engineer_id ?? null,
      is_warranty: values.is_warranty,
      received_at: values.received_at
        ? values.received_at.format('YYYY-MM-DD')
        : dayjs().format('YYYY-MM-DD'),
      fixed_at: values.fixed_at ? values.fixed_at.format('YYYY-MM-DD') : null,
    };

    try {
      if (isEdit && ticketId) {
        const uploaded = await updateAsync({
          id: Number(ticketId),
          ...payload,
          newAttachments: newFiles,
          removedAttachmentIds: removedIds,
          updatedAttachments: Object.entries(changedTypes).map(([id, type]) => ({
            id,
            type_id: type,
          })),
        });
        if (uploaded?.length) {
          appendRemote(
            uploaded.map((u: any) => ({
              id: u.id,
              name: u.original_name || u.storage_path.split('/').pop() || 'file',
              original_name: u.original_name ?? null,
              path: u.storage_path,
              url: u.file_url,
              type: u.file_type,
              attachment_type_id: u.attachment_type_id ?? null,
            })),
          );
        }
        markPersisted();
        setFormTouched(false);
        onCreated?.();
      } else {
        await create.mutateAsync({
          ...payload,
          attachments: newFiles.map((f) => ({ file: f.file, type_id: f.type_id })),
        } as any);
        onCreated?.();
        form.resetFields();
        resetAttachments();
        setFormTouched(false);
      }
    } catch (e: unknown) {
      console.error(e);
    }
  };

  const handleCancel = () => {
    if (hasChanges && !window.confirm('Изменения будут потеряны. Покинуть форму?')) {
      return;
    }
    onCancel?.();
  };

  const hasChanges = formTouched || attachmentsChanged;
  useUnsavedChangesWarning(hasChanges);

  if (isEdit && !ticket) return <Skeleton active />;

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      onValuesChange={handleValuesChange}
      style={{ maxWidth: embedded ? 'none' : 640 }}
      autoComplete="off"
    >
      <Row gutter={16}>
        <Col span={12}>
      <Form.Item
        name="project_id"
        label="Проект"
        rules={[{ required: true }]}
        style={highlight('project_id')}
      >
        <Select allowClear options={projects.map((p) => ({ value: p.id, label: p.name }))} />
      </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="unit_ids"
            label="Объекты"
            rules={[{ required: true }]}
            style={highlight('unit_ids')}
          >
            <Select
              mode="multiple"
              disabled={!projectId}
              options={units.map((u) => ({ value: u.id, label: u.name }))}
            />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="responsible_engineer_id"
            label="Ответственный инженер"
            rules={[{ required: true }]}
            style={highlight('responsible_engineer_id')}
          >
            <Select allowClear options={users.map((u) => ({ value: u.id, label: u.name }))} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="status_id"
            label="Статус"
            rules={[{ required: true }]}
            style={highlight('status_id')}
          >
            <Select options={statuses.map((s) => ({ value: s.id, label: s.name }))} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="is_warranty"
            label="Гарантия"
            valuePropName="checked"
            style={highlight('is_warranty')}
          >
            <Switch />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="customer_request_no"
            label="№ заявки от Заказчика"
            style={highlight('customer_request_no')}
          >
            <Input />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="customer_request_date"
            label="Дата заявки Заказчика"
            style={highlight('customer_request_date')}
          >
            <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="received_at"
            label="Дата получения"
            rules={[{ required: true }]}
            style={highlight('received_at')}
          >
            <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="fixed_at"
            label="Дата устранения"
            style={highlight('fixed_at')}
          >
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
                if (rec) form.setFieldValue('fixed_at', dayjs(rec).add(d, 'day'));
              }}
            >
              +{d} дней
            </Button>
          </Col>
        ))}
      </Row>
      <Form.Item
        name="title"
        label="Краткое описание"
        rules={[{ required: true }]}
        style={highlight('title')}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="description"
        label="Подробное описание"
        style={highlight('description')}
      >
        <Input.TextArea rows={2} />
      </Form.Item>
      <Form.Item label="Файлы" style={attachmentsChanged ? { background: '#fffbe6', padding: 4, borderRadius: 2 } : {}}>
        <FileDropZone onFiles={handleFiles} />
        <Button
          size="small"
          style={{ marginTop: 8, marginBottom: 8 }}
          onClick={handleDownloadArchive}
          disabled={!remoteFiles.length && !newFiles.length}
        >
          Скачать архив
        </Button>
        <AttachmentEditorTable
          remoteFiles={remoteFiles.map((f) => ({
            id: String(f.id),
            name: f.original_name ?? f.name,
            path: f.path,
            typeId: changedTypes[f.id] ?? f.attachment_type_id,
            typeName: f.attachment_type_name,
            mime: f.type,
          }))}
          newFiles={newFiles.map((f) => ({ file: f.file, typeId: f.type_id, mime: f.file.type }))}
          attachmentTypes={attachmentTypes}
          onRemoveRemote={removeRemote}
          onRemoveNew={removeNew}
          onChangeRemoteType={changeRemoteType}
          onChangeNewType={changeNewType}
          getSignedUrl={(path, name) => signedUrl(path, name)}
        />
      </Form.Item>
      <Form.Item style={{ textAlign: 'right' }}>
        {onCancel && (
          <Button style={{ marginRight: 8 }} onClick={handleCancel} disabled={create.isPending || updating}>
            Отмена
          </Button>
        )}
        <Button type="primary" htmlType="submit" loading={create.isPending || updating}>
          {isEdit ? 'Сохранить' : 'Создать'}
        </Button>
      </Form.Item>
    </Form>
  );
}
