import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import "dayjs/locale/ru";
import {
  ConfigProvider,
  Button,
  Card,
  Table,
  Space,
  Popconfirm,
  Tooltip,
  Typography,
} from "antd";
import ruRU from "antd/locale/ru_RU";
import type { ColumnsType } from "antd/es/table";
import { formatRub } from "@/shared/utils/formatCurrency";
import type { CourtCase } from "@/shared/types/courtCase";
import { useVisibleProjects } from "@/entities/project";
import { useUnitsByIds } from "@/entities/unit";
import { useUsers } from "@/entities/user";
import { useCourtCaseStatuses } from "@/entities/courtCaseStatus";
import { useCasePartiesByCaseIds } from "@/entities/courtCaseParty";
import { useRolePermission } from "@/entities/rolePermission";
import { useAuthStore } from "@/shared/store/authStore";
import type { RoleName } from "@/shared/types/rolePermission";
import {
  PlusOutlined,
  DeleteOutlined,
  LinkOutlined,
  FileTextOutlined,
  BranchesOutlined,
  SettingOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import {
  useCourtCases,
  useDeleteCourtCase,
  useLinkCases,
  useUnlinkCase,
} from "@/entities/courtCase";
import { useNotify } from "@/shared/hooks/useNotify";
import CourtCaseStatusSelect from "@/features/courtCase/CourtCaseStatusSelect";
import LinkCasesDialog from "@/features/courtCase/LinkCasesDialog";
import AddCourtCaseFormAntd from "@/features/courtCase/AddCourtCaseFormAntd";

// Lazy loading для компонента экспорта (содержит ExcelJS)
const ExportCourtCasesButton = React.lazy(() => import("@/features/courtCase/ExportCourtCasesButton"));
import CourtCaseViewModal from "@/features/courtCase/CourtCaseViewModal";
import CourtCasesFilters from "@/widgets/CourtCasesFilters";
import type { CourtCasesFiltersValues } from "@/shared/types/courtCasesFilters";
import { useCourtCasesFilterOptions } from "@/features/courtCase/model/useCourtCasesFilterOptions";
const TableColumnsDrawer = React.lazy(
  () => import("@/widgets/TableColumnsDrawer"),
);
import type { TableColumnSetting } from "@/shared/types/tableColumnSetting";

dayjs.locale("ru");
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const LS_KEY = "courtCasesHideClosed";
const LS_COLUMNS_KEY = "courtCasesColumns";
const LS_COLUMN_WIDTHS_KEY = "courtCasesColumnWidths";
const LS_FILTERS_VISIBLE_KEY = "courtCasesFiltersVisible";

export default function CourtCasesPage() {
  const { data: cases = [], isPending: casesLoading } = useCourtCases();
  const caseIds = React.useMemo(() => cases.map((c) => c.id), [cases]);
  const { data: parties = [] } = useCasePartiesByCaseIds(caseIds);
  const deleteCaseMutation = useDeleteCourtCase();
  const notify = useNotify();
  const linkCases = useLinkCases();
  const unlinkCase = useUnlinkCase();
  const [linkFor, setLinkFor] = useState<CourtCase | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  /** Размер страницы таблицы дел */
  const [pageSize, setPageSize] = useState(100);
  const [showFilters, setShowFilters] = useState(() => {
    try {
      const saved = localStorage.getItem(LS_FILTERS_VISIBLE_KEY);
      return saved ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });
  const [showColumnsDrawer, setShowColumnsDrawer] = useState(false);
  const [viewId, setViewId] = useState<number | null>(null);
  const hideOnScroll = useRef(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const initialValues = {
    project_id: searchParams.get("project_id")
      ? Number(searchParams.get("project_id")!)
      : undefined,
    unit_ids: searchParams.get("unit_id")
      ? [Number(searchParams.get("unit_id")!)]
      : undefined,
    responsible_lawyer_id:
      searchParams.get("responsible_lawyer_id") || undefined,
    status: searchParams.get("status")
      ? Number(searchParams.get("status")!)
      : undefined,
  };

  React.useEffect(() => {
    if (searchParams.get("open_form") === "1") {
      setShowAddForm(true);
    }
  }, [searchParams]);

  const { data: projects = [] } = useVisibleProjects();
  const { data: users = [] } = useUsers();
  const { data: stages = [] } = useCourtCaseStatuses();
  const role = useAuthStore((s) => s.profile?.role as RoleName | undefined);
  const { data: perm } = useRolePermission(role);

  const unitIds = React.useMemo(
    () =>
      Array.from(
        new Set(
          cases
            .flatMap((c) => c.unit_ids ?? [])
            .filter((id): id is number => Boolean(id)),
        ),
      ),
    [cases],
  );
  const { data: caseUnits = [] } = useUnitsByIds(unitIds);

  const buildingMap = React.useMemo(() => {
    const map = new Map<number, string>();
    (caseUnits ?? []).forEach((u) => {
      if (u.building) map.set(u.id, u.building);
    });
    return map;
  }, [caseUnits]);

  const partiesMap = React.useMemo(() => {
    const map = new Map<
      number,
      { plaintiffs: string[]; defendants: string[] }
    >();
    (parties ?? []).forEach((p) => {
      const entry = map.get(p.case_id) || { plaintiffs: [], defendants: [] };
      const name = p.persons?.full_name ?? p.contractors?.name ?? "";
      if (p.role === "plaintiff") entry.plaintiffs.push(name);
      else if (p.role === "defendant") entry.defendants.push(name);
      map.set(p.case_id, entry);
    });
    return map;
  }, [parties]);

  const [filters, setFilters] = useState<CourtCasesFiltersValues>(() => {
    let hideClosed = false;
    try {
      const saved = localStorage.getItem(LS_KEY);
      hideClosed = saved ? JSON.parse(saved) : false;
    } catch {}
    return {
      hideClosed,
      projectId: initialValues.project_id,
      objectId: initialValues.unit_ids ? initialValues.unit_ids[0] : undefined,
      building: undefined,
    } as CourtCasesFiltersValues;
  });

  useEffect(() => {
    const caseId = searchParams.get("case_id");
    if (caseId) setViewId(Number(caseId));
    const prj = searchParams.get("project_id");
    const obj = searchParams.get("unit_id");
    setFilters((f) => ({
      ...f,
      projectId: prj ? Number(prj) : f.projectId,
      objectId: obj ? Number(obj) : f.objectId,
    }));
  }, [searchParams]);

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === LS_KEY) {
        try {
          setFilters((f) => ({
            ...f,
            hideClosed: JSON.parse(e.newValue || "false"),
          }));
        } catch {}
      }
      if (e.key === LS_FILTERS_VISIBLE_KEY) {
        try {
          setShowFilters(JSON.parse(e.newValue || "true"));
        } catch {}
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LS_FILTERS_VISIBLE_KEY, JSON.stringify(showFilters));
    } catch {}
  }, [showFilters]);

  const handleFiltersChange = (v: CourtCasesFiltersValues) => {
    if (v.hideClosed !== filters.hideClosed) {
      try {
        localStorage.setItem(LS_KEY, JSON.stringify(v.hideClosed));
      } catch {}
    }
    setFilters(v);
  };

  const resetFilters = () =>
    setFilters(
      (f) => ({ hideClosed: f.hideClosed }) as CourtCasesFiltersValues,
    );

  const closedStageId = React.useMemo(() => {
    return stages.find((s) => s.name.toLowerCase().includes("закры"))?.id;
  }, [stages]);

  const casesData = cases.map((c: any) => ({
    ...c,
    caseUid: c.caseUid,
    plaintiffs: (partiesMap.get(c.id)?.plaintiffs || []).join(", "),
    defendants: (partiesMap.get(c.id)?.defendants || []).join(", "),
    projectName: projects.find((p) => p.id === c.project_id)?.name ?? "",
    projectObject: (c.unit_ids ?? [])
      .map((id: number) => caseUnits.find((u) => u.id === id)?.name)
      .filter(Boolean)
      .join(", "),
    buildingNamesList: Array.from(
      new Set(
        (c.unit_ids ?? [])
          .map((id: number) => buildingMap.get(id))
          .filter(Boolean),
      ),
    ) as string[],
    buildings: Array.from(
      new Set(
        (c.unit_ids ?? [])
          .map((id: number) => buildingMap.get(id))
          .filter(Boolean),
      ),
    ).join(", "),
    totalClaimAmount: c.total_claim_amount || 0,
    responsibleLawyer:
      users.find((u) => u.id === c.responsible_lawyer_id)?.name ??
      c.responsibleLawyer,
    createdAt: c.created_at ? dayjs(c.created_at) : null,
    createdByName: users.find((u) => u.id === c.created_by)?.name ?? null,
    daysSinceFixStart: c.fix_start_date
      ? dayjs().diff(dayjs(c.fix_start_date), "day")
      : null,
    statusName: stages.find((s) => s.id === c.status)?.name ?? null,
    statusColor: stages.find((s) => s.id === c.status)?.color ?? null,
  }));

  const {
    filteredCases,
    projectOptions,
    buildingOptions,
    unitOptions,
    statusOptions,
    userOptions,
    idOptions,
  } = useCourtCasesFilterOptions(
    casesData,
    projects,
    caseUnits,
    stages,
    users,
    filters,
    closedStageId,
  );


  const treeData = React.useMemo(() => {
    const map = new Map<number, any>();
    const roots: any[] = [];
    filteredCases.forEach((c) => {
      const row = { ...c, key: c.id, children: [] as any[] };
      map.set(c.id, row);
    });
    filteredCases.forEach((c) => {
      const row = map.get(c.id);
      if (c.parent_id && map.has(c.parent_id)) {
        map.get(c.parent_id).children.push(row);
      } else {
        roots.push(row);
      }
    });
    map.forEach((row) => {
      if (!row.children.length) row.children = undefined;
    });
    return roots;
  }, [filteredCases]);

  const baseColumns: Record<string, ColumnsType<CourtCase & any>[number]> = {
    treeIcon: {
      title: "",
      dataIndex: "treeIcon",
      width: 40,
      render: (_: any, record) => {
        if (!record.parent_id) {
          return (
            <Tooltip title="Основное дело">
              <FileTextOutlined style={{ color: "#1890ff", fontSize: 17 }} />
            </Tooltip>
          );
        }
        return (
          <Tooltip title="Связанное дело">
            <BranchesOutlined style={{ color: "#52c41a", fontSize: 16 }} />
          </Tooltip>
        );
      },
    },
    id: {
      title: "ID",
      dataIndex: "id",
      width: 80,
      sorter: (a, b) => a.id - b.id,
      defaultSortOrder: "descend",
      render: (id: number) => (
        <span style={{ whiteSpace: "nowrap" }}>{id}</span>
      ),
    },
    projectName: {
      title: "Проект",
      dataIndex: "projectName",
      width: 180,
      sorter: (a, b) =>
        (a.projectName || "").localeCompare(b.projectName || ""),
    },
    buildings: {
      title: "Корпус",
      dataIndex: "buildings",
      width: 120,
      sorter: (a, b) => (a.buildings || "").localeCompare(b.buildings || ""),
    },
    projectObject: {
      title: "Объект",
      dataIndex: "projectObject",
      width: 160,
      sorter: (a, b) =>
        (a.projectObject || "").localeCompare(b.projectObject || ""),
    },
    number: {
      title: "№ дела",
      dataIndex: "number",
      width: 120,
      sorter: (a, b) => a.number.localeCompare(b.number),
    },
    caseUid: {
      title: "UID",
      dataIndex: "caseUid",
      width: 120,
      sorter: (a, b) => (a.caseUid || "").localeCompare(b.caseUid || ""),
    },
    date: {
      title: "Дата дела",
      dataIndex: "date",
      width: 120,
      sorter: (a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf(),
      render: (v: string) => dayjs(v).format("DD.MM.YYYY"),
    },
    plaintiffs: {
      title: "Истец",
      dataIndex: "plaintiffs",
      width: 200,
      sorter: (a, b) => (a.plaintiffs || "").localeCompare(b.plaintiffs || ""),
    },
    defendants: {
      title: "Ответчик",
      dataIndex: "defendants",
      width: 200,
      sorter: (a, b) => (a.defendants || "").localeCompare(b.defendants || ""),
    },
    totalClaimAmount: {
      title: (
        <div style={{ textAlign: 'center', lineHeight: '1.2' }}>
          Сумма<br />требований
        </div>
      ),
      dataIndex: "totalClaimAmount",
      width: 150,
      sorter: (a, b) =>
        (a.totalClaimAmount ?? 0) - (b.totalClaimAmount ?? 0),
      render: (v: number) => formatRub(v),
    },
    status: {
      title: "Статус",
      dataIndex: "status",
      width: 160,
      sorter: (a, b) => a.status - b.status,
      render: (_: number, row) => (
        <CourtCaseStatusSelect
          caseId={row.id}
          statusId={row.status}
          statusName={row.statusName}
          statusColor={row.statusColor}
        />
      ),
    },
    fix_start_date: {
      title: (
        <div style={{ textAlign: 'center', lineHeight: '1.2' }}>
          Дата начала<br />устранения
        </div>
      ),
      dataIndex: "fix_start_date",
      width: 120,
      render: (v: string | null) => (v ? dayjs(v).format("DD.MM.YYYY") : ""),
      sorter: (a, b) =>
        dayjs(a.fix_start_date || 0).valueOf() -
        dayjs(b.fix_start_date || 0).valueOf(),
    },
    fix_end_date: {
      title: (
        <div style={{ textAlign: 'center', lineHeight: '1.2' }}>
          Дата окончания<br />устранения
        </div>
      ),
      dataIndex: "fix_end_date",
      width: 120,
      render: (v: string | null) => (v ? dayjs(v).format("DD.MM.YYYY") : ""),
      sorter: (a, b) =>
        dayjs(a.fix_end_date || 0).valueOf() -
        dayjs(b.fix_end_date || 0).valueOf(),
    },
    daysSinceFixStart: {
      title: (
        <div style={{ textAlign: 'center', lineHeight: '1.2' }}>
          Прошло дней с начала<br />устранения
        </div>
      ),
      dataIndex: "daysSinceFixStart",
      width: 200,
      sorter: (a, b) => (a.daysSinceFixStart ?? 0) - (b.daysSinceFixStart ?? 0),
    },
    responsibleLawyer: {
      title: "Юрист",
      dataIndex: "responsibleLawyer",
      width: 180,
      sorter: (a, b) =>
        (a.responsibleLawyer || "").localeCompare(b.responsibleLawyer || ""),
    },
    createdAt: {
      title: "Добавлено",
      dataIndex: "createdAt",
      width: 160,
      sorter: (a, b) =>
        (a.createdAt ? a.createdAt.valueOf() : 0) -
        (b.createdAt ? b.createdAt.valueOf() : 0),
      render: (v: dayjs.Dayjs | null) =>
        v ? v.format("DD.MM.YYYY HH:mm") : "",
    },
    createdByName: {
      title: "Автор",
      dataIndex: "createdByName",
      width: 160,
      sorter: (a, b) =>
        (a.createdByName || "").localeCompare(b.createdByName || ""),
    },
    actions: {
      title: "Действия",
      key: "actions",
      width: 140,
      render: (_: any, record) => (
        <Space size="middle">
          <Tooltip title="Просмотр">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => setViewId(record.id)}
            />
          </Tooltip>
          <Button
            type="text"
            icon={<PlusOutlined />}
            onClick={() => setLinkFor(record)}
          />
          {record.parent_id && (
            <Tooltip title="Исключить из связи">
              <Button
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
                onClick={() => unlinkCase.mutate(record.id)}
              />
            </Tooltip>
          )}
          {perm?.delete_tables.includes("court_cases") && (
            <Popconfirm
              title="Удалить дело?"
              okText="Да"
              cancelText="Нет"
              onConfirm={() =>
                deleteCaseMutation.mutate({
                  id: record.id,
                  project_id: record.project_id,
                })
              }
            >
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  };

  const [columnsState, setColumnsState] = useState<TableColumnSetting[]>(() => {
    const defaults = Object.keys(baseColumns).map((key) => ({
      key,
      title: baseColumns[key].title as string,
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
        const filtered = parsed.filter((c) => baseColumns[c.key]);
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
    const defaults = Object.keys(baseColumns).map((key) => ({
      key,
      title: baseColumns[key].title as string,
      visible: !["createdAt", "createdByName"].includes(key),
    }));
    try {
      localStorage.removeItem(LS_COLUMN_WIDTHS_KEY);
    } catch {}
    setColumnWidths({});
    setColumnsState(defaults);
  };

  useEffect(() => {
    try {
      localStorage.setItem(LS_COLUMNS_KEY, JSON.stringify(columnsState));
    } catch {}
  }, [columnsState]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_COLUMN_WIDTHS_KEY, JSON.stringify(columnWidths));
    } catch {}
  }, [columnWidths]);

  const columns: ColumnsType<CourtCase & any> = React.useMemo(
    () =>
      columnsState
        .filter((c) => c.visible)
        .map((c) => ({
          ...baseColumns[c.key],
          width: columnWidths[c.key] ?? baseColumns[c.key].width,
        })),
    [columnsState, baseColumns, columnWidths],
  );

  const total = cases.length;
  const closedCount = React.useMemo(
    () =>
      cases.filter((c) => closedStageId && c.status === closedStageId).length,
    [cases, closedStageId],
  );
  const openCount = total - closedCount;
  const readyToExport = filteredCases.length;

  return (
    <ConfigProvider locale={ruRU}>
      <>
        {perm?.edit_tables.includes("court_cases") && (
          <Button
            type="primary"
            onClick={() => setShowAddForm((p) => !p)}
            style={{ marginRight: 8 }}
          >
            {showAddForm ? "Скрыть форму" : "Добавить дело"}
          </Button>
        )}
        <Button onClick={() => setShowFilters((p) => !p)}>
          {showFilters ? "Скрыть фильтры" : "Показать фильтры"}
        </Button>
        <Button
          icon={<SettingOutlined />}
          style={{ marginLeft: 8 }}
          onClick={() => setShowColumnsDrawer(true)}
        />
        <span style={{ marginLeft: 8, display: "inline-block" }}>
          <React.Suspense fallback={<Button loading>Экспорт</Button>}>
            <ExportCourtCasesButton
              cases={filteredCases}
              stages={Object.fromEntries(stages.map((s) => [s.id, s.name]))}
              closedStageId={closedStageId ?? undefined}
            />
          </React.Suspense>
        </span>
        {showAddForm && (
          <AddCourtCaseFormAntd
            initialValues={initialValues}
            onCreated={() => {
              setShowAddForm(false);
              hideOnScroll.current = true;
            }}
          />
        )}
        <LinkCasesDialog
          open={!!linkFor}
          parent={linkFor}
          cases={casesData}
          onClose={() => setLinkFor(null)}
          onSubmit={(ids) =>
            linkCases.mutate({ parentId: String(linkFor!.id), childIds: ids })
          }
        />
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
        <CourtCaseViewModal
          open={viewId !== null}
          caseId={viewId}
          onClose={() => {
            setViewId(null);
            const params = new URLSearchParams(searchParams);
            params.delete("case_id");
            setSearchParams(params, { replace: true });
          }}
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
            <div style={{ marginBottom: 24, maxWidth: 1040 }}>
              <CourtCasesFilters
                values={filters}
                onChange={handleFiltersChange}
                onReset={resetFilters}
                projects={projectOptions}
                units={unitOptions}
                stages={statusOptions}
                users={userOptions}
                idOptions={idOptions}
              />
            </div>
          )}

          <Table
            rowKey="id"
            columns={columns}
            sticky={{ offsetHeader: 80 }}
            dataSource={treeData}
            loading={casesLoading}
            pagination={{
              pageSize,
              showSizeChanger: true,
              onChange: (_p, size) => size && setPageSize(size),
            }}
            size="middle"
            expandable={{
              expandRowByClick: true,
              defaultExpandAllRows: false,
              indentSize: 24,
            }}
            rowClassName={(record) =>
              record.parent_id ? "child-case-row" : "main-case-row"
            }
          />

          <Typography.Text style={{ display: "block", marginTop: 8 }}>
            Всего дел: {total}, из них закрытых: {closedCount} и не закрытых:{" "}
            {openCount}
          </Typography.Text>
          <Typography.Text style={{ display: "block", marginTop: 4 }}>
            Готовых дел к выгрузке: {readyToExport}
          </Typography.Text>
        </div>
      </>
    </ConfigProvider>
  );
}
