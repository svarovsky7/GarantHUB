import React, { useEffect } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { Form, Input, Select, DatePicker, Button, Row, Col, Skeleton } from 'antd';
import { useUsers } from '@/entities/user';
import { useLetterTypes } from '@/entities/letterType';
import { useProjects } from '@/entities/project';
import { useUnitsByProject } from '@/entities/unit';
import { useAttachmentTypes } from '@/entities/attachmentType';
import { useLetter, useUpdateLetter } from '@/entities/correspondence';
import FileDropZone from '@/shared/ui/FileDropZone';
import AttachmentEditorTable from '@/shared/ui/AttachmentEditorTable';
import { useLetterAttachments } from './model/useLetterAttachments';
import { useNotify } from '@/shared/hooks/useNotify';

export interface LetterFormAntdEditProps {
  letterId: string;
  onCancel?: () => void;
  onSaved?: () => void;
  embedded?: boolean;
}

export interface LetterFormValues {
  type: 'incoming' | 'outgoing';
  number: string;
  date: Dayjs | null;
  sender: string;
  receiver: string;
  subject: string;
  content: string;
  responsible_user_id: string | null;
  letter_type_id: number | null;
  project_id: number | null;
  unit_ids: number[];
  status_id: number | null;
}

/** Форма редактирования письма */
export default function LetterFormAntdEdit({ letterId, onCancel, onSaved, embedded = false }: LetterFormAntdEditProps) {
  const [form] = Form.useForm<LetterFormValues>();
  const { data: letter } = useLetter(letterId);
  console.debug('LetterFormAntdEdit letterId:', letterId);
  console.debug('LetterFormAntdEdit fetched letter:', letter);
  const update = useUpdateLetter();
  const notify = useNotify();

  const { data: users = [] } = useUsers();
  const { data: letterTypes = [] } = useLetterTypes();
  const { data: projects = [] } = useProjects();
  const projectId = Form.useWatch('project_id', form);
  const { data: units = [] } = useUnitsByProject(projectId);
  const { data: attachmentTypes = [] } = useAttachmentTypes();

  const attachments = useLetterAttachments({ letter, attachmentTypes });

  // Сбрасываем форму при смене письма
  useEffect(() => {
    console.debug('LetterFormAntdEdit resetting form for letterId', letterId);
    form.resetFields();
  }, [letterId]);

  // Заполняем поля данными письма
  useEffect(() => {
    if (!letter) return;
    console.debug('LetterFormAntdEdit setFields with letter:', letter);
    form.setFieldsValue({
      type: letter.type,
      number: letter.number,
      date: letter.date ? dayjs(letter.date) : null,
      sender: letter.sender,
      receiver: letter.receiver,
      subject: letter.subject,
      content: letter.content,
      responsible_user_id: letter.responsible_user_id,
      letter_type_id: letter.letter_type_id,
      project_id: letter.project_id,
      unit_ids: letter.unit_ids,
      status_id: letter.status_id ?? null,
    });
    attachments.reset();
  }, [letterId, letter]);

  const handleFiles = (files: File[]) => attachments.addFiles(files);

  const onFinish = async (values: LetterFormValues) => {
    try {
      if (attachments.newFiles.some((f) => f.type_id == null) || attachments.remoteFiles.some((f) => (attachments.changedTypes[f.id] ?? null) == null)) {
        notify.error('Укажите тип файла для всех вложений');
        return;
      }
      await update.mutateAsync({
        id: Number(letterId),
        updates: {
          number: values.number,
          letter_type_id: values.letter_type_id,
          project_id: values.project_id,
          unit_ids: values.unit_ids,
          letter_date: values.date ? values.date.format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
          sender: values.sender,
          receiver: values.receiver,
          subject: values.subject,
          content: values.content,
          responsible_user_id: values.responsible_user_id,
          status_id: values.status_id,
        } as any,
        newAttachments: attachments.newFiles,
        removedAttachmentIds: attachments.removedIds.map(Number),
        updatedAttachments: Object.entries(attachments.changedTypes).map(([id, t]) => ({ id: Number(id), type_id: t })),
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
    <Form form={form} layout="vertical" onFinish={onFinish} style={{ maxWidth: embedded ? 'none' : 640 }} autoComplete="off">
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item name="type" label="Тип письма">
            <Select>
              <Select.Option value="incoming">Входящее</Select.Option>
              <Select.Option value="outgoing">Исходящее</Select.Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="number" label="Номер письма" rules={[{ required: true }]}> <Input /> </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="date" label="Дата" rules={[{ required: true }]}> <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} /> </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="sender" label="Отправитель"> <Input /> </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="receiver" label="Получатель"> <Input /> </Form.Item>
        </Col>
      </Row>
      <Form.Item name="subject" label="Тема"> <Input /> </Form.Item>
      <Form.Item name="content" label="Содержание"> <Input.TextArea rows={2} /> </Form.Item>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="project_id" label="Проект"> <Select allowClear options={projects.map((p) => ({ value: p.id, label: p.name }))} /> </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="unit_ids" label="Объекты"> <Select mode="multiple" options={units.map((u) => ({ value: u.id, label: u.name }))} /> </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item name="letter_type_id" label="Категория"> <Select options={letterTypes.map((t) => ({ value: t.id, label: t.name }))} /> </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="status_id" label="Статус"> <Select options={[]} allowClear /> </Form.Item>
        </Col>
      </Row>
      <Form.Item name="responsible_user_id" label="Ответственный"> <Select allowClear options={users.map((u) => ({ value: u.id, label: u.name }))} /> </Form.Item>
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
