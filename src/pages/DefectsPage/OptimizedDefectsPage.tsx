import React, { useMemo, useState, useCallback, memo } from "react";
import dayjs from "dayjs";
import {
  ConfigProvider,
  Card,
  Button,
  Typography,
  Tooltip,
  Popconfirm,
  message,
  Modal,
} from "antd";
import {
  SettingOutlined,
  EyeOutlined,
  DeleteOutlined,
  CheckOutlined,
  CloseOutlined,
} from "@ant-design/icons";

import ruRU from "antd/locale/ru_RU";
import { useDeleteDefect } from "@/entities/defect";
import { useLockedUnitIds } from "@/entities/unit";
import { useOptimizedDefects, useDefectAttachments } from "@/shared/hooks/useOptimizedQueries";
import { useRolePermission } from "@/entities/rolePermission";
import { useAuthStore } from "@/shared/store/authStore";
import { useProjectId } from "@/shared/hooks/useProjectId";
import type { RoleName } from "@/shared/types/rolePermission";
import DefectsTable from "@/widgets/DefectsTable";
import DefectsFilters from "@/widgets/DefectsFilters";
import type { TableColumnSetting } from "@/shared/types/tableColumnSetting";
import DefectStatusSelect from "@/features/defect/DefectStatusSelect";
import ExportDefectsButton from "@/features/defect/ExportDefectsButton";
import { useCancelDefectFix } from "@/entities/defect";
import { filterDefects } from "@/shared/utils/defectFilter";
import { naturalCompare, naturalCompareArrays } from "@/shared/utils/naturalSort";
import formatUnitName from "@/shared/utils/formatUnitName";
import { useUsers } from "@/entities/user";
import type { DefectWithInfo } from "@/shared/types/defect";
import type { DefectFilters } from "@/shared/types/defectFilters";
import type { ColumnsType } from "antd/es/table";
import "./optimized-defects.css";

// Lazy loading для тяжелых компонентов
const TableColumnsDrawer = React.lazy(() => import("@/widgets/TableColumnsDrawer"));
const DefectViewModal = React.lazy(() => import("@/features/defect/DefectViewModal"));
const DefectFixModal = React.lazy(() => import("@/features/defect/DefectFixModal"));

// Форматеры для дат
const fmt = (v: string | null) => (v ? dayjs(v).format("DD.MM.YYYY") : "—");
const fmtDateTime = (v: string | null) =>
  v ? dayjs(v).format("DD.MM.YYYY HH:mm") : "—";

const LS_FILTERS_VISIBLE_KEY = "defectsFiltersVisible";
const LS_COLUMNS_KEY = "defectsColumns";
const LS_COLUMN_WIDTHS_KEY = "defectsColumnWidths";

