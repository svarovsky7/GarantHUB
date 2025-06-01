import React, { useState, useEffect } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import 'dayjs/locale/ru';
import { ConfigProvider } from 'antd';
import ruRU from 'antd/locale/ru_RU';

dayjs.locale('ru');
dayjs.extend(isSameOrAfter);
import {
  Row,
  Col,
  Form,
  Input,
  DatePicker,
  Select,
  Button,
  Table,
  Tag,
  Space,
  Modal,
  Tabs,
  message,
  Popconfirm,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { CourtCase, Defect } from '@/shared/types/courtCase';
import { useProjects } from '@/entities/project';
import { useUnitsByProject, useUnitsByIds } from '@/entities/unit';
import { useContractors, useAddContractor, useUpdateContractor } from '@/entities/contractor';
import { useUsers } from '@/entities/user';
import { useLitigationStages } from '@/entities/litigationStage';
import { usePersons, useAddPerson, useUpdatePerson, useDeletePerson } from '@/entities/person';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { formatPhone } from '@/shared/utils/formatPhone';
import {
  useCourtCases,
  useAddCourtCase,
  useDeleteCourtCase,
  useUpdateCourtCase,
  useCaseDefects,
  useAddDefect,
  useDeleteDefect,
} from '@/entities/courtCase';
import { useAttachmentTypes } from '@/entities/attachmentType';
import {
  uploadCaseAttachment,
  addCaseAttachments,
  getAttachmentsByIds,
} from '@/entities/attachment';
import { supabase } from '@/shared/api/supabaseClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useProjectId } from '@/shared/hooks/useProjectId';
import { useAuthStore } from '@/shared/store/authStore';
import FileDropZone from '@/shared/ui/FileDropZone';

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(n);

type Filters = {
  status?: string;
  object?: string;
  lawyer?: string;
  search?: string;
};

export default function CourtCasesPage() {
  const { data: cases = [], isPending: casesLoading } = useCourtCases();
  const addCaseMutation = useAddCourtCase();
  const deleteCaseMutation = useDeleteCourtCase();
  const qc = useQueryClient();
  const updateCaseMutation = useUpdateCourtCase();

  const [filters, setFilters] = useState<Filters>({});
  const [dialogCase, setDialogCase] = useState<CourtCase | null>(null);
  const [tab, setTab] = useState('defects');

  const [form] = Form.useForm();
  const projectId = Form.useWatch('project_id', form);
  const globalProjectId = useProjectId();
  const profileId = useAuthStore((s) => s.profile?.id);

  useEffect(() => {
    form.setFieldValue('unit_ids', []);
  }, [projectId, form]);

  useEffect(() => {
    if (globalProjectId) {
      form.setFieldValue('project_id', globalProjectId);
    }
  }, [globalProjectId, form]);

  useEffect(() => {
    if (profileId && !form.getFieldValue('responsible_lawyer_id')) {
      form.setFieldValue('responsible_lawyer_id', profileId);
    }
  }, [profileId, form]);

  const { data: projects = [] } = useProjects();
  const { data: units = [], isPending: unitsLoading } = useUnitsByProject(projectId);
  const { data: contractors = [], isPending: contractorsLoading } = useContractors();
  const { data: users = [], isPending: usersLoading } = useUsers();
  const { data: stages = [], isPending: stagesLoading } = useLitigationStages();
  const { data: personsList = [] } = usePersons();
  const deletePersonMutation = useDeletePerson();
  const [personModal, setPersonModal] = useState<any | null>(null);
  const [contractorModal, setContractorModal] = useState<any | null>(null);
  const { data: attachmentTypes = [] } = useAttachmentTypes();
  const [caseFiles, setCaseFiles] = useState<{ file: File; type_id: number | null }[]>([]);

  const unitIds = React.useMemo(
    () => Array.from(new Set(cases.flatMap((c) => c.unit_ids).filter(Boolean))),
    [cases],
  );
  const { data: caseUnits = [] } = useUnitsByIds(unitIds);

  const { data: projectPersons = [], isPending: personsLoading } = useQuery({
    queryKey: ['projectPersons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('persons')
        .select('id, full_name')
        .order('full_name');
      if (error) throw error;
      return data ?? [];
    },
  });

  const handleCaseFiles = (files: File[]) => {
    const arr = files.map((file) => ({ file, type_id: null }));
    setCaseFiles((p) => [...p, ...arr]);
  };

  const setCaseFileType = (idx: number, val: number | null) =>
    setCaseFiles((p) => p.map((f, i) => (i === idx ? { ...f, type_id: val } : f)));

  const removeCaseFile = (idx: number) =>
    setCaseFiles((p) => p.filter((_, i) => i !== idx));

  const handleAddCase = async (values: any) => {
    try {
      const newCase = await addCaseMutation.mutateAsync({
        project_id: values.project_id,
        unit_ids: values.unit_ids || [],
        number: values.number,
        date: values.date.format('YYYY-MM-DD'),
        plaintiff_id: values.plaintiff_id,
        defendant_id: values.defendant_id,
        responsible_lawyer_id: values.responsible_lawyer_id,
        status: values.status,
        fix_start_date: values.fix_start_date
          ? (values.fix_start_date as Dayjs).format('YYYY-MM-DD')
          : null,
        fix_end_date: values.fix_end_date
          ? (values.fix_end_date as Dayjs).format('YYYY-MM-DD')
          : null,
        description: values.description || '',
      } as any);

      let newAtts: { id: number }[] = [];
      if (caseFiles.length) {
        newAtts = await addCaseAttachments(caseFiles, newCase.id);
        await updateCaseMutation.mutateAsync({
          id: newCase.id,
          updates: { attachment_ids: newAtts.map((a) => a.id) },
        });
        qc.invalidateQueries({ queryKey: ['court_cases'] });
      }

      form.resetFields();
      setCaseFiles([]);
      message.success('Дело успешно добавлено!');
    } catch (e: any) {
      message.error(e.message);
    }
  };

  const deleteCase = (id: number) => {
    deleteCaseMutation.mutate(id, {
      onSuccess: () => message.success('Дело удалено!'),
      onError: (e: any) => message.error(e.message),
    });
  };

  const casesData = cases.map((c: any) => ({
    ...c,
    projectName: projects.find((p) => p.id === c.project_id)?.name ?? '',
    projectObject: c.unit_ids
      .map((id: number) => caseUnits.find((u) => u.id === id)?.name)
      .filter(Boolean)
      .join(', '),
    plaintiff:
      personsList.find((p) => p.id === c.plaintiff_id)?.full_name ?? c.plaintiff,
    defendant:
      contractors.find((d) => d.id === c.defendant_id)?.name ?? c.defendant,
    responsibleLawyer:
      users.find((u) => u.id === c.responsible_lawyer_id)?.name ?? c.responsibleLawyer,
    daysSinceFixStart: c.fix_start_date
      ? dayjs(c.fix_end_date ?? dayjs()).diff(dayjs(c.fix_start_date), 'day')
      : null,
  }));

  const columns: ColumnsType<CourtCase & any> = [
    {
      title: '№ дела',
      dataIndex: 'number',
      width: 120,
      sorter: (a, b) => a.number.localeCompare(b.number),
    },
    {
      title: 'Дата',
      dataIndex: 'date',
      width: 120,
      sorter: (a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf(),
      render: (v: string) => dayjs(v).format('DD.MM.YYYY'),
    },
    {
      title: 'Проект',
      dataIndex: 'projectName',
    },
    {
      title: 'Объект',
      dataIndex: 'projectObject',
    },
    {
      title: 'Истец',
      dataIndex: 'plaintiff',
    },
    {
      title: 'Ответчик',
      dataIndex: 'defendant',
    },
    {
      title: 'Юрист',
      dataIndex: 'responsibleLawyer',
    },
    {
      title: 'Дата начала устранения',
      dataIndex: 'fix_start_date',
      render: (v: string | null) =>
        v ? dayjs(v).format('DD.MM.YYYY') : '',
    },
    {
      title: 'Дата завершения устранения',
      dataIndex: 'fix_end_date',
      render: (v: string | null) =>
        v ? dayjs(v).format('DD.MM.YYYY') : '',
    },
    {
      title: 'Дней с начала устранения',
      dataIndex: 'daysSinceFixStart',
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      render: (s: number) => <Tag color="blue">{stages.find((st) => st.id === s)?.name}</Tag>,
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: any, record) => (
        <Space>
          <Button size="small" onClick={() => { setDialogCase(record); setTab('defects'); }}>
            Просмотр
          </Button>
          <Button size="small" danger onClick={() => deleteCase(Number(record.id))}>
            Удалить
          </Button>
        </Space>
      ),
    },
  ];

  const filteredCases = casesData.filter((c: any) => {
    const search = filters.search?.toLowerCase() ?? '';
    const matchesSearch =
      c.number.toLowerCase().includes(search) ||
      c.plaintiff.toLowerCase().includes(search) ||
      c.defendant.toLowerCase().includes(search) ||
      (c.description || '').toLowerCase().includes(search);
    const matchesStatus = !filters.status || c.status === filters.status;
    const matchesObject =
      !filters.object || c.projectObject.toLowerCase().includes(filters.object.toLowerCase());
    const matchesLawyer =
      !filters.lawyer || c.responsibleLawyer.toLowerCase().includes(filters.lawyer.toLowerCase());
    return matchesSearch && matchesStatus && matchesObject && matchesLawyer;
  });

  return (
    <ConfigProvider locale={ruRU}>
      <>
        <Form form={form} layout="vertical" onFinish={handleAddCase} autoComplete="off">
        {/* Row 1: Project, Object, Lawyer */}
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="project_id" label="Проект" rules={[{ required: true, message: 'Выберите проект' }]}>
              <Select options={projects.map((p) => ({ value: p.id, label: p.name }))} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              name="unit_ids"
              label="Объекты"
              rules={[{ required: true, message: 'Выберите объекты' }]}
            >
              <Select
                mode="multiple"
                loading={unitsLoading}
                options={units.map((u) => ({ value: u.id, label: u.name }))}
                disabled={!projectId}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="responsible_lawyer_id" label="Ответственный юрист" rules={[{ required: true, message: 'Выберите юриста' }]}>
              <Select loading={usersLoading} options={users.map((u) => ({ value: u.id, label: u.name }))} />
            </Form.Item>
          </Col>
        </Row>
        {/* Row 2: Number, Date, Status */}
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="number" label="Номер дела" rules={[{ required: true, message: 'Укажите номер' }]}> 
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="date" label="Дата" rules={[{ required: true, message: 'Укажите дату' }]}> 
              <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="status" label="Статус" rules={[{ required: true, message: 'Выберите статус' }]}> 
              <Select loading={stagesLoading} options={stages.map((s) => ({ value: s.id, label: s.name }))} />
            </Form.Item>
          </Col>
        </Row>
        {/* Row 3: Plaintiff, Defendant */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Истец" style={{ marginBottom: 0 }}>
              <Space.Compact style={{ width: '100%' }}>
                <Form.Item
                  name="plaintiff_id"
                  noStyle
                  rules={[{ required: true, message: 'Выберите истца' }]}
                >
                  <Select
                    loading={personsLoading}
                    options={projectPersons.map((p) => ({ value: p.id, label: p.full_name }))}
                    disabled={!projectId}
                  />
                </Form.Item>
                <Button
                  icon={<PlusOutlined />}
                  onClick={() => setPersonModal({})}
                />
                <Button
                  icon={<EditOutlined />}
                  disabled={!form.getFieldValue('plaintiff_id')}
                  onClick={() => {
                    const id = form.getFieldValue('plaintiff_id');
                    const data = personsList.find((p) => p.id === id) || null;
                    setPersonModal(data);
                  }}
                />
                <Popconfirm
                  title="Удалить физлицо?"
                  okText="Да"
                  cancelText="Нет"
                  onConfirm={() => {
                    const id = form.getFieldValue('plaintiff_id');
                    if (!id) return;
                    deletePersonMutation.mutate(id, {
                      onSuccess: () => {
                        message.success('Физлицо удалено');
                        form.setFieldValue('plaintiff_id', null);
                      },
                      onError: (e: any) => message.error(e.message),
                    });
                  }}
                  disabled={!form.getFieldValue('plaintiff_id')}
                >
                  <Button
                    icon={<DeleteOutlined />}
                    disabled={!form.getFieldValue('plaintiff_id')}
                  />
                </Popconfirm>
              </Space.Compact>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Ответчик" style={{ marginBottom: 0 }}>
              <Space.Compact style={{ width: '100%' }}>
                <Form.Item
                  name="defendant_id"
                  noStyle
                  rules={[{ required: true, message: 'Выберите ответчика' }]}
                >
                  <Select
                    loading={contractorsLoading}
                    options={contractors.map((c) => ({ value: c.id, label: c.name }))}
                  />
                </Form.Item>
                <Button icon={<PlusOutlined />} onClick={() => setContractorModal({})} />
                <Button
                  icon={<EditOutlined />}
                  disabled={!form.getFieldValue('defendant_id')}
                  onClick={() => {
                    const id = form.getFieldValue('defendant_id');
                    const data = contractors.find((c) => c.id === id) || null;
                    setContractorModal(data);
                  }}
                />
              </Space.Compact>
            </Form.Item>
          </Col>
        </Row>
        {/* Row 4: Fix dates */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="fix_start_date" label="Дата начала устранения">
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
            >
              <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
        {/* Row 5: Description */}
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="description" label="Описание">
              <Input.TextArea rows={1} />
            </Form.Item>
          </Col>
        </Row>
        {/* Row 6: Files drag and drop */}
        <Row gutter={16}>
          <Col span={24}>
            <FileDropZone onFiles={handleCaseFiles} />
            {caseFiles.map((f, i) => (
              <Row key={i} gutter={8} align="middle" style={{ marginTop: 4 }}>
                <Col flex="auto">
                  <span>{f.file.name}</span>
                </Col>
                <Col flex="160px">
                  <Select
                    style={{ width: '100%' }}
                    placeholder="Тип файла"
                    value={f.type_id ?? undefined}
                    onChange={(v) => setCaseFileType(i, v)}
                    allowClear
                  >
                    {attachmentTypes.map((t) => (
                      <Select.Option key={t.id} value={t.id}>
                        {t.name}
                      </Select.Option>
                    ))}
                  </Select>
                </Col>
                <Col>
                  <Button type="text" danger onClick={() => removeCaseFile(i)}>
                    Удалить
                  </Button>
                </Col>
              </Row>
            ))}
          </Col>
        </Row>
        <Form.Item style={{ textAlign: 'right' }}>
          <Button type="primary" htmlType="submit">
            Добавить дело
          </Button>
        </Form.Item>
      </Form>

      <Row gutter={16} style={{ marginTop: 24, marginBottom: 12 }}>
        <Col>
          <Select
            allowClear
            placeholder="Статус"
            onChange={(v) => setFilters((f) => ({ ...f, status: v }))}
            style={{ width: 150 }}
          >
            {stages.map((s) => (
              <Select.Option key={s.id} value={s.id}>
                {s.name}
              </Select.Option>
            ))}
          </Select>
        </Col>
        <Col>
          <Input
            placeholder="Фильтр по объекту"
            onChange={(e) => setFilters((f) => ({ ...f, object: e.target.value }))}
          />
        </Col>
        <Col>
          <Input
            placeholder="Юрист"
            onChange={(e) => setFilters((f) => ({ ...f, lawyer: e.target.value }))}
          />
        </Col>
        <Col flex="auto">
          <Input
            placeholder="Поиск"
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          />
        </Col>
      </Row>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={filteredCases}
        loading={casesLoading}
        pagination={{ pageSize: 25, showSizeChanger: true }}
        size="middle"
      />

      <CaseDialog
        open={!!dialogCase}
        onClose={() => setDialogCase(null)}
        caseData={dialogCase}
        tab={tab}
        onTabChange={setTab}
      />
      <AddPersonModal
        open={!!personModal}
        onClose={() => setPersonModal(null)}
        unitId={Form.useWatch('unit_ids', form)?.[0] ?? null}
        onSelect={(id) => form.setFieldValue('plaintiff_id', id)}
        initialData={personModal}
      />
      <ContractorModal
        open={!!contractorModal}
        onClose={() => setContractorModal(null)}
        onSelect={(id) => form.setFieldValue('defendant_id', id)}
        initialData={contractorModal}
      />
    </>
    </ConfigProvider>
  );
}

interface CaseDialogProps {
  open: boolean;
  onClose: () => void;
  caseData: CourtCase | null;
  tab: string;
  onTabChange: (k: string) => void;
}

function CaseDialog({ open, onClose, caseData, tab, onTabChange }: CaseDialogProps) {
  const { data: defects = [] } = useCaseDefects(caseData ? Number(caseData.id) : 0);
  const { data: stages = [] } = useLitigationStages();
  const { data: unitInfo = [] } = useUnitsByIds(
    caseData?.unit_ids ?? [],
  );
  const addDefectMutation = useAddDefect();
  const deleteDefectMutation = useDeleteDefect();
  const updateCaseMutation = useUpdateCourtCase();
  const [editing, setEditing] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (caseData) {
      form.setFieldsValue({
        number: caseData.number,
        date: dayjs(caseData.date),
        unit_ids: caseData.unit_ids,
        plaintiff_id: caseData.plaintiff_id,
        defendant_id: caseData.defendant_id,
        responsible_lawyer_id: caseData.responsible_lawyer_id,
        status: caseData.status,
        fix_start_date: caseData.fix_start_date ? dayjs(caseData.fix_start_date) : null,
        fix_end_date: caseData.fix_end_date ? dayjs(caseData.fix_end_date) : null,
        description: caseData.description,
      });
    } else {
      form.resetFields();
    }
  }, [caseData, form]);

  const saveChanges = async (values: any) => {
    if (!caseData) return;
    try {
      await updateCaseMutation.mutateAsync({
        id: Number(caseData.id),
        updates: {
          number: values.number,
          date: values.date.format('YYYY-MM-DD'),
          unit_ids: values.unit_ids,
          plaintiff_id: values.plaintiff_id,
          defendant_id: values.defendant_id,
          responsible_lawyer_id: values.responsible_lawyer_id,
          status: values.status,
          fix_start_date: values.fix_start_date
            ? (values.fix_start_date as Dayjs).format('YYYY-MM-DD')
            : null,
          fix_end_date: values.fix_end_date
            ? (values.fix_end_date as Dayjs).format('YYYY-MM-DD')
            : null,
          description: values.description || '',
        },
      });
      message.success('Дело обновлено');
      setEditing(false);
    } catch (e: any) {
      message.error(e.message);
    }
  };


  const addDefect = (defect: Omit<Defect, 'id'>) => {
    if (!caseData) return;
    addDefectMutation.mutate(
      { case_id: Number(caseData.id), ...defect },
      {
        onError: (e: any) => message.error(e.message),
      },
    );
  };

  const deleteDefect = (id: number) => {
    if (!caseData) return;
    deleteDefectMutation.mutate(
      { id, case_id: Number(caseData.id) },
      {
        onError: (e: any) => message.error(e.message),
      },
    );
  };

  const objectName =
    unitInfo.map((u) => u.name).join(', ') || (caseData as any)?.projectObject || '';

  return (
    <Modal open={open} onCancel={onClose} width="80%" footer={null} title={caseData ? `Дело № ${caseData.number}` : ''}>
      {caseData && (
        <>
          {editing ? (
            <Form form={form} layout="vertical" onFinish={saveChanges} style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="number" label="Номер дела" rules={[{ required: true, message: 'Укажите номер' }]}> 
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="date" label="Дата" rules={[{ required: true, message: 'Укажите дату' }]}> 
                    <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="unit_ids" label="Объекты" rules={[{ required: true, message: 'Выберите объекты' }]}> 
                    <Select
                      mode="multiple"
                      options={unitInfo.map((u) => ({ value: u.id, label: u.name }))}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="plaintiff_id" label="Истец"> 
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="defendant_id" label="Ответчик"> 
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="responsible_lawyer_id" label="Ответственный юрист"> 
                    <Input />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="status" label="Статус"> 
                    <Select options={stages.map((s) => ({ value: s.id, label: s.name }))} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="fix_start_date" label="Дата начала устранения"> 
                    <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
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
                  >
                    <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="description" label="Описание"> 
                    <Input.TextArea rows={2} />
                  </Form.Item>
                </Col>
                <Col span={24} style={{ textAlign: 'right' }}>
                  <Space>
                    <Button onClick={() => setEditing(false)}>Отмена</Button>
                    <Button type="primary" htmlType="submit" loading={updateCaseMutation.isPending}>Сохранить</Button>
                  </Space>
                </Col>
              </Row>
            </Form>
          ) : (
            <>
              <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={8}>
                  <div>
                    <strong>Номер дела</strong>
                    <div>{caseData.number}</div>
                  </div>
                </Col>
                <Col span={8}>
                  <div>
                    <strong>Дата открытия</strong>
                    <div>{dayjs(caseData.date).format('DD.MM.YYYY')}</div>
                  </div>
                </Col>
                <Col span={8}>
                  <div>
                    <strong>Объект</strong>
                    <div>{objectName}</div>
                  </div>
                </Col>
                <Col span={8}>
                  <div>
                    <strong>Истец</strong>
                    <div>{(caseData as any).plaintiff}</div>
                  </div>
                </Col>
                <Col span={8}>
                  <div>
                    <strong>Ответчик</strong>
                    <div>{(caseData as any).defendant}</div>
                  </div>
                </Col>
                <Col span={8}>
                  <div>
                    <strong>Ответственный юрист</strong>
                    <div>{(caseData as any).responsibleLawyer}</div>
                  </div>
                </Col>
                <Col span={8}>
                  <div>
                    <strong>Статус</strong>
                    <div>{stages.find((s) => s.id === (caseData as any).status)?.name}</div>
                  </div>
                </Col>
                <Col span={8}>
                  <div>
                    <strong>Дата начала устранения</strong>
                    <div>
                      {caseData.fix_start_date ? dayjs(caseData.fix_start_date).format('DD.MM.YYYY') : 'Не указано'}
                    </div>
                  </div>
                </Col>
                <Col span={8}>
                  <div>
                    <strong>Дата завершения устранения</strong>
                    <div>
                      {caseData.fix_end_date ? dayjs(caseData.fix_end_date).format('DD.MM.YYYY') : 'Не указано'}
                    </div>
                  </div>
                </Col>
                <Col span={24}>
                  <div>
                    <strong>Описание</strong>
                    <div>{caseData.description || 'Нет описания'}</div>
                  </div>
                </Col>
                <Col span={24} style={{ textAlign: 'right' }}>
                  <Button onClick={() => setEditing(true)}>Редактировать</Button>
                </Col>
              </Row>
            </>
          )}
          <Tabs activeKey={tab} onChange={onTabChange} style={{ marginBottom: 16 }}>
            <Tabs.TabPane tab="Недостатки" key="defects">
              <DefectsTab defects={defects} onAdd={addDefect} onDelete={deleteDefect} />
            </Tabs.TabPane>
            <Tabs.TabPane tab="Файлы" key="files">
              <CaseFilesTab caseData={caseData} />
            </Tabs.TabPane>
          </Tabs>
        </>
      )}
    </Modal>
  );
}


interface DefectsProps {
  defects: Defect[];
  onAdd: (defect: Omit<Defect, 'id'>) => void;
  onDelete: (id: number) => void;
}

function DefectsTab({ defects, onAdd, onDelete }: DefectsProps) {
  const [form] = Form.useForm();

  const add = (values: any) => {
    if (!values.name || !values.cost) return;
    onAdd({
      name: values.name,
      location: values.location,
      description: values.description,
      cost: Number(values.cost),
      duration: values.duration ? Number(values.duration) : null,
    });
    form.resetFields();
  };

  const columns: ColumnsType<Defect> = [
    { title: 'Недостаток', dataIndex: 'name' },
    { title: 'Местоположение', dataIndex: 'location' },
    {
      title: 'Стоимость',
      dataIndex: 'cost',
      render: (v: number) => fmtCurrency(v),
    },
    { title: 'Срок', dataIndex: 'duration' },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: any, record) => (
        <Button size="small" danger onClick={() => onDelete(record.id)}>
          Удалить
        </Button>
      ),
    },
  ];

  const total = defects.reduce((sum, d) => sum + d.cost, 0);

  return (
    <>
      <Form form={form} layout="vertical" onFinish={add} style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="name" label="Наименование">
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="location" label="Местоположение">
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="cost" label="Стоимость">
              <Input type="number" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="duration" label="Срок (дней)">
              <Input type="number" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="description" label="Описание">
              <Input.TextArea rows={2} />
            </Form.Item>
          </Col>
          <Col span={24} style={{ textAlign: 'right' }}>
            <Button type="primary" htmlType="submit">
              Добавить
            </Button>
          </Col>
        </Row>
      </Form>
      <Table rowKey="id" columns={columns} dataSource={defects} pagination={false} size="middle" />
      {defects.length > 0 && (
        <div style={{ textAlign: 'right', marginTop: 8 }}>
          <strong>Общая стоимость: {fmtCurrency(total)}</strong>
        </div>
      )}
    </>
  );
}

