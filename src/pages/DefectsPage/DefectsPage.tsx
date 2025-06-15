import React, { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import {
  ConfigProvider,
  Card,
  Button,
  Typography,
  Tooltip,
  Popconfirm,
  message,
} from 'antd';
import { SettingOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons';
import ruRU from 'antd/locale/ru_RU';
import { useDefects, useDeleteDefect } from '@/entities/defect';
import { useTicketsSimple } from '@/entities/ticket';
import { useUnitsByIds } from '@/entities/unit';
import { useProjects } from '@/entities/project';
import DefectsTable from '@/widgets/DefectsTable';
import DefectsFilters from '@/widgets/DefectsFilters';
import TableColumnsDrawer from '@/widgets/TableColumnsDrawer';
import type { TableColumnSetting } from '@/shared/types/tableColumnSetting';
import DefectViewModal from '@/features/defect/DefectViewModal';
import ExportDefectsButton from '@/features/defect/ExportDefectsButton';
import { filterDefects } from '@/shared/utils/defectFilter';
import formatUnitName from '@/shared/utils/formatUnitName';
import type { DefectWithInfo } from '@/shared/types/defect';
import type { DefectFilters } from '@/shared/types/defectFilters';
import type { ColumnsType } from 'antd/es/table';

const fmt = (v: string | null) => (v ? dayjs(v).format('DD.MM.YYYY') : '—');

export default function DefectsPage() {
  const { data: defects = [], isPending } = useDefects();
  const { data: tickets = [] } = useTicketsSimple();
  const unitIds = useMemo(
    () => Array.from(new Set(tickets.flatMap((t) => t.unit_ids || []))),
    [tickets],
  );
  const { data: units = [] } = useUnitsByIds(unitIds);
  const { data: projects = [] } = useProjects();

  const data: DefectWithInfo[] = useMemo(() => {
    const unitMap = new Map(units.map((u) => [u.id, formatUnitName(u)]));
    const projectMap = new Map(projects.map((p) => [p.id, p.name]));
    const ticketsMap = new Map<number, { id: number; unit_ids: number[]; project_id: number }[]>();
    tickets.forEach((t: any) => {
      (t.defect_ids || []).forEach((id: number) => {
        const arr = ticketsMap.get(id) || [];
        arr.push({ id: t.id, unit_ids: t.unit_ids || [], project_id: t.project_id });
        ticketsMap.set(id, arr);
      });
    });
    return defects.map((d: any) => {
      const linked = ticketsMap.get(d.id) || [];
      const unitIds = Array.from(new Set(linked.flatMap((l) => l.unit_ids)));
      const unitNames = unitIds
        .map((id) => unitMap.get(id))
        .filter(Boolean)
        .join(', ');
      const projectIds = Array.from(new Set(linked.map((l) => l.project_id)));
      const projectNames = projectIds
        .map((id) => projectMap.get(id))
        .filter(Boolean)
        .join(', ');
      const fixByName = d.fix_by === 'contractor' ? 'Подрядчик' : 'Собственные силы';
      return {
        ...d,
        ticketIds: linked.map((l) => l.id),
        unitIds,
        unitNames,
        projectIds,
        projectNames,
        fixByName,
        defectTypeName: d.defect_type?.name ?? '',
        defectStatusName: d.defect_status?.name ?? '',
      } as DefectWithInfo;
    });
  }, [defects, tickets, units, projects]);

  const options = useMemo(() => {
    const uniq = (arr: any[], key: string) =>
      Array.from(new Set(arr.map((i) => i[key]).filter(Boolean))).map((v) => ({
        label: String(v),
        value: v,
      }));
    return {
      ids: uniq(data, 'id'),
      tickets: uniq(data.flatMap((d) => d.ticketIds.map((t) => ({ ticket: t }))), 'ticket').map((o) => ({ label: o.label, value: Number(o.label) })),
      units: units.map((u) => ({ label: u.name, value: u.id })),
      projects: uniq(data, 'projectNames'),
      types: uniq(data, 'defectTypeName'),
      statuses: uniq(data, 'defectStatusName'),
      fixBy: uniq(data, 'fixByName'),
    };
  }, [data, units]);

  const [filters, setFilters] = useState<DefectFilters>({});
  const [viewId, setViewId] = useState<number | null>(null);
  const { mutateAsync: removeDefect, isPending: removing } = useDeleteDefect();

  const LS_FILTERS_VISIBLE_KEY = 'defectsFiltersVisible';
  const LS_COLUMNS_KEY = 'defectsColumns';

  const [showFilters, setShowFilters] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_FILTERS_VISIBLE_KEY);
      return saved ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const baseColumns = useMemo(() => {
    return {
      id: {
        title: 'ID дефекта',
        dataIndex: 'id',
        sorter: (a: DefectWithInfo, b: DefectWithInfo) => a.id - b.id,
      },
      tickets: {
        title: 'ID замечание',
        dataIndex: 'ticketIds',
        sorter: (a: DefectWithInfo, b: DefectWithInfo) =>
          a.ticketIds.join(',').localeCompare(b.ticketIds.join(',')),
        render: (v: number[]) => v.join(', '),
      },
      project: {
        title: 'Проект',
        dataIndex: 'projectNames',
        sorter: (a: DefectWithInfo, b: DefectWithInfo) =>
          (a.projectNames || '').localeCompare(b.projectNames || ''),
      },
      units: {
        title: 'Объекты',
        dataIndex: 'unitNames',
        sorter: (a: DefectWithInfo, b: DefectWithInfo) =>
          (a.unitNames || '').localeCompare(b.unitNames || ''),
      },
      description: {
        title: 'Описание',
        dataIndex: 'description',
        sorter: (a: DefectWithInfo, b: DefectWithInfo) =>
          a.description.localeCompare(b.description),
      },
      type: {
        title: 'Тип',
        dataIndex: 'defectTypeName',
        sorter: (a: DefectWithInfo, b: DefectWithInfo) =>
          (a.defectTypeName || '').localeCompare(b.defectTypeName || ''),
      },
      status: {
        title: 'Статус',
        dataIndex: 'defectStatusName',
        sorter: (a: DefectWithInfo, b: DefectWithInfo) =>
          (a.defectStatusName || '').localeCompare(b.defectStatusName || ''),
      },
      fixBy: {
        title: 'Кем устраняется',
        dataIndex: 'fixByName',
        sorter: (a: DefectWithInfo, b: DefectWithInfo) =>
          (a.fixByName || '').localeCompare(b.fixByName || ''),
      },
      received: {
        title: 'Дата получения',
        dataIndex: 'received_at',
        sorter: (a: DefectWithInfo, b: DefectWithInfo) =>
          (a.received_at ? dayjs(a.received_at).valueOf() : 0) -
          (b.received_at ? dayjs(b.received_at).valueOf() : 0),
        render: fmt,
      },
      created: {
        title: 'Дата создания',
        dataIndex: 'created_at',
        sorter: (a: DefectWithInfo, b: DefectWithInfo) =>
          (a.created_at ? dayjs(a.created_at).valueOf() : 0) -
          (b.created_at ? dayjs(b.created_at).valueOf() : 0),
        render: fmt,
      },
      actions: {
        title: 'Действия',
        key: 'actions',
        width: 100,
        render: (_: unknown, row: DefectWithInfo) => (
          <>
            <Tooltip title="Просмотр">
              <Button
                size="small"
                type="text"
                icon={<EyeOutlined />}
                onClick={() => setViewId(row.id)}
              />
            </Tooltip>
            <Popconfirm
              title="Удалить дефект?"
              okText="Да"
              cancelText="Нет"
              onConfirm={async () => {
                await removeDefect(row.id);
                message.success('Удалено');
              }}
              disabled={removing}
            >
              <Button
                size="small"
                type="text"
                danger
                icon={<DeleteOutlined />}
                loading={removing}
              />
            </Popconfirm>
          </>
        ),
      } as any,
    } as Record<string, ColumnsType<DefectWithInfo>[number]>;
  }, [removeDefect, removing]);

  const [columnsState, setColumnsState] = useState<TableColumnSetting[]>(() => {
    const base = baseColumns;
    const defaults = Object.keys(base).map((key) => ({
      key,
      title: base[key].title as string,
      visible: true,
    }));
    try {
      const saved = localStorage.getItem(LS_COLUMNS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as TableColumnSetting[];
        const filtered = parsed.filter((c) => base[c.key]);
        const missing = defaults.filter((d) => !filtered.some((f) => f.key === d.key));
        return [...filtered, ...missing];
      }
    } catch {}
    return defaults;
  });

  const handleResetColumns = () => {
    const base = baseColumns;
    const defaults = Object.keys(base).map((key) => ({
      key,
      title: base[key].title as string,
      visible: true,
    }));
    setColumnsState(defaults);
  };

  React.useEffect(() => {
    try {
      localStorage.setItem(LS_COLUMNS_KEY, JSON.stringify(columnsState));
    } catch {}
  }, [columnsState]);

  React.useEffect(() => {
    try {
      localStorage.setItem(LS_FILTERS_VISIBLE_KEY, JSON.stringify(showFilters));
    } catch {}
  }, [showFilters]);

  const columns = useMemo(() => {
    const base = baseColumns;
    return columnsState
      .filter((c) => c.visible)
      .map((c) => base[c.key]);
  }, [columnsState, baseColumns]);

  const [showColumnsDrawer, setShowColumnsDrawer] = useState(false);

  const total = data.length;
  const closedCount = useMemo(
    () => data.filter((d) => d.defectStatusName?.toLowerCase().includes('закры')).length,
    [data],
  );
  const openCount = total - closedCount;
  const readyToExport = useMemo(
    () => filterDefects(data, filters).length,
    [data, filters],
  );

  return (
    <ConfigProvider locale={ruRU}>
      <>
        <Button onClick={() => setShowFilters((p) => !p)} style={{ marginTop: 16 }}>
          {showFilters ? 'Скрыть фильтры' : 'Показать фильтры'}
        </Button>
        <Button
          icon={<SettingOutlined />}
          style={{ marginTop: 16, marginLeft: 8 }}
          onClick={() => setShowColumnsDrawer(true)}
        />
        <span style={{ marginTop: 16, marginLeft: 8, display: 'inline-block' }}>
          <ExportDefectsButton defects={data} filters={filters} />
        </span>
        {showFilters && (
          <Card style={{ marginTop: 16, marginBottom: 24 }}>
            <DefectsFilters options={options} onChange={setFilters} />
          </Card>
        )}
        <DefectsTable
          defects={data}
          filters={filters}
          loading={isPending}
          onView={setViewId}
          columns={columns}
        />
        <TableColumnsDrawer
          open={showColumnsDrawer}
          columns={columnsState}
          onChange={setColumnsState}
          onClose={() => setShowColumnsDrawer(false)}
          onReset={handleResetColumns}
        />
        <Typography.Text style={{ display: 'block', marginTop: 8 }}>
          Всего дефектов: {total}, из них закрытых: {closedCount} и не закрытых: {openCount}
        </Typography.Text>
        <Typography.Text style={{ display: 'block', marginTop: 4 }}>
          Готовых дефектов к выгрузке: {readyToExport}
        </Typography.Text>
        <DefectViewModal
          open={viewId !== null}
          defectId={viewId}
          onClose={() => setViewId(null)}
        />
      </>
    </ConfigProvider>
  );
}
