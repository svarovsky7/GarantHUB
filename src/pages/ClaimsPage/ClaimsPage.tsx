import React, { useState, useMemo } from "react";
import {
  ConfigProvider,
  Alert,
  Button,
  Tooltip,
  Popconfirm,
  message,
  Space,
  Typography,
} from "antd";
import ruRU from "antd/locale/ru_RU";
import {
  SettingOutlined,
  EyeOutlined,
  DeleteOutlined,
  PlusOutlined,
  LinkOutlined,
  FileTextOutlined,
  BranchesOutlined,
} from "@ant-design/icons";
import ExportClaimsButton from "@/features/claim/ExportClaimsButton";
import { useSnackbar } from "notistack";
import {
  useClaims,
  useClaimsAll,
  useDeleteClaim,
  useLinkClaims,
  useUnlinkClaim,
} from "@/entities/claim";
import { useUsers } from "@/entities/user";
import { useUnitsByIds, useLockedUnitIds } from "@/entities/unit";
import { useRolePermission } from "@/entities/rolePermission";
import { useAuthStore } from "@/shared/store/authStore";
import type { RoleName } from "@/shared/types/rolePermission";
import formatUnitShortName from "@/shared/utils/formatUnitShortName";
const ClaimsTable = React.lazy(() => import("@/widgets/ClaimsTable"));
const ClaimsFilters = React.lazy(() => import("@/widgets/ClaimsFilters"));
const ClaimFormAntd = React.lazy(() => import("@/features/claim/ClaimFormAntd"));
const ClaimViewModal = React.lazy(() => import("@/features/claim/ClaimViewModal"));
const LinkClaimsDialog = React.lazy(() => import("@/features/claim/LinkClaimsDialog"));
const TableColumnsDrawer = React.lazy(
  () => import("@/widgets/TableColumnsDrawer"),
);
import ClaimStatusSelect from "@/features/claim/ClaimStatusSelect";
import dayjs from "dayjs";
import type { TableColumnSetting } from "@/shared/types/tableColumnSetting";
import type { ColumnsType } from "antd/es/table";
import { useSearchParams } from "react-router-dom";
import type { ClaimWithNames } from "@/shared/types/claimWithNames";
import { filterClaims } from "@/shared/utils/claimFilter";
import { naturalCompare } from "@/shared/utils/naturalSort";
import type { ClaimFilters } from "@/shared/types/claimFilters";

const LS_COLUMNS_KEY = "claimsColumns";
const LS_COLUMN_WIDTHS_KEY = "claimsColumnWidths";

