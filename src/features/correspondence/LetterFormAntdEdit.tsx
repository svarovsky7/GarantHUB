import React, { useEffect } from 'react';
import dayjs from 'dayjs';
import {
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Row,
  Col,
  AutoComplete,
  Skeleton,
} from 'antd';
import { useUsers } from '@/entities/user';
import { useLetterTypes } from '@/entities/letterType';
import { useProjects } from '@/entities/project';
import { useUnitsByProject } from '@/entities/unit';
import { useLetterStatuses } from '@/entities/letterStatus';
import { useAttachmentTypes } from '@/entities/attachmentType';
import { useContractors } from '@/entities/contractor';
import { usePersons } from '@/entities/person';
import { useLetter, useUpdateLetter } from '@/entities/correspondence';
import { useNotify } from '@/shared/hooks/useNotify';
import FileDropZone from '@/shared/ui/FileDropZone';
import AttachmentEditorTable from '@/shared/ui/AttachmentEditorTable';
import { useLetterAttachments } from './model/useLetterAttachments';
import { signedUrl } from '@/entities/attachment';

interface Props {
  letterId: string;
  onCancel?: () => void;
  onSaved?: () => void;
  embedded?: boolean;
}

/** Форма просмотра и редактирования письма */
export default function LetterFormAntdEdit({
  letterId,
  onCancel,
  onSaved,
  embedded = false,
}: Props) {
  const [form] = Form.useForm();
  const { data: letter } = useLetter(letterId);
  const update = useUpdateLetter();
  const notify = useNotify();

  const { data: users = [] } = useUsers();
  const { data: letterTypes = [] } = useLetterTypes();
  const { data: projects = [] } = useProjects();
  const { data: statuses = [] } = useLetterStatuses();
  const { data: attachmentTypes = [] } = useAttachmentTypes();
  const { data: contractors = [] } = useContractors();
  const { data: persons = [] } = usePersons();

  const projectId = Form.useWatch('project_id', form);
  const { data: units = [] } = useUnitsByProject(projectId);

  const attachments = useLetterAttachments({ letter, attachmentTypes });

  useEffect(() => {
    if (!letter) return;
    form.setFieldsValue({
      number: letter.number,
      date: dayjs(letter.date),
      sender: letter.sender,
      receiver: letter.receiver,
      subject: letter.subject,
      content: letter.content,
      project_id: letter.project_id ?? null,
      unit_ids: letter.unit_ids,
      responsible_user_id: letter.responsible_user_id ?? undefined,
      letter_type_id: letter.letter_type_id ?? undefined,
      status_id: letter.status_id ?? undefined,
    });
  }, [letter, form]);

  const contactOptions = React.useMemo(
    () => [
      ...contractors.map((c) => ({ value: c.name })),
      ...persons.map((p) => ({ value: p.full_name })),
    ],
    [contractors, persons],
  );

  const handleFiles = (files: File[]) => attachments.addFiles(files);

  const handleSubmit = async (values: any) => {
    if (
      attachments.newFiles.some((f) => f.type_id == null) ||
      attachments.remoteFiles.some(
        (f) => (attachments.changedTypes[f.id] ?? null) == null,
      )
    ) {
      notify.error('Выберите тип файла для всех документов');
      return;
    }

    try {
      await update.mutateAsync({
        id: Number(letterId),
        newAttachments: attachments.newFiles,
        removedAttachmentIds: attachments.removedIds.map((id) => Number(id)),
        updatedAttachments: Object.entries(attachments.changedTypes).map(
          ([id, type]) => ({ id: Number(id), type_id: type }),
        ),
        updates: {
          number: values.number,
          letter_type_id: values.letter_type_id ?? null,
          status_id: values.status_id ?? null,
          letter_date: values.date ? values.date.toISOString() : null,
          subject: values.subject,
          content: values.content,
          sender: values.sender,
          receiver: values.receiver,
          responsible_user_id: values.responsible_user_id ?? null,
          project_id: values.project_id ?? null,
          unit_ids: values.unit_ids ?? [],
        },
      });
      attachments.markPersisted();
      notify.success('Письмо обновлено');
      onSaved?.();
    } catch (e: any) {
      notify.error(e.message);
    }
  };

  if (!letter) return <Skeleton active />;

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      style={{ maxWidth: embedded ? 'none' : 640 }}
      autoComplete="off"
    >
      <Row gutter={16}>
        <Col span={6}>
          <Form.Item name="number" label="Номер" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name="date" label="Дата" rules={[{ required: true }]}>
            <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name="status_id" label="Статус">
            <Select
              allowClear
              options={statuses.map((s) => ({ value: s.id, label: s.name }))}
            />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name="responsible_user_id" label="Ответственный">
            <Select
              showSearch
              allowClear
              options={users.map((u) => ({ value: u.id, label: u.name }))}
            />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={6}>
          <Form.Item name="letter_type_id" label="Категория">
            <Select
              allowClear
              options={letterTypes.map((t) => ({ value: t.id, label: t.name }))}
            />
          </Form.Item>
        </Col>
        <Col span={6}>
          <Form.Item name="project_id" label="Проект">
            <Select
              allowClear
              options={projects.map((p) => ({ value: p.id, label: p.name }))}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="unit_ids" label="Объекты">
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
          <Form.Item name="sender" label="Отправитель">
            <AutoComplete options={contactOptions} allowClear />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="receiver" label="Получатель">
            <AutoComplete options={contactOptions} allowClear />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item name="subject" label="Тема">
        <Input />
      </Form.Item>
      <Form.Item name="content" label="Содержание">
        <Input.TextArea rows={2} />
      </Form.Item>
      <Form.Item label="Вложения">
        <FileDropZone onFiles={handleFiles} />
        <AttachmentEditorTable
          remoteFiles={attachments.remoteFiles.map((f) => ({
            id: String(f.id),
            name: f.name,
            path: f.path,
            typeId: attachments.changedTypes[f.id] ?? f.attachment_type_id,
            typeName: f.attachment_type_name,
            mime: f.type,
          }))}
          newFiles={attachments.newFiles.map((f) => ({
            file: f.file,
            typeId: f.type_id,
            mime: f.file.type,
          }))}
          attachmentTypes={attachmentTypes}
          onRemoveRemote={(id) => attachments.removeRemote(id)}
          onRemoveNew={(idx) => attachments.removeNew(idx)}
          onChangeRemoteType={(id, t) => attachments.changeRemoteType(id, t)}
          onChangeNewType={(idx, t) => attachments.changeNewType(idx, t)}
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
  );
}
