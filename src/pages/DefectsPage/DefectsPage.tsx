import React, { useMemo, useState } from "react";
import dayjs from "dayjs";
import {
  ConfigProvider,
  Card,
  Button,
  Typography,
  Tooltip,
  Popconfirm,
  message,
} from "antd";
import {
  SettingOutlined,
  EyeOutlined,
  DeleteOutlined,
  CheckOutlined,
  CheckCircleTwoTone,
  CloseCircleTwoTone,
} from "@ant-design/icons";
import { Tag } from "antd";
import ruRU from "antd/locale/ru_RU";
import { useDefects, useDeleteDefect } from "@/entities/defect";
import { useTicketsSimple } from "@/entities/ticket";
import { useUnitsByIds } from "@/entities/unit";
import { useProjects } from "@/entities/project";
import { useBrigades } from "@/entities/brigade";
import { useContractors } from "@/entities/contractor";
import DefectsTable from "@/widgets/DefectsTable";
import DefectsFilters from "@/widgets/DefectsFilters";
import TableColumnsDrawer from "@/widgets/TableColumnsDrawer";
import type { TableColumnSetting } from "@/shared/types/tableColumnSetting";
import DefectViewModal from "@/features/defect/DefectViewModal";
import DefectStatusSelect from "@/features/defect/DefectStatusSelect";
import ExportDefectsButton from "@/features/defect/ExportDefectsButton";
import DefectFixModal from "@/features/defect/DefectFixModal";
import { filterDefects } from "@/shared/utils/defectFilter";
import formatUnitName from "@/shared/utils/formatUnitName";
import type { DefectWithInfo } from "@/shared/types/defect";
import type { DefectFilters } from "@/shared/types/defectFilters";
import type { ColumnsType } from "antd/es/table";

const fmt = (v: string | null) => (v ? dayjs(v).format("DD.MM.YYYY") : "—");