export default function ClaimsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const role = useAuthStore((s) => s.profile?.role as RoleName | undefined);
  const { data: perm } = useRolePermission(role);
  const {
    data: claimsAssigned = [],
    isLoading: loadingAssigned,
    error: errorAssigned,
  } = useClaims();
  const {
    data: claimsAllResult = [],
    isLoading: loadingAll,
    error: errorAll,
  } = useClaimsAll();
  
  const claimsAll = Array.isArray(claimsAllResult) ? claimsAllResult : claimsAllResult?.data || [];
  const claims = perm?.only_assigned_project ? claimsAssigned : claimsAll;
  const isLoading = perm?.only_assigned_project ? loadingAssigned : loadingAll;
  const error = errorAssigned || errorAll;
  const deleteClaimMutation = useDeleteClaim();
  const { data: users = [], isPending: usersLoading } = useUsers();
  const unitIds = useMemo(
    () => Array.from(new Set(claims.flatMap((t) => t.unit_ids))),
    [claims],
  );
  const { data: units = [], isPending: unitsLoading } = useUnitsByIds(unitIds);
  const { data: lockedUnitIds = [] } = useLockedUnitIds();
  const filtersLoading = usersLoading || unitsLoading;
  const checkingDefectMap = useMemo(() => new Map<number, boolean>(), []);
  const [searchParams] = useSearchParams();
  const initialValues = {
    project_id: searchParams.get("project_id")
      ? Number(searchParams.get("project_id")!)
      : undefined,
    unit_ids: searchParams.get("unit_id")
      ? [Number(searchParams.get("unit_id")!)]
      : [],
    engineer_id: searchParams.get("engineer_id") || undefined,
  };
  const LS_HIDE_CLOSED = "claimsHideClosed";
  const [filters, setFilters] = useState<ClaimFilters>(() => {
    try {
      const saved = localStorage.getItem(LS_HIDE_CLOSED);
      const hideClosed = saved ? JSON.parse(saved) : false;
      return hideClosed ? { hideClosed } : {};
    } catch {
      return {} as ClaimFilters;
    }
  });
  const [showAddForm, setShowAddForm] = useState(
    searchParams.get("open_form") === "1",
  );
  React.useEffect(() => {
    if (searchParams.get("open_form") === "1") {
      setShowAddForm(true);
    }
  }, [searchParams]);
  const [viewId, setViewId] = useState<number | null>(null);
  const [linkFor, setLinkFor] = useState<ClaimWithNames | null>(null);
  const linkClaims = useLinkClaims();
  const unlinkClaim = useUnlinkClaim();
  const [showColumnsDrawer, setShowColumnsDrawer] = useState(false);
  const [columnsState, setColumnsState] = useState<TableColumnSetting[]>(() => {
    const base = getBaseColumns();
    const defaults = Object.keys(base).map((key) => ({
      key,
      title: base[key].title as string,
      visible: !["createdAt", "createdByName"].includes(key),
    }));
    try {
      const saved = localStorage.getItem(LS_COLUMNS_KEY);
      if (saved) {
        let parsed = JSON.parse(saved) as TableColumnSetting[];
        parsed = parsed.map((c) => {
          if (typeof c.title !== "string") {
            const def = defaults.find((d) => d.key === c.key);
            return { ...c, title: def?.title ?? "" };
          }
          return c;
        });
        const filtered = parsed.filter((c) => base[c.key]);
        const missing = defaults.filter(
          (d) => !filtered.some((f) => f.key === d.key),
        );
        return [...filtered, ...missing];
      }
    } catch {}
    return defaults;
  });

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(
    () => {
      try {
        return JSON.parse(localStorage.getItem(LS_COLUMN_WIDTHS_KEY) || "{}");
      } catch {
        return {};
      }
    },
  );

  /**
   * Сброс колонок к начальному состоянию
   */
  const handleResetColumns = () => {
    const base = getBaseColumns();
    const defaults = Object.keys(base).map((key) => ({
      key,
      title: base[key].title as string,
      visible: !["createdAt", "createdByName"].includes(key),
    }));
    try {
      localStorage.removeItem(LS_COLUMN_WIDTHS_KEY);
    } catch {}
    setColumnWidths({});
    setColumnsState(defaults);
  };

  React.useEffect(() => {
    try {
      localStorage.setItem(LS_COLUMNS_KEY, JSON.stringify(columnsState));
    } catch {}
  }, [columnsState]);

  React.useEffect(() => {
    try {
      localStorage.setItem(LS_COLUMN_WIDTHS_KEY, JSON.stringify(columnWidths));
    } catch {}
  }, [columnWidths]);

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
      map[u.id] = formatUnitShortName(u);
    });
    return map;
  }, [units]);

  const unitNumberMap = useMemo(() => {
    const map = {} as Record<number, string>;
    (units ?? []).forEach((u) => {
      map[u.id] = u.name;
    });
    return map;
  }, [units]);

  const buildingMap = useMemo(() => {
    const map = {} as Record<number, string>;
    (units ?? []).forEach((u) => {
      if (u.building) map[u.id] = u.building;
    });
    return map;
  }, [units]);

  const claimsWithNames: ClaimWithNames[] = useMemo(
    () =>
      claims.map((c) => ({
        ...c,
        unitNames: c.unit_ids
          .map((id) => unitMap[id])
          .filter(Boolean)
          .join(", "),
        unitNumbers: c.unit_ids
          .map((id) => unitNumberMap[id])
          .filter(Boolean)
          .join(", "),
        buildings: Array.from(
          new Set(c.unit_ids.map((id) => buildingMap[id]).filter(Boolean)),
        ).join(", "),
        responsibleEngineerName: userMap[c.engineer_id] ?? null,
        createdByName: userMap[c.created_by as string] ?? null,
      })),
    [claims, unitMap, unitNumberMap, buildingMap, userMap, checkingDefectMap],
  );

  const options = useMemo(() => {
    const without = <K extends keyof ClaimFilters>(key: K) => {
      const { [key]: _omit, ...rest } = filters;
      return rest as ClaimFilters;
    };
    const filtered = <K extends keyof ClaimFilters>(key: K) =>
      filterClaims(claimsWithNames, without(key));

    const uniq = (values: (string | number | undefined | null)[]) =>
      Array.from(new Set(values.filter(Boolean) as (string | number)[])).sort(
        naturalCompare,
      );
    const mapOptions = (vals: (string | number | undefined | null)[]) =>
      uniq(vals).map((v) => ({ label: String(v), value: v }));

    return {
      projects: mapOptions(filtered("project").map((c) => c.projectName)),
      units: mapOptions(
        filtered("units").flatMap((c) =>
          c.unitNumbers ? c.unitNumbers.split(",").map((n) => n.trim()) : [],
        ),
      ),
      buildings: mapOptions(
        filtered("building").flatMap((c) =>
          c.buildings ? c.buildings.split(",").map((n) => n.trim()) : [],
        ),
      ),
      statuses: mapOptions(filtered("status").map((c) => c.statusName)),
      responsibleEngineers: mapOptions(
        filtered("responsible").map((c) => c.responsibleEngineerName),
      ),
      ids: mapOptions(filtered("id").map((c) => c.id)),
      authors: mapOptions(filtered("author").map((c) => c.createdByName)),
    };
  }, [claimsWithNames, filters]);

  function getBaseColumns() {
    return {
      treeIcon: {
        title: "",
        dataIndex: "treeIcon",
        width: 40,
        render: (_: any, record: any) => {
          if (!record.parent_id) {
            return (
              <Tooltip title="Основная претензия">
                <FileTextOutlined style={{ color: "#1890ff", fontSize: 17 }} />
              </Tooltip>
            );
          }
          return (
            <Tooltip title="Связанная претензия">
              <BranchesOutlined style={{ color: "#52c41a", fontSize: 16 }} />
            </Tooltip>
          );
        },
      },
      id: {
        title: "ID",
        dataIndex: "id",
        width: 80,
        sorter: (a: any, b: any) => a.id - b.id,
      },
      projectName: {
        title: "Проект",
        dataIndex: "projectName",
        width: 180,
        sorter: (a: any, b: any) => a.projectName.localeCompare(b.projectName),
      },
      buildings: {
        title: "Корпус",
        dataIndex: "buildings",
        width: 120,
        sorter: (a: any, b: any) =>
          (a.buildings || "").localeCompare(b.buildings || ""),
      },
      unitNames: {
        title: "Объекты",
        dataIndex: "unitNames",
        width: 160,
        sorter: (a: any, b: any) => a.unitNames.localeCompare(b.unitNames),
      },
      statusId: {
        title: "Статус",
        dataIndex: "claim_status_id",
        width: 160,
        sorter: (a: any, b: any) => a.statusName.localeCompare(b.statusName),
        render: (_: any, row: any) => (
          <ClaimStatusSelect
            claimId={row.id}
            statusId={row.claim_status_id}
            statusColor={row.statusColor}
            statusName={row.statusName}
            locked={row.unit_ids?.some((id: number) =>
              lockedUnitIds.includes(id),
            )}
          />
        ),
      },
      claim_no: {
        title: "№ претензии",
        dataIndex: "claim_no",
        width: 160,
        sorter: (a: any, b: any) => a.claim_no.localeCompare(b.claim_no),
      },
      claimedOn: {
        title: "Дата претензии",
        dataIndex: "claimedOn",
        width: 120,
        sorter: (a: any, b: any) =>
          (a.claimedOn ? a.claimedOn.valueOf() : 0) -
          (b.claimedOn ? b.claimedOn.valueOf() : 0),
        render: (v: any) => fmt(v),
      },
      acceptedOn: {
        title: "Дата получения Застройщиком",
        dataIndex: "acceptedOn",
        width: 120,
        sorter: (a: any, b: any) =>
          (a.acceptedOn ? a.acceptedOn.valueOf() : 0) -
          (b.acceptedOn ? b.acceptedOn.valueOf() : 0),
        render: (v: any) => fmt(v),
      },
      registeredOn: {
        title: "Дата регистрации претензии",
        dataIndex: "registeredOn",
        width: 120,
        sorter: (a: any, b: any) =>
          (a.registeredOn ? a.registeredOn.valueOf() : 0) -
          (b.registeredOn ? b.registeredOn.valueOf() : 0),
        render: (v: any) => fmt(v),
      },
      resolvedOn: {
        title: "Дата устранения",
        dataIndex: "resolvedOn",
        width: 120,
        sorter: (a: any, b: any) =>
          (a.resolvedOn ? a.resolvedOn.valueOf() : 0) -
          (b.resolvedOn ? b.resolvedOn.valueOf() : 0),
        render: (v: any) => fmt(v),
      },
      responsibleEngineerName: {
        title: "Закрепленный инженер",
        dataIndex: "responsibleEngineerName",
        width: 180,
        sorter: (a: any, b: any) =>
          (a.responsibleEngineerName || "").localeCompare(
            b.responsibleEngineerName || "",
          ),
      },
      createdAt: {
        title: "Добавлено",
        dataIndex: "createdAt",
        width: 160,
        sorter: (a: any, b: any) =>
          (a.createdAt ? a.createdAt.valueOf() : 0) -
          (b.createdAt ? b.createdAt.valueOf() : 0),
        render: (v: any) => fmtDateTime(v),
      },
      createdByName: {
        title: "Автор",
        dataIndex: "createdByName",
        width: 160,
        sorter: (a: any, b: any) =>
          (a.createdByName || "").localeCompare(b.createdByName || ""),
      },
      actions: {
        title: "Действия",
        key: "actions",
        width: 140,
        render: (_: any, record: ClaimWithNames) => (
          <Space size="middle">
            <Tooltip title="Просмотр">
              <Button
                size="small"
                type="text"
                icon={<EyeOutlined />}
                onClick={() => setViewId(record.id)}
              />
            </Tooltip>
            <Button
              size="small"
              type="text"
              icon={<PlusOutlined />}
              onClick={() => setLinkFor(record)}
            />
            {record.parent_id && (
              <Tooltip title="Исключить из связи">
                <Button
                  size="small"
                  type="text"
                  icon={
                    <LinkOutlined
                      style={{
                        color: "#c41d7f",
                        textDecoration: "line-through",
                        fontWeight: 700,
                      }}
                    />
                  }
                  onClick={() => unlinkClaim.mutate(record.id)}
                />
              </Tooltip>
            )}
            <Popconfirm
              title="Удалить претензию?"
              okText="Да"
              cancelText="Нет"
              onConfirm={async () => {
                await deleteClaimMutation.mutateAsync({ id: record.id });
                message.success("Удалено");
              }}
              disabled={deleteClaimMutation.isPending}
            >
              <Button
                size="small"
                type="text"
                danger
                icon={<DeleteOutlined />}
                loading={deleteClaimMutation.isPending}
              />
            </Popconfirm>
          </Space>
        ),
      },
    } as Record<string, ColumnsType<any>[number]>;
  }

  const baseColumns = useMemo(() => {
    const cols = getBaseColumns();
    Object.keys(cols).forEach((key) => {
      cols[key] = { ...cols[key], width: columnWidths[key] ?? cols[key].width };
    });
    return cols;
  }, [columnWidths, deleteClaimMutation.isPending]);
  const columns: ColumnsType<any> = useMemo(
    () => columnsState.filter((c) => c.visible).map((c) => baseColumns[c.key]),
    [columnsState, baseColumns],
  );

  /** Общее количество претензий после учёта прав доступа */
  const total = claimsWithNames.length;
  /** Количество претензий со статусом, содержащим "закры" */
  const closedCount = useMemo(
    () =>
      claimsWithNames.filter((c) => /закры/i.test(c.statusName ?? "")).length,
    [claimsWithNames],
  );
  /** Количество открытых претензий */
  const openCount = total - closedCount;
  /** Сколько претензий пройдёт в выгрузку с учётом фильтров */
  const readyToExport = useMemo(
    () => filterClaims(claimsWithNames, filters).length,
    [claimsWithNames, filters],
  );

  const applyFilters = (vals: ClaimFilters) => {
    setFilters(vals);
    if (Object.prototype.hasOwnProperty.call(vals, "hideClosed")) {
      try {
        localStorage.setItem(LS_HIDE_CLOSED, JSON.stringify(vals.hideClosed));
      } catch {}
    }
    const count = filterClaims(claimsWithNames, vals).length;
    message.success(`Фильтры применены (${count} результатов)`);
  };

  const resetFilters = () => {
    setFilters({});
    try {
      localStorage.setItem(LS_HIDE_CLOSED, "false");
    } catch {}
    message.info("Фильтры сброшены");
  };

  return (
    <ConfigProvider locale={ruRU}>
      <>
        <Button
          type="primary"
          onClick={() => setShowAddForm((p) => !p)}
          style={{ marginRight: 8 }}
        >
          {showAddForm ? "Скрыть форму" : "Добавить претензию"}
        </Button>
        <Button
          icon={<SettingOutlined />}
          style={{ marginLeft: 8 }}
          onClick={() => setShowColumnsDrawer(true)}
        />
        <span style={{ marginLeft: 8, display: "inline-block" }}>
          <ExportClaimsButton claims={claimsWithNames} filters={filters} />
        </span>
        {showAddForm && (
          <div style={{ marginTop: 16 }}>
            <React.Suspense fallback={<div>Загрузка формы...</div>}>
              <ClaimFormAntd
                onCreated={() => setShowAddForm(false)}
                initialValues={initialValues}
              />
            </React.Suspense>
          </div>
        )}
        <React.Suspense fallback={null}>
          <LinkClaimsDialog
            open={!!linkFor}
            parent={linkFor}
            claims={claimsWithNames}
            loading={linkClaims.isPending}
            onClose={() => setLinkFor(null)}
            onSubmit={(ids) =>
              linkClaims.mutate(
                { parentId: String(linkFor!.id), childIds: ids },
                {
                  onSuccess: () => {
                    message.success("Претензии связаны");
                    setLinkFor(null);
                  },
                  onError: (e) => message.error(e.message),
                },
              )
            }
          />
        </React.Suspense>
        <React.Suspense fallback={null}>
          <TableColumnsDrawer
            open={showColumnsDrawer}
            columns={columnsState}
            widths={
              Object.fromEntries(
                Object.keys(baseColumns).map((k) => [
                  k,
                  columnWidths[k] ?? baseColumns[k].width,
                ]),
              ) as Record<string, number>
            }
            onWidthsChange={setColumnWidths}
            onChange={setColumnsState}
            onClose={() => setShowColumnsDrawer(false)}
            onReset={handleResetColumns}
          />
        </React.Suspense>
        <div style={{ marginTop: 24 }}>
          <div style={{ marginBottom: 24, maxWidth: 1040 }}>
            <React.Suspense fallback={<div>Загрузка фильтров...</div>}>
              <ClaimsFilters
                options={options}
                loading={filtersLoading}
                initialValues={filters}
                onSubmit={applyFilters}
                onReset={resetFilters}
              />
            </React.Suspense>
          </div>
          {error ? (
            <Alert type="error" message={error.message} />
          ) : (
            <React.Suspense fallback={<div>Загрузка таблицы...</div>}>
              <ClaimsTable
                claims={claimsWithNames}
                filters={filters}
                loading={isLoading}
                columns={columns}
                lockedUnitIds={lockedUnitIds}
                onView={(id) => setViewId(id)}
                onAddChild={setLinkFor}
                onUnlink={(id) => unlinkClaim.mutate(id)}
              />
            </React.Suspense>
          )}
        </div>
        <Typography.Text style={{ display: "block", marginTop: 8 }}>
          Всего претензий: {total}, из них закрытых: {closedCount} и не
          закрытых: {openCount}
        </Typography.Text>
        <Typography.Text style={{ display: "block", marginTop: 4 }}>
          Готовых претензий к выгрузке: {readyToExport}
        </Typography.Text>
        <React.Suspense fallback={null}>
          <ClaimViewModal
            open={viewId !== null}
            claimId={viewId}
            onClose={() => setViewId(null)}
          />
        </React.Suspense>
      </>
    </ConfigProvider>
  );
}

function fmt(d: any) {
  return d && dayjs.isDayjs(d) && d.isValid() ? d.format("DD.MM.YYYY") : "—";
}

function fmtDateTime(d: any) {
  return d && dayjs.isDayjs(d) && d.isValid()
    ? d.format("DD.MM.YYYY HH:mm")
    : "—";
}
