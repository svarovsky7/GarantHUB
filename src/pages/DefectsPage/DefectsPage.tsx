import React, { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { ConfigProvider, Card, Button } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import ruRU from 'antd/locale/ru_RU';
import { useDefects } from '@/entities/defect';
import { useTicketsSimple } from '@/entities/ticket';
import { useUnitsByIds } from '@/entities/unit';
import DefectsTable from '@/widgets/DefectsTable';
import DefectsFilters from '@/widgets/DefectsFilters';
import TableColumnsDrawer from '@/widgets/TableColumnsDrawer';
import type { TableColumnSetting } from '@/shared/types/tableColumnSetting';
import DefectViewModal from '@/features/defect/DefectViewModal';
import type { DefectWithInfo } from '@/shared/types/defect';
import type { DefectFilters } from '@/shared/types/defectFilters';

const fmt = (v: string | null) => (v ? dayjs(v).format('DD.MM.YYYY') : '—');

export default function DefectsPage() {
  const { data: defects = [], isPending } = useDefects();
  const { data: tickets = [] } = useTicketsSimple();
  const unitIds = useMemo(
    () => Array.from(new Set(tickets.flatMap((t) => t.unit_ids || []))),
    [tickets],
  );
  const { data: units = [] } = useUnitsByIds(unitIds);

  const data: DefectWithInfo[] = useMemo(() => {
    const unitMap = new Map(units.map((u) => [u.id, u.name]));
    const ticketsMap = new Map<number, { id: number; unit_ids: number[] }[]>();
    tickets.forEach((t: any) => {
      (t.defect_ids || []).forEach((id: number) => {
        const arr = ticketsMap.get(id) || [];
        arr.push({ id: t.id, unit_ids: t.unit_ids || [] });
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
      return {
        ...d,
        ticketIds: linked.map((l) => l.id),
        unitIds,
        unitNames,
        defectTypeName: d.defect_type?.name ?? '',
        defectStatusName: d.defect_status?.name ?? '',
      } as DefectWithInfo;
    });
  }, [defects, tickets, units]);

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
    };
  }, [data, units]);

  const [filters, setFilters] = useState<DefectFilters>({});
  const [viewId, setViewId] = useState<number | null>(null);

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
      id: { title: 'ID', dataIndex: 'id', width: 80 },
      tickets: {
        title: '№ замечания',
        dataIndex: 'ticketIds',
        render: (v: number[]) => v.join(', '),
      },
      units: { title: 'Объекты', dataIndex: 'unitNames' },
      description: { title: 'Описание', dataIndex: 'description' },
      type: { title: 'Тип', dataIndex: 'defectTypeName' },
      status: { title: 'Статус', dataIndex: 'defectStatusName' },
      received: {
        title: 'Дата получения',
        dataIndex: 'received_at',
        render: fmt,
      },
      created: {
        title: 'Дата создания',
        dataIndex: 'created_at',
        render: fmt,
      },
      actions: {
        title: 'Действия',
        key: 'actions',
      } as any,
    } as Record<string, ColumnsType<DefectWithInfo>[number]>;
  }, []);

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
        return parsed.filter((c) => base[c.key]);
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
        <DefectViewModal
          open={viewId !== null}
          defectId={viewId}
          onClose={() => setViewId(null)}
        />
      </>
    </ConfigProvider>
  );
}