export default function DefectsPage() {
  const { data: defects = [], isPending } = useDefects();
  const { data: tickets = [] } = useTicketsSimple();
  const unitIds = useMemo(
    () => Array.from(new Set(tickets.flatMap((t) => t.unit_ids || []))),
    [tickets],
  );
  const { data: units = [] } = useUnitsByIds(unitIds);
  const { data: projects = [] } = useProjects();
  const { data: brigades = [] } = useBrigades();
  const { data: contractors = [] } = useContractors();

  const data: DefectWithInfo[] = useMemo(() => {
    const unitMap = new Map(units.map((u) => [u.id, formatUnitName(u)]));
    const projectMap = new Map(projects.map((p) => [p.id, p.name]));
    const ticketsMap = new Map<
      number,
      { id: number; unit_ids: number[]; project_id: number }[]
    >();
    tickets.forEach((t: any) => {
      (t.defect_ids || []).forEach((id: number) => {
        const arr = ticketsMap.get(id) || [];
        arr.push({
          id: t.id,
          unit_ids: t.unit_ids || [],
          project_id: t.project_id,
        });
        ticketsMap.set(id, arr);
      });
    });
    return defects.map((d: any) => {
      const linked = ticketsMap.get(d.id) || [];
      const unitIds = Array.from(new Set(linked.flatMap((l) => l.unit_ids)));
      const unitNamesList = unitIds
        .map((id) => unitMap.get(id))
        .filter(Boolean);
      const unitNames = unitNamesList.join(", ");
      const projectIds = Array.from(new Set(linked.map((l) => l.project_id)));
      const projectNames = projectIds
        .map((id) => projectMap.get(id))
        .filter(Boolean)
        .join(", ");
      let fixByName = "—";
      if (d.brigade_id) {
        fixByName =
          brigades.find((b) => b.id === d.brigade_id)?.name || "Бригада";
      } else if (d.contractor_id) {
        fixByName =
          contractors.find((c) => c.id === d.contractor_id)?.name ||
          "Подрядчик";
      }
      return {
        ...d,
        ticketIds: linked.map((l) => l.id),
        unitIds,
        unitNames,
        unitNamesList,
        projectIds,
        projectNames,
        fixByName,
        is_fixed: d.is_fixed,
        days: d.received_at
          ? dayjs().diff(dayjs(d.received_at), "day") + 1
          : null,
        defectTypeName: d.defect_type?.name ?? "",
        defectStatusName: d.defect_status?.name ?? "",
      } as DefectWithInfo;
    });
  }, [defects, tickets, units, projects]);

  const options = useMemo(() => {
    const uniq = (entries: [number | null, string | null][]) => {
      const map = new Map<number, string>();
      entries.forEach(([id, name]) => {
        if (id != null && name) map.set(id, name);
      });
      return Array.from(map.entries()).map(([value, label]) => ({ value, label }));
    };
    return {
      ids: Array.from(new Set(data.map((d) => d.id))).map((id) => ({
        label: String(id),
        value: id,
      })),
      tickets: Array.from(
        new Set(data.flatMap((d) => d.ticketIds))
      ).map((id) => ({ label: String(id), value: id })),
      units: units.map((u) => ({ label: u.name, value: u.id })),
      projects: projects.map((p) => ({ label: p.name, value: p.id })),
      types: uniq(data.map((d) => [d.defect_type_id, d.defectTypeName])),
      statuses: uniq(data.map((d) => [d.defect_status_id, d.defectStatusName])),
      fixBy: Array.from(new Set(data.map((d) => d.fixByName).filter(Boolean))).map(
        (name) => ({ label: String(name), value: String(name) })
      ),
    };
  }, [data, units, projects]);

  const [filters, setFilters] = useState<DefectFilters>({});
  const [viewId, setViewId] = useState<number | null>(null);
  const [fixId, setFixId] = useState<number | null>(null);
  const { mutateAsync: removeDefect, isPending: removing } = useDeleteDefect();

  const LS_FILTERS_VISIBLE_KEY = "defectsFiltersVisible";
  const LS_COLUMNS_KEY = "defectsColumns";

  const [showFilters, setShowFilters] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_FILTERS_VISIBLE_KEY);
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const baseColumns = useMemo(() => {
    return {
      id: {
        title: "ID дефекта",
        dataIndex: "id",
        sorter: (a: DefectWithInfo, b: DefectWithInfo) => a.id - b.id,
      },
      tickets: {
        title: "ID замечание",
        dataIndex: "ticketIds",
        sorter: (a: DefectWithInfo, b: DefectWithInfo) =>
          a.ticketIds.join(",").localeCompare(b.ticketIds.join(",")),
        render: (v: number[]) => v.join(", "),
      },
      days: {
        title: (
          <span>
            Прошло дней
            <br />с даты получения
          </span>
        ),
        dataIndex: "days",
        sorter: (a: DefectWithInfo, b: DefectWithInfo) =>
          (a.days ?? -1) - (b.days ?? -1),
      },
      project: {
        title: "Проект",
        dataIndex: "projectNames",
        sorter: (a: DefectWithInfo, b: DefectWithInfo) =>
          (a.projectNames || "").localeCompare(b.projectNames || ""),
      },
      units: {
        title: "Объекты",
        dataIndex: "unitNamesList",
        sorter: (a: DefectWithInfo, b: DefectWithInfo) =>
          (a.unitNames || "").localeCompare(b.unitNames || ""),
        render: (_: string[], row: DefectWithInfo) => (
          <>
            {row.unitNamesList?.map((n, i) => (
              <div key={i} style={{ whiteSpace: "nowrap" }}>
                {n}
              </div>
            ))}
          </>
        ),
      },
      description: {
        title: "Описание",
        dataIndex: "description",
        sorter: (a: DefectWithInfo, b: DefectWithInfo) =>
          a.description.localeCompare(b.description),
      },
      type: {
        title: "Тип",
        dataIndex: "defectTypeName",
        sorter: (a: DefectWithInfo, b: DefectWithInfo) =>
          (a.defectTypeName || "").localeCompare(b.defectTypeName || ""),
      },
      status: {
        title: "Статус",
        dataIndex: "defect_status_id",
        sorter: (a: DefectWithInfo, b: DefectWithInfo) =>
          (a.defectStatusName || "").localeCompare(b.defectStatusName || ""),
        render: (_: number, row: DefectWithInfo) => (
          <DefectStatusSelect
            defectId={row.id}
            statusId={row.defect_status_id}
            statusName={row.defectStatusName}
          />
        ),
      },
      fixBy: {
        title: "Кем устраняется",
        dataIndex: "fixByName",
        sorter: (a: DefectWithInfo, b: DefectWithInfo) =>
          (a.fixByName || "").localeCompare(b.fixByName || ""),
      },
      fixed: {
        title: "Устранён",
        dataIndex: "is_fixed",
        sorter: (a: DefectWithInfo, b: DefectWithInfo) =>
          Number(a.is_fixed) - Number(b.is_fixed),
        render: (v: boolean) =>
          v ? (
            <Tag
              icon={<CheckCircleTwoTone twoToneColor="#52c41a" />}
              color="success"
            >
              Да
            </Tag>
          ) : (
            <Tag
              icon={<CloseCircleTwoTone twoToneColor="#eb2f96" />}
              color="default"
            >
              Нет
            </Tag>
          ),
      },
      received: {
        title: "Дата получения",
        dataIndex: "received_at",
        sorter: (a: DefectWithInfo, b: DefectWithInfo) =>
          (a.received_at ? dayjs(a.received_at).valueOf() : 0) -
          (b.received_at ? dayjs(b.received_at).valueOf() : 0),
        render: fmt,
      },
      created: {
        title: "Дата устранения",
        dataIndex: "fixed_at",
        sorter: (a: DefectWithInfo, b: DefectWithInfo) =>
          (a.fixed_at ? dayjs(a.fixed_at).valueOf() : 0) -
          (b.fixed_at ? dayjs(b.fixed_at).valueOf() : 0),
        render: fmt,
      },
      actions: {
        title: "Действия",
        key: "actions",
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
            <Tooltip title="Устранён">
              <Button
                size="small"
                type="text"
                icon={
                  <CheckOutlined style={{ color: "#52c41a", fontSize: 16 }} />
                }
                onClick={() => setFixId(row.id)}
              />
            </Tooltip>
            <Popconfirm
              title="Удалить дефект?"
              okText="Да"
              cancelText="Нет"
              onConfirm={async () => {
                await removeDefect(row.id);
                message.success("Удалено");
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

  const columnOrder = [
    "id",
    "tickets",
    "fixed",
    "days",
    "project",
    "units",
    "description",
    "type",
    "status",
    "fixBy",
    "received",
    "created",
    "actions",
  ] as const;

  const [columnsState, setColumnsState] = useState<TableColumnSetting[]>(() => {
    const base = baseColumns;
    const defaults = columnOrder.map((key) => ({
      key,
      title: base[key].title as string,
      visible: true,
    }));
    try {
      const saved = localStorage.getItem(LS_COLUMNS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as TableColumnSetting[];
        const filtered = parsed.filter((c) => base[c.key]);
        const missing = defaults.filter(
          (d) => !filtered.some((f) => f.key === d.key),
        );
        return [...filtered, ...missing];
      }
    } catch {}
    return defaults;
  });

  const handleResetColumns = () => {
    const base = baseColumns;
    const defaults = columnOrder.map((key) => ({
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
    return columnsState.filter((c) => c.visible).map((c) => base[c.key]);
  }, [columnsState, baseColumns]);

  const [showColumnsDrawer, setShowColumnsDrawer] = useState(false);

  const total = data.length;
  const closedCount = useMemo(
    () =>
      data.filter((d) => d.defectStatusName?.toLowerCase().includes("закры"))
        .length,
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
        <Button
          onClick={() => setShowFilters((p) => !p)}
          style={{ marginTop: 16 }}
        >
          {showFilters ? "Скрыть фильтры" : "Показать фильтры"}
        </Button>
        <Button
          icon={<SettingOutlined />}
          style={{ marginTop: 16, marginLeft: 8 }}
          onClick={() => setShowColumnsDrawer(true)}
        />
        <span style={{ marginTop: 16, marginLeft: 8, display: "inline-block" }}>
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
        <Typography.Text style={{ display: "block", marginTop: 8 }}>
          Всего дефектов: {total}, из них закрытых: {closedCount} и не закрытых:{" "}
          {openCount}
        </Typography.Text>
        <Typography.Text style={{ display: "block", marginTop: 4 }}>
          Готовых дефектов к выгрузке: {readyToExport}
        </Typography.Text>
        <DefectViewModal
          open={viewId !== null}
          defectId={viewId}
          onClose={() => setViewId(null)}
        />
        <DefectFixModal
          open={fixId !== null}
          defectId={fixId}
          onClose={() => setFixId(null)}
        />
      </>
    </ConfigProvider>
  );
}
