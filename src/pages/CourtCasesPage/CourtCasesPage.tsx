import React, { useState, useEffect } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/ru';
import { ConfigProvider } from 'antd';
import ruRU from 'antd/locale/ru_RU';

dayjs.locale('ru');
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
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { CourtCase, Letter, Defect } from '@/shared/types/courtCase';
import { useProjects } from '@/entities/project';
import { useUnitsByProject } from '@/entities/unit';
import { useContractors } from '@/entities/contractor';
import { useUsers } from '@/entities/user';
import { useLitigationStages } from '@/entities/litigationStage';
import {
  useCourtCases,
  useAddCourtCase,
  useDeleteCourtCase,
  useCaseLetters,
  useAddLetter,
  useDeleteLetter,
  useCaseDefects,
  useAddDefect,
  useDeleteDefect,
} from '@/entities/courtCase';
import { useAttachmentTypes } from '@/entities/attachmentType';
import { supabase } from '@/shared/api/supabaseClient';
import { useQuery } from '@tanstack/react-query';

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

  const [filters, setFilters] = useState<Filters>({});
  const [dialogCase, setDialogCase] = useState<CourtCase | null>(null);
  const [tab, setTab] = useState('letters');

  const [form] = Form.useForm();
  const projectId = Form.useWatch('project_id', form);

  useEffect(() => {
    form.setFieldValue('unit_id', null);
  }, [projectId, form]);

  const { data: projects = [] } = useProjects();
  const { data: units = [], isPending: unitsLoading } = useUnitsByProject(projectId);
  const { data: contractors = [], isPending: contractorsLoading } = useContractors();
  const { data: users = [], isPending: usersLoading } = useUsers();
  const { data: stages = [], isPending: stagesLoading } = useLitigationStages();

  const { data: persons = [], isPending: personsLoading } = useQuery({
    queryKey: ['persons', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('persons')
        .select('id, full_name')
        .eq('project_id', projectId)
        .order('full_name');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!projectId,
  });

  const handleAddCase = async (values: any) => {
    addCaseMutation.mutate(
      {
        project_id: values.project_id,
        unit_id: values.unit_id || null,
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
      } as any,
      {
        onSuccess: () => {
          form.resetFields();
          message.success('Дело успешно добавлено!');
        },
        onError: (e: any) => message.error(e.message),
      },
    );
  };

  const deleteCase = (id: number) => {
    deleteCaseMutation.mutate(id, {
      onSuccess: () => message.success('Дело удалено!'),
      onError: (e: any) => message.error(e.message),
    });
  };

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
      title: 'Статус',
      dataIndex: 'status',
      render: (s: number) => <Tag color="blue">{stages.find((st) => st.id === s)?.name}</Tag>,
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: any, record) => (
        <Space>
          <Button size="small" onClick={() => { setDialogCase(record); setTab('letters'); }}>
            Просмотр
          </Button>
          <Button size="small" danger onClick={() => deleteCase(Number(record.id))}>
            Удалить
          </Button>
        </Space>
      ),
    },
  ];

  const filteredCases = cases.filter((c: any) => {
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
            <Form.Item name="project_id" label="Проект" rules={[{ required: true, message: 'Выберите проект' }]}>
              <Select options={projects.map((p) => ({ value: p.id, label: p.name }))} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="unit_id" label="Объект" rules={[{ required: true, message: 'Выберите объект' }]}>
              <Select
                loading={unitsLoading}
                options={units.map((u) => ({ value: u.id, label: u.name }))}
                disabled={!projectId}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="plaintiff_id" label="Истец" rules={[{ required: true, message: 'Выберите истца' }]}>
              <Select
                loading={personsLoading}
                options={persons.map((p) => ({ value: p.id, label: p.full_name }))}
                disabled={!projectId}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="defendant_id" label="Ответчик" rules={[{ required: true, message: 'Выберите ответчика' }]}>
              <Select
                loading={contractorsLoading}
                options={contractors.map((c) => ({ value: c.id, label: c.name }))}
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="responsible_lawyer_id" label="Ответственный юрист" rules={[{ required: true, message: 'Выберите юриста' }]}>
              <Select
                loading={usersLoading}
                options={users.map((u) => ({ value: u.id, label: u.name }))}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="status" label="Статус" rules={[{ required: true, message: 'Выберите статус' }]}>
              <Select loading={stagesLoading} options={stages.map((s) => ({ value: s.id, label: s.name }))} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="fix_start_date" label="Дата начала устранения">
              <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="fix_end_date" label="Дата завершения устранения">
              <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="description" label="Описание">
              <Input.TextArea rows={1} />
            </Form.Item>
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
  const { data: letters = [] } = useCaseLetters(caseData ? Number(caseData.id) : 0);
  const { data: defects = [] } = useCaseDefects(caseData ? Number(caseData.id) : 0);
  const addLetterMutation = useAddLetter();
  const deleteLetterMutation = useDeleteLetter();
  const addDefectMutation = useAddDefect();
  const deleteDefectMutation = useDeleteDefect();

  const addLetter = (letter: Omit<Letter, 'id' | 'case_id'>) => {
    if (!caseData) return;
    addLetterMutation.mutate(
      { ...letter, case_id: Number(caseData.id) },
      {
        onError: (e: any) => message.error(e.message),
      },
    );
  };

  const deleteLetter = (id: number) => {
    if (!caseData) return;
    deleteLetterMutation.mutate(
      { id, case_id: Number(caseData.id) },
      {
        onError: (e: any) => message.error(e.message),
      },
    );
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

  return (
    <Modal open={open} onCancel={onClose} width="80%" footer={null} title={caseData ? `Дело № ${caseData.number}` : ''}>
      {caseData && (
        <>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={8}>
              <div>
                <small>Номер дела</small>
                <div>{caseData.number}</div>
              </div>
            </Col>
            <Col span={8}>
              <div>
                <small>Дата открытия</small>
                <div>{dayjs(caseData.date).format('DD.MM.YYYY')}</div>
              </div>
            </Col>
            <Col span={8}>
              <div>
                <small>Объект</small>
                <div>{(caseData as any).projectObject}</div>
              </div>
            </Col>
            <Col span={8}>
              <div>
                <small>Истец</small>
                <div>{(caseData as any).plaintiff}</div>
              </div>
            </Col>
            <Col span={8}>
              <div>
                <small>Ответчик</small>
                <div>{(caseData as any).defendant}</div>
              </div>
            </Col>
            <Col span={8}>
              <div>
                <small>Ответственный юрист</small>
                <div>{(caseData as any).responsibleLawyer}</div>
              </div>
            </Col>
            <Col span={8}>
              <div>
                <small>Статус</small>
                <div>{(caseData as any).status}</div>
              </div>
            </Col>
            <Col span={8}>
              <div>
                <small>Дата начала устранения</small>
                <div>
                  {(caseData as any).remediationStartDate
                    ? dayjs((caseData as any).remediationStartDate).format('DD.MM.YYYY')
                    : 'Не указано'}
                </div>
              </div>
            </Col>
            <Col span={8}>
              <div>
                <small>Дата завершения устранения</small>
                <div>
                  {(caseData as any).remediationEndDate
                    ? dayjs((caseData as any).remediationEndDate).format('DD.MM.YYYY')
                    : 'Не указано'}
                </div>
              </div>
            </Col>
            <Col span={24}>
              <div>
                <small>Описание</small>
                <div>{caseData.description || 'Нет описания'}</div>
              </div>
            </Col>
          </Row>
          <Tabs activeKey={tab} onChange={onTabChange} style={{ marginBottom: 16 }}>
            <Tabs.TabPane tab="Письма" key="letters">
              <LettersTab letters={letters} onAdd={addLetter} onDelete={deleteLetter} />
            </Tabs.TabPane>
            <Tabs.TabPane tab="Недостатки" key="defects">
              <DefectsTab defects={defects} onAdd={addDefect} onDelete={deleteDefect} />
            </Tabs.TabPane>
          </Tabs>
        </>
      )}
    </Modal>
  );
}

interface LettersProps {
  letters: Letter[];
  onAdd: (letter: Omit<Letter, 'id' | 'case_id'>) => void;
  onDelete: (id: number) => void;
}

function LettersTab({ letters, onAdd, onDelete }: LettersProps) {
  const [form] = Form.useForm();
  const { data: attachmentTypes = [] } = useAttachmentTypes();
  const [files, setFiles] = useState<{ file: File; type_id: number | null }[]>([]);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arr = Array.from(e.target.files || []).map((f) => ({ file: f, type_id: null }));
    setFiles((p) => [...p, ...arr]);
    e.target.value = '';
  };

  const setType = (idx: number, val: number | null) =>
    setFiles((p) => p.map((f, i) => (i === idx ? { ...f, type_id: val } : f)));

  const removeFile = (idx: number) => setFiles((p) => p.filter((_, i) => i !== idx));

  const add = (values: any) => {
    if (!values.number || !values.date || !values.content) return;
    onAdd({
      number: values.number,
      date: (values.date as Dayjs).format('YYYY-MM-DD'),
      content: values.content,
      attachments: files,
    });
    form.resetFields();
    setFiles([]);
  };

  const columns: ColumnsType<Letter> = [
    { title: '№ письма', dataIndex: 'number', width: 120 },
    {
      title: 'Дата',
      dataIndex: 'date',
      width: 120,
      render: (v: string) => dayjs(v).format('DD.MM.YYYY'),
    },
    { title: 'Содержание', dataIndex: 'content', width: '60%' },
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

  return (
    <>
      <Form form={form} layout="vertical" onFinish={add} style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="number" label="Номер письма">
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="date" label="Дата">
              <DatePicker format="DD.MM.YYYY" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item>
              <Button type="primary" htmlType="submit">
                Добавить
              </Button>
            </Form.Item>
          </Col>
        <Col span={24}>
          <Form.Item name="content" label="Содержание">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Col>
        <Col span={24}>
          <input type="file" multiple onChange={handleFiles} />
          {files.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', marginTop: 4 }}>
              <span style={{ marginRight: 8 }}>{f.file.name}</span>
              <Select
                style={{ width: 160 }}
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
              <Button type="text" danger onClick={() => removeFile(i)}>
                Удалить
              </Button>
            </div>
          ))}
        </Col>
      </Row>
    </Form>
      <Table rowKey="id" columns={columns} dataSource={letters} pagination={false} size="middle" />
    </>
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
