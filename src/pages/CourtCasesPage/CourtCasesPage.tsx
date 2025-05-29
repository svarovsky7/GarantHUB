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
import type { CourtCase, Defect } from '@/shared/types/courtCase';
import { useProjects } from '@/entities/project';
import { useUnitsByProject, useUnitsByIds } from '@/entities/unit';
import { useContractors } from '@/entities/contractor';
import { useUsers } from '@/entities/user';
import { useLitigationStages } from '@/entities/litigationStage';
import { usePersons, useAddPerson } from '@/entities/person';
import { PlusOutlined } from '@ant-design/icons';
import {
  useCourtCases,
  useAddCourtCase,
  useDeleteCourtCase,
  useCaseDefects,
  useAddDefect,
  useDeleteDefect,
} from '@/entities/courtCase';
import { useAttachmentTypes } from '@/entities/attachmentType';
import { uploadCaseAttachment } from '@/entities/attachment';
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
  const [tab, setTab] = useState('defects');

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
  const { data: personsList = [] } = usePersons();
  const [addPersonOpen, setAddPersonOpen] = useState(false);
  const { data: attachmentTypes = [] } = useAttachmentTypes();
  const [caseFiles, setCaseFiles] = useState<{ file: File; type_id: number | null }[]>([]);

  const unitIds = React.useMemo(
    () => Array.from(new Set(cases.map((c) => c.unit_id).filter(Boolean))),
    [cases],
  );
  const { data: caseUnits = [] } = useUnitsByIds(unitIds);

  const { data: projectPersons = [], isPending: personsLoading } = useQuery({
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

  const handleCaseFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const arr = Array.from(e.target.files || []).map((f) => ({ file: f, type_id: null }));
    setCaseFiles((p) => [...p, ...arr]);
    e.target.value = '';
  };

  const setCaseFileType = (idx: number, val: number | null) =>
    setCaseFiles((p) => p.map((f, i) => (i === idx ? { ...f, type_id: val } : f)));

  const removeCaseFile = (idx: number) =>
    setCaseFiles((p) => p.filter((_, i) => i !== idx));

  const handleAddCase = async (values: any) => {
    try {
      await addCaseMutation.mutateAsync({
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
      } as any);

      if (caseFiles.length && values.project_id && values.unit_id) {
        await Promise.all(
          caseFiles.map(({ file }) =>
            uploadCaseAttachment(file, values.project_id, values.unit_id),
          ),
        );
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
    projectObject: caseUnits.find((u) => u.id === c.unit_id)?.name ?? '',
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
                  onClick={() => setAddPersonOpen(true)}
                />
              </Space.Compact>
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
        <Row gutter={16}>
          <Col span={24}>
            <input type="file" multiple onChange={handleCaseFiles} />
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
        open={addPersonOpen}
        onClose={() => setAddPersonOpen(false)}
        unitId={Form.useWatch('unit_id', form)}
        onSelect={(id) => form.setFieldValue('plaintiff_id', id)}
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
    caseData && caseData.unit_id ? [caseData.unit_id] : [],
  );
  const addDefectMutation = useAddDefect();
  const deleteDefectMutation = useDeleteDefect();


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
    (caseData as any)?.projectObject || unitInfo[0]?.name || caseData?.unit_id;

  return (
    <Modal open={open} onCancel={onClose} width="80%" footer={null} title={caseData ? `Дело № ${caseData.number}` : ''}>
      {caseData && (
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
                  {caseData.fix_start_date
                    ? dayjs(caseData.fix_start_date).format('DD.MM.YYYY')
                    : 'Не указано'}
                </div>
              </div>
            </Col>
            <Col span={8}>
              <div>
                <strong>Дата завершения устранения</strong>
                <div>
                  {caseData.fix_end_date
                    ? dayjs(caseData.fix_end_date).format('DD.MM.YYYY')
                    : 'Не указано'}
                </div>
              </div>
            </Col>
            <Col span={24}>
              <div>
                <strong>Описание</strong>
                <div>{caseData.description || 'Нет описания'}</div>
              </div>
            </Col>
          </Row>
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
  const [files, setFiles] = useState<{
    name: string;
    path: string;
    url: string;
    type_id: number | null;
  }[]>([]);

  const storageKey = React.useMemo(
    () => `case_file_types_${caseData.id}`,
    [caseData.id],
  );

  const loadFiles = async () => {
    const prefix = `Case/${caseData.project_id}/${caseData.unit_id}`;
    const { data, error } = await supabase.storage.from('attachments').list(prefix);
    if (error) return message.error(error.message);
    const typeMap: Record<string, number> = JSON.parse(
      localStorage.getItem(storageKey) || '{}',
    );
    const arr = (data || []).map((f) => {
      const path = `${prefix}/${f.name}`;
      const { data: pub } = supabase.storage.from('attachments').getPublicUrl(path);
      return {
        name: f.name,
        path,
        url: pub.publicUrl,
        type_id: typeMap[path] ?? null,
      };
    });
    setFiles(arr);
  };

  useEffect(() => {
    loadFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseData.id]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fls = Array.from(e.target.files || []);
    try {
      const uploaded = await Promise.all(
        fls.map((f) => uploadCaseAttachment(f, caseData.project_id, caseData.unit_id)),
      );
      const typeMap: Record<string, number> = JSON.parse(
        localStorage.getItem(storageKey) || '{}',
      );
      const newFiles = uploaded.map((res, idx) => {
        const obj = {
          name: fls[idx].name,
          path: res.path,
          url: res.url,
          type_id: null as number | null,
        };
        typeMap[res.path] = obj.type_id as any;
        return obj;
      });
      localStorage.setItem(storageKey, JSON.stringify(typeMap));
      setFiles((p) => [...p, ...newFiles]);
      message.success('Файлы загружены');
    } catch (err: any) {
      message.error(err.message);
    }
    e.target.value = '';
  };

  const handleDelete = async (path: string) => {
    await supabase.storage.from('attachments').remove([path]);
    const typeMap: Record<string, number> = JSON.parse(
      localStorage.getItem(storageKey) || '{}',
    );
    delete typeMap[path];
    localStorage.setItem(storageKey, JSON.stringify(typeMap));
    setFiles((p) => p.filter((f) => f.path !== path));
    message.success('Файл удалён');
  };

  const setType = (idx: number, val: number | null) => {
    setFiles((p) => {
      const updated = p.map((f, i) => (i === idx ? { ...f, type_id: val } : f));
      const map: Record<string, number> = {};
      updated.forEach((f) => {
        if (f.type_id != null) map[f.path] = f.type_id;
      });
      localStorage.setItem(storageKey, JSON.stringify(map));
      return updated;
    });
  };

  return (
    <div>
      <input type="file" multiple onChange={handleUpload} />
      {files.map((f, i) => (
        <Row key={f.path} gutter={8} align="middle" style={{ marginTop: 8 }}>
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
            <Button type="text" danger size="small" onClick={() => handleDelete(f.path)}>
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
}

function AddPersonModal({ open, onClose, unitId, onSelect }: AddPersonModalProps) {
  const [form] = Form.useForm();
  const addPersonMutation = useAddPerson();
  const handleFinish = (values: any) => {
    addPersonMutation.mutate(values, {
      onSuccess: async (person: any) => {
        if (unitId) {
          await supabase.from('unit_persons').insert({
            unit_id: unitId,
            person_id: person.id,
          });
        }
        message.success('Физлицо добавлено');
        onSelect(person.id);
        form.resetFields();
        onClose();
      },
      onError: (e: any) => message.error(e.message),
    });
  };
  return (
    <Modal open={open} onCancel={onClose} onOk={() => form.submit()} title="Новое физлицо">
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item name="full_name" label="ФИО" rules={[{ required: true, message: 'Укажите ФИО' }]}> 
          <Input />
        </Form.Item>
        <Form.Item name="phone" label="Телефон">
          <Input />
        </Form.Item>
        <Form.Item name="email" label="Email">
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
}

