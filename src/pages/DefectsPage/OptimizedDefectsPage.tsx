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
import { useDefects, useDeleteDefect } from "@/entities/defect";
import { useUnitsByIds, useLockedUnitIds } from "@/entities/unit";
import { useVisibleProjects } from "@/entities/project";
import { useBrigades } from "@/entities/brigade";
import { useContractors } from "@/entities/contractor";
import { useRolePermission } from "@/entities/rolePermission";
import {
  useClaimsSimple,
  useClaimsSimpleAll,
  useClaimIdsByDefectIds,
} from "@/entities/claim";
import { useAuthStore } from "@/shared/store/authStore";
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
  const { data: defects = [], isPending } = useDefects();
  const role = useAuthStore((s) => s.profile?.role as RoleName | undefined);
  const { data: perm } = useRolePermission(role);
  const { data: claimsAll = [] } = useClaimsSimpleAll();
  const { data: claimsAssigned = [] } = useClaimsSimple();
  const claims = perm?.only_assigned_project ? claimsAssigned : claimsAll;
  
  // Мемоизированные IDs для оптимизации
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
  
  const defectIds = useMemo(() => defects.map((d) => d.id), [defects]);
  
  // Ленивая загрузка данных только при необходимости
  const { data: units = [] } = useUnitsByIds(unitIds);
  const { data: lockedUnitIds = [] } = useLockedUnitIds();
  const { data: projects = [] } = useVisibleProjects();
  const { data: brigades = [] } = useBrigades();
  const { data: contractors = [] } = useContractors();
  const { data: users = [] } = useUsers();
  const { data: claimIdMap = {} } = useClaimIdsByDefectIds(defectIds);

  const userProjectIds = useAuthStore((s) => s.profile?.project_ids) ?? [];
  
  // Мемоизированные мапы для производительности
  const userMap = useMemo(() => {
    const map = new Map<string, string>();
    users.forEach((u) => {
      map.set(u.id, u.name);
    });
    return map;
  }, [users]);

  const unitMap = useMemo(() => new Map(units.map((u) => [u.id, formatUnitName(u, false)])), [units]);
  const buildingMap = useMemo(() => new Map(units.map((u) => [u.id, u.building || ""])), [units]);
  const projectMap = useMemo(() => new Map(projects.map((p) => [p.id, p.name])), [projects]);
  const brigadeMap = useMemo(() => new Map(brigades.map((b) => [b.id, b.name])), [brigades]);
  const contractorMap = useMemo(() => new Map(contractors.map((c) => [c.id, c.name])), [contractors]);

  // Основные данные с мемоизацией
  const data: DefectWithInfo[] = useMemo(() => {
    const claimsMap = new Map<
      number,
      { id: number; unit_ids: number[]; project_id: number; pre_trial_claim: boolean }[]
    >();
    
    claims.forEach((c: any) => {
      (c.claim_defects || []).forEach((cd: any) => {
        const arr = claimsMap.get(cd.defect_id) || [];
        arr.push({
          id: c.id,
          unit_ids: c.unit_ids || [],
          project_id: c.project_id,
          pre_trial_claim: cd.pre_trial_claim ?? false,
        });
        claimsMap.set(cd.defect_id, arr);
      });
    });
    
    return defects.map((d: any) => {
      const claimLinked = claimsMap.get(d.id) || [];
      const hasPretrial = claimLinked.some((l) => l.pre_trial_claim);
      const unitIdsFromClaims = Array.from(new Set(claimLinked.flatMap((l) => l.unit_ids)));
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
      
      const projectIdsFromClaims = Array.from(new Set(claimLinked.map((l) => l.project_id)));
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
        fixByName = brigadeMap.get(d.brigade_id) || "Бригада";
      } else if (d.contractor_id) {
        fixByName = contractorMap.get(d.contractor_id) || "Подрядчик";
      }
      
      return {
        ...d,
        claimIds: Array.from(
          new Set([
            ...claimLinked.map((l) => l.id),
            ...(claimIdMap[d.id] ?? []),
          ]),
        ),
        hasPretrialClaim: hasPretrial,
        createdByName: userMap.get(d.created_by as string) ?? null,
        engineerName: userMap.get(d.engineer_id as string) ?? null,
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
  }, [defects, claims, unitMap, buildingMap, projectMap, brigadeMap, contractorMap, userMap, claimIdMap]);

  const filteredData = useMemo(() => {
    if (perm?.only_assigned_project) {
      return data.filter((d) =>
        (d.projectIds || []).some((id) => userProjectIds.includes(id)),
      );
    }
    return data;
  }, [data, perm?.only_assigned_project, userProjectIds]);

  const [filters, setFilters] = useState<DefectFilters>({});

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
        .map((id) => ({ label: unitMap.get(id) ?? String(id), value: id }))
        .sort((a, b) => naturalCompare(a.label, b.label)),
      buildings: mapStrOptions(
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
      fixBy: mapStrOptions(filtered('fixBy').map((d) => d.fixByName)),
      engineers: mapStrOptions(filtered('engineer').map((d) => d.engineerName)),
      authors: mapStrOptions(filtered('author').map((d) => d.createdByName)),
    };
  }, [filteredData, filters, unitMap, projectMap]);

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