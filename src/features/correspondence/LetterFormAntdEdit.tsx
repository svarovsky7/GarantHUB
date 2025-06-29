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
  Radio,
  Space,
  Popconfirm,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useUsers } from '@/entities/user';
import { useLetterTypes } from '@/entities/letterType';
import { useVisibleProjects } from '@/entities/project';
import { useUnitsByProject } from '@/entities/unit';
import { useContractors, useDeleteContractor } from '@/entities/contractor';
import { usePersons, useDeletePerson } from '@/entities/person';
import { useLetter, useUpdateLetter, signedUrl } from '@/entities/correspondence';
import FileDropZone from '@/shared/ui/FileDropZone';
import AttachmentEditorTable from '@/shared/ui/AttachmentEditorTable';
import { useLetterAttachments } from './model/useLetterAttachments';
import { useNotify } from '@/shared/hooks/useNotify';
import { downloadZip } from '@/shared/utils/downloadZip';
import PersonModal from '@/features/person/PersonModal';
import ContractorModal from '@/features/contractor/ContractorModal';
import { useChangedFields } from '@/shared/hooks/useChangedFields';

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
  const { data: projects = [] } = useVisibleProjects();
  const projectId = Form.useWatch('project_id', form);
  const { data: units = [] } = useUnitsByProject(projectId); 
  const { data: contractors = [] } = useContractors();
  const { data: persons = [] } = usePersons();
  const deletePerson = useDeletePerson();
  const deleteContractor = useDeleteContractor();
  const update = useUpdateLetter();
  const notify = useNotify();
  const attachments = useLetterAttachments({ letter });
  const { changedFields, handleValuesChange: handleChanged } = useChangedFields(
    form,
    [letter],
  );

  const highlight = (name: string) =>
    changedFields[name]
      ? { background: '#fffbe6', padding: 4, borderRadius: 2 }
      : {};

  const senderValue = Form.useWatch('sender', form);
  const receiverValue = Form.useWatch('receiver', form);
  const [senderType, setSenderType] = React.useState<'person' | 'contractor'>('contractor');
  const [receiverType, setReceiverType] = React.useState<'person' | 'contractor'>('contractor');
  const [personModal, setPersonModal] = React.useState<{ target: 'sender' | 'receiver'; data?: any } | null>(null);
  const [contractorModal, setContractorModal] = React.useState<{ target: 'sender' | 'receiver'; data?: any } | null>(null);

  const personOptions = React.useMemo(
    () => persons.map((p) => ({ value: p.full_name })),
    [persons],
  );
  const contractorOptions = React.useMemo(
    () => contractors.map((c) => ({ value: c.name })),
    [contractors],
  );

  useEffect(() => {
    if (!letter) return;
    if (persons.some((p) => p.full_name === letter.sender)) {
      setSenderType('person');
    } else if (contractors.some((c) => c.name === letter.sender)) {
      setSenderType('contractor');
    }
    if (persons.some((p) => p.full_name === letter.receiver)) {
      setReceiverType('person');
    } else if (contractors.some((c) => c.name === letter.receiver)) {
      setReceiverType('contractor');
    }
  }, [letter, persons, contractors]);

  useEffect(() => {
    if (!letter) return;
    form.setFieldsValue({
      project_id: letter.project_id,
      unit_ids: letter.unit_ids,
      type: letter.type,
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
    try {
      const uploaded = await update.mutateAsync({
        id: Number(letterId),
        updates: {
          project_id: values.project_id,
          unit_ids: values.unit_ids,
          number: values.number,
          letter_type_id: values.letter_type_id,
          type: values.type,
          letter_date: values.date ? (values.date as Dayjs).format('YYYY-MM-DD') : letter?.date,
          sender: values.sender,
          receiver: values.receiver,
          subject: values.subject,
          content: values.content,
          responsible_user_id: values.responsible_user_id ?? null,
        } as any,
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
            url: u.path,
            mime_type: u.mime_type,
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
          <Form.Item name="type" label="Тип письма" style={highlight('type')}>
            <Select>
              <Select.Option value="incoming">Входящее</Select.Option>
              <Select.Option value="outgoing">Исходящее</Select.Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>
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
          <Form.Item name="unit_ids" label="Объекты" style={highlight('unit_ids')}>
            <Select mode="multiple" options={units.map((u) => ({ value: u.id, label: u.name }))} disabled={!projectId} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="responsible_user_id" label="Ответственный" style={highlight('responsible_user_id')}>
            <Select allowClear options={users.map((u) => ({ value: u.id, label: u.name }))} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={8}>
          <Form.Item
            name="number"
            label="Номер"
            rules={[{ required: true }]}
            style={highlight('number')}
          >
            <Input />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="date" label="Дата" rules={[{ required: true }]} style={highlight('date')}>
            <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item name="letter_type_id" label="Категория" style={highlight('letter_type_id')}>
            <Select allowClear options={letterTypes.map((t) => ({ value: t.id, label: t.name }))} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="Отправитель" style={{ marginBottom: 0, ...highlight('sender') }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Radio.Group value={senderType} onChange={(e) => setSenderType(e.target.value)}>
                <Radio.Button value="contractor">Контрагент</Radio.Button>
                <Radio.Button value="person">Физлицо</Radio.Button>
              </Radio.Group>
              <Space.Compact style={{ width: '100%' }}>
                <Form.Item name="sender" noStyle>
                  <AutoComplete
                    options={senderType === 'person' ? personOptions : contractorOptions}
                    allowClear
                    placeholder="Укажите отправителя"
                    filterOption={(input, option) =>
                      String(option?.value ?? '')
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                  />
                </Form.Item>
                <Button
                  icon={<PlusOutlined />}
                  onClick={() => setPersonModal({ target: 'sender' })}
                  style={{ display: senderType === 'person' ? 'inline-block' : 'none' }}
                />
                <Button
                  icon={<PlusOutlined />}
                  onClick={() => setContractorModal({ target: 'sender' })}
                  style={{ display: senderType === 'contractor' ? 'inline-block' : 'none' }}
                />
                <Button
                  icon={<EditOutlined />}
                  disabled={!senderValue}
                  onClick={() => {
                    const val = form.getFieldValue('sender');
                    const data = senderType === 'person'
                      ? persons.find((p) => p.full_name === val)
                      : contractors.find((c) => c.name === val);
                    senderType === 'person'
                      ? setPersonModal({ target: 'sender', data })
                      : setContractorModal({ target: 'sender', data });
                  }}
                />
                <Popconfirm
                  title="Удалить?"
                  okText="Да"
                  cancelText="Нет"
                  onConfirm={() => {
                    const val = form.getFieldValue('sender');
                    if (!val) return;
                    if (senderType === 'person') {
                      const p = persons.find((pr) => pr.full_name === val);
                      if (p) {
                        deletePerson.mutate(p.id);
                        form.setFieldValue('sender', '');
                      }
                    } else {
                      const c = contractors.find((co) => co.name === val);
                      if (c) {
                        deleteContractor.mutate(c.id);
                        form.setFieldValue('sender', '');
                      }
                    }
                  }}
                >
                  <Button danger icon={<DeleteOutlined />} disabled={!senderValue} />
                </Popconfirm>
              </Space.Compact>
            </Space>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Получатель" style={{ marginBottom: 0, ...highlight('receiver') }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Radio.Group value={receiverType} onChange={(e) => setReceiverType(e.target.value)}>
                <Radio.Button value="contractor">Контрагент</Radio.Button>
                <Radio.Button value="person">Физлицо</Radio.Button>
              </Radio.Group>
              <Space.Compact style={{ width: '100%' }}>
                <Form.Item name="receiver" noStyle>
                  <AutoComplete
                    options={receiverType === 'person' ? personOptions : contractorOptions}
                    allowClear
                    placeholder="Укажите получателя"
                    filterOption={(input, option) =>
                      String(option?.value ?? '')
                        .toLowerCase()
                        .includes(input.toLowerCase())
                    }
                  />
                </Form.Item>
                <Button
                  icon={<PlusOutlined />}
                  onClick={() => setPersonModal({ target: 'receiver' })}
                  style={{ display: receiverType === 'person' ? 'inline-block' : 'none' }}
                />
                <Button
                  icon={<PlusOutlined />}
                  onClick={() => setContractorModal({ target: 'receiver' })}
                  style={{ display: receiverType === 'contractor' ? 'inline-block' : 'none' }}
                />
                <Button
                  icon={<EditOutlined />}
                  disabled={!receiverValue}
                  onClick={() => {
                    const val = form.getFieldValue('receiver');
                    const data = receiverType === 'person'
                      ? persons.find((p) => p.full_name === val)
                      : contractors.find((c) => c.name === val);
                    receiverType === 'person'
                      ? setPersonModal({ target: 'receiver', data })
                      : setContractorModal({ target: 'receiver', data });
                  }}
                />
                <Popconfirm
                  title="Удалить?"
                  okText="Да"
                  cancelText="Нет"
                  onConfirm={() => {
                    const val = form.getFieldValue('receiver');
                    if (!val) return;
                    if (receiverType === 'person') {
                      const p = persons.find((pr) => pr.full_name === val);
                      if (p) {
                        deletePerson.mutate(p.id);
                        form.setFieldValue('receiver', '');
                      }
                    } else {
                      const c = contractors.find((co) => co.name === val);
                      if (c) {
                        deleteContractor.mutate(c.id);
                        form.setFieldValue('receiver', '');
                      }
                    }
                  }}
                >
                  <Button danger icon={<DeleteOutlined />} disabled={!receiverValue} />
                </Popconfirm>
              </Space.Compact>
            </Space>
          </Form.Item>
        </Col>
      </Row>
      <Form.Item name="subject" label="Тема" style={highlight('subject')}>
        <Input />
      </Form.Item>
      <Form.Item name="content" label="Содержание" style={highlight('content')}>
        <Input.TextArea rows={2} />
      </Form.Item>
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
            name: f.original_name ?? f.name,
            path: f.path,
            mime: f.mime_type,
            description: f.description,
          }))}
          newFiles={attachments.newFiles.map((f) => ({
            file: f.file,
            mime: f.file.type,
            description: f.description,
          }))}
          onRemoveRemote={attachments.removeRemote}
          onRemoveNew={attachments.removeNew}
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
      {personModal && (
        <PersonModal
          open
          onClose={() => setPersonModal(null)}
          unitId={null}
          onSelect={(name) => form.setFieldValue(personModal.target, name)}
          initialData={personModal.data}
        />
      )}
      {contractorModal && (
        <ContractorModal
          open
          onClose={() => setContractorModal(null)}
          onSelect={(name) => form.setFieldValue(contractorModal.target, name)}
          initialData={contractorModal.data}
        />
      )}
    </Form>
  );
}
