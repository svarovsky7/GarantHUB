import React, { useState, useMemo, useCallback, memo } from "react";
import {
  ConfigProvider,
  Alert,
  Button,
  Tooltip,
  message,
  Space,
  Typography,
} from "antd";
import ruRU from "antd/locale/ru_RU";
import {
  SettingOutlined,
  PlusOutlined,
  EyeOutlined,
  DeleteOutlined,
  BranchesOutlined,
  FileTextOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import { useSnackbar } from "notistack";
import {
  useClaims,
  useClaimsAllLegacy,
  useLinkClaims,
  useUnlinkClaim,
} from "@/entities/claim";
import { useUsers } from "@/entities/user";
import { useUnitsByIds, useLockedUnitIds } from "@/entities/unit";
import { useRolePermission } from "@/entities/rolePermission";
import { useAuthStore } from "@/shared/store/authStore";
import type { RoleName } from "@/shared/types/rolePermission";
import formatUnitShortName from "@/shared/utils/formatUnitShortName";
import ClaimsTable from "@/widgets/ClaimsTable";
import ClaimsFilters from "@/widgets/ClaimsFilters";
import ClaimFormAntd from "@/features/claim/ClaimFormAntd";
import ClaimViewModal from "@/features/claim/ClaimViewModal";
import LinkClaimsDialog from "@/features/claim/LinkClaimsDialog";
import ExportClaimsButton from "@/features/claim/ExportClaimsButton";
import { useSearchParams } from "react-router-dom";
import type { ClaimWithNames } from "@/shared/types/claimWithNames";
import type { ClaimFilters } from "@/shared/types/claimFilters";
import type { TableColumnSetting } from "@/shared/types/tableColumnSetting";
import type { ColumnsType } from "antd/es/table";
import { filterClaims } from "@/shared/utils/claimFilter";

import type { ClaimTableData } from './types/ClaimTableData';
import dayjs from "dayjs";
import ClaimStatusSelect from "@/features/claim/ClaimStatusSelect";
import { useDeleteClaim } from "@/entities/claim";
import { Popconfirm } from "antd";
import { useVisibleProjects } from "@/entities/project";

// Lazy loading для тяжелых компонентов
const TableColumnsDrawer = React.lazy(
  () => import("@/widgets/TableColumnsDrawer"),
);

const LS_COLUMNS_KEY = "claimsColumns";
const LS_COLUMN_WIDTHS_KEY = "claimsColumnWidths";

export default function ClaimsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const role = useAuthStore((s) => s.profile?.role as RoleName | undefined);
  const { data: perm } = useRolePermission(role);
  
  // Оптимизированная загрузка данных
  const {
    data: claimsAssigned = [],
    isLoading: loadingAssigned,
    error: errorAssigned,
  } = useClaims();
  const {
    data: claimsAll = [],
    isLoading: loadingAll,
    error: errorAll,
  } = useClaimsAllLegacy();
  
  const claims = perm?.only_assigned_project ? claimsAssigned : claimsAll;
  const isLoading = perm?.only_assigned_project ? loadingAssigned : loadingAll;
  const error = errorAssigned || errorAll;

  // Ленивая загрузка пользователей и юнитов
  const { data: users = [], isPending: usersLoading } = useUsers();
  const { data: lockedUnitIds = [] } = useLockedUnitIds();
  const { data: projects = [] } = useVisibleProjects();
  
  // Получаем только нужные unit IDs
  const unitIds = useMemo(
    () => Array.from(new Set(claims.flatMap((t) => (t.unit_ids || []) as number[]))),
    [claims],
  );
  const { data: units = [], isPending: unitsLoading } = useUnitsByIds(unitIds);

  // Состояние компонента
  const [searchParams] = useSearchParams();
  
  
  const [showAddForm, setShowAddForm] = useState(
    searchParams.get("open_form") === "1",
  );
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ClaimFilters>({});
  const [viewId, setViewId] = useState<number | null>(null);
  const [linkFor, setLinkFor] = useState<ClaimWithNames | null>(null);
  const [showColumnsDrawer, setShowColumnsDrawer] = useState(false);

  // Состояние колонок таблицы
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    try {
      return JSON.parse(localStorage.getItem(LS_COLUMN_WIDTHS_KEY) || "{}");
    } catch {
      return {};
    }
  });

  // Mutations
  const linkClaims = useLinkClaims();
  const unlinkClaim = useUnlinkClaim();
  const { mutateAsync: remove, isPending: removing } = useDeleteClaim();

  // Хелперы для форматирования
  const fmt = (d: dayjs.Dayjs | null | undefined) =>
    d && dayjs.isDayjs(d) && d.isValid() ? d.format("DD.MM.YYYY") : "—";
  const fmtDateTime = (d: dayjs.Dayjs | null | undefined) =>
    d && dayjs.isDayjs(d) && d.isValid() ? d.format("DD.MM.YYYY HH:mm") : "—";

  // Мемоизированные мапы для производительности
  const userMap = useMemo(() => {
    const map = {} as Record<string, string>;
    users.forEach((u) => {
      map[u.id] = u.name;
    });
    return map;
  }, [users]);

  const unitMap = useMemo(() => {
    const map = {} as Record<number, string>;
    units.forEach((u) => {
      map[u.id] = formatUnitShortName(u);
    });
    return map;
  }, [units]);

  const unitNumberMap = useMemo(() => {
    const map = {} as Record<number, string>;
    units.forEach((u) => {
      map[u.id] = u.name;
    });
    return map;
  }, [units]);

  const buildingMap = useMemo(() => {
    const map = {} as Record<number, string>;
    units.forEach((u) => {
      if (u.building) map[u.id] = u.building;
    });
    return map;
  }, [units]);

  // Мемоизированные претензии с именами
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
    [claims, unitMap, unitNumberMap, buildingMap, userMap],
  );

  // Фильтрованные претензии
  const filteredClaims = useMemo(
    () => {
      console.log('ClaimsPage: Фильтруем претензии');
      console.log('ClaimsPage: Всего претензий до фильтрации:', claimsWithNames.length);
      console.log('ClaimsPage: Текущие фильтры:', filters);
      const result = filterClaims(claimsWithNames, filters);
      console.log('ClaimsPage: Результат фильтрации:', result.length);
      return result;
    },
    [claimsWithNames, filters],
  );

  // Опции для фильтров
  const filterOptions = useMemo(() => {
    console.log('ClaimsPage: Формируем опции для фильтров');
    console.log('ClaimsPage: Проекты:', projects);
    console.log('ClaimsPage: Объекты:', units);
    
    const uniqueProjects = Array.from(new Set(projects.map(p => ({ value: p.id, label: p.name }))))
      .sort((a, b) => a.label.localeCompare(b.label));

    const uniqueUnits = Array.from(new Set(units.map(u => ({ value: u.id, label: formatUnitShortName(u) }))))
      .sort((a, b) => a.label.localeCompare(b.label));

    const uniqueBuildings = Array.from(
      new Set(claimsWithNames.map(c => c.buildings).filter(Boolean))
    ).map(building => ({ value: building, label: building }))
      .sort((a, b) => a.label.localeCompare(b.label));

    const uniqueStatuses = Array.from(
      new Set(claimsWithNames.map(c => ({ id: c.claim_status_id, name: c.statusName })).filter(s => s.name))
    ).map(s => ({ value: s.id, label: s.name }))
      .sort((a, b) => a.label.localeCompare(b.label));

    const uniqueEngineers = Array.from(
      new Set(claimsWithNames.map(c => c.responsibleEngineerName).filter(Boolean))
    ).map(name => ({ value: name, label: name }))
      .sort((a, b) => a.label.localeCompare(b.label));

    const uniqueAuthors = Array.from(
      new Set(claimsWithNames.map(c => c.createdByName).filter(Boolean))
    ).map(name => ({ value: name, label: name }))
      .sort((a, b) => a.label.localeCompare(b.label));

    const uniqueIds = claimsWithNames.map(c => ({ value: c.id, label: c.id.toString() }))
      .sort((a, b) => b.value - a.value);

    return {
      projects: uniqueProjects,
      units: uniqueUnits,
      buildings: uniqueBuildings,
      statuses: uniqueStatuses,
      responsibleEngineers: uniqueEngineers,
      authors: uniqueAuthors,
      ids: uniqueIds,
    };
  }, [projects, units, claimsWithNames]);


  // Мемоизированная статистика
  const statistics = useMemo(() => {
    const total = claimsWithNames.length;
    const closedCount = claimsWithNames.filter((c) => /закры/i.test(c.statusName ?? "")).length;
    const openCount = total - closedCount;
    const filteredTotal = filteredClaims.length;
    return { total, closedCount, openCount, filteredTotal };
  }, [claimsWithNames, filteredClaims]);

  const { total, closedCount, openCount, filteredTotal } = statistics;

  // Мемоизированные обработчики для лучшей производительности

  const handleView = useCallback((id: number) => setViewId(id), []);
  const handleAddChild = useCallback((parent: ClaimWithNames) => setLinkFor(parent), []);
  const handleUnlink = useCallback((id: number) => unlinkClaim.mutate(id), [unlinkClaim]);
  const handleShowAddForm = useCallback(() => setShowAddForm(p => !p), []);
  const handleShowFilters = useCallback(() => setShowFilters(p => !p), []);
  const handleShowColumnsDrawer = useCallback(() => setShowColumnsDrawer(true), []);
  const handleCloseColumnsDrawer = useCallback(() => setShowColumnsDrawer(false), []);
  const handleCloseAddForm = useCallback(() => setShowAddForm(false), []);
  const handleCloseViewModal = useCallback(() => setViewId(null), []);
  const handleCloseLinkDialog = useCallback(() => setLinkFor(null), []);
  const handleSubmitFilters = useCallback((newFilters: ClaimFilters) => {
    console.log('ClaimsPage: Применяем фильтры:', newFilters);
    setFilters(newFilters);
  }, []);
  const handleResetFilters = useCallback(() => {
    console.log('ClaimsPage: Сброс фильтров');
    setFilters({});
  }, []);

  // Базовые колонки таблицы
  const baseColumns = useMemo(() => {
    const cols = {
      treeIcon: {
        title: "",
        dataIndex: "treeIcon",
        width: 40,
        render: (_: unknown, record: ClaimTableData) => {
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
        sorter: (a: ClaimTableData, b: ClaimTableData) => a.id - b.id,
      },
      projectName: {
        title: "Проект",
        dataIndex: "projectName",
        width: 180,
        sorter: (a: ClaimTableData, b: ClaimTableData) => a.projectName.localeCompare(b.projectName),
      },
      buildings: {
        title: "Корпус",
        dataIndex: "buildings",
        width: 120,
        sorter: (a: ClaimTableData, b: ClaimTableData) => (a.buildings || "").localeCompare(b.buildings || ""),
      },
      unitNames: {
        title: "Объекты",
        dataIndex: "unitNames",
        width: 160,
        sorter: (a: ClaimTableData, b: ClaimTableData) => a.unitNames.localeCompare(b.unitNames),
      },
      claim_status_id: {
        title: "Статус",
        dataIndex: "claim_status_id",
        width: 160,
        sorter: (a: ClaimTableData, b: ClaimTableData) => a.statusName.localeCompare(b.statusName),
        render: (_: unknown, row: ClaimTableData) => (
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
        sorter: (a: ClaimTableData, b: ClaimTableData) => a.claim_no.localeCompare(b.claim_no),
      },
      claimedOn: {
        title: "Дата претензии",
        dataIndex: "claimedOn",
        width: 120,
        sorter: (a: ClaimTableData, b: ClaimTableData) =>
          (a.claimedOn ? a.claimedOn.valueOf() : 0) -
          (b.claimedOn ? b.claimedOn.valueOf() : 0),
        render: (v: dayjs.Dayjs | null) => fmt(v),
      },
      acceptedOn: {
        title: "Дата получения Застройщиком",
        dataIndex: "acceptedOn",
        width: 120,
        sorter: (a: ClaimTableData, b: ClaimTableData) =>
          (a.acceptedOn ? a.acceptedOn.valueOf() : 0) -
          (b.acceptedOn ? b.acceptedOn.valueOf() : 0),
        render: (v: dayjs.Dayjs | null) => fmt(v),
      },
      registeredOn: {
        title: "Дата регистрации претензии",
        dataIndex: "registeredOn",
        width: 120,
        sorter: (a: ClaimTableData, b: ClaimTableData) =>
          (a.registeredOn ? a.registeredOn.valueOf() : 0) -
          (b.registeredOn ? b.registeredOn.valueOf() : 0),
        render: (v: dayjs.Dayjs | null) => fmt(v),
      },
      resolvedOn: {
        title: "Дата устранения",
        dataIndex: "resolvedOn",
        width: 120,
        sorter: (a: ClaimTableData, b: ClaimTableData) =>
          (a.resolvedOn ? a.resolvedOn.valueOf() : 0) -
          (b.resolvedOn ? b.resolvedOn.valueOf() : 0),
        render: (v: dayjs.Dayjs | null) => fmt(v),
      },
      responsibleEngineerName: {
        title: "Закрепленный инженер",
        dataIndex: "responsibleEngineerName",
        width: 180,
        sorter: (a: ClaimTableData, b: ClaimTableData) =>
          (a.responsibleEngineerName || "").localeCompare(
            b.responsibleEngineerName || "",
          ),
      },
      createdAt: {
        title: "Добавлено",
        dataIndex: "createdAt",
        width: 160,
        sorter: (a: ClaimTableData, b: ClaimTableData) =>
          (a.createdAt ? a.createdAt.valueOf() : 0) -
          (b.createdAt ? b.createdAt.valueOf() : 0),
        render: (v: dayjs.Dayjs | null) => fmtDateTime(v),
      },
      createdByName: {
        title: "Автор",
        dataIndex: "createdByName",
        width: 160,
        sorter: (a: ClaimTableData, b: ClaimTableData) =>
          (a.createdByName || "").localeCompare(b.createdByName || ""),
      },
      actions: {
        title: "Действия",
        key: "actions",
        width: 140,
        render: (_: unknown, record: ClaimTableData) => (
          <Space size="middle">
            <Tooltip title="Просмотр">
              <Button
                size="small"
                type="text"
                icon={<EyeOutlined />}
                onClick={() => handleView(record.id)}
              />
            </Tooltip>
            <Button
              size="small"
              type="text"
              icon={<PlusOutlined />}
              onClick={() => handleAddChild(record)}
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
                  onClick={() => handleUnlink(record.id)}
                />
              </Tooltip>
            )}
            <Popconfirm
              title="Удалить претензию?"
              okText="Да"
              cancelText="Нет"
              onConfirm={async () => {
                await remove({ id: record.id });
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
          </Space>
        ),
      },
    } as Record<string, ColumnsType<ClaimTableData>[number]>;
    
    // Применяем сохраненные ширины колонок
    Object.keys(cols).forEach((k) => {
      if (cols[k]) {
        cols[k] = { ...cols[k], width: columnWidths[k] ?? cols[k].width };
      }
    });
    
    return cols;
  }, [columnWidths, lockedUnitIds, handleView, handleAddChild, handleUnlink, remove, removing, fmt, fmtDateTime]);

  // Порядок колонок
  const columnOrder = [
    "treeIcon",
    "id",
    "projectName",
    "buildings",
    "unitNames",
    "claim_status_id",
    "claim_no",
    "claimedOn",
    "acceptedOn",
    "registeredOn",
    "resolvedOn",
    "responsibleEngineerName",
    "createdAt",
    "createdByName",
    "actions",
  ];

  // Получение текста заголовка для колонок
  const getTitleText = (title: React.ReactNode): string => {
    if (React.isValidElement(title)) {
      return getTitleText(title.props.children);
    }
    return String(title);
  };

  // Состояние видимости и порядка колонок
  const [columnsState, setColumnsState] = useState<TableColumnSetting[]>(() => {
    try {
      const saved = localStorage.getItem(LS_COLUMNS_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    
    // Настройки по умолчанию
    return columnOrder.map((key) => ({
      key,
      title: getTitleText(baseColumns[key].title as React.ReactNode),
      visible: !["createdAt", "createdByName"].includes(key),
    }));
  });

  // Функция сброса колонок
  const handleResetColumns = () => {
    const defaults = columnOrder.map((key) => ({
      key,
      title: getTitleText(baseColumns[key].title as React.ReactNode),
      visible: !["createdAt", "createdByName"].includes(key),
    }));
    setColumnsState(defaults);
    setColumnWidths({});
  };

  // Эффекты для сохранения состояния
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


  // Финальные колонки для таблицы
  const columns: ColumnsType<ClaimTableData> = useMemo(() => {
    return columnsState
      .filter((c) => c.visible && baseColumns[c.key])
      .map((c) => baseColumns[c.key]);
  }, [columnsState, baseColumns]);


  const initialValues = useMemo(() => ({
    project_id: searchParams.get("project_id")
      ? Number(searchParams.get("project_id")!)
      : undefined,
    unit_ids: searchParams.get("unit_id")
      ? [Number(searchParams.get("unit_id")!)]
      : [],
    engineer_id: searchParams.get("engineer_id") || undefined,
  }), [searchParams]);

  React.useEffect(() => {
    if (searchParams.get("open_form") === "1") {
      setShowAddForm(true);
    }
  }, [searchParams]);

  return (
    <ConfigProvider locale={ruRU}>
      <>
        <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <Button
            type="primary"
            onClick={handleShowAddForm}
          >
            {showAddForm ? "Скрыть форму" : "Добавить претензию"}
          </Button>
          
          <Button
            onClick={handleShowFilters}
          >
            {showFilters ? "Скрыть фильтры" : "Показать фильтры"}
          </Button>
          
          <Button
            icon={<SettingOutlined />}
            onClick={handleShowColumnsDrawer}
          />
          
          <ExportClaimsButton claims={filteredClaims} />
          
        </div>

        {showAddForm && (
          <div style={{ marginBottom: 24 }}>
            <ClaimFormAntd
              onCreated={handleCloseAddForm}
              initialValues={initialValues}
            />
          </div>
        )}

        {showFilters && (
          <div style={{ marginBottom: 24 }}>
            <ClaimsFilters
              options={filterOptions}
              loading={isLoading}
              initialValues={filters}
              onSubmit={handleSubmitFilters}
              onReset={handleResetFilters}
            />
          </div>
        )}

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

        <React.Suspense fallback={null}>
          <TableColumnsDrawer
            open={showColumnsDrawer}
            columns={columnsState}
            widths={
              Object.fromEntries(
                Object.keys(baseColumns).map((k) => [k, columnWidths[k] ?? baseColumns[k].width])
              ) as Record<string, number>
            }
            onWidthsChange={setColumnWidths}
            onChange={setColumnsState}
            onClose={handleCloseColumnsDrawer}
            onReset={handleResetColumns}
          />
        </React.Suspense>


        {error ? (
          <Alert type="error" message={error.message} />
        ) : (
          <ClaimsTable
            claims={filteredClaims}
            loading={isLoading}
            onView={handleView}
            onAddChild={handleAddChild}
            onUnlink={handleUnlink}
            lockedUnitIds={lockedUnitIds}
            columns={columns}
            showPagination={true}
          />
        )}

        <div style={{ marginTop: 16 }}>
          <Typography.Text style={{ display: "block" }}>
            Всего претензий: {total}, из них закрытых: {closedCount} и не
            закрытых: {openCount}
          </Typography.Text>
          <Typography.Text style={{ display: "block", marginTop: 4 }}>
            Отфильтровано претензий: {filteredTotal}
          </Typography.Text>
        </div>

        <ClaimViewModal
          open={viewId !== null}
          claimId={viewId}
          onClose={handleCloseViewModal}
        />
      </>
    </ConfigProvider>
  );
}