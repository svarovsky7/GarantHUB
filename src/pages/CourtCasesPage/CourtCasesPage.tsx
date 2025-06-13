import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import dayjs, { Dayjs } from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import 'dayjs/locale/ru';
import { ConfigProvider } from 'antd';
import ruRU from 'antd/locale/ru_RU';

dayjs.locale('ru');
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);
import {
  Row,
  Col,
  Form,
  Input,
  DatePicker,
  Select,
  Button,
  Card,
  Table,
  Tag,
  Space,
  Modal,
  Popconfirm,
  Tooltip,
  Radio,
  Switch,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { CourtCase, Defect } from '@/shared/types/courtCase';
import type { Project } from '@/shared/types/project';
import { useProjects } from '@/entities/project';
import { useUnitsByProject, useUnitsByIds } from '@/entities/unit';
import {
  useContractors,
  useAddContractor,
  useUpdateContractor,
  useDeleteContractor,
} from '@/entities/contractor';
import { useUsers } from '@/entities/user';
import { useLitigationStages } from '@/entities/litigationStage';
import { usePersons, useAddPerson, useUpdatePerson, useDeletePerson } from '@/entities/person';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import { formatPhone } from '@/shared/utils/formatPhone';
import {
  useCourtCases,
  useAddCourtCase,
  useDeleteCourtCase,
  useUpdateCourtCase,
  useLinkCases,
  useUnlinkCase,
} from '@/entities/courtCase';
import { useAttachmentTypes } from '@/entities/attachmentType';
import { addCaseAttachments } from '@/entities/attachment';
import { supabase } from '@/shared/api/supabaseClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useProjectId } from '@/shared/hooks/useProjectId';
import { useAuthStore } from '@/shared/store/authStore';
import { useNotify } from '@/shared/hooks/useNotify';
import FileDropZone from '@/shared/ui/FileDropZone';
import CourtCaseStatusSelect from '@/features/courtCase/CourtCaseStatusSelect';
import CourtCaseClosedSelect from '@/features/courtCase/CourtCaseClosedSelect';
import LinkCasesDialog from '@/features/courtCase/LinkCasesDialog';
import ExportCourtCasesButton from '@/features/courtCase/ExportCourtCasesButton';
import AddCourtCaseFormAntd from '@/features/courtCase/AddCourtCaseFormAntd';
import CourtCasesFilters from '@/widgets/CourtCasesFilters';

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(n);

const LS_KEY = 'courtCasesHideClosed';

type Filters = {
  status?: number;
  projectId?: number;
  objectId?: number;
  number?: string;
  dateRange?: [Dayjs, Dayjs];
  plaintiff?: string;
  defendant?: string;
  fixStartRange?: [Dayjs, Dayjs];
  lawyerId?: string;
  hideClosed?: boolean;
  ids?: number[];
};

export default function CourtCasesPage() {
  const { data: cases = [], isPending: casesLoading } = useCourtCases();
  const addCaseMutation = useAddCourtCase();
  const deleteCaseMutation = useDeleteCourtCase();
  const qc = useQueryClient();
  const updateCaseMutation = useUpdateCourtCase();
  const notify = useNotify();

  const [filters, setFilters] = useState<Filters>(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      return { hideClosed: saved ? JSON.parse(saved) : false };
    } catch {
      return {} as Filters;
    }
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialValues = {
    project_id: searchParams.get('project_id')
      ? Number(searchParams.get('project_id')!)
      : undefined,
    unit_ids: searchParams.get('unit_id')
      ? [Number(searchParams.get('unit_id')!)]
      : undefined,
    responsible_lawyer_id: searchParams.get('responsible_lawyer_id') || undefined,
  };

  const [form] = Form.useForm();
  const projectId = Form.useWatch('project_id', form);
  const globalProjectId = useProjectId();
  const profileId = useAuthStore((s) => s.profile?.id);
  const prevProjectIdRef = useRef<number | null>(null);


  useEffect(() => {
    const p = searchParams.get('project_id');
    const u = searchParams.get('unit_id');
    const r = searchParams.get('responsible_lawyer_id');
    if (p) {
      const num = Number(p);
      form.setFieldValue('project_id', num);
      prevProjectIdRef.current = num;
    }
    if (u) form.setFieldValue('unit_ids', [Number(u)]);
    if (r) form.setFieldValue('responsible_lawyer_id', r);
  }, [searchParams, form]);

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === LS_KEY) {
        try {
          setFilters((f) => ({ ...f, hideClosed: JSON.parse(e.newValue || 'false') }));
        } catch {}
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  useEffect(() => {
    // Сброс выбранных объектов при смене проекта.
    // SearchParams могут проставить project_id и unit_id асинхронно,
    // поэтому проверяем, что оба значения уже заданы.
    const prev = prevProjectIdRef.current;
    if (prev != null && projectId != null && prev !== projectId) {
      form.setFieldValue('unit_ids', []);
    }
    prevProjectIdRef.current = projectId;
  }, [projectId, form]);

  useEffect(() => {
    if (globalProjectId && !form.getFieldValue('project_id')) {
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

  const stageMap = React.useMemo(() => {
    const m: Record<number, string> = {};
    stages.forEach((s) => {
      m[s.id] = s.name;
    });
    return m;
  }, [stages]);
  const deletePersonMutation = useDeletePerson();
  const deleteContractorMutation = useDeleteContractor();
  const [personModal, setPersonModal] = useState<any | null>(null);
  const [contractorModal, setContractorModal] = useState<any | null>(null);
  const [partySelect, setPartySelect] = useState<{
    role: 'plaintiff' | 'defendant';
  } | null>(null);
  const [plaintiffType, setPlaintiffType] = useState<'person' | 'contractor'>(
    'person',
  );
  const [defendantType, setDefendantType] = useState<'person' | 'contractor'>(
    'contractor',
  );
  const [partyRole, setPartyRole] = useState<'plaintiff' | 'defendant' | null>(
    null,
  );
  const { data: attachmentTypes = [] } = useAttachmentTypes();
  const [caseFiles, setCaseFiles] = useState<{ file: File; type_id: number | null }[]>([]);

  const [showAddForm, setShowAddForm] = useState(false);
  const hideOnScroll = useRef(false);

  const linkCases = useLinkCases();
  const unlinkCase = useUnlinkCase();
  const [linkFor, setLinkFor] = useState<CourtCase | null>(null);

  const plaintiffId = Form.useWatch('plaintiff_id', form);
  const defendantId = Form.useWatch('defendant_id', form);

  const unitIds = React.useMemo(
    () => Array.from(new Set(cases.flatMap((c) => c.unit_ids).filter(Boolean))),
    [cases],
  );
  const { data: caseUnits = [] } = useUnitsByIds(unitIds);
  const { data: allUnits = [] } = useQuery({
    queryKey: ['allUnits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('units')
        .select('id, name, project_id');
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60_000,
  });

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
        is_closed: false,
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
      hideOnScroll.current = true;
      notify.success('Дело успешно добавлено!');
    } catch (e: any) {
      notify.error(e.message);
    }
  };

  const deleteCase = (id: number) => {
    deleteCaseMutation.mutate(id, {
      onSuccess: () => notify.success('Дело удалено!'),
      onError: (e: any) => notify.error(e.message),
    });
  };

  const handleUnlink = (id: number) => {
    unlinkCase.mutate(id, {
      onSuccess: () => notify.success('Дело исключено из связи'),
    });
  };

  const handleLink = (ids: string[]) => {
    if (!linkFor) return;
    linkCases.mutate(
      { parentId: String(linkFor.id), childIds: ids },
      {
        onSuccess: () => {
          notify.success('Дела связаны');
          setLinkFor(null);
        },
      },
    );
  };

  const casesData = cases.map((c: any) => ({
    ...c,
    projectName: projects.find((p) => p.id === c.project_id)?.name ?? '',
    projectObject: c.unit_ids
      .map((id: number) => caseUnits.find((u) => u.id === id)?.name)
      .filter(Boolean)
      .join(', '),
    plaintiff:
      personsList.find((p) => p.id === c.plaintiff_id)?.full_name ||
      c.plaintiff,
    defendant:
      contractors.find((d) => d.id === c.defendant_id)?.name ||
      personsList.find((p) => p.id === c.defendant_id)?.full_name ||
      c.defendant,
    responsibleLawyer:
      users.find((u) => u.id === c.responsible_lawyer_id)?.name ?? c.responsibleLawyer,
    daysSinceFixStart: c.fix_start_date
      ? dayjs(c.fix_end_date ?? dayjs()).diff(dayjs(c.fix_start_date), 'day')
      : null,
  }));

  const idOptions = React.useMemo(
    () =>
      Array.from(new Set(cases.map((c) => c.id))).map((id) => ({
        value: id,
        label: String(id),
      })),
    [cases],
  );

  useEffect(() => {
    const ids = searchParams.get('ids');
    if (ids) {
      const arr = ids
        .split(',')
        .map((s) => Number(s))
        .filter(Boolean);
      const valid = arr.filter((id) => cases.some((c) => c.id === id));
      setFilters((f) => ({ ...f, ids: valid }));
    }
  }, [searchParams, cases]);

  const columns: ColumnsType<CourtCase & any> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      sorter: (a, b) => a.id - b.id,
      render: (id: number) => (
        <span style={{ whiteSpace: 'nowrap' }}>{id}</span>
      ),
    },
    {
      title: 'Проект',
      dataIndex: 'projectName',
      sorter: (a, b) => (a.projectName || '').localeCompare(b.projectName || ''),
    },
    {
      title: 'Объект',
      dataIndex: 'projectObject',
      sorter: (a, b) =>
        (a.projectObject || '').localeCompare(b.projectObject || ''),
    },
    {
      title: '№ дела',
      dataIndex: 'number',
      width: 120,
      sorter: (a, b) => a.number.localeCompare(b.number),
    },
    {
      title: 'Дата дела',
      dataIndex: 'date',
      width: 120,
      sorter: (a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf(),
      render: (v: string) => dayjs(v).format('DD.MM.YYYY'),
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      sorter: (a, b) => a.status - b.status,
      render: (_: number, row) => (
        <CourtCaseStatusSelect caseId={row.id} status={row.status} />
      ),
    },
    {
      title: 'Прошло дней с начала устранения',
      dataIndex: 'daysSinceFixStart',
      sorter: (a, b) =>
        (a.daysSinceFixStart ?? 0) - (b.daysSinceFixStart ?? 0),
    },
    {
      title: 'Истец',
      dataIndex: 'plaintiff',
      sorter: (a, b) => (a.plaintiff || '').localeCompare(b.plaintiff || ''),
    },
    {
      title: 'Ответчик',
      dataIndex: 'defendant',
      sorter: (a, b) => (a.defendant || '').localeCompare(b.defendant || ''),
    },
    {
      title: 'Дата начала устранения',
      dataIndex: 'fix_start_date',
      render: (v: string | null) => (v ? dayjs(v).format('DD.MM.YYYY') : ''),
      sorter: (a, b) =>
        dayjs(a.fix_start_date || 0).valueOf() -
        dayjs(b.fix_start_date || 0).valueOf(),
    },
    {
      title: 'Дата завершения устранения',
      dataIndex: 'fix_end_date',
      render: (v: string | null) => (v ? dayjs(v).format('DD.MM.YYYY') : ''),
      sorter: (a, b) =>
        dayjs(a.fix_end_date || 0).valueOf() -
        dayjs(b.fix_end_date || 0).valueOf(),
    },
    {
      title: 'Юрист',
      dataIndex: 'responsibleLawyer',
      sorter: (a, b) =>
        (a.responsibleLawyer || '').localeCompare(b.responsibleLawyer || ''),
    },
    {
      title: 'Дело закрыто',
      dataIndex: 'is_closed',
      sorter: (a, b) => Number(a.is_closed) - Number(b.is_closed),
      render: (_: boolean, row) => (
        <CourtCaseClosedSelect caseId={row.id} isClosed={row.is_closed} />
      ),
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 120,
      render: (_: any, record) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<PlusOutlined />}
            onClick={() => setLinkFor(record)}
          />
          {record.parent_id && (
            <Tooltip title="Исключить из связи">
              <Button
                type="text"
                icon={<LinkOutlined style={{ color: '#c41d7f', textDecoration: 'line-through', fontWeight: 700 }} />}
                onClick={() => handleUnlink(record.id)}
              />
            </Tooltip>
          )}
          <Popconfirm
            title="Удалить дело?"
            okText="Да"
            cancelText="Нет"
            onConfirm={() => deleteCase(Number(record.id))}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const closedStageId = React.useMemo(() => {
    return stages.find((s) => s.name.toLowerCase().includes('закры'))?.id;
  }, [stages]);

  const filteredCases = casesData.filter((c: any) => {
    const idFilter = filters.ids && filters.ids.length ? filters.ids.map(String) : null;
    const matchesStatus = !filters.status || c.status === filters.status;
    const matchesProject = !filters.projectId || c.project_id === filters.projectId;
    const matchesObject = !filters.objectId || c.unit_ids.includes(filters.objectId);
    const matchesNumber =
      !filters.number || c.number.toLowerCase().includes(filters.number.toLowerCase());
    const matchesDate =
      !filters.dateRange ||
      (dayjs(c.date).isSameOrAfter(filters.dateRange[0], 'day') &&
        dayjs(c.date).isSameOrBefore(filters.dateRange[1], 'day'));
    const matchesPlaintiff =
      !filters.plaintiff || c.plaintiff.toLowerCase().includes(filters.plaintiff.toLowerCase());
    const matchesDefendant =
      !filters.defendant || c.defendant.toLowerCase().includes(filters.defendant.toLowerCase());
    const matchesFixStart =
      !filters.fixStartRange ||
      (c.fix_start_date &&
        dayjs(c.fix_start_date).isSameOrAfter(filters.fixStartRange[0], 'day') &&
        dayjs(c.fix_start_date).isSameOrBefore(filters.fixStartRange[1], 'day'));
    const matchesLawyer = !filters.lawyerId || String(c.responsible_lawyer_id) === filters.lawyerId;
    const matchesClosed =
      !filters.hideClosed ||
      (closedStageId ? c.status !== closedStageId : !c.is_closed);
    const matchesIds = !idFilter || idFilter.includes(String(c.id));
    return (
      matchesIds &&
      matchesStatus &&
      matchesProject &&
      matchesObject &&
      matchesNumber &&
      matchesDate &&
      matchesPlaintiff &&
      matchesDefendant &&
      matchesFixStart &&
      matchesLawyer &&
      matchesClosed
    );
  });

  const treeData = React.useMemo(() => {
    const map = new Map<number, any>();
    const roots: any[] = [];
    filteredCases.forEach((c) => {
      const row = { ...c, key: c.id, children: [] as any[] };
      map.set(c.id, row);
    });
    filteredCases.forEach((c) => {
      const row = map.get(c.id);
      if (c.parent_id && map.has(c.parent_id)) {
        map.get(c.parent_id).children.push(row);
      } else {
        roots.push(row);
      }
    });
    map.forEach((row) => {
      if (!row.children.length) row.children = undefined;
    });
    return roots;
  }, [filteredCases]);

  const rowClassName = (record: any) => {
    if (!record.parent_id) return 'main-case-row';
    return 'child-case-row';
  };

  const total = cases.length;
  const closedCount = React.useMemo(
    () =>
      cases.filter((c) =>
        closedStageId ? c.status === closedStageId : c.is_closed,
      ).length,
    [cases, closedStageId],
  );
  const openCount = total - closedCount;
  const readyToExport = filteredCases.length;

  const resetFilters = () => setFilters((f) => ({ hideClosed: f.hideClosed }));

  return (
    <ConfigProvider locale={ruRU}>
      <>
        <Button
          type="primary"
          onClick={() => setShowAddForm((p) => !p)}
          style={{ marginTop: 16 }}
        >
          {showAddForm ? 'Скрыть форму' : 'Добавить дело'}
        </Button>
        {showAddForm && (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleAddCase}
            autoComplete="off"
            style={{ marginTop: 16 }}
          >
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
              <Space direction="vertical" style={{ width: '100%' }}>
                <Radio.Group
                  value={plaintiffType}
                  onChange={(e) => setPlaintiffType(e.target.value)}
                >
                  <Radio.Button value="person">Физлицо</Radio.Button>
                  <Radio.Button value="contractor">Контрагент</Radio.Button>
                </Radio.Group>
                <Space.Compact style={{ width: '100%' }}>
                  <Form.Item
                    name="plaintiff_id"
                    noStyle
                    rules={[{ required: true, message: 'Выберите истца' }]}
                  >
                    {plaintiffType === 'person' ? (
                      <Select
                        loading={personsLoading}
                        options={projectPersons.map((p) => ({ value: p.id, label: p.full_name }))}
                        disabled={!projectId}
                      />
                    ) : (
                      <Select
                        loading={contractorsLoading}
                        options={contractors.map((c) => ({ value: c.id, label: c.name }))}
                      />
                    )}
                  </Form.Item>
                  <Button
                    icon={<PlusOutlined />}
                    onClick={() => setPartySelect({ role: 'plaintiff' })}
                  />
                  <Button
                    icon={<EditOutlined />}
                    disabled={!plaintiffId}
                    onClick={() => {
                      const id = form.getFieldValue('plaintiff_id');
                      const data =
                        plaintiffType === 'person'
                          ? personsList.find((p) => p.id === id) || null
                          : contractors.find((c) => c.id === id) || null;
                      plaintiffType === 'person'
                        ? setPersonModal(data)
                        : setContractorModal(data);
                    }}
                  />
                  <Popconfirm
                    title={plaintiffType === 'person' ? 'Удалить физлицо?' : 'Удалить контрагента?'}
                    okText="Да"
                    cancelText="Нет"
                    onConfirm={() => {
                      const id = form.getFieldValue('plaintiff_id');
                      if (!id) return;
                      if (plaintiffType === 'person') {
                        deletePersonMutation.mutate(id, {
                          onSuccess: () => {
                            notify.success('Физлицо удалено');
                            form.setFieldValue('plaintiff_id', null);
                            qc.invalidateQueries({ queryKey: ['projectPersons'] });
                          },
                          onError: (e: any) => notify.error(e.message),
                        });
                      } else {
                        deleteContractorMutation.mutate(id, {
                          onSuccess: () => {
                            notify.success('Контрагент удалён');
                            form.setFieldValue('plaintiff_id', null);
                          },
                          onError: (e: any) => notify.error(e.message),
                        });
                      }
                    }}
                    disabled={!plaintiffId}
                  >
                    <Button
                      icon={<DeleteOutlined />}
                      disabled={!plaintiffId}
                    />
                  </Popconfirm>
                </Space.Compact>
              </Space>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Ответчик" style={{ marginBottom: 0 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Radio.Group
                  value={defendantType}
                  onChange={(e) => setDefendantType(e.target.value)}
                >
                  <Radio.Button value="person">Физлицо</Radio.Button>
                  <Radio.Button value="contractor">Контрагент</Radio.Button>
                </Radio.Group>
                <Space.Compact style={{ width: '100%' }}>
                  <Form.Item
                    name="defendant_id"
                    noStyle
                    rules={[{ required: true, message: 'Выберите ответчика' }]}
                  >
                    {defendantType === 'person' ? (
                      <Select
                        loading={personsLoading}
                        options={projectPersons.map((p) => ({ value: p.id, label: p.full_name }))}
                      />
                    ) : (
                      <Select
                        loading={contractorsLoading}
                        options={contractors.map((c) => ({ value: c.id, label: c.name }))}
                      />
                    )}
                  </Form.Item>
                  <Button
                    icon={<PlusOutlined />}
                    onClick={() => setPartySelect({ role: 'defendant' })}
                  />
                  <Button
                    icon={<EditOutlined />}
                    disabled={!defendantId}
                    onClick={() => {
                      const id = form.getFieldValue('defendant_id');
                      const data =
                        defendantType === 'person'
                          ? personsList.find((p) => p.id === id) || null
                          : contractors.find((c) => c.id === id) || null;
                      defendantType === 'person'
                        ? setPersonModal(data)
                        : setContractorModal(data);
                    }}
                  />
                  <Popconfirm
                    title={defendantType === 'person' ? 'Удалить физлицо?' : 'Удалить контрагента?'}
                    okText="Да"
                    cancelText="Нет"
                    onConfirm={() => {
                      const id = form.getFieldValue('defendant_id');
                      if (!id) return;
                      if (defendantType === 'person') {
                        deletePersonMutation.mutate(id, {
                          onSuccess: () => {
                            notify.success('Физлицо удалено');
                            form.setFieldValue('defendant_id', null);
                            qc.invalidateQueries({ queryKey: ['projectPersons'] });
                          },
                          onError: (e: any) => notify.error(e.message),
                        });
                      } else {
                        deleteContractorMutation.mutate(id, {
                          onSuccess: () => {
                            notify.success('Контрагент удалён');
                            form.setFieldValue('defendant_id', null);
                          },
                          onError: (e: any) => notify.error(e.message),
                        });
                      }
                    }}
                    disabled={!defendantId}
                  >
                    <Button icon={<DeleteOutlined />} disabled={!defendantId} />
                  </Popconfirm>
                </Space.Compact>
              </Space>
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
        )}

      <LinkCasesDialog
        open={!!linkFor}
        parent={linkFor}
        cases={casesData}
        onClose={() => setLinkFor(null)}
        onSubmit={handleLink}
      />

      <div
        style={{ marginTop: 24 }}
        onWheel={() => {
          if (hideOnScroll.current) {
            setShowAddForm(false);
            hideOnScroll.current = false;
          }
        }}
      >
      <Card style={{ marginBottom: 24 }}>
        <Form layout="vertical" className="filter-grid">
          <Form.Item label="ID">
            <Select
              mode="multiple"
              allowClear
              placeholder="ID"
              options={idOptions}
              value={filters.ids}
              onChange={(v) => setFilters((f) => ({ ...f, ids: v }))}
            />
          </Form.Item>
          <Form.Item label="Проект">
            <Select
              allowClear
              placeholder="Проект"
              options={projects.map((p) => ({ value: p.id, label: p.name }))}
              value={filters.projectId}
              onChange={(v) => setFilters((f) => ({ ...f, projectId: v, objectId: undefined }))}
            />
          </Form.Item>
          <Form.Item label="Объект">
            <Select
              allowClear
              placeholder="Объект"
              options={allUnits

                .filter((u) => !filters.projectId || u.project_id === filters.projectId)
                .map((u) => ({ value: u.id, label: u.name }))}
              value={filters.objectId}
              onChange={(v) => setFilters((f) => ({ ...f, objectId: v }))}
              disabled={!filters.projectId}
            />
          </Form.Item>
          <Form.Item label="Номер дела">
            <Input
              placeholder="Номер"
              value={filters.number}
              onChange={(e) => setFilters((f) => ({ ...f, number: e.target.value }))}
            />
          </Form.Item>
          <Form.Item label="Дата дела">
            <DatePicker.RangePicker
              allowClear
              style={{ width: '100%' }}
              format="DD.MM.YYYY"
              value={filters.dateRange as any}
              onChange={(v) => setFilters((f) => ({ ...f, dateRange: v as any }))}
            />
          </Form.Item>
          <Form.Item label="Статус">
            <Select
              allowClear
              placeholder="Статус"
              options={stages.map((s) => ({ value: s.id, label: s.name }))}
              value={filters.status}
              onChange={(v) => setFilters((f) => ({ ...f, status: v }))}
            />
          </Form.Item>
          <Form.Item label="Истец">
            <Input
              placeholder="Истец"
              value={filters.plaintiff}
              onChange={(e) => setFilters((f) => ({ ...f, plaintiff: e.target.value }))}
            />
          </Form.Item>
          <Form.Item label="Ответчик">
            <Input
              placeholder="Ответчик"
              value={filters.defendant}
              onChange={(e) => setFilters((f) => ({ ...f, defendant: e.target.value }))}
            />
          </Form.Item>
          <Form.Item label="Период начала устранения">
            <DatePicker.RangePicker
              allowClear
              style={{ width: '100%' }}
              format="DD.MM.YYYY"
              value={filters.fixStartRange as any}
              onChange={(v) => setFilters((f) => ({ ...f, fixStartRange: v as any }))}
            />
          </Form.Item>
          <Form.Item label="Юрист">
            <Select
              allowClear
              showSearch
              placeholder="Юрист"
              options={users.map((u) => ({ value: u.id, label: u.name }))}
              value={filters.lawyerId}
              onChange={(v) => setFilters((f) => ({ ...f, lawyerId: v }))}
            />
          </Form.Item>
          <Form.Item label="Скрыть закрытые" valuePropName="checked">
            <Switch
              checked={!!filters.hideClosed}
              onChange={(checked) => {
                setFilters((f) => ({ ...f, hideClosed: checked }));
                try {
                  localStorage.setItem(LS_KEY, JSON.stringify(checked));
                } catch {}
              }}
            />
          </Form.Item>

          <Form.Item>
            <Button onClick={resetFilters} block>
              Сбросить фильтры
            </Button>
          </Form.Item>

        </Form>
      </Card>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={treeData}
        loading={casesLoading}
        pagination={{ pageSize: 25, showSizeChanger: true }}
        size="middle"
        expandable={{
          expandRowByClick: true,
          defaultExpandAllRows: true,
          indentSize: 24,
        }}
        rowClassName={rowClassName}
      />

      <Typography.Text style={{ display: 'block', marginTop: 8 }}>
        Всего дел: {total}, из них закрытых: {closedCount} и не закрытых: {openCount}
      </Typography.Text>
      <Typography.Text style={{ display: 'block', marginTop: 4 }}>
        Готовых дел к выгрузке: {readyToExport}
      </Typography.Text>
      <div style={{ marginTop: 8 }}>
        <ExportCourtCasesButton cases={filteredCases} stages={stageMap} />
      </div>

      </div>

      <Modal
        open={!!partySelect}
        onCancel={() => setPartySelect(null)}
        footer={null}
        title="Кого добавить?"
      >
        <Space>
          <Button
            onClick={() => {
              setPartyRole(partySelect!.role);
              setPersonModal({});
              setPartySelect(null);
            }}
          >
            Физлицо
          </Button>
          <Button
            onClick={() => {
              setPartyRole(partySelect!.role);
              setContractorModal({});
              setPartySelect(null);
            }}
          >
            Контрагент
          </Button>
        </Space>
      </Modal>
      <AddPersonModal
        open={!!personModal}
        onClose={() => {
          setPersonModal(null);
          setPartyRole(null);
        }}
        unitId={Form.useWatch('unit_ids', form)?.[0] ?? null}
        onSelect={(id) => {
          if (partyRole === 'defendant') {
            form.setFieldValue('defendant_id', id);
          } else {
            form.setFieldValue('plaintiff_id', id);
          }
          setPartyRole(null);
        }}
        initialData={personModal}
      />
      <ContractorModal
        open={!!contractorModal}
        onClose={() => {
          setContractorModal(null);
          setPartyRole(null);
        }}
        onSelect={(id) => {
          if (partyRole === 'plaintiff') {
            form.setFieldValue('plaintiff_id', id);
          } else {
            form.setFieldValue('defendant_id', id);
          }
          setPartyRole(null);
        }}
        initialData={contractorModal}
      />
    </>
    </ConfigProvider>
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
  const qc = useQueryClient();
  const notify = useNotify();
  const isEdit = !!initialData?.id;

  useEffect(() => {
    if (!open) return;
    if (isEdit) {
      form.setFieldsValue(initialData);
    } else {
      form.resetFields();
    }
  }, [open, isEdit, initialData, form]);

  const handleFinish = (values: any) => {
    const action = isEdit
      ? updatePersonMutation.mutateAsync({ id: initialData.id, updates: values })
      : addPersonMutation.mutateAsync(values);
    action
      .then(async (person: any) => {
        // unit_persons table removed
        notify.success(isEdit ? 'Физлицо обновлено' : 'Физлицо добавлено');
        qc.invalidateQueries({ queryKey: ['projectPersons'] });
        onSelect(person.id);
        form.resetFields();
        onClose();
      })
      .catch((e: any) => notify.error(e.message));
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
        <Form.Item name="description" label="Описание">
          <Input.TextArea rows={2} />
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
  const notify = useNotify();
  const isEdit = !!initialData?.id;

  useEffect(() => {
    if (!open) return;
    if (isEdit) {
      form.setFieldsValue(initialData);
    } else {
      form.resetFields();
    }
  }, [open, isEdit, initialData, form]);

  const finish = (values: any) => {
    const action = isEdit
      ? updateMutation.mutateAsync({ id: initialData.id, updates: values })
      : addMutation.mutateAsync(values);
    action
      .then((res: any) => {
        notify.success(isEdit ? 'Контрагент обновлён' : 'Контрагент создан');
        onSelect(res.id);
        onClose();
      })
      .catch((e: any) => notify.error(e.message));
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
        <Form.Item name="description" label="Описание">
          <Input.TextArea rows={2} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
