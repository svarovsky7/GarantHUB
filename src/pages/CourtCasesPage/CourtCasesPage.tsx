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
import { PlusOutlined, DeleteOutlined, LinkOutlined } from '@ant-design/icons';
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
import CourtCasesFilters, { CourtCasesFiltersValues } from '@/widgets/CourtCasesFilters';

 dayjs.locale('ru');
 dayjs.extend(isSameOrAfter);
 dayjs.extend(isSameOrBefore);

const LS_KEY = 'courtCasesHideClosed';

export default function CourtCasesPage() {
  const { data: cases = [], isPending: casesLoading } = useCourtCases();
  const deleteCaseMutation = useDeleteCourtCase();
  const notify = useNotify();
  const linkCases = useLinkCases();
  const unlinkCase = useUnlinkCase();
  const [linkFor, setLinkFor] = useState<CourtCase | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const hideOnScroll = useRef(false);

  const [searchParams] = useSearchParams();
  const initialValues = {
    project_id: searchParams.get('project_id') ? Number(searchParams.get('project_id')!) : undefined,
    unit_ids: searchParams.get('unit_id') ? [Number(searchParams.get('unit_id')!)] : undefined,
    responsible_lawyer_id: searchParams.get('responsible_lawyer_id') || undefined,
  };

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
    try {
      const saved = localStorage.getItem(LS_KEY);
      return { hideClosed: saved ? JSON.parse(saved) : false } as CourtCasesFiltersValues;
    } catch {
      return {} as CourtCasesFiltersValues;
    }
  });

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

  const columns: ColumnsType<CourtCase & any> = [
    { title: 'ID', dataIndex: 'id', width: 80, sorter: (a, b) => a.id - b.id },
    { title: 'Проект', dataIndex: 'projectName', sorter: (a, b) => (a.projectName || '').localeCompare(b.projectName || '') },
    { title: 'Объект', dataIndex: 'projectObject', sorter: (a, b) => (a.projectObject || '').localeCompare(b.projectObject || '') },
    { title: '№ дела', dataIndex: 'number', width: 120, sorter: (a, b) => a.number.localeCompare(b.number) },
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
      render: (_: number, row) => <CourtCaseStatusSelect caseId={row.id} status={row.status} />,
    },
    {
      title: 'Прошло дней с начала устранения',
      dataIndex: 'daysSinceFixStart',
      sorter: (a, b) => (a.daysSinceFixStart ?? 0) - (b.daysSinceFixStart ?? 0),
    },
    { title: 'Истец', dataIndex: 'plaintiff', sorter: (a, b) => (a.plaintiff || '').localeCompare(b.plaintiff || '') },
    { title: 'Ответчик', dataIndex: 'defendant', sorter: (a, b) => (a.defendant || '').localeCompare(b.defendant || '') },
    {
      title: 'Дата начала устранения',
      dataIndex: 'fix_start_date',
      render: (v: string | null) => (v ? dayjs(v).format('DD.MM.YYYY') : ''),
      sorter: (a, b) => dayjs(a.fix_start_date || 0).valueOf() - dayjs(b.fix_start_date || 0).valueOf(),
    },
    {
      title: 'Дата окончания устранения',
      dataIndex: 'fix_end_date',
      render: (v: string | null) => (v ? dayjs(v).format('DD.MM.YYYY') : ''),
      sorter: (a, b) => dayjs(a.fix_end_date || 0).valueOf() - dayjs(b.fix_end_date || 0).valueOf(),
    },
    {
      title: 'Юрист',
      dataIndex: 'responsibleLawyer',
      sorter: (a, b) => (a.responsibleLawyer || '').localeCompare(b.responsibleLawyer || ''),
    },
    {
      title: 'Дело закрыто',
      dataIndex: 'is_closed',
      sorter: (a, b) => Number(a.is_closed) - Number(b.is_closed),
      render: (_: boolean, row) => <CourtCaseClosedSelect caseId={row.id} isClosed={row.is_closed} />,
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 120,
      render: (_: any, record) => (
        <Space size="middle">
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
  ];

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
        <Button type="primary" onClick={() => setShowAddForm((p) => !p)} style={{ marginTop: 16 }}>
          {showAddForm ? 'Скрыть форму' : 'Добавить дело'}
        </Button>
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

          <Table
            rowKey="id"
            columns={columns}
            dataSource={treeData}
            loading={casesLoading}
            pagination={{ pageSize: 25, showSizeChanger: true }}
            size="middle"
            expandable={{ expandRowByClick: true, defaultExpandAllRows: true, indentSize: 24 }}
          />

          <Typography.Text style={{ display: 'block', marginTop: 8 }}>
            Всего дел: {total}, из них закрытых: {closedCount} и не закрытых: {openCount}
          </Typography.Text>
          <Typography.Text style={{ display: 'block', marginTop: 4 }}>
            Готовых дел к выгрузке: {readyToExport}
          </Typography.Text>
          <div style={{ marginTop: 8 }}>
            <ExportCourtCasesButton cases={filteredCases} stages={Object.fromEntries(stages.map((s) => [s.id, s.name]))} />
          </div>
        </div>
      </>
    </ConfigProvider>
  );
}
