import React, { useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
  Button,
  AutoComplete,
  Radio,
  Space,
  Popconfirm,
  message,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { useUsers } from '@/entities/user';
import { useLetterTypes } from '@/entities/letterType';
import { useVisibleProjects } from '@/entities/project';
import { useUnitsByProject } from '@/entities/unit';
import { useContractors, useDeleteContractor } from '@/entities/contractor';
import { usePersons, useDeletePerson } from '@/entities/person';
import { useAttachmentTypes } from '@/entities/attachmentType';
import PersonModal from '@/features/person/PersonModal';
import ContractorModal from '@/features/contractor/ContractorModal';
import { useLetterStatuses } from '@/entities/letterStatus';
import { useAuthStore } from '@/shared/store/authStore';
import { useLetterFiles } from './model/useLetterFiles';

export interface AddLetterFormData {
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
  /** Статус письма */
  status_id: number | null;
  attachments: { file: File; type_id: number | null }[];
  parent_id: string | null;
}

interface AddLetterFormProps {
  onSubmit: (data: AddLetterFormData) => void;
  parentId?: string | null;
  /** Начальные значения формы */
  initialValues?: Partial<AddLetterFormData>;
}

/** Форма добавления нового письма на Ant Design */
export default function AddLetterForm({ onSubmit, parentId = null, initialValues: defaults = {} }: AddLetterFormProps) {
  const [form] = Form.useForm<Omit<AddLetterFormData, 'attachments'>>();
  const projectId = Form.useWatch('project_id', form);
  const senderValue = Form.useWatch('sender', form);
  const receiverValue = Form.useWatch('receiver', form);

  const { files, addFiles, setType, removeFile, reset: resetFiles } = useLetterFiles();
  const [senderType, setSenderType] = React.useState<'person' | 'contractor'>('contractor');
  const [receiverType, setReceiverType] = React.useState<'person' | 'contractor'>('contractor');
  const [personModal, setPersonModal] = React.useState<{ target: 'sender' | 'receiver'; data?: any } | null>(null);
  const [contractorModal, setContractorModal] = React.useState<{ target: 'sender' | 'receiver'; data?: any } | null>(null);

  const { data: users = [], isLoading: loadingUsers } = useUsers();
  const { data: letterTypes = [], isLoading: loadingTypes } = useLetterTypes();
  const { data: projects = [], isLoading: loadingProjects } = useVisibleProjects();
  const { data: units = [], isLoading: loadingUnits } = useUnitsByProject(projectId);
  const { data: contractors = [], isLoading: loadingContractors } = useContractors();
  const { data: persons = [], isLoading: loadingPersons } = usePersons();
  const { data: attachmentTypes = [], isLoading: loadingAttachmentTypes } = useAttachmentTypes();
  const { data: statuses = [] } = useLetterStatuses();
  const deletePerson = useDeletePerson();
  const deleteContractor = useDeleteContractor();

  const personOptions = React.useMemo(
    () => persons.map((p) => ({ value: p.full_name })),
    [persons],
  );
  const contractorOptions = React.useMemo(
    () => contractors.map((c) => ({ value: c.name })),
    [contractors],
  );
  const contactOptions = React.useMemo(
    () => [...contractorOptions, ...personOptions],
    [contractorOptions, personOptions],
  );

  /** ID текущего пользователя для заполнения "Ответственного" */
  const profileId = useAuthStore((s) => s.profile?.id);

  /** Предыдущий выбранный проект, чтобы очищать объекты при его смене */
  const prevProjectId = React.useRef<number | null>(null);

  useEffect(() => {
    // На инициализации просто запоминаем проект без очистки
    if (prevProjectId.current === null) {
      prevProjectId.current = projectId ?? null;
      return;
    }
    // Если проект изменился после инициализации — сбрасываем выбранные объекты
    if (prevProjectId.current !== projectId) {
      form.setFieldValue('unit_ids', []);
      prevProjectId.current = projectId ?? null;
    }
  }, [projectId, form]);

  // Подставляем текущего пользователя, если ответственный не выбран
  useEffect(() => {
    if (profileId && !form.getFieldValue('responsible_user_id')) {
      form.setFieldValue('responsible_user_id', profileId);
    }
  }, [profileId, form]);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arr = Array.from(e.target.files || []);
    addFiles(arr as File[]);
    e.target.value = '';
  };

  const submit = (values: Omit<AddLetterFormData, 'attachments'>) => {
    if (files.some((f) => f.type_id == null)) {
      message.error('Укажите тип файла для всех документов');
      return;
    }
    onSubmit({
      ...values,
      date: values.date ?? dayjs(),
      status_id: statuses[0]?.id ?? null,
      attachments: files,
      parent_id: parentId,
    });
    form.resetFields();
    resetFiles();
  };

  return (
    <>
      <Form
        form={form}
        layout="vertical"
        onFinish={submit}
        initialValues={{ type: 'incoming', date: dayjs(), unit_ids: [], ...defaults }}
        autoComplete="off"
      >
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="type" label="Тип письма">
              <Select placeholder="Выберите тип письма">
                <Select.Option value="incoming">Входящее</Select.Option>
                <Select.Option value="outgoing">Исходящее</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
                name="number"
                label="Номер письма"
                rules={[{ required: true, message: 'Укажите номер письма' }]}
            >
              <Input placeholder="Введите номер письма" autoComplete="off" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
                name="date"
                label="Дата"
                rules={[{ required: true, message: 'Укажите дату' }]}
            >
              <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="Отправитель" style={{ marginBottom: 0 }}>
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
                  <Button icon={<PlusOutlined />} onClick={() => setPersonModal({ target: 'sender' })} style={{ display: senderType === 'person' ? 'inline-block' : 'none' }} />
                  <Button icon={<PlusOutlined />} onClick={() => setContractorModal({ target: 'sender' })} style={{ display: senderType === 'contractor' ? 'inline-block' : 'none' }} />
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
          <Col span={8}>
            <Form.Item label="Получатель" style={{ marginBottom: 0 }}>
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
                  <Button icon={<PlusOutlined />} onClick={() => setPersonModal({ target: 'receiver' })} style={{ display: receiverType === 'person' ? 'inline-block' : 'none' }} />
                  <Button icon={<PlusOutlined />} onClick={() => setContractorModal({ target: 'receiver' })} style={{ display: receiverType === 'contractor' ? 'inline-block' : 'none' }} />
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
          <Col span={8}>
            <Form.Item name="responsible_user_id" label="Ответственный">
              <Select
                showSearch
                loading={loadingUsers}
                options={users.map((u) => ({ value: u.id, label: u.name }))}
                allowClear
                placeholder="Выберите ответственного"
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="letter_type_id" label="Категория письма">
              <Select
                loading={loadingTypes}
                options={letterTypes.map((t) => ({ value: t.id, label: t.name }))}
                allowClear
                placeholder="Выберите категорию"
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="project_id" label="Проект">
              <Select
                  loading={loadingProjects}
                  options={projects.map((p) => ({ value: p.id, label: p.name }))}
                  allowClear
                  placeholder="Выберите проект"
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="unit_ids" label="Объекты">
              <Select
                  mode="multiple"
                  loading={loadingUnits}
                  options={units.map((u) => ({ value: u.id, label: u.name }))}
                  placeholder="Выберите объекты"
                  disabled={!projectId}
              />
            </Form.Item>
          </Col>
          <Col span={8} />
        </Row>
        <Form.Item name="subject" label="Тема письма">
          <Input placeholder="Введите тему письма" autoComplete="off" />
        </Form.Item>
        <Form.Item name="content" label="Содержание">
          <Input.TextArea
              rows={3}
              placeholder="Введите содержание письма"
              autoComplete="off"
          />
        </Form.Item>
        <Form.Item label="Вложения">
          <input type="file" multiple onChange={handleFiles} />
          {files.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', marginTop: 4 }}>
                <span style={{ marginRight: 8 }}>{f.file.name}</span>
                <Select
                    style={{ width: 220 }}
                    placeholder="Тип файла"
                    value={f.type_id ?? undefined}
                    onChange={(v) => setType(i, v)}
                    allowClear
                    loading={loadingAttachmentTypes}
                >
                  {attachmentTypes.map((t) => (
                      <Select.Option key={t.id} value={t.id}>
                        {t.name}
                      </Select.Option>
                  ))}
                </Select>
                <Button type="text" danger onClick={() => removeFile(i)}>
                  Удалить
                </Button>
              </div>
          ))}
        </Form.Item>
        <Form.Item style={{ textAlign: 'right' }}>
          <Button type="primary" htmlType="submit">
            Добавить письмо
          </Button>
        </Form.Item>
      </Form>
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
    </>
  );
}