interface CaseFilesTabProps {
  caseData: CourtCase;
}

function CaseFilesTab({ caseData }: CaseFilesTabProps) {
  const { data: attachmentTypes = [] } = useAttachmentTypes();
  const updateCaseMutation = useUpdateCourtCase();
  const [files, setFiles] = useState<{
    id: number;
    name: string;
    path: string;
    url: string;
    type_id: number | null;
  }[]>([]);


  const loadFiles = async () => {
    try {
      const data = await getAttachmentsByIds(caseData.attachment_ids || []);
      const arr = data.map((a) => ({
        id: a.id,
        name:
          a.original_name ||
          (() => {
            try {
              return decodeURIComponent(
                a.storage_path.split('/').pop()?.replace(/^\d+_/, '') ||
                  a.storage_path,
              );
            } catch {
              return a.storage_path;
            }
          })(),
        path: a.storage_path,
        url: a.file_url,
        type_id: a.attachment_type_id,
      }));
      setFiles(arr);
    } catch (err: any) {
      message.error(err.message);
    }
  };

  useEffect(() => {
    loadFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseData.id, caseData.attachment_ids?.join(',')]);

  const handleUpload = async (files: File[]) => {
    const fls = files;
    try {
      const attachments = await addCaseAttachments(
        fls.map((f) => ({ file: f, type_id: null })),
        caseData.id,
      );
      await updateCaseMutation.mutateAsync({
        id: Number(caseData.id),
        updates: {
          attachment_ids: [
            ...(caseData.attachment_ids || []),
            ...attachments.map((a) => a.id),
          ],
        },
      });
      const newFiles = attachments.map((a) => ({
        id: a.id,
        name:
          a.original_name ||
          (() => {
            try {
              return decodeURIComponent(
                a.storage_path.split('/').pop()?.replace(/^\d+_/, '') ||
                  a.storage_path,
              );
            } catch {
              return a.storage_path;
            }
          })(),
        path: a.storage_path,
        url: a.file_url,
        type_id: a.attachment_type_id,
      }));
      setFiles((p) => [...p, ...newFiles]);
      message.success('Файлы загружены');
    } catch (err: any) {
      message.error(err.message);
    }
  };

  const handleDelete = async (id: number, path: string) => {
    try {
      await supabase.storage.from('attachments').remove([path]);
      await supabase.from('attachments').delete().eq('id', id);
      const updatedIds = (caseData.attachment_ids || []).filter((a) => a !== id);
      await updateCaseMutation.mutateAsync({
        id: Number(caseData.id),
        updates: { attachment_ids: updatedIds },
      });
      setFiles((p) => p.filter((f) => f.id !== id));
      message.success('Файл удалён');
    } catch (err: any) {
      message.error(err.message);
    }
  };

  const setType = async (idx: number, val: number | null) => {
    const file = files[idx];
    setFiles((p) => p.map((f, i) => (i === idx ? { ...f, type_id: val } : f)));
    try {
      await supabase
        .from('attachments')
        .update({ attachment_type_id: val })
        .eq('id', file.id);
    } catch (err: any) {
      message.error(err.message);
    }
  };

  return (
    <div>
      <FileDropZone onFiles={handleUpload} />
      {files.map((f, i) => (
        <Row key={f.id} gutter={8} align="middle" style={{ marginTop: 8 }}>
          <Col flex="auto">
            <a href={f.url} target="_blank" rel="noopener noreferrer">
              {f.name}
            </a>
          </Col>
          <Col flex="160px">
            <Select
              style={{ width: '100%' }}
              placeholder="Тип файла"
              value={f.type_id ?? undefined}
              onChange={(v) => setType(i, v)}
              allowClear
            >
              {attachmentTypes.map((t) => (
                <Select.Option key={t.id} value={t.id}>
                  {t.name}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col>
            <Button type="text" danger size="small" onClick={() => handleDelete(f.id, f.path)}>
              Удалить
            </Button>
          </Col>
        </Row>
      ))}
    </div>
  );
}

interface AddPersonModalProps {
  open: boolean;
  onClose: () => void;
  unitId: number | null;
  onSelect: (id: number) => void;
  initialData?: any | null;
}

function AddPersonModal({ open, onClose, unitId, onSelect, initialData = null }: AddPersonModalProps) {
  const [form] = Form.useForm();
  const addPersonMutation = useAddPerson();
  const updatePersonMutation = useUpdatePerson();
  const isEdit = !!initialData?.id;

  useEffect(() => {
    if (isEdit) {
      form.setFieldsValue(initialData);
    } else {
      form.resetFields();
    }
  }, [isEdit, initialData, form]);

  const handleFinish = (values: any) => {
    const action = isEdit
      ? updatePersonMutation.mutateAsync({ id: initialData.id, updates: values })
      : addPersonMutation.mutateAsync(values);
    action
      .then(async (person: any) => {
        if (unitId && !isEdit) {
          await supabase.from('unit_persons').insert({ unit_id: unitId, person_id: person.id });
        }
        message.success(isEdit ? 'Физлицо обновлено' : 'Физлицо добавлено');
        onSelect(person.id);
        form.resetFields();
        onClose();
      })
      .catch((e: any) => message.error(e.message));
  };

  return (
    <Modal open={open} onCancel={onClose} onOk={() => form.submit()} title={isEdit ? 'Редактировать физлицо' : 'Новое физлицо'}>
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item name="full_name" label="ФИО" rules={[{ required: true, message: 'Укажите ФИО' }]}>
          <Input />
        </Form.Item>
        <Form.Item name="passport_series" label="Серия паспорта">
          <Input maxLength={4} />
        </Form.Item>
        <Form.Item name="passport_number" label="Номер паспорта">
          <Input maxLength={6} />
        </Form.Item>
        <Form.Item
          name="phone"
          label="Телефон"
          getValueFromEvent={(e) => formatPhone(e.target.value)}
        >
          <Input placeholder="+7 (9xx) xxx-xx-xx" />
        </Form.Item>
        <Form.Item name="email" label="Email">
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
}


interface ContractorModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (id: number) => void;
  initialData?: any | null;
}

function ContractorModal({ open, onClose, onSelect, initialData = null }: ContractorModalProps) {
  const [form] = Form.useForm();
  const addMutation = useAddContractor();
  const updateMutation = useUpdateContractor();
  const isEdit = !!initialData?.id;

  useEffect(() => {
    if (isEdit) {
      form.setFieldsValue(initialData);
    } else {
      form.resetFields();
    }
  }, [isEdit, initialData, form]);

  const finish = (values: any) => {
    const action = isEdit
      ? updateMutation.mutateAsync({ id: initialData.id, updates: values })
      : addMutation.mutateAsync(values);
    action
      .then((res: any) => {
        message.success(isEdit ? 'Контрагент обновлён' : 'Контрагент создан');
        onSelect(res.id);
        onClose();
      })
      .catch((e: any) => message.error(e.message));
  };

  return (
    <Modal open={open} onCancel={onClose} onOk={() => form.submit()} title={isEdit ? 'Редактировать контрагента' : 'Новый контрагент'}>
      <Form form={form} layout="vertical" onFinish={finish}>
        <Form.Item name="name" label="Название" rules={[{ required: true, message: 'Укажите название' }]}> 
          <Input />
        </Form.Item>
        <Form.Item
          name="inn"
          label="ИНН"
          rules={[
            { required: true, message: 'Укажите ИНН' },
            { pattern: /^\d{10}$|^\d{12}$/, message: 'ИНН должен содержать 10 или 12 цифр' },
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="phone"
          label="Телефон"
          getValueFromEvent={(e) => formatPhone(e.target.value)}
        >
          <Input placeholder="+7 (9xx) xxx-xx-xx" />
        </Form.Item>
        <Form.Item name="email" label="Email"> 
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
}