const OptimizedDefectsPage = memo(function OptimizedDefectsPage() {
  const role = useAuthStore((s) => s.profile?.role as RoleName | undefined);
  const { data: perm } = useRolePermission(role);
  const projectId = useProjectId();
  const [filters, setFilters] = useState<DefectFilters>({});
  
  // Используем оптимизированные запросы
  const { 
    data: defects = [], 
    isPending, 
    error 
  } = useOptimizedDefects(projectId || 1, filters);
  
  // Мемоизированные IDs для оптимизации
  const defectIds = useMemo(() => defects.map((d) => d.id), [defects]);
  
  // Ленивая загрузка данных только при необходимости
  const { data: lockedUnitIds = [] } = useLockedUnitIds();
  const { data: users = [] } = useUsers();
  const { data: defectAttachments } = useDefectAttachments(defectIds);

  const userProjectIds = useAuthStore((s) => s.profile?.project_ids) ?? [];
  
  // Мемоизированные мапы для производительности
  const userMap = useMemo(() => {
    const map = new Map<string, string>();
    users.forEach((u) => {
      map.set(u.id, u.name);
    });
    return map;
  }, [users]);

  // Основные данные с мемоизацией - теперь используем оптимизированные данные из view
  const data: DefectWithInfo[] = useMemo(() => {
    return defects.map((d: any) => {
      // Данные уже приходят из defects_with_details view с объединенными данными
      const unitIds = d.unit_ids || (d.unit_id ? [d.unit_id] : []);
      const unitNames = d.unit_names || "";
      const buildingNames = d.building_names || "";
      const projectNames = d.project_name || "";
      const fixByName = d.fix_by_name || "—";
      
      return {
        ...d,
        claimIds: d.claim_ids || [],
        hasPretrialClaim: d.has_pretrial_claim || false,
        createdByName: d.created_by_name || userMap.get(d.created_by as string) || null,
        engineerName: d.engineer_name || userMap.get(d.engineer_id as string) || null,
        unitIds,
        unitNames,
        unitNamesList: unitNames ? unitNames.split(", ") : [],
        buildingNamesList: buildingNames ? buildingNames.split(", ") : [],
        buildingNames,
        projectIds: d.project_ids || (d.project_id ? [d.project_id] : []),
        projectNames,
        fixByName,
        days: d.received_at
          ? dayjs().diff(dayjs(d.received_at), "day") + 1
          : null,
        defectTypeName: d.defect_type_name || "",
        defectStatusName: d.defect_status_name || "",
        defectStatusColor: d.defect_status_color || null,
      } as DefectWithInfo;
    });
  }, [defects, userMap]);

  const filteredData = useMemo(() => {
    if (perm?.only_assigned_project) {
      return data.filter((d) =>
        (d.projectIds || []).some((id) => userProjectIds.includes(id)),
      );
    }
    return data;
  }, [data, perm?.only_assigned_project, userProjectIds]);

  // Мемоизированные опции для фильтров
  const options = useMemo(() => {
    const without = <K extends keyof DefectFilters>(key: K) => {
      const { [key]: _omit, ...rest } = filters;
      return rest as DefectFilters;
    };
    const filtered = <K extends keyof DefectFilters>(key: K) =>
      filterDefects(filteredData, without(key));

    const uniq = (values: (string | number | null | undefined)[]) =>
      Array.from(new Set(values.filter(Boolean) as (string | number)[])).sort(naturalCompare);
    const mapNumOptions = (vals: (number | null | undefined)[]) =>
      uniq(vals).map((v) => ({ label: String(v), value: Number(v) }));
    const mapStrOptions = (vals: (string | null | undefined)[]) =>
      uniq(vals).map((v) => ({ label: String(v), value: String(v) }));

    const uniqPairs = (pairs: [number | null, string | null][]) => {
      const map = new Map<number, string>();
      pairs.forEach(([id, name]) => {
        if (id != null && name) map.set(id, name);
      });
      return Array.from(map.entries())
        .sort((a, b) => naturalCompare(a[1], b[1]))
        .map(([value, label]) => ({ value, label }));
    };

    return {
      ids: mapNumOptions(filtered('id').map((d) => d.id)),
      claimIds: mapNumOptions(filtered('claimId').flatMap((d) => d.claimIds)),
      units: Array.from(
        new Set(filtered('units').flatMap((d) => d.unitIds)),
      )
        .map((id) => ({ label: String(id), value: id }))
        .sort((a, b) => naturalCompare(a.label, b.label)),
      buildings: mapStrOptions(
        filtered('building').flatMap((d) => d.buildingNamesList || []),
      ),
      projects: mapStrOptions(
        filtered('projectId').map((d) => d.projectNames),
      ),
      types: uniqPairs(filtered('typeId').map((d) => [d.type_id, d.defectTypeName])),
      statuses: uniqPairs(
        filtered('statusId').map((d) => [d.status_id, d.defectStatusName]),
      ),
      fixBy: mapStrOptions(filtered('fixBy').map((d) => d.fixByName)),
      engineers: mapStrOptions(filtered('engineer').map((d) => d.engineerName)),
      authors: mapStrOptions(filtered('author').map((d) => d.createdByName)),
    };
  }, [filteredData, filters]);

  // Состояние компонента
  const [viewId, setViewId] = useState<number | null>(null);
  const [fixId, setFixId] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_FILTERS_VISIBLE_KEY);
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    try {
      return JSON.parse(localStorage.getItem(LS_COLUMN_WIDTHS_KEY) || "{}");
    } catch {
      return {};
    }
  });

  // Mutations
  const { mutateAsync: removeDefect, isPending: removing } = useDeleteDefect();
  const cancelFix = useCancelDefectFix();

  // Мемоизированные обработчики
  const handleView = useCallback((id: number) => setViewId(id), []);
  const handleFix = useCallback((id: number) => setFixId(id), []);
  const handleCloseView = useCallback(() => setViewId(null), []);
  const handleCloseFix = useCallback(() => setFixId(null), []);
  
  const handleToggleFilters = useCallback(() => {
    const newValue = !showFilters;
    setShowFilters(newValue);
    try {
      localStorage.setItem(LS_FILTERS_VISIBLE_KEY, JSON.stringify(newValue));
    } catch {}
  }, [showFilters]);

  const handleFiltersSubmit = useCallback((vals: DefectFilters) => {
    setFilters(vals);
  }, []);

  const handleFiltersReset = useCallback(() => {
    setFilters({});
    message.info("Фильтры сброшены");
  }, []);

  const handleDelete = useCallback(async (id: number) => {
    await removeDefect({ id });
    message.success("Удалено");
  }, [removeDefect]);

  const handleCancelFix = useCallback(async (id: number) => {
    await cancelFix.mutateAsync({ id });
    message.success("Устранение отменено");
  }, [cancelFix]);

  // Мемоизированные колонки
  const baseColumns = useMemo(() => {
    const cols = {
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
        width: 100,
        sorter: (a: DefectWithInfo, b: DefectWithInfo) => (a.days || 0) - (b.days || 0),
        render: (v: number | null) => v ?? "—",
      },
      projectNames: {
        title: "Проект",
        dataIndex: "projectNames",
        width: 180,
        sorter: (a: DefectWithInfo, b: DefectWithInfo) =>
          a.projectNames.localeCompare(b.projectNames),
      },
      buildingNames: {
        title: "Корпус",
        dataIndex: "buildingNames",
        width: 120,
        sorter: (a: DefectWithInfo, b: DefectWithInfo) =>
          a.buildingNames.localeCompare(b.buildingNames),
      },
      unitNames: {
        title: "Объекты",
        dataIndex: "unitNames",
        width: 160,
        sorter: (a: DefectWithInfo, b: DefectWithInfo) =>
          a.unitNames.localeCompare(b.unitNames),
      },
      defectTypeName: {
        title: "Тип дефекта",
        dataIndex: "defectTypeName",
        width: 200,
        sorter: (a: DefectWithInfo, b: DefectWithInfo) =>
          a.defectTypeName.localeCompare(b.defectTypeName),
      },
      defectStatusName: {
        title: "Статус",
        dataIndex: "status_id",
        width: 180,
        sorter: (a: DefectWithInfo, b: DefectWithInfo) =>
          a.defectStatusName.localeCompare(b.defectStatusName),
        render: (_: any, record: DefectWithInfo) => (
          <DefectStatusSelect
            defectId={record.id}
            statusId={record.status_id}
            statusName={record.defectStatusName}
            statusColor={record.defectStatusColor}
            locked={record.unitIds?.some((id: number) =>
              lockedUnitIds.includes(id),
            )}
          />
        ),
      },
      fixByName: {
        title: "Устраняет",
        dataIndex: "fixByName",
        width: 140,
        sorter: (a: DefectWithInfo, b: DefectWithInfo) =>
          a.fixByName.localeCompare(b.fixByName),
      },
      engineerName: {
        title: "Инженер",
        dataIndex: "engineerName",
        width: 140,
        sorter: (a: DefectWithInfo, b: DefectWithInfo) =>
          (a.engineerName || "").localeCompare(b.engineerName || ""),
      },
      received_at: {
        title: "Дата получения",
        dataIndex: "received_at",
        width: 120,
        sorter: (a: DefectWithInfo, b: DefectWithInfo) => {
          const aDate = a.received_at ? dayjs(a.received_at) : null;
          const bDate = b.received_at ? dayjs(b.received_at) : null;
          if (!aDate && !bDate) return 0;
          if (!aDate) return 1;
          if (!bDate) return -1;
          return aDate.valueOf() - bDate.valueOf();
        },
        render: (v: string | null) => fmt(v),
      },
      actions: {
        title: "Действия",
        key: "actions",
        width: 140,
        render: (_: any, record: DefectWithInfo) => (
          <div className="defect-actions" style={{ display: "flex", gap: 4 }}>
            <Tooltip title="Просмотр">
              <Button
                size="small"
                type="text"
                icon={<EyeOutlined />}
                onClick={() => handleView(record.id)}
              />
            </Tooltip>
            <Tooltip title="Устранить">
              <Button
                size="small"
                type="text"
                icon={<CheckOutlined />}
                onClick={() => handleFix(record.id)}
              />
            </Tooltip>
            {record.fixed_at && (
              <Tooltip title="Отменить устранение">
                <Button
                  size="small"
                  type="text"
                  icon={<CloseOutlined />}
                  onClick={() => handleCancelFix(record.id)}
                  loading={cancelFix.isPending}
                />
              </Tooltip>
            )}
            <Popconfirm
              title="Удалить дефект?"
              okText="Да"
              cancelText="Нет"
              onConfirm={() => handleDelete(record.id)}
            >
              <Button
                size="small"
                type="text"
                danger
                icon={<DeleteOutlined />}
                loading={removing}
              />
            </Popconfirm>
          </div>
        ),
      },
    };

    Object.keys(cols).forEach((key) => {
      cols[key] = { ...cols[key], width: columnWidths[key] ?? cols[key].width };
    });

    return cols;
  }, [columnWidths, lockedUnitIds, handleView, handleFix, handleCancelFix, handleDelete, removing, cancelFix.isPending]);

  // Статистика
  const statistics = useMemo(() => {
    const filtered = filterDefects(filteredData, filters);
    const total = filteredData.length;
    const filtered_count = filtered.length;
    const fixed = filtered.filter((d) => d.fixed_at).length;
    const unfixed = filtered_count - fixed;
    return { total, filtered_count, fixed, unfixed };
  }, [filteredData, filters]);

  return (
    <ConfigProvider locale={ruRU}>
      <div className="defects-page" style={{ padding: 24 }}>
        <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <Button
            type={showFilters ? "primary" : "default"}
            onClick={handleToggleFilters}
          >
            {showFilters ? "Скрыть фильтры" : "Показать фильтры"}
          </Button>
          
          <Button
            icon={<SettingOutlined />}
            onClick={() => {/* TODO: открыть настройки колонок */}}
          />
          
          <ExportDefectsButton 
            defects={filteredData} 
            filters={filters}
          />
        </div>

        {showFilters && (
          <div className="defects-filters" style={{ marginBottom: 24 }}>
            <DefectsFilters
              options={options}
              onChange={handleFiltersSubmit}
              initialValues={filters}
            />
          </div>
        )}

        {error ? (
          <div style={{ color: 'red', marginBottom: 16 }}>
            Ошибка загрузки данных: {error.message}
          </div>
        ) : (
          <div className="defects-table">
            <DefectsTable
              defects={filteredData}
              filters={filters}
              loading={isPending}
              columns={Object.values(baseColumns)}
              onView={handleView}
              lockedUnitIds={lockedUnitIds}
            />
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <Typography.Text style={{ display: "block" }}>
            Всего дефектов: {statistics.total}, отфильтровано: {statistics.filtered_count}
          </Typography.Text>
          <Typography.Text style={{ display: "block", marginTop: 4 }}>
            Устранено: {statistics.fixed}, не устранено: {statistics.unfixed}
          </Typography.Text>
        </div>

        <React.Suspense fallback={null}>
          <DefectViewModal
            open={viewId !== null}
            defectId={viewId}
            onClose={handleCloseView}
          />
        </React.Suspense>

        <React.Suspense fallback={null}>
          <DefectFixModal
            open={fixId !== null}
            defectId={fixId}
            onClose={handleCloseFix}
          />
        </React.Suspense>
      </div>
    </ConfigProvider>
  );
});

export default OptimizedDefectsPage;