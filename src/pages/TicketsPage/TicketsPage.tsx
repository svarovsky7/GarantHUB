// -----------------------------------------------------------------------------
// Страница «/tickets» – фильтры + таблица
// -----------------------------------------------------------------------------
import React, { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { ConfigProvider, Typography, Alert, Card, Button, message, Tooltip, Space, Popconfirm, Tag } from "antd";
import {
  SettingOutlined,
  EyeOutlined,
  DeleteOutlined,
  PlusOutlined,
  BranchesOutlined,
  LinkOutlined,
  FileTextOutlined,
  CheckCircleTwoTone,
  CloseCircleTwoTone,
} from "@ant-design/icons";
import dayjs from "dayjs";
import ruRU from "antd/locale/ru_RU";
import { useSnackbar } from "notistack";
import { useQueryClient } from "@tanstack/react-query";

import { useTickets, useLinkTickets, useUnlinkTicket, useDeleteTicket } from "@/entities/ticket";
import { useUsers } from "@/entities/user";
import { useUnitsByIds } from "@/entities/unit";
import { useDefectsByIds } from "@/entities/defect";
import TicketsTable from "@/widgets/TicketsTable";
import TicketsFilters from "@/widgets/TicketsFilters";
import TicketFormAntd from "@/features/ticket/TicketFormAntd";
import TicketViewModal from "@/features/ticket/TicketViewModal";
import LinkTicketsDialog from "@/features/ticket/LinkTicketsDialog";
import ExportTicketsButton from "@/features/ticket/ExportTicketsButton";
import TicketStatusSelect from "@/features/ticket/TicketStatusSelect";
import TableColumnsDrawer from "@/widgets/TableColumnsDrawer";
import type { TableColumnSetting } from "@/shared/types/tableColumnSetting";
import type { ColumnsType } from "antd/es/table";
import type { TicketWithNames } from "@/shared/types/ticketWithNames";
import { useNotify } from "@/shared/hooks/useNotify";
import { filterTickets } from "@/shared/utils/ticketFilter";

const fmt = (d: any, withTime = false) =>
  d && dayjs.isDayjs(d) && d.isValid()
    ? d.format(withTime ? "DD.MM.YYYY HH:mm" : "DD.MM.YYYY")
    : "—";

export default function TicketsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const { data: tickets = [], isLoading, error } = useTickets();
  const linkTickets = useLinkTickets();
  const unlinkTicket = useUnlinkTicket();
  const notify = useNotify();
  const { data: users = [] } = useUsers();
  const unitIds = useMemo(
    () => Array.from(new Set(tickets.flatMap((t) => t.unitIds))),
    [tickets],
  );
  const { data: units = [] } = useUnitsByIds(unitIds);
  const defectIds = useMemo(
    () => Array.from(new Set(tickets.flatMap((t) => t.defectIds || []))),
    [tickets],
  );
  const { data: defectsInfo = [] } = useDefectsByIds(defectIds);
  const defectMap = useMemo(() => {
    const map = new Map<number, boolean>();
    defectsInfo.forEach((d) => {
      const name = d.statusName?.toLowerCase() || '';
      map.set(d.id, /закры|провер/.test(name));
    });
    return map;
  }, [defectsInfo]);
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({});
  const [initialFilters, setInitialFilters] = useState({});
  const [viewId, setViewId] = useState<number | null>(null);
  const [linkFor, setLinkFor] = useState<any | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const hideOnScroll = React.useRef(false);
  const deleteTicketMutation = useDeleteTicket();

  React.useEffect(() => {
    if (searchParams.get('open_form') === '1') {
      setShowAddForm(true);
    }
  }, [searchParams]);

  const LS_FILTERS_VISIBLE_KEY = 'ticketsFiltersVisible';
  const LS_COLUMNS_KEY = 'ticketsColumns';
  const [showFilters, setShowFilters] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_FILTERS_VISIBLE_KEY);
      return saved ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });
  const [showColumnsDrawer, setShowColumnsDrawer] = useState(false);

  React.useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === LS_FILTERS_VISIBLE_KEY) {
        try {
          setShowFilters(JSON.parse(e.newValue || 'true'));
        } catch {}
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  React.useEffect(() => {
    const id = searchParams.get('ticket_id');
    if (id) {
      setViewId(Number(id));
    }
    const project = searchParams.get('project_id');
    if (project) {
      const val = Number(project);
      setInitialFilters((f) => ({ ...f, project: val }));
      setFilters((f) => ({ ...f, project: val }));
    }
    const unit = searchParams.get('unit_id');
    if (unit) {
      const val = Number(unit);
      setInitialFilters((f) => ({ ...f, units: [val] }));
      setFilters((f) => ({ ...f, units: [val] }));
    }
    const ids = searchParams.get('ids');
    if (ids) {
      const arr = ids
        .split(',')
        .map((v) => Number(v))
        .filter(Boolean);
      const valid = arr.filter((tid) => tickets.some((t) => t.id === tid));
      setInitialFilters({ id: valid });
      setFilters((f) => ({ ...f, id: valid }));
    }
  }, [searchParams, tickets]);
  const initialValues = {
    project_id: searchParams.get('project_id')
      ? Number(searchParams.get('project_id')!)
      : undefined,
    unit_ids: searchParams.get('unit_id')
      ? [Number(searchParams.get('unit_id')!)]
      : undefined,
    responsible_engineer_id:
      searchParams.get('responsible_engineer_id') || undefined,
  };

  /* toast api-ошибки */
  React.useEffect(() => {
    if (error) enqueueSnackbar(error.message, { variant: "error" });
  }, [error, enqueueSnackbar]);

  const userMap = useMemo(() => {
    const map = {} as Record<string, string>;
    (users ?? []).forEach((u) => {
      map[u.id] = u.name;
    });
    return map;
  }, [users]);

  const unitMap = useMemo(() => {
    const map = {} as Record<number, string>;
    (units ?? []).forEach((u) => {
      map[u.id] = u.name;
    });
    return map;
  }, [units]);

  const ticketsWithNames: TicketWithNames[] = useMemo(
    () =>
      tickets.map((t) => ({
        ...t,
        unitNames: t.unitIds
          .map((id) => unitMap[id])
          .filter(Boolean)
          .join(', '),
        responsibleEngineerName: userMap[t.responsibleEngineerId] ?? null,
        createdByName: userMap[t.createdBy] ?? null,
        allDefectsFixed:
          (t.defectIds || []).length > 0 &&
          (t.defectIds || []).every((id) => defectMap.get(id)),
      })),
    [tickets, userMap, unitMap, defectMap],
  );

  /* списки для <Select> (уникальные значения) */
  const options = useMemo(() => {
    const uniq = (arr, key) =>
      Array.from(new Set(arr.map((i) => i[key]).filter(Boolean))).map((v) => ({
        label: v,
        value: v,
      }));
    return {
      projects: uniq(ticketsWithNames, "projectName"),
      units: uniq(ticketsWithNames, "unitNames"),
      statuses: uniq(ticketsWithNames, "statusName"),
      responsibleEngineers: uniq(ticketsWithNames, "responsibleEngineerName"),
      ids: uniq(ticketsWithNames, "id"),
    };
  }, [ticketsWithNames]);

  const handleUnlink = (id: number) => {
    unlinkTicket.mutate(String(id), {
      onSuccess: () => notify.success('Замечание исключено из связи'),
    });
  };

  const handleLink = (ids: string[]) => {
    if (!linkFor) return;
    linkTickets.mutate(
      { parentId: String(linkFor.id), childIds: ids },
      {
        onSuccess: () => {
          notify.success('Замечания связаны');
          setLinkFor(null);
        },
      },
    );
  };

  const getBaseColumns = () => {
    return {
      tree: {
        title: '',
        dataIndex: 'tree',
        width: 40,
        render: (_: any, record: any) => {
          if (!record.parentId) {
            return (
              <Tooltip title="Основное замечание">
                <FileTextOutlined style={{ color: '#1890ff', fontSize: 17 }} />
              </Tooltip>
            );
          }
          return (
            <Tooltip title="Связанное замечание">
              <BranchesOutlined style={{ color: '#52c41a', fontSize: 16 }} />
            </Tooltip>
          );
        },
      },
      id: {
        title: 'ID',
        dataIndex: 'id',
        width: 80,
        sorter: (a: any, b: any) => a.id - b.id,
      },
      projectName: {
        title: 'Проект',
        dataIndex: 'projectName',
        width: 180,
        sorter: (a: any, b: any) => a.projectName.localeCompare(b.projectName),
      },
      unitNames: {
        title: 'Объекты',
        dataIndex: 'unitNames',
        width: 160,
        sorter: (a: any, b: any) => a.unitNames.localeCompare(b.unitNames),
      },
      isWarranty: {
        title: 'Гарантия',
        dataIndex: 'isWarranty',
        width: 110,
        sorter: (a: any, b: any) => Number(a.isWarranty) - Number(b.isWarranty),
        render: (v: boolean) =>
          v ? (
            <Tag icon={<CheckCircleTwoTone twoToneColor="#52c41a" />} color="success">Да</Tag>
          ) : (
            <Tag icon={<CloseCircleTwoTone twoToneColor="#eb2f96" />} color="default">Нет</Tag>
          ),
      },
      statusId: {
        title: 'Статус',
        dataIndex: 'statusId',
        width: 160,
        sorter: (a: any, b: any) => a.statusName.localeCompare(b.statusName),
        render: (_: any, row: any) => (
          <TicketStatusSelect
            ticketId={row.id}
            statusId={row.statusId}
            statusColor={row.statusColor}
            statusName={row.statusName}
          />
        ),
      },
      days: {
        title: 'Прошло дней с Даты получения',
        dataIndex: 'days',
        width: 120,
        sorter: (a: any, b: any) => (a.days ?? -1) - (b.days ?? -1),
      },
      receivedAt: {
        title: 'Дата получения',
        dataIndex: 'receivedAt',
        width: 140,
        defaultSortOrder: 'descend' as const,
        sorter: (a: any, b: any) =>
          (a.receivedAt ? a.receivedAt.valueOf() : 0) - (b.receivedAt ? b.receivedAt.valueOf() : 0),
        render: (v: any) => fmt(v),
      },
      fixedAt: {
        title: 'Дата устранения',
        dataIndex: 'fixedAt',
        width: 140,
        sorter: (a: any, b: any) =>
          (a.fixedAt ? a.fixedAt.valueOf() : 0) - (b.fixedAt ? b.fixedAt.valueOf() : 0),
        render: (v: any) => fmt(v),
      },
      customerRequestNo: {
        title: '№ заявки от Заказчика',
        dataIndex: 'customerRequestNo',
        width: 160,
        sorter: (a: any, b: any) => (a.customerRequestNo || '').localeCompare(b.customerRequestNo || ''),
      },
      customerRequestDate: {
        title: 'Дата заявки Заказчика',
        dataIndex: 'customerRequestDate',
        width: 160,
        sorter: (a: any, b: any) =>
          (a.customerRequestDate ? a.customerRequestDate.valueOf() : 0) -
          (b.customerRequestDate ? b.customerRequestDate.valueOf() : 0),
        render: (v: any) => fmt(v),
      },
      responsibleEngineerName: {
        title: 'Ответственный инженер',
        dataIndex: 'responsibleEngineerName',
        width: 180,
        sorter: (a: any, b: any) =>
          (a.responsibleEngineerName || '').localeCompare(b.responsibleEngineerName || ''),
      },
      actions: {
        title: 'Действия',
        key: 'actions',
        width: 100,
        render: (_: any, record: any) => (
          <Space size="middle">
            <Tooltip title="Просмотр">
              <Button
                size="small"
                type="text"
                icon={<EyeOutlined />}
                onClick={() => setViewId(record.id)}
              />
            </Tooltip>
            <Button size="small" type="text" icon={<PlusOutlined />} onClick={() => setLinkFor(record)} />
            {record.parentId && (
              <Tooltip title="Исключить из связи">
                <Button
                  size="small"
                  type="text"
                  icon={<LinkOutlined style={{ color: '#c41d7f', textDecoration: 'line-through', fontWeight: 700 }} />}
                  onClick={() => handleUnlink(record.id)}
                />
              </Tooltip>
            )}
            <Popconfirm
              title="Удалить замечание?"
              okText="Да"
              cancelText="Нет"
              onConfirm={async () => {
                await deleteTicketMutation.mutateAsync(record.id);
                message.success('Удалено');
              }}
              disabled={deleteTicketMutation.isPending}
            >
              <Button size="small" type="text" danger icon={<DeleteOutlined />} loading={deleteTicketMutation.isPending} />
            </Popconfirm>
          </Space>
        ),
      },
    } as Record<string, ColumnsType<any>[number]>;
  };

  const [columnsState, setColumnsState] = useState<TableColumnSetting[]>(() => {
    const base = getBaseColumns();
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

  /**
   * Сброс колонок к начальному состоянию
   */
  const handleResetColumns = () => {
    const base = getBaseColumns();
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

  const baseColumns = React.useMemo(getBaseColumns, [deleteTicketMutation.isPending]);
  const columns: ColumnsType<any> = React.useMemo(
    () => columnsState.filter((c) => c.visible).map((c) => baseColumns[c.key]),
    [columnsState, baseColumns],
  );

  const total = tickets.length;
  const closedCount = useMemo(
    () => tickets.filter((t) => /закры/i.test(t.statusName ?? '')).length,
    [tickets],
  );
  const openCount = total - closedCount;
  const readyToExport = useMemo(
    () => filterTickets(ticketsWithNames, filters).length,
    [ticketsWithNames, filters],
  );

  return (
    <ConfigProvider locale={ruRU}>
      <>
        <Button
          type="primary"
          onClick={() => setShowAddForm((p) => !p)}
          style={{ marginTop: 16, marginRight: 8 }}
        >
          {showAddForm ? 'Скрыть форму' : 'Добавить замечание'}
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
          <ExportTicketsButton tickets={ticketsWithNames} filters={filters} />
        </span>
        {showAddForm && (
          <div style={{ marginTop: 16 }}>
            <TicketFormAntd
              onCreated={() => {
                qc.invalidateQueries({ queryKey: ['tickets'] });
                hideOnScroll.current = true;
              }}
              initialValues={initialValues}
            />
          </div>
        )}

        <LinkTicketsDialog
          open={!!linkFor}
          parent={linkFor}
          tickets={ticketsWithNames}
          onClose={() => setLinkFor(null)}
          onSubmit={handleLink}
        />
        <TableColumnsDrawer
          open={showColumnsDrawer}
          columns={columnsState}
          onChange={setColumnsState}
          onClose={() => setShowColumnsDrawer(false)}
          onReset={handleResetColumns}
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
              <TicketsFilters
                options={options}
                onChange={setFilters}
                initialValues={initialFilters}
              />
            </Card>
          )}

          {error ? (
            <Alert type="error" message={error.message} />
          ) : (
            <TicketsTable
              tickets={ticketsWithNames}
              filters={filters}
              loading={isLoading}
              columns={columns}
              onView={(id) => setViewId(id)}
              onAddChild={setLinkFor}
              onUnlink={handleUnlink}
            />
          )}
          <Typography.Text style={{ display: 'block', marginTop: 8 }}>
            Всего замечаний: {total}, из них закрытых: {closedCount} и не закрытых: {openCount}
          </Typography.Text>
          <Typography.Text style={{ display: 'block', marginTop: 4 }}>
            Готовых замечаний к выгрузке: {readyToExport}
          </Typography.Text>
        </div>
        <TicketViewModal
          open={viewId !== null}
          ticketId={viewId}
          onClose={() => {
            setViewId(null);
            const params = new URLSearchParams(searchParams);
            params.delete('ticket_id');
            setSearchParams(params, { replace: true });
          }}
        />
      </>
    </ConfigProvider>
  );
}
