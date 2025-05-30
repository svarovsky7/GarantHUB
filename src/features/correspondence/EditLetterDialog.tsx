import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button as MuiButton,
} from '@mui/material';
import { Form, Input, Select, DatePicker, AutoComplete } from 'antd';
import dayjs from 'dayjs';
import FileDropZone from '@/shared/ui/FileDropZone';
import AttachmentEditorList from '@/shared/ui/AttachmentEditorList';
import { useUpdateLetter, signedLetterUrl } from '@/entities/correspondence';
import { useUsers } from '@/entities/user';
import { useUnitsByProject } from '@/entities/unit';
import { usePersons } from '@/entities/person';
import { useContractors } from '@/entities/contractor';
import { CorrespondenceLetter, CorrespondenceAttachment } from '@/shared/types/correspondence';

interface Option { id: number | string; name: string; }

interface Props {
  open: boolean;
  letter: CorrespondenceLetter | null;
  onClose: () => void;
  projects: Option[];
  letterTypes: Option[];
  attachmentTypes: Option[];
}

export default function EditLetterDialog({
  open,
  letter,
  onClose,
  projects,
  letterTypes,
  attachmentTypes,
}: Props) {
  const [form] = Form.useForm();
  const update = useUpdateLetter();
  const [remote, setRemote] = useState<CorrespondenceAttachment[]>([]);
  const [newFiles, setNewFiles] = useState<{ file: File; type_id: number | null }[]>([]);
  const [changedTypes, setChangedTypes] = useState<Record<string, number | null>>({});

  const projectId = Form.useWatch('project_id', form);
  const { data: users = [], isLoading: loadingUsers } = useUsers();
  const { data: units = [], isLoading: loadingUnits } = useUnitsByProject(projectId);
  const { data: contractors = [] } = useContractors();
  const { data: persons = [] } = usePersons();

  // При смене проекта сбрасываем выбранные объекты,
  // чтобы пользователь не сохранял несоответствующие unit_ids
  useEffect(() => {
    form.setFieldValue('unit_ids', []);
  }, [projectId, form]);

  const contactOptions = React.useMemo(
    () => [
      ...contractors.map((c) => ({ value: c.name })),
      ...persons.map((p) => ({ value: p.full_name })),
    ],
    [contractors, persons],
  );

  useEffect(() => {
    if (letter) {
      form.setFieldsValue({
        type: letter.type,
        number: letter.number,
        date: dayjs(letter.date),
        sender: letter.sender,
        receiver: letter.receiver,
        subject: letter.subject,
        project_id: letter.project_id ?? undefined,
        letter_type_id: letter.letter_type_id ?? undefined,
        responsible_user_id: letter.responsible_user_id ?? undefined,
        unit_ids: letter.unit_ids,
      });
      setRemote(letter.attachments);
      setNewFiles([]);
      setChangedTypes({});
    }
  }, [letter, form]);

  const addFiles = (files: File[]) => {
    const arr = files.map((f) => ({ file: f, type_id: null }));
    setNewFiles((p) => [...p, ...arr]);
  };
  const removeRemote = (id: string) => setRemote((p) => p.filter((f) => f.id !== id));
  const removeNew = (idx: number) => setNewFiles((p) => p.filter((_, i) => i !== idx));
  const changeRemoteType = (id: string, val: number | null) =>
    setChangedTypes((p) => ({ ...p, [id]: val }));
  const changeNewType = (idx: number, val: number | null) =>
    setNewFiles((p) => p.map((f, i) => (i === idx ? { ...f, type_id: val } : f)));

  const handleSave = async () => {
    const vals = form.getFieldsValue();
    const removedIds = letter!.attachments
      .filter((a) => !remote.some((r) => r.id === a.id))
      .map((a) => a.id);
    const updated = Object.entries(changedTypes).map(([id, type_id]) => ({ id, type_id }));
    await update.mutateAsync({
      id: letter!.id,
      updates: {
        type: vals.type,
        number: vals.number,
        date: vals.date ? vals.date.toISOString() : dayjs().toISOString(),
        sender: vals.sender,
        receiver: vals.receiver,
        subject: vals.subject,
        project_id: vals.project_id ?? null,
        letter_type_id: vals.letter_type_id ?? null,
        responsible_user_id: vals.responsible_user_id ?? null,
        unit_ids: vals.unit_ids ?? [],
      },
      newAttachments: newFiles,
      removedAttachmentIds: removedIds,
      updatedAttachments: updated,
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Детали письма</DialogTitle>
      <DialogContent dividers>
        <Form form={form} layout="vertical">
          <Form.Item name="type" label="Тип письма">
            <Select>
              <Select.Option value="incoming">Входящее</Select.Option>
              <Select.Option value="outgoing">Исходящее</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="number" label="Номер">
            <Input />
          </Form.Item>
          <Form.Item name="date" label="Дата">
            <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="project_id" label="Проект">
            <Select allowClear options={projects.map((p) => ({ value: p.id, label: p.name }))} />
          </Form.Item>
          <Form.Item name="letter_type_id" label="Категория">
            <Select allowClear options={letterTypes.map((t) => ({ value: t.id, label: t.name }))} />
          </Form.Item>
          <Form.Item name="responsible_user_id" label="Ответственный">
            <Select
              allowClear
              loading={loadingUsers}
              options={users.map((u) => ({ value: u.id, label: u.name }))}
            />
          </Form.Item>
          <Form.Item name="unit_ids" label="Объекты">
            <Select
              mode="multiple"
              allowClear
              disabled={!projectId}
              loading={loadingUnits}
              options={units.map((u) => ({ value: u.id, label: u.name }))}
            />
          </Form.Item>
          <Form.Item name="sender" label="Отправитель">
            <AutoComplete
              options={contactOptions}
              filterOption={(i, o) =>
                (o?.value ?? '').toLowerCase().includes(i.toLowerCase())
              }
              allowClear
            />
          </Form.Item>
          <Form.Item name="receiver" label="Получатель">
            <AutoComplete
              options={contactOptions}
              filterOption={(i, o) =>
                (o?.value ?? '').toLowerCase().includes(i.toLowerCase())
              }
              allowClear
            />
          </Form.Item>
          <Form.Item name="subject" label="Тема">
            <Input />
          </Form.Item>
        </Form>
        <FileDropZone onFiles={addFiles} />
        <AttachmentEditorList
          remoteFiles={remote.map((f) => ({ id: f.id, name: f.name, path: f.storage_path, typeId: changedTypes[f.id] ?? f.attachment_type_id }))}
          newFiles={newFiles.map((f) => ({ file: f.file, typeId: f.type_id }))}
          attachmentTypes={attachmentTypes}
          onRemoveRemote={removeRemote}
          onRemoveNew={removeNew}
          onChangeRemoteType={changeRemoteType}
          onChangeNewType={changeNewType}
          getSignedUrl={(path, name) => signedLetterUrl(path, name)}
        />
      </DialogContent>
      <DialogActions>
        <MuiButton onClick={onClose}>Отмена</MuiButton>
        <MuiButton variant="contained" onClick={handleSave} disabled={update.isPending}>
          Сохранить
        </MuiButton>
      </DialogActions>
    </Dialog>
  );
}
