import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import 'dayjs/locale/ru';
import {
  ConfigProvider,
  Button,
  Card,
  Table,
  Space,
  Popconfirm,
  Tooltip,
  Typography,
  Drawer,
  Checkbox,
} from 'antd';
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
  BookOutlined,
  BranchesOutlined,
  SettingOutlined,
  MenuOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
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
import CourtCasesFilters, { CourtCasesFiltersValues } from '@/widgets/CourtCasesFilters';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

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
  const [showFilters, setShowFilters] = useState(true);
  const [columnsDrawer, setColumnsDrawer] = useState(false);
  const [columnKeys, setColumnKeys] = useState<string[]>([]);
  const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
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

  const columnDefs = React.useMemo(() => {
    const map: Record<string, any> = {
      tree: {
        title: 'Иконка',
        dataIndex: 'tree',
        width: 40,
        render: (_: any, record: any) => {
          if (!record.parent_id) {
            return (
              <Tooltip title="Основное дело">
                <BookOutlined style={{ color: '#722ed1', fontSize: 17 }} />
              </Tooltip>
            );
          }
          return (
            <Tooltip title="Связанное дело">
              <BranchesOutlined style={{ color: '#722ed1', fontSize: 16 }} />
            </Tooltip>
          );
        },
      },
      id: {
        title: 'ID',
        dataIndex: 'id',
        width: 80,
        sorter: (a: any, b: any) => a.id - b.id,
        render: (v: number) => <span style={{ whiteSpace: 'nowrap' }}>{v}</span>,
      },
      projectName: {
        title: 'Проект',
        dataIndex: 'projectName',
        sorter: (a: any, b: any) => (a.projectName || '').localeCompare(b.projectName || ''),
      },
      projectObject: {
        title: 'Объект',
        dataIndex: 'projectObject',
        sorter: (a: any, b: any) => (a.projectObject || '').localeCompare(b.projectObject || ''),
      },
      number: {
        title: '№ дела',
        dataIndex: 'number',
        width: 120,
        sorter: (a: any, b: any) => a.number.localeCompare(b.number),
      },
      date: {
        title: 'Дата дела',
        dataIndex: 'date',
        width: 120,
        sorter: (a: any, b: any) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf(),
        render: (v: string) => dayjs(v).format('DD.MM.YYYY'),
      },
      status: {
        title: 'Статус',
        dataIndex: 'status',
        sorter: (a: any, b: any) => a.status - b.status,
        render: (_: number, row: any) => <CourtCaseStatusSelect caseId={row.id} status={row.status} />,
      },
      daysSinceFixStart: {
        title: 'Прошло дней с начала устранения',
        dataIndex: 'daysSinceFixStart',
        sorter: (a: any, b: any) => (a.daysSinceFixStart ?? 0) - (b.daysSinceFixStart ?? 0),
      },
      plaintiff: {
        title: 'Истец',
        dataIndex: 'plaintiff',
        sorter: (a: any, b: any) => (a.plaintiff || '').localeCompare(b.plaintiff || ''),
      },
      defendant: {
        title: 'Ответчик',
        dataIndex: 'defendant',
        sorter: (a: any, b: any) => (a.defendant || '').localeCompare(b.defendant || ''),
      },
      fix_start_date: {
        title: 'Дата начала устранения',
        dataIndex: 'fix_start_date',
        render: (v: string | null) => (v ? dayjs(v).format('DD.MM.YYYY') : ''),
        sorter: (a: any, b: any) => dayjs(a.fix_start_date || 0).valueOf() - dayjs(b.fix_start_date || 0).valueOf(),
      },
      fix_end_date: {
        title: 'Дата окончания устранения',
        dataIndex: 'fix_end_date',
        render: (v: string | null) => (v ? dayjs(v).format('DD.MM.YYYY') : ''),
        sorter: (a: any, b: any) => dayjs(a.fix_end_date || 0).valueOf() - dayjs(b.fix_end_date || 0).valueOf(),
      },
      responsibleLawyer: {
        title: 'Юрист',
        dataIndex: 'responsibleLawyer',
        sorter: (a: any, b: any) => (a.responsibleLawyer || '').localeCompare(b.responsibleLawyer || ''),
      },
      is_closed: {
        title: 'Дело закрыто',
        dataIndex: 'is_closed',
        sorter: (a: any, b: any) => Number(a.is_closed) - Number(b.is_closed),
        render: (_: boolean, row: any) => <CourtCaseClosedSelect caseId={row.id} isClosed={row.is_closed} />,
      },
      actions: {
        title: 'Действия',
        key: 'actions',
        width: 120,
        render: (_: any, record: any) => (
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
    };
    return map;
  }, [unlinkCase, deleteCaseMutation]);

  useEffect(() => {
    setColumnKeys(Object.keys(columnDefs));
  }, [columnDefs]);

  const columns: ColumnsType<any> = React.useMemo(
    () =>
      columnKeys
        .filter((k) => !hiddenColumns.includes(k))
        .map((k) => columnDefs[k]),
    [columnKeys, hiddenColumns, columnDefs],
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
        <Space style={{ marginTop: 16 }}>
          <Button type="primary" onClick={() => setShowAddForm((p) => !p)}>
            {showAddForm ? 'Скрыть форму' : 'Добавить дело'}
          </Button>
          <Button onClick={() => setShowFilters((p) => !p)}>
            {showFilters ? 'Скрыть фильтры' : 'Показать фильтры'}
          </Button>
          <Button icon={<SettingOutlined />} onClick={() => setColumnsDrawer(true)} />
          <ExportCourtCasesButton
            cases={filteredCases}
            stages={Object.fromEntries(stages.map((s) => [s.id, s.name]))}
          />
        </Space>
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
            key={columnKeys.join('-')}
            columns={columns}
            dataSource={treeData}
            loading={casesLoading}
            pagination={{ pageSize: 25, showSizeChanger: true }}
            size="middle"
            expandable={{ expandRowByClick: true, defaultExpandAllRows: true, indentSize: 24 }}
            rowClassName={(record: any) => (!record.parent_id ? 'main-case-row' : 'child-case-row')}
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
          <Drawer
            title="Столбцы"
            placement="right"
            onClose={() => setColumnsDrawer(false)}
            open={columnsDrawer}
          >
            <DragDropContext
              onDragEnd={(result: DropResult) => {
                if (!result.destination) return;
                const newOrder = Array.from(columnKeys);
                const [moved] = newOrder.splice(result.source.index, 1);
                newOrder.splice(result.destination.index, 0, moved);
                setColumnKeys(newOrder);
              }}
            >
              <Droppable droppableId="cols">
                {(prov) => (
                  <div ref={prov.innerRef} {...prov.droppableProps}>
                    {columnKeys.map((k, index) => (
                      <Draggable key={k} draggableId={k} index={index}>
                        {(p) => (
                          <div
                            ref={p.innerRef}
                            {...p.draggableProps}
                            style={{ display: 'flex', alignItems: 'center', marginBottom: 8, ...p.draggableProps.style }}
                          >
                            <MenuOutlined
                              style={{ marginRight: 8, cursor: 'grab' }}
                              {...p.dragHandleProps}
                            />
                            <Checkbox
                              checked={!hiddenColumns.includes(k)}
                              onChange={(e) => {
                                setHiddenColumns((prev) =>
                                  e.target.checked ? prev.filter((c) => c !== k) : [...prev, k],
                                );
                              }}
                            >
                              {columnDefs[k].title}
                            </Checkbox>
                            <Space style={{ marginLeft: 'auto' }}>
                              <Button
                                size="small"
                                icon={<ArrowUpOutlined />}
                                onClick={() => {
                                  setColumnKeys((prev) => {
                                    if (index === 0) return prev;
                                    const arr = [...prev];
                                    [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
                                    return arr;
                                  });
                                }}
                              />
                              <Button
                                size="small"
                                icon={<ArrowDownOutlined />}
                                onClick={() => {
                                  setColumnKeys((prev) => {
                                    if (index === prev.length - 1) return prev;
                                    const arr = [...prev];
                                    [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
                                    return arr;
                                  });
                                }}
                              />
                            </Space>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {prov.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </Drawer>
        </div>
      </>
    </ConfigProvider>
  );
}
