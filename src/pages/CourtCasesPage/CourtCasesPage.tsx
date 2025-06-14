import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import 'dayjs/locale/ru';
import { ConfigProvider, Button, Card, Table, Space, Popconfirm, Tooltip, Typography } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import type { ColumnsType } from 'antd/es/table';
import type { CourtCase } from '@/shared/types/courtCase';
import { useProjects } from '@/entities/project';
import { useUnitsByIds } from '@/entities/unit';
import { useContractors } from '@/entities/contractor';
import { useUsers } from '@/entities/user';
import { useLitigationStages } from '@/entities/litigationStage';
import { usePersons } from '@/entities/person';
import {
  PlusOutlined,
  DeleteOutlined,
  LinkOutlined,
  FileTextOutlined,
  BranchesOutlined,
  SettingOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import {
  useCourtCases,
  useDeleteCourtCase,
  useLinkCases,
  useUnlinkCase,
} from '@/entities/courtCase';
import { supabase } from '@/shared/api/supabaseClient';
import { useQuery } from '@tanstack/react-query';
import { useNotify } from '@/shared/hooks/useNotify';
import CourtCaseStatusSelect from '@/features/courtCase/CourtCaseStatusSelect';
import CourtCaseClosedSelect from '@/features/courtCase/CourtCaseClosedSelect';
import LinkCasesDialog from '@/features/courtCase/LinkCasesDialog';
import ExportCourtCasesButton from '@/features/courtCase/ExportCourtCasesButton';
import AddCourtCaseFormAntd from '@/features/courtCase/AddCourtCaseFormAntd';
import CourtCaseViewModal from '@/features/courtCase/CourtCaseViewModal';
import CourtCasesFilters, { CourtCasesFiltersValues } from '@/widgets/CourtCasesFilters';
import TableColumnsDrawer from '@/widgets/TableColumnsDrawer';
import type { TableColumnSetting } from '@/shared/types/tableColumnSetting';

 dayjs.locale('ru');
 dayjs.extend(isSameOrAfter);
 dayjs.extend(isSameOrBefore);

const LS_KEY = 'courtCasesHideClosed';
const LS_COLUMNS_KEY = 'courtCasesColumns';
const LS_FILTERS_VISIBLE_KEY = 'courtCasesFiltersVisible';

export default function CourtCasesPage() {
  const { data: cases = [], isPending: casesLoading } = useCourtCases();
  const deleteCaseMutation = useDeleteCourtCase();
  const notify = useNotify();
  const linkCases = useLinkCases();
  const unlinkCase = useUnlinkCase();
  const [linkFor, setLinkFor] = useState<CourtCase | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showFilters, setShowFilters] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_FILTERS_VISIBLE_KEY);
      return saved ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });
  const [showColumnsDrawer, setShowColumnsDrawer] = useState(false);
  const [viewId, setViewId] = useState<number | null>(null);
  const hideOnScroll = useRef(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const initialValues = {
    project_id: searchParams.get('project_id')
      ? Number(searchParams.get('project_id')!)
      : undefined,
    unit_ids: searchParams.get('unit_id')
      ? [Number(searchParams.get('unit_id')!)]
      : undefined,
    responsible_lawyer_id: searchParams.get('responsible_lawyer_id') || undefined,
    status: searchParams.get('status') ? Number(searchParams.get('status')!) : undefined,
  };

  React.useEffect(() => {
    if (searchParams.get('open_form') === '1') {
      setShowAddForm(true);
    }
  }, [searchParams]);

  const { data: projects = [] } = useProjects();
  const { data: contractors = [] } = useContractors();
  const { data: users = [] } = useUsers();
  const { data: stages = [] } = useLitigationStages();
  const { data: personsList = [] } = usePersons();

  const unitIds = React.useMemo(() => Array.from(new Set(cases.flatMap((c) => c.unit_ids).filter(Boolean))), [cases]);
  const { data: caseUnits = [] } = useUnitsByIds(unitIds);
  const { data: allUnits = [] } = useQuery({
    queryKey: ['allUnits'],
    queryFn: async () => {
      const { data, error } = await supabase.from('units').select('id, name, project_id');
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60_000,
  });

  const [filters, setFilters] = useState<CourtCasesFiltersValues>(() => {
    let hideClosed = false;
    try {
      const saved = localStorage.getItem(LS_KEY);
      hideClosed = saved ? JSON.parse(saved) : false;
    } catch {}
    return {
      hideClosed,
      projectId: initialValues.project_id,
      objectId: initialValues.unit_ids ? initialValues.unit_ids[0] : undefined,
    } as CourtCasesFiltersValues;
  });

  useEffect(() => {
    const caseId = searchParams.get('case_id');
    if (caseId) setViewId(Number(caseId));
    const prj = searchParams.get('project_id');
    const obj = searchParams.get('unit_id');
    setFilters((f) => ({
      ...f,
      projectId: prj ? Number(prj) : f.projectId,
      objectId: obj ? Number(obj) : f.objectId,
    }));
  }, [searchParams]);

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === LS_KEY) {
        try {
          setFilters((f) => ({ ...f, hideClosed: JSON.parse(e.newValue || 'false') }));
        } catch {}
      }
      if (e.key === LS_FILTERS_VISIBLE_KEY) {
        try {
          setShowFilters(JSON.parse(e.newValue || 'true'));
        } catch {}
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LS_FILTERS_VISIBLE_KEY, JSON.stringify(showFilters));
    } catch {}
  }, [showFilters]);

  const handleFiltersChange = (v: CourtCasesFiltersValues) => {
    if (v.hideClosed !== filters.hideClosed) {
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(v.hideClosed));
      } catch {}
    }
    setFilters(v);
  };

  const resetFilters = () => setFilters((f) => ({ hideClosed: f.hideClosed } as CourtCasesFiltersValues));

  const closedStageId = React.useMemo(() => {
    return stages.find((s) => s.name.toLowerCase().includes('закры'))?.id;
  }, [stages]);

  const casesData = cases.map((c: any) => ({
    ...c,
    projectName: projects.find((p) => p.id === c.project_id)?.name ?? '',
    projectObject: c.unit_ids
      .map((id: number) => caseUnits.find((u) => u.id === id)?.name)
      .filter(Boolean)
      .join(', '),
    plaintiff: personsList.find((p) => p.id === c.plaintiff_id)?.full_name || c.plaintiff,
    defendant:
      contractors.find((d) => d.id === c.defendant_id)?.name ||
      personsList.find((p) => p.id === c.defendant_id)?.full_name ||
      c.defendant,
    responsibleLawyer: users.find((u) => u.id === c.responsible_lawyer_id)?.name ?? c.responsibleLawyer,
    daysSinceFixStart: c.fix_start_date ? dayjs(c.fix_end_date ?? dayjs()).diff(dayjs(c.fix_start_date), 'day') : null,
  }));

  const idOptions = React.useMemo(
    () => Array.from(new Set(cases.map((c) => c.id))).map((id) => ({ value: id, label: String(id) })),
    [cases],
  );

  const filteredCases = casesData.filter((c: any) => {
    const matchesStatus = !filters.status || c.status === filters.status;
    const matchesProject = !filters.projectId || c.project_id === filters.projectId;
    const matchesObject = !filters.objectId || c.unit_ids.includes(filters.objectId);
    const matchesNumber = !filters.number || c.number.toLowerCase().includes(filters.number.toLowerCase());
    const matchesDate =
      !filters.dateRange ||
      (dayjs(c.date).isSameOrAfter(filters.dateRange[0], 'day') &&
        dayjs(c.date).isSameOrBefore(filters.dateRange[1], 'day'));
    const matchesPlaintiff = !filters.plaintiff || c.plaintiff.toLowerCase().includes(filters.plaintiff.toLowerCase());
    const matchesDefendant = !filters.defendant || c.defendant.toLowerCase().includes(filters.defendant.toLowerCase());
    const matchesFixStart =
      !filters.fixStartRange ||
      (c.fix_start_date &&
        dayjs(c.fix_start_date).isSameOrAfter(filters.fixStartRange[0], 'day') &&
        dayjs(c.fix_start_date).isSameOrBefore(filters.fixStartRange[1], 'day'));
    const matchesLawyer = !filters.lawyerId || String(c.responsible_lawyer_id) === filters.lawyerId;
    const matchesClosed = !filters.hideClosed || (closedStageId ? c.status !== closedStageId : !c.is_closed);
    const matchesIds = !filters.ids || filters.ids.includes(c.id);
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

  const baseColumns: Record<string, ColumnsType<CourtCase & any>[number]> = {
    treeIcon: {
      title: '',
      dataIndex: 'treeIcon',
      width: 40,
      render: (_: any, record) => {
        if (!record.parent_id) {
          return (
            <Tooltip title="Основное дело">
              <FileTextOutlined style={{ color: '#1890ff', fontSize: 17 }} />
            </Tooltip>
          );
        }
        return (
          <Tooltip title="Связанное дело">
            <BranchesOutlined style={{ color: '#52c41a', fontSize: 16 }} />
          </Tooltip>
        );
      },
    },
    id: {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      sorter: (a, b) => a.id - b.id,
      render: (id: number) => <span style={{ whiteSpace: 'nowrap' }}>{id}</span>,
    },
    projectName: {
      title: 'Проект',
      dataIndex: 'projectName',
      sorter: (a, b) => (a.projectName || '').localeCompare(b.projectName || ''),
    },
    projectObject: {
      title: 'Объект',
      dataIndex: 'projectObject',
      sorter: (a, b) => (a.projectObject || '').localeCompare(b.projectObject || ''),
    },
    number: {
      title: '№ дела',
      dataIndex: 'number',
      width: 120,
      sorter: (a, b) => a.number.localeCompare(b.number),
    },
    date: {
      title: 'Дата дела',
      dataIndex: 'date',
      width: 120,
      sorter: (a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf(),
      render: (v: string) => dayjs(v).format('DD.MM.YYYY'),
    },
    status: {
      title: 'Статус',
      dataIndex: 'status',
      sorter: (a, b) => a.status - b.status,
      render: (_: number, row) => <CourtCaseStatusSelect caseId={row.id} status={row.status} />,
    },
    daysSinceFixStart: {
      title: 'Прошло дней с начала устранения',
      dataIndex: 'daysSinceFixStart',
      sorter: (a, b) => (a.daysSinceFixStart ?? 0) - (b.daysSinceFixStart ?? 0),
    },
    plaintiff: {
      title: 'Истец',
      dataIndex: 'plaintiff',
      sorter: (a, b) => (a.plaintiff || '').localeCompare(b.plaintiff || ''),
    },
    defendant: {
      title: 'Ответчик',
      dataIndex: 'defendant',
      sorter: (a, b) => (a.defendant || '').localeCompare(b.defendant || ''),
    },
    fix_start_date: {
      title: 'Дата начала устранения',
      dataIndex: 'fix_start_date',
      render: (v: string | null) => (v ? dayjs(v).format('DD.MM.YYYY') : ''),
      sorter: (a, b) => dayjs(a.fix_start_date || 0).valueOf() - dayjs(b.fix_start_date || 0).valueOf(),
    },
    fix_end_date: {
      title: 'Дата окончания устранения',
      dataIndex: 'fix_end_date',
      render: (v: string | null) => (v ? dayjs(v).format('DD.MM.YYYY') : ''),
      sorter: (a, b) => dayjs(a.fix_end_date || 0).valueOf() - dayjs(b.fix_end_date || 0).valueOf(),
    },
    responsibleLawyer: {
      title: 'Юрист',
      dataIndex: 'responsibleLawyer',
      sorter: (a, b) => (a.responsibleLawyer || '').localeCompare(b.responsibleLawyer || ''),
    },
    is_closed: {
      title: 'Дело закрыто',
      dataIndex: 'is_closed',
      sorter: (a, b) => Number(a.is_closed) - Number(b.is_closed),
      render: (_: boolean, row) => <CourtCaseClosedSelect caseId={row.id} isClosed={row.is_closed} />,
    },
    actions: {
      title: 'Действия',
      key: 'actions',
      width: 140,
      render: (_: any, record) => (
        <Space size="middle">
          <Tooltip title="Просмотр">
            <Button type="text" icon={<EyeOutlined />} onClick={() => setViewId(record.id)} />
          </Tooltip>
          <Button type="text" icon={<PlusOutlined />} onClick={() => setLinkFor(record)} />
          {record.parent_id && (
            <Tooltip title="Исключить из связи">
              <Button
                type="text"
                icon={<LinkOutlined style={{ color: '#c41d7f', textDecoration: 'line-through', fontWeight: 700 }} />}
                onClick={() => unlinkCase.mutate(record.id)}
              />
            </Tooltip>
          )}
          <Popconfirm
            title="Удалить дело?"
            okText="Да"
            cancelText="Нет"
            onConfirm={() => deleteCaseMutation.mutate(record.id)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  };

  const [columnsState, setColumnsState] = useState<TableColumnSetting[]>(() => {
    const defaults = Object.keys(baseColumns).map((key) => ({
      key,
      title: baseColumns[key].title as string,
      visible: true,
    }));
    try {
      const saved = localStorage.getItem(LS_COLUMNS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as TableColumnSetting[];
        return parsed.filter((c) => baseColumns[c.key]);
      }
    } catch {}
    return defaults;
  });

  /**
   * Сброс колонок к начальному состоянию
   */
  const handleResetColumns = () => {
    const defaults = Object.keys(baseColumns).map((key) => ({
      key,
      title: baseColumns[key].title as string,
      visible: true,
    }));
    setColumnsState(defaults);
  };

  useEffect(() => {
    try {
      localStorage.setItem(LS_COLUMNS_KEY, JSON.stringify(columnsState));
    } catch {}
  }, [columnsState]);

  const columns: ColumnsType<CourtCase & any> = React.useMemo(
    () => columnsState.filter((c) => c.visible).map((c) => baseColumns[c.key]),
    [columnsState],
  );


  const total = cases.length;
  const closedCount = React.useMemo(
    () => cases.filter((c) => (closedStageId ? c.status === closedStageId : c.is_closed)).length,
    [cases, closedStageId],
  );
  const openCount = total - closedCount;
  const readyToExport = filteredCases.length;

  return (
    <ConfigProvider locale={ruRU}>
      <>
        <Button type="primary" onClick={() => setShowAddForm((p) => !p)} style={{ marginTop: 16, marginRight: 8 }}>
          {showAddForm ? 'Скрыть форму' : 'Добавить дело'}
        </Button>
        <Button onClick={() => setShowFilters((p) => !p)} style={{ marginTop: 16 }}>
          {showFilters ? 'Скрыть фильтры' : 'Показать фильтры'}
        </Button>
        <Button
          icon={<SettingOutlined />}
          style={{ marginTop: 16, marginLeft: 8 }}
          onClick={() => setShowColumnsDrawer(true)}
        />
        <span style={{ marginTop: 16, marginLeft: 8, display: 'inline-block' }}>
          <ExportCourtCasesButton
            cases={filteredCases}
            stages={Object.fromEntries(stages.map((s) => [s.id, s.name]))}
          />
        </span>
        {showAddForm && (
          <AddCourtCaseFormAntd
            initialValues={initialValues}
            onCreated={() => {
              setShowAddForm(false);
              hideOnScroll.current = true;
            }}
          />
        )}
        <LinkCasesDialog
          open={!!linkFor}
          parent={linkFor}
          cases={casesData}
          onClose={() => setLinkFor(null)}
          onSubmit={(ids) => linkCases.mutate({ parentId: String(linkFor!.id), childIds: ids })}
        />
        <TableColumnsDrawer
          open={showColumnsDrawer}
          columns={columnsState}
          onChange={setColumnsState}
          onClose={() => setShowColumnsDrawer(false)}
          onReset={handleResetColumns}
        />
        <CourtCaseViewModal
          open={viewId !== null}
          caseId={viewId}
          onClose={() => {
            setViewId(null);
            const params = new URLSearchParams(searchParams);
            params.delete('case_id');
            setSearchParams(params, { replace: true });
          }}
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
          {showFilters && (
            <Card style={{ marginBottom: 24 }}>
              <CourtCasesFilters
                values={filters}
                onChange={handleFiltersChange}
                onReset={resetFilters}
                projects={projects}
                units={allUnits}
                stages={stages}
                users={users}
                idOptions={idOptions}
              />
            </Card>
          )}

          <Table
            rowKey="id"
            columns={columns}
            dataSource={treeData}
            loading={casesLoading}
            pagination={{ pageSize: 25, showSizeChanger: true }}
            size="middle"
            expandable={{ expandRowByClick: true, defaultExpandAllRows: false, indentSize: 24 }}
            rowClassName={(record) => (record.parent_id ? 'child-case-row' : 'main-case-row')}
          />

          <Typography.Text style={{ display: 'block', marginTop: 8 }}>
            Всего дел: {total}, из них закрытых: {closedCount} и не закрытых: {openCount}
          </Typography.Text>
        <Typography.Text style={{ display: 'block', marginTop: 4 }}>
          Готовых дел к выгрузке: {readyToExport}
        </Typography.Text>
      </div>
      </>
    </ConfigProvider>
  );
}
