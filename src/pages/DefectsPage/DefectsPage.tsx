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
  CloseOutlined,
} from "@ant-design/icons";

import ruRU from "antd/locale/ru_RU";
import { useDefects, useDeleteDefect } from "@/entities/defect";
import { useUnitsByIds } from "@/entities/unit";
import { useVisibleProjects } from "@/entities/project";
import { useBrigades } from "@/entities/brigade";
import { useContractors } from "@/entities/contractor";
import { useRolePermission } from "@/entities/rolePermission";
import { useClaimsSimple, useClaimsSimpleAll } from "@/entities/claim";
import { useAuthStore } from "@/shared/store/authStore";
import type { RoleName } from "@/shared/types/rolePermission";
import DefectsTable from "@/widgets/DefectsTable";
import DefectsFilters from "@/widgets/DefectsFilters";
import TableColumnsDrawer from "@/widgets/TableColumnsDrawer";
import type { TableColumnSetting } from "@/shared/types/tableColumnSetting";
import DefectViewModal from "@/features/defect/DefectViewModal";
import DefectStatusSelect from "@/features/defect/DefectStatusSelect";
import ExportDefectsButton from "@/features/defect/ExportDefectsButton";
import DefectFixModal from "@/features/defect/DefectFixModal";
import { useCancelDefectFix } from "@/entities/defect";
import { filterDefects } from "@/shared/utils/defectFilter";
import { naturalCompare, naturalCompareArrays } from "@/shared/utils/naturalSort";
import formatUnitName from "@/shared/utils/formatUnitName";
import { useUsers } from "@/entities/user";
import type { DefectWithInfo } from "@/shared/types/defect";
import type { DefectFilters } from "@/shared/types/defectFilters";
import type { ColumnsType } from "antd/es/table";

const fmt = (v: string | null) => (v ? dayjs(v).format("DD.MM.YYYY") : "—");
const fmtDateTime = (v: string | null) =>
  v ? dayjs(v).format("DD.MM.YYYY HH:mm") : "—";

