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
} from "@ant-design/icons";
import { useSnackbar } from "notistack";
import {
  useClaims,
  useClaimsAllLegacy as useClaimsAll,
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
import OptimizedClaimsFilters from "@/widgets/OptimizedClaimsFilters";
import ClaimFormAntd from "@/features/claim/ClaimFormAntd";
import ClaimViewModal from "@/features/claim/ClaimViewModal";
import LinkClaimsDialog from "@/features/claim/LinkClaimsDialog";
import ExportClaimsButton from "@/features/claim/ExportClaimsButton";
import { useSearchParams } from "react-router-dom";
import type { ClaimWithNames } from "@/shared/types/claimWithNames";
import { filterClaims } from "@/shared/utils/claimFilter";
import { naturalCompare } from "@/shared/utils/naturalSort";
import type { ClaimFilters } from "@/shared/types/claimFilters";
import "./optimized-claims.css";

// Lazy loading для тяжелых компонентов
const TableColumnsDrawer = React.lazy(
  () => import("@/widgets/TableColumnsDrawer"),
);

const LS_HIDE_CLOSED = "claimsHideClosed";

const OptimizedClaimsPage = memo(function OptimizedClaimsPage() {
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
  } = useClaimsAll();
  
  const claims = perm?.only_assigned_project ? claimsAssigned : claimsAll;
  const isLoading = perm?.only_assigned_project ? loadingAssigned : loadingAll;
  const error = errorAssigned || errorAll;

  // Ленивая загрузка пользователей и юнитов
  const { data: users = [], isPending: usersLoading } = useUsers();
  const { data: lockedUnitIds = [] } = useLockedUnitIds();
  
  // Получаем только нужные unit IDs
  const unitIds = useMemo(
    () => Array.from(new Set(claims.flatMap((t) => t.unit_ids))),
    [claims],
  );
  const { data: units = [], isPending: unitsLoading } = useUnitsByIds(unitIds);
  const filtersLoading = usersLoading || unitsLoading;

  // Состояние компонента
  const [searchParams] = useSearchParams();
  
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
  const [viewId, setViewId] = useState<number | null>(null);
  const [linkFor, setLinkFor] = useState<ClaimWithNames | null>(null);
  const [showColumnsDrawer, setShowColumnsDrawer] = useState(false);

  // Mutations
  const linkClaims = useLinkClaims();
  const unlinkClaim = useUnlinkClaim();

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

  // Мемоизированные опции для фильтров с дебаунсом
  const filterOptions = useMemo(() => {
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

  // Мемоизированная статистика
  const statistics = useMemo(() => {
    const total = claimsWithNames.length;
    const closedCount = claimsWithNames.filter((c) => /закры/i.test(c.statusName ?? "")).length;
    const openCount = total - closedCount;
    const readyToExport = filterClaims(claimsWithNames, filters).length;
    return { total, closedCount, openCount, readyToExport };
  }, [claimsWithNames, filters]);

  const { total, closedCount, openCount, readyToExport } = statistics;

  // Мемоизированные обработчики для лучшей производительности
  const applyFilters = useCallback((vals: ClaimFilters) => {
    setFilters(vals);
    if (Object.prototype.hasOwnProperty.call(vals, "hideClosed")) {
      try {
        localStorage.setItem(LS_HIDE_CLOSED, JSON.stringify(vals.hideClosed));
      } catch {}
    }
    const count = filterClaims(claimsWithNames, vals).length;
    message.success(`Фильтры применены (${count} результатов)`);
  }, [claimsWithNames]);

  const resetFilters = useCallback(() => {
    setFilters({});
    try {
      localStorage.setItem(LS_HIDE_CLOSED, "false");
    } catch {}
    message.info("Фильтры сброшены");
  }, []);


  const handleView = useCallback((id: number) => setViewId(id), []);
  const handleAddChild = useCallback((parent: ClaimWithNames) => setLinkFor(parent), []);
  const handleUnlink = useCallback((id: number) => unlinkClaim.mutate(id), [unlinkClaim]);
  const handleShowAddForm = useCallback(() => setShowAddForm(p => !p), []);
  const handleShowColumnsDrawer = useCallback(() => setShowColumnsDrawer(true), []);
  const handleCloseColumnsDrawer = useCallback(() => setShowColumnsDrawer(false), []);
  const handleCloseAddForm = useCallback(() => setShowAddForm(false), []);
  const handleCloseViewModal = useCallback(() => setViewId(null), []);
  const handleCloseLinkDialog = useCallback(() => setLinkFor(null), []);

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
            icon={<SettingOutlined />}
            onClick={handleShowColumnsDrawer}
          />
          
          <ExportClaimsButton claims={claimsWithNames} filters={filters} />
          
        </div>

        {showAddForm && (
          <div style={{ marginBottom: 24 }}>
            <ClaimFormAntd
              onCreated={handleCloseAddForm}
              initialValues={initialValues}
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
            columns={[]}
            widths={{}}
            onWidthsChange={() => {}}
            onChange={() => {}}
            onClose={handleCloseColumnsDrawer}
            onReset={() => {}}
          />
        </React.Suspense>

        <div className="claims-filters" style={{ marginBottom: 24 }}>
          <OptimizedClaimsFilters
            options={filterOptions}
            loading={filtersLoading}
            initialValues={filters}
            onSubmit={applyFilters}
            onReset={resetFilters}
          />
        </div>

        {error ? (
          <Alert type="error" message={error.message} />
        ) : (
          <ClaimsTable
            claims={claimsWithNames}
            filters={filters}
            loading={isLoading}
            onView={handleView}
            onAddChild={handleAddChild}
            onUnlink={handleUnlink}
            lockedUnitIds={lockedUnitIds}
          />
        )}

        <div style={{ marginTop: 16 }}>
          <Typography.Text style={{ display: "block" }}>
            Всего претензий: {total}, из них закрытых: {closedCount} и не
            закрытых: {openCount}
          </Typography.Text>
          <Typography.Text style={{ display: "block", marginTop: 4 }}>
            Готовых претензий к выгрузке: {readyToExport}
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
});

export default OptimizedClaimsPage;