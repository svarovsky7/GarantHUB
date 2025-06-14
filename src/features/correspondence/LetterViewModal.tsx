import React, { useEffect } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
  Skeleton,
} from 'antd';
import { useLetter, useUpdateLetter, signedUrl } from '@/entities/correspondence';
import { useUsers } from '@/entities/user';
import { useLetterTypes } from '@/entities/letterType';
import { useProjects } from '@/entities/project';
import { useUnitsByProject } from '@/entities/unit';
import { useAttachmentTypes } from '@/entities/attachmentType';
import { useLetterStatuses } from '@/entities/letterStatus';
import FileDropZone from '@/shared/ui/FileDropZone';
import AttachmentEditorTable from '@/shared/ui/AttachmentEditorTable';
import { useNotify } from '@/shared/hooks/useNotify';
import { useLetterAttachments } from './model/useLetterAttachments';

export interface LetterViewModalProps {
  letterId: string | null;
  open: boolean;
  onClose: () => void;
}

/**
 * Модальное окно просмотра и редактирования письма.
 */
export default function LetterViewModal({ letterId, open, onClose }: LetterViewModalProps) {
  const [form] = Form.useForm();
  const { data: letter, isLoading } = useLetter(letterId ?? undefined);
  const { data: users = [] } = useUsers();
  const { data: letterTypes = [] } = useLetterTypes();
  const { data: projects = [] } = useProjects();
  const projectId = Form.useWatch('project_id', form);
  const { data: units = [] } = useUnitsByProject(projectId);
  const { data: statuses = [] } = useLetterStatuses();
  const { data: attachmentTypes = [] } = useAttachmentTypes();
  const update = useUpdateLetter();
  const notify = useNotify();

  const attachments = useLetterAttachments({ letter, attachmentTypes });

  useEffect(() => {
    if (!letter) return;
    form.setFieldsValue({
      type: letter.type,
      number: letter.number,
      date: dayjs(letter.date),
      sender: letter.sender,
      receiver: letter.receiver,
      subject: letter.subject,
      content: letter.content,
      responsible_user_id: letter.responsible_user_id ?? undefined,
      letter_type_id: letter.letter_type_id ?? null,
      project_id: letter.project_id ?? null,
      unit_ids: letter.unit_ids,
      status_id: letter.status_id ?? null,
    });
  }, [letter, form]);

  const handleFiles = (files: File[]) => attachments.addFiles(files);

  const submit = async (values: any) => {
    if (
      attachments.newFiles.some((f) => f.type_id == null) ||
      attachments.remoteFiles.some(
        (f) => (attachments.changedTypes[String(f.id)] ?? null) == null,
      )
    ) {
      notify.error('Укажите тип файла для всех документов');
      return;
    }
    try {
      const uploaded = await update.mutateAsync({
        id: Number(letterId),
        updates: {
          number: values.number,
          letter_type_id: values.letter_type_id ?? null,
          status_id: values.status_id ?? null,
          letter_date: values.date ? (values.date as Dayjs).format('YYYY-MM-DD') : letter?.date,
          sender: values.sender,
          receiver: values.receiver,
          subject: values.subject,
          content: values.content,
          responsible_user_id: values.responsible_user_id ?? null,
          project_id: values.project_id ?? null,
          unit_ids: values.unit_ids ?? [],
        },
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
            name:
              u.original_name ||
              (() => {
                try {
                  return decodeURIComponent(
                    u.storage_path.split('/').pop()?.replace(/^\d+_/, '') || u.storage_path,
                  );
                } catch {
                  return u.storage_path;
                }
              })(),
            original_name: u.original_name ?? null,
            path: u.storage_path,
            url: u.file_url,
            type: u.file_type,
            attachment_type_id: u.attachment_type_id ?? null,
          })),
        );
      }
      attachments.markPersisted();
      notify.success('Письмо обновлено');
      onClose();
    } catch (e: any) {
      notify.error(e.message);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      title="Просмотр письма"
      width={720}
      okText="Сохранить"
      cancelText="Закрыть"
      afterClose={() => form.resetFields()}
    >
      {isLoading || !letter ? (
        <Skeleton active />
      ) : (
        <Form form={form} layout="vertical" onFinish={submit}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="type" label="Тип">
                <Select>
                  <Select.Option value="incoming">Входящее</Select.Option>
                  <Select.Option value="outgoing">Исходящее</Select.Option>
                </Select>
              </Form.Item>
            </Col>
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
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="letter_type_id" label="Категория">
                <Select allowClear options={letterTypes.map((t) => ({ value: t.id, label: t.name }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status_id" label="Статус">
                <Select allowClear options={statuses.map((s) => ({ value: s.id, label: s.name }))} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="project_id" label="Проект">
                <Select allowClear options={projects.map((p) => ({ value: p.id, label: p.name }))} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="unit_ids" label="Объекты">
                <Select
                  mode="multiple"
                  options={units.map((u) => ({ value: u.id, label: u.name }))}
                  disabled={!projectId}
                />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="responsible_user_id" label="Ответственный">
                <Select allowClear options={users.map((u) => ({ value: u.id, label: u.name }))} />
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
            <AttachmentEditorTable
              remoteFiles={attachments.remoteFiles.map((f) => ({
                id: String(f.id),
                name: f.name,
                path: f.path,
                typeId: attachments.changedTypes[String(f.id)] ?? f.attachment_type_id,
                typeName: f.attachment_type_name,
                mime: f.type,
              }))}
              newFiles={attachments.newFiles.map((f) => ({ file: f.file, typeId: f.type_id, mime: f.file.type }))}
              attachmentTypes={attachmentTypes}
              onRemoveRemote={(id) => attachments.removeRemote(id)}
              onRemoveNew={(idx) => attachments.removeNew(idx)}
              onChangeRemoteType={(id, t) => attachments.changeRemoteType(id, t)}
              onChangeNewType={(idx, t) => attachments.changeNewType(idx, t)}
              getSignedUrl={(path, name) => signedUrl(path, name)}
            />
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
}

