import React, { useEffect } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { Form, Input, Select, DatePicker, Row, Col, Button, Skeleton } from 'antd';
import { useUsers } from '@/entities/user';
import { useLetterTypes } from '@/entities/letterType';
import { useProjects } from '@/entities/project';
import { useUnitsByProject } from '@/entities/unit';
import { useAttachmentTypes } from '@/entities/attachmentType';
import { useLetter, useUpdateLetter, signedUrl } from '@/entities/correspondence';
import FileDropZone from '@/shared/ui/FileDropZone';
import AttachmentEditorTable from '@/shared/ui/AttachmentEditorTable';
import { useLetterAttachments } from './model/useLetterAttachments';
import { useNotify } from '@/shared/hooks/useNotify';
import { downloadZip } from '@/shared/utils/downloadZip';

export interface LetterFormAntdEditProps {
  letterId: string;
  onCancel?: () => void;
  onSaved?: () => void;
  embedded?: boolean;
}

export default function LetterFormAntdEdit({ letterId, onCancel, onSaved, embedded = false }: LetterFormAntdEditProps) {
  const [form] = Form.useForm();
  const { data: letter } = useLetter(letterId);
  const { data: users = [] } = useUsers();
  const { data: letterTypes = [] } = useLetterTypes();
  const { data: projects = [] } = useProjects();
  const projectId = Form.useWatch('project_id', form);
  const { data: units = [] } = useUnitsByProject(projectId); 
  const { data: attachmentTypes = [] } = useAttachmentTypes();
  const update = useUpdateLetter();
  const notify = useNotify();
  const attachments = useLetterAttachments({ letter, attachmentTypes });

  useEffect(() => {
    if (!letter) return;
    form.setFieldsValue({
      project_id: letter.project_id,
      unit_ids: letter.unit_ids,
      number: letter.number,
      date: dayjs(letter.date),
      sender: letter.sender,
      receiver: letter.receiver,
      responsible_user_id: letter.responsible_user_id ?? undefined,
      letter_type_id: letter.letter_type_id ?? undefined,
      subject: letter.subject,
      content: letter.content,
    });
  }, [letter, form]);

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
      ...attachments.newFiles.map((f) => ({ name: f.file.name, getFile: async () => f.file })),
    ];
    if (files.length) {
      await downloadZip(files, `letter-${letterId}-files.zip`);
    }
  };

  const onFinish = async (values: any) => {
    if (
      attachments.newFiles.some((f) => f.type_id == null) ||
      attachments.remoteFiles.some((f) => (attachments.changedTypes[f.id] ?? null) == null)
    ) {
      notify.error('Укажите тип файла для всех вложений');
      return;
    }
    try {
      const uploaded = await update.mutateAsync({
        id: Number(letterId),
        updates: {
          project_id: values.project_id,
          unit_ids: values.unit_ids,
          number: values.number,
          letter_type_id: values.letter_type_id,
          letter_date: values.date ? (values.date as Dayjs).format('YYYY-MM-DD') : letter?.date,
          sender: values.sender,
          receiver: values.receiver,
          subject: values.subject,
          content: values.content,
          responsible_user_id: values.responsible_user_id ?? null,
        } as any,
        newAttachments: attachments.newFiles,
        removedAttachmentIds: attachments.removedIds.map(Number),
        updatedAttachments: Object.entries(attachments.changedTypes).map(([id, t]) => ({
          id: Number(id),
          type_id: t,
        })),
      });
      if (uploaded?.length) {
        attachments.appendRemote(
          uploaded.map((u: any) => ({
            id: u.id,
            name: u.original_name || u.storage_path.split('/').pop() || 'file',
            original_name: u.original_name ?? null,
            path: u.storage_path,
            url: u.file_url,
            type: u.file_type,
            attachment_type_id: u.attachment_type_id ?? null,
          }))
        );
      }
      attachments.markPersisted();
      notify.success('Письмо обновлено');
      onSaved?.();
    } catch (e: any) {
      notify.error(e.message);
    }
  };

  if (!letter) return <Skeleton active />;

  return (
    <Form form={form} layout="vertical" onFinish={onFinish} style={{ maxWidth: embedded ? 'none' : 640 }} autoComplete="off">
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name="project_id" label="Проект" rules={[{ required: true }]}> 
            <Select options={projects.map((p) => ({ value: p.id, label: p.name }))} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="unit_ids" label="Объекты">
            <Select mode="multiple" options={units.map((u) => ({ value: u.id, label: u.name }))} disabled={!projectId} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="responsible_user_id" label="Ответственный">
            <Select allowClear options={users.map((u) => ({ value: u.id, label: u.name }))} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name="number" label="Номер" rules={[{ required: true }]}> 
            <Input />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="date" label="Дата" rules={[{ required: true }]}> 
            <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="letter_type_id" label="Категория">
            <Select allowClear options={letterTypes.map((t) => ({ value: t.id, label: t.name }))} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="sender" label="Отправитель">
            <Input />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="receiver" label="Получатель">
            <Input />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item name="subject" label="Тема">
        <Input />
      </Form.Item>
      <Form.Item name="content" label="Содержание">
        <Input.TextArea rows={2} />
      </Form.Item>
      <Form.Item label="Файлы">
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
            name: f.original_name ?? f.name,
            path: f.path,
            typeId: attachments.changedTypes[f.id] ?? f.attachment_type_id,
            typeName: f.attachment_type_name,
            mime: f.type,
          }))}
          newFiles={attachments.newFiles.map((f) => ({ file: f.file, typeId: f.type_id, mime: f.file.type }))}
          attachmentTypes={attachmentTypes}
          onRemoveRemote={attachments.removeRemote}
          onRemoveNew={attachments.removeNew}
          onChangeRemoteType={attachments.changeRemoteType}
          onChangeNewType={attachments.changeNewType}
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