export default function DefectsPage() {
  const { data: defects = [], isPending } = useDefects();
  const role = useAuthStore((s) => s.profile?.role as RoleName | undefined);
  const { data: perm } = useRolePermission(role);
  const { data: claimsAll = [] } = useClaimsSimpleAll();
  const { data: claimsAssigned = [] } = useClaimsSimple();
  const claims = perm?.only_assigned_project ? claimsAssigned : claimsAll;
  const defectUnitIds = useMemo(
    () => defects.map((d) => d.unit_id).filter(Boolean) as number[],
    [defects],
  );
  const unitIds = useMemo(
    () =>
      Array.from(
        new Set([
          ...claims.flatMap((t) => t.unit_ids || []),
          ...defectUnitIds,
        ]),
      ),
    [claims, defectUnitIds],
  );
  const { data: units = [] } = useUnitsByIds(unitIds);
  const { data: projects = [] } = useVisibleProjects();
  const { data: brigades = [] } = useBrigades();
  const { data: contractors = [] } = useContractors();
  const { data: users = [] } = useUsers();

  const userProjectIds = useAuthStore((s) => s.profile?.project_ids) ?? [];
  const userMap = useMemo(() => {
    const map = new Map<string, string>();
    users.forEach((u) => {
      map.set(u.id, u.name);
    });
    return map;
  }, [users]);

  const toNum = (v: string | number | null | undefined): number | undefined =>
    v == null ? undefined : Number(v);

  const data: DefectWithInfo[] = useMemo(() => {
    const unitMap = new Map(units.map((u) => [u.id, formatUnitName(u, false)]));
    const buildingMap = new Map(units.map((u) => [u.id, u.building || ""]));
    const projectMap = new Map(projects.map((p) => [p.id, p.name]));
    const ticketsMap = new Map<number, { id: number; unit_ids: number[]; project_id: number }[]>();
    // замена: no tickets
    const claimsMap = new Map<
      number,
      { id: number; unit_ids: number[]; project_id: number; pre_trial_claim: boolean }[]
    >();
    claims.forEach((c: any) => {
      (c.claim_defects || []).forEach((cd: any) => {
        const defectId = toNum(cd.defect_id);
        const arr = claimsMap.get(defectId!) || [];
        arr.push({
          id: toNum(c.id)!,
          unit_ids: (c.unit_ids || []).map(toNum).filter(Boolean) as number[],
          project_id: toNum(c.project_id)!,
          pre_trial_claim: cd.pre_trial_claim ?? false,
        });
        claimsMap.set(defectId!, arr);
      });
    });
    return defects.map((d: any) => {
      const claimLinked = claimsMap.get(toNum(d.id)!) || [];
      const linked = claimLinked;
      const hasPretrial = linked.some((l) => l.pre_trial_claim);
      const unitIdsFromClaims = Array.from(new Set(linked.flatMap((l) => l.unit_ids)));
      const unitIds = unitIdsFromClaims.length
        ? unitIdsFromClaims
        : d.unit_id != null
        ? [d.unit_id]
        : [];
      const unitNamesList = unitIds
        .map((id) => unitMap.get(id))
        .filter(Boolean);
      const unitNames = unitNamesList.join(", ");
      const buildingNamesList = Array.from(
        new Set(unitIds.map((id) => buildingMap.get(id)).filter(Boolean)),
      );
      const buildingNames = buildingNamesList.join(", ");
      const projectIdsFromClaims = Array.from(new Set(linked.map((l) => l.project_id)));
      const projectIds = projectIdsFromClaims.length
        ? projectIdsFromClaims
        : d.project_id != null
        ? [d.project_id]
        : [];
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
        claimIds: claimLinked.map((l) => l.id),
        hasPretrialClaim: hasPretrial,
        createdByName: userMap.get(d.created_by as string) ?? null,
        unitIds,
        unitNames,
        unitNamesList,
        buildingNamesList,
        buildingNames,
        projectIds,
        projectNames,
        fixByName,
        days: d.received_at
          ? dayjs().diff(dayjs(d.received_at), "day") + 1
          : null,
        defectTypeName: d.defect_type?.name ?? "",
        defectStatusName: d.defect_status?.name ?? "",
        defectStatusColor: d.defect_status?.color ?? null,
      } as DefectWithInfo;
    });
  }, [defects, claims, units, projects, userMap]);

  const filteredData = useMemo(() => {
    if (perm?.only_assigned_project) {
      return data.filter((d) =>
        (d.projectIds || []).some((id) => userProjectIds.includes(id)),
      );
    }
    return data;
  }, [data, perm?.only_assigned_project, userProjectIds]);

  const [filters, setFilters] = useState<DefectFilters>({});

  const options = useMemo(() => {
    const without = <K extends keyof DefectFilters>(key: K) => {
      const { [key]: _omit, ...rest } = filters;
      return rest as DefectFilters;
    };
    const filtered = <K extends keyof DefectFilters>(key: K) =>
      filterDefects(filteredData, without(key));

    const uniq = (values: (string | number | null | undefined)[]) =>
      Array.from(new Set(values.filter(Boolean) as (string | number)[])).sort(naturalCompare);
    const mapOptions = (vals: (string | number | null | undefined)[]) =>
      uniq(vals).map((v) => ({ label: String(v), value: v }));

    const uniqPairs = (pairs: [number | null, string | null][]) => {
      const map = new Map<number, string>();
      pairs.forEach(([id, name]) => {
        if (id != null && name) map.set(id, name);
      });
      return Array.from(map.entries())
        .sort((a, b) => naturalCompare(a[1], b[1]))
        .map(([value, label]) => ({ value, label }));
    };

    const unitMap = new Map(units.map((u) => [u.id, u.name]));
    const projectMap = new Map(projects.map((p) => [p.id, p.name]));

    return {
      ids: mapOptions(filtered('id').map((d) => d.id)),
      units: Array.from(
        new Set(filtered('units').flatMap((d) => d.unitIds)),
      )
        .map((id) => ({ label: unitMap.get(id) ?? String(id), value: id }))
        .sort((a, b) => naturalCompare(a.label, b.label)),
      buildings: mapOptions(
        filtered('building').flatMap((d) => d.buildingNamesList || []),
      ),
      projects: Array.from(
        new Set(filtered('projectId').flatMap((d) => d.projectIds || [])),
      )
        .map((id) => ({ label: projectMap.get(id) ?? String(id), value: id }))
        .sort((a, b) => naturalCompare(a.label, b.label)),
      types: uniqPairs(filtered('typeId').map((d) => [d.type_id, d.defectTypeName])),
      statuses: uniqPairs(
        filtered('statusId').map((d) => [d.status_id, d.defectStatusName]),
      ),
      fixBy: mapOptions(filtered('fixBy').map((d) => d.fixByName)),
    };
  }, [filteredData, filters, units, projects]);
  const [viewId, setViewId] = useState<number | null>(null);
  const [fixId, setFixId] = useState<number | null>(null);
  const { mutateAsync: removeDefect, isPending: removing } = useDeleteDefect();
  const cancelFix = useCancelDefectFix();

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
        width: 80,
        sorter: (a: DefectWithInfo, b: DefectWithInfo) => a.id - b.id,
        defaultSortOrder: 'descend' as const,
      },
      claims: {
        title: "ID претензии",
        dataIndex: "claimIds",
        width: 120,
        sorter: (a: DefectWithInfo, b: DefectWithInfo) =>
          naturalCompareArrays(a.claimIds, b.claimIds),
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
        width: 120,
        sorter: (a: DefectWithInfo, b: DefectWithInfo) =>
          (a.days ?? -1) - (b.days ?? -1),
      },
      project: {
        title: "Проект",
        dataIndex: "projectNames",
        width: 180,
        sorter: (a: DefectWithInfo, b: DefectWithInfo) =>
          (a.projectNames || "").localeCompare(b.projectNames || ""),
      },
      building: {
        title: "Корпус",
        dataIndex: "buildingNames",
        width: 120,
        sorter: (a: DefectWithInfo, b: DefectWithInfo) =>
          (a.buildingNames || "").localeCompare(b.buildingNames || ""),
      },
      units: {
        title: "Объекты",
        dataIndex: "unitNamesList",
        width: 160,
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
        width: 220,
        sorter: (a: DefectWithInfo, b: DefectWithInfo) =>
          a.description.localeCompare(b.description),
      },
      type: {
        title: "Тип",
        dataIndex: "defectTypeName",
        width: 120,
        sorter: (a: DefectWithInfo, b: DefectWithInfo) =>
          (a.defectTypeName || "").localeCompare(b.defectTypeName || ""),
      },
      status: {
        title: "Статус",
        dataIndex: "status_id",
        width: 160,
        sorter: (a: DefectWithInfo, b: DefectWithInfo) =>
          (a.defectStatusName || "").localeCompare(b.defectStatusName || ""),
        render: (_: number, row: DefectWithInfo) => (
          <DefectStatusSelect
            defectId={row.id}
            statusId={row.status_id}
            statusName={row.defectStatusName}
            statusColor={row.defectStatusColor}
          />
        ),
      },
      fixBy: {
        title: "Кем устраняется",
        dataIndex: "fixByName",
        width: 180,
        sorter: (a: DefectWithInfo, b: DefectWithInfo) =>
          (a.fixByName || "").localeCompare(b.fixByName || ""),
      },
      received: {
        title: "Дата получения",
        dataIndex: "received_at",
        width: 120,
        sorter: (a: DefectWithInfo, b: DefectWithInfo) =>
          (a.received_at ? dayjs(a.received_at).valueOf() : 0) -
          (b.received_at ? dayjs(b.received_at).valueOf() : 0),
        render: fmt,
      },
      createdAt: {
        title: "Добавлено",
        dataIndex: "created_at",
        width: 160,
        sorter: (a: DefectWithInfo, b: DefectWithInfo) =>
          (a.created_at ? dayjs(a.created_at).valueOf() : 0) -
          (b.created_at ? dayjs(b.created_at).valueOf() : 0),
        render: fmtDateTime,
      },
      createdByName: {
        title: "Автор",
        dataIndex: "createdByName",
        width: 160,
        sorter: (a: DefectWithInfo, b: DefectWithInfo) =>
          (a.createdByName || "").localeCompare(b.createdByName || ""),
      },
      created: {
        title: "Дата устранения",
        dataIndex: "fixed_at",
        width: 120,
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
            {row.defectStatusName?.toLowerCase().includes("провер") ? (
              <Tooltip title="Отменить подтверждение">
                <Popconfirm
                  title="Отменить подтверждение устранения?"
                  okText="Да"
                  cancelText="Нет"
                  onConfirm={() => cancelFix.mutate(row.id)}
                  disabled={cancelFix.isPending}
                >
                  <Button
                    size="small"
                    type="text"
                    danger
                    icon={
                      <CloseOutlined style={{ color: "#ff4d4f", fontSize: 16 }} />
                    }
                    loading={cancelFix.isPending}
                  />
                </Popconfirm>
              </Tooltip>
            ) : (
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
            )}
            {perm?.delete_tables.includes('defects') && (
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
            )}
          </>
        ),
      } as any,
    } as Record<string, ColumnsType<DefectWithInfo>[number]>;
  }, [removeDefect, removing]);

  const columnOrder = [
    "id",
    "claims",
    "days",
    "project",
    "building",
    "units",
    "description",
    "type",
    "status",
    "fixBy",
    "received",
    "createdAt",
    "createdByName",
    "created",
    "actions",
  ] as const;

  const getTitleText = (t: React.ReactNode): string => {
    if (typeof t === 'string') return t;
    if (React.isValidElement(t)) {
      return React.Children.toArray(t.props.children).join(' ');
    }
    return String(t);
  };

  const [columnsState, setColumnsState] = useState<TableColumnSetting[]>(() => {
    const base = baseColumns;
      const defaults = columnOrder.map((key) => ({
        key,
        title: getTitleText(base[key].title as React.ReactNode),
        visible: !["createdAt", "createdByName"].includes(key),
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
      title: getTitleText(base[key].title as React.ReactNode),
      visible: !["createdAt", "createdByName"].includes(key),
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

  const total = filteredData.length;
  const closedCount = useMemo(
    () =>
      filteredData.filter((d) => d.defectStatusName?.toLowerCase().includes("закры"))
        .length,
    [filteredData],
  );
  const openCount = total - closedCount;
  const readyToExport = useMemo(
    () => filterDefects(filteredData, filters).length,
    [filteredData, filters],
  );

  return (
    <ConfigProvider locale={ruRU}>
      <>
        <Button onClick={() => setShowFilters((p) => !p)}>
          {showFilters ? "Скрыть фильтры" : "Показать фильтры"}
        </Button>
        <Button icon={<SettingOutlined />} style={{ marginLeft: 8 }} onClick={() => setShowColumnsDrawer(true)} />
        <span style={{ marginLeft: 8, display: "inline-block" }}>
          <ExportDefectsButton defects={filteredData} filters={filters} />
        </span>
        {showFilters && (
          <Card style={{ marginTop: 16, marginBottom: 24 }}>
            <DefectsFilters options={options} onChange={setFilters} />
          </Card>
        )}
        <DefectsTable
          defects={filteredData}
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
