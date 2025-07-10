import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
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
  Alert,
  message,
} from "antd";
import ruRU from "antd/locale/ru_RU";
import type { ColumnsType } from "antd/es/table";
import { formatRub } from "@/shared/utils/formatCurrency";
import type { CourtCase } from "@/shared/types/courtCase";
import { useUsers } from "@/entities/user";
import { useCourtCaseStatuses } from "@/entities/courtCaseStatus";
import { useRolePermission } from "@/entities/rolePermission";
import { useAuthStore } from "@/shared/store/authStore";
import { useProjectId } from "@/shared/hooks/useProjectId";
import { useOptimizedCourtCases, useCourtCaseRelatedData } from "@/shared/hooks/useOptimizedQueries";
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
  useDeleteCourtCase,
  useLinkCases,
  useUnlinkCase,
} from "@/entities/courtCase";
import { useNotify } from "@/shared/hooks/useNotify";
import CourtCaseStatusSelect from "@/features/courtCase/CourtCaseStatusSelect";
import LinkCasesDialog from "@/features/courtCase/LinkCasesDialog";
import ExportCourtCasesButton from "@/features/courtCase/ExportCourtCasesButton";
import AddCourtCaseFormAntd from "@/features/courtCase/AddCourtCaseFormAntd";
import CourtCaseViewModal from "@/features/courtCase/CourtCaseViewModal";
import CourtCasesFilters from "@/widgets/CourtCasesFilters";
import type { CourtCasesFiltersValues } from "@/shared/types/courtCasesFilters";
import { useCourtCasesFilterOptions } from "@/features/courtCase/model/useCourtCasesFilterOptions";
import type { TableColumnSetting } from "@/shared/types/tableColumnSetting";
import formatUnitName from "@/shared/utils/formatUnitName";
import { naturalSort } from "@/shared/utils/naturalSort";

const TableColumnsDrawer = React.lazy(
  () => import("@/widgets/TableColumnsDrawer"),
);

dayjs.locale("ru");
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const LS_KEY = "courtCasesHideClosed";
const LS_COLUMNS_KEY = "courtCasesColumns";
const LS_COLUMN_WIDTHS_KEY = "courtCasesColumnWidths";
const LS_FILTERS_VISIBLE_KEY = "courtCasesFiltersVisible";

export default function OptimizedCourtCasesPage() {
  const role = useAuthStore((s) => s.profile?.role as RoleName | undefined);
  const { data: perm } = useRolePermission(role);
  const projectId = useProjectId();
  const [filters, setFilters] = useState<CourtCasesFiltersValues>({});
  
  // Используем оптимизированные запросы
  const { 
    data: cases = [], 
    isPending: casesLoading, 
    error 
  } = useOptimizedCourtCases(projectId || 1, filters);
  
  // Получаем связанные данные
  const caseIds = useMemo(() => cases.map((c) => c.id), [cases]);
  const { data: relatedData } = useCourtCaseRelatedData(caseIds);

  const deleteCaseMutation = useDeleteCourtCase();
  const notify = useNotify();
  const linkCases = useLinkCases();
  const unlinkCase = useUnlinkCase();
  const [linkFor, setLinkFor] = useState<CourtCase | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
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
    responsible_lawyer_id: searchParams.get("responsible_lawyer_id") || undefined,
    status: searchParams.get("status")
      ? Number(searchParams.get("status")!)
      : undefined,
  };

  React.useEffect(() => {
    if (searchParams.get("open_form") === "1") {
      setShowAddForm(true);
    }
  }, [searchParams]);

  const { data: users = [] } = useUsers();
  const { data: stages = [] } = useCourtCaseStatuses();

  // Мемоизированные мапы для производительности
  const userMap = useMemo(() => {
    const map = new Map<string, string>();
    users.forEach((u) => {
      map.set(u.id, u.name);
    });
    return map;
  }, [users]);

  const stageMap = useMemo(() => {
    const map = new Map<number, { name: string; color: string | null }>();
    stages.forEach((s) => {
      map.set(s.id, { name: s.name, color: s.color });
    });
    return map;
  }, [stages]);

  // Обработанные данные судебных дел с именами (используем оптимизированные данные)
  const casesWithNames = useMemo(() => {
    return cases.map((c: any) => ({
      ...c,
      unitNames: c.unit_names || "",
      buildingNames: c.building_names || "",
      projectName: c.project_name || "",
      statusName: c.status_name || stageMap.get(c.status)?.name || "",
      statusColor: c.status_color || stageMap.get(c.status)?.color || null,
      responsibleLawyerName: c.responsible_lawyer_name || userMap.get(c.responsible_lawyer_id) || null,
      createdByName: c.created_by_name || userMap.get(c.created_by) || null,
      plaintiffNames: c.plaintiff_names || "",
      defendantNames: c.defendant_names || "",
    }));
  }, [cases, userMap, stageMap]);

  // Фильтрация данных по проектам пользователя
  const userProjectIds = useAuthStore((s) => s.profile?.project_ids) ?? [];
  const filteredCases = useMemo(() => {
    if (perm?.only_assigned_project) {
      return casesWithNames.filter((c) => 
        userProjectIds.includes(c.project_id)
      );
    }
    return casesWithNames;
  }, [casesWithNames, perm?.only_assigned_project, userProjectIds]);

  // Получаем опции для фильтров
  const { data: filterOptions } = useCourtCasesFilterOptions();

  // Обработчики
  const handleDeleteCase = useCallback(async (caseId: number, projectId: number) => {
    try {
      await deleteCaseMutation.mutateAsync({ id: caseId, project_id: projectId });
      notify("Дело удалено", "success");
    } catch (error: any) {
      notify("Ошибка при удалении дела: " + error.message, "error");
    }
  }, [deleteCaseMutation, notify]);

  const handleLinkCases = useCallback(async (parentId: string, childIds: string[]) => {
    try {
      await linkCases.mutateAsync({ parentId, childIds });
      notify("Дела связаны", "success");
      setLinkFor(null);
    } catch (error: any) {
      notify("Ошибка при связывании дел: " + error.message, "error");
    }
  }, [linkCases, notify]);

  const handleUnlinkCase = useCallback(async (caseId: number) => {
    try {
      await unlinkCase.mutateAsync(caseId);
      notify("Связь удалена", "success");
    } catch (error: any) {
      notify("Ошибка при удалении связи: " + error.message, "error");
    }
  }, [unlinkCase, notify]);

  const handleToggleFilters = useCallback(() => {
    const newValue = !showFilters;
    setShowFilters(newValue);
    try {
      localStorage.setItem(LS_FILTERS_VISIBLE_KEY, JSON.stringify(newValue));
    } catch {}
  }, [showFilters]);

  const handleFiltersSubmit = useCallback((values: CourtCasesFiltersValues) => {
    setFilters(values);
    message.success(`Фильтры применены (${filteredCases.length} результатов)`);
  }, [filteredCases.length]);

  const handleFiltersReset = useCallback(() => {
    setFilters({});
    message.info("Фильтры сброшены");
  }, []);

  // Колонки таблицы
  const columns: ColumnsType<any> = useMemo(() => [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 80,
      sorter: (a, b) => a.id - b.id,
      defaultSortOrder: 'descend',
    },
    {
      title: "Номер дела",
      dataIndex: "number",
      key: "number",
      width: 120,
      sorter: (a, b) => (a.number || "").localeCompare(b.number || ""),
    },
    {
      title: "Проект",
      dataIndex: "projectName",
      key: "project",
      width: 150,
      sorter: (a, b) => a.projectName.localeCompare(b.projectName),
    },
    {
      title: "Корпус",
      dataIndex: "buildingNames",
      key: "buildings",
      width: 120,
      sorter: (a, b) => a.buildingNames.localeCompare(b.buildingNames),
    },
    {
      title: "Объекты",
      dataIndex: "unitNames",
      key: "units",
      width: 200,
      sorter: (a, b) => a.unitNames.localeCompare(b.unitNames),
    },
    {
      title: "Истцы",
      dataIndex: "plaintiffNames",
      key: "plaintiffs",
      width: 200,
      sorter: (a, b) => a.plaintiffNames.localeCompare(b.plaintiffNames),
    },
    {
      title: "Ответчики",
      dataIndex: "defendantNames",
      key: "defendants",
      width: 200,
      sorter: (a, b) => a.defendantNames.localeCompare(b.defendantNames),
    },
    {
      title: "Статус",
      dataIndex: "status",
      key: "status",
      width: 150,
      sorter: (a, b) => a.statusName.localeCompare(b.statusName),
      render: (status, record) => (
        <CourtCaseStatusSelect
          caseId={record.id}
          statusId={status}
          statusName={record.statusName}
          statusColor={record.statusColor}
        />
      ),
    },
    {
      title: "Юрист",
      dataIndex: "responsibleLawyerName",
      key: "lawyer",
      width: 150,
      sorter: (a, b) => (a.responsibleLawyerName || "").localeCompare(b.responsibleLawyerName || ""),
    },
    {
      title: "Сумма иска",
      dataIndex: "total_claim_amount",
      key: "claim_amount",
      width: 120,
      sorter: (a, b) => (a.total_claim_amount || 0) - (b.total_claim_amount || 0),
      render: (amount) => amount ? formatRub(amount) : "—",
    },
    {
      title: "Дата создания",
      dataIndex: "created_at",
      key: "created_at",
      width: 120,
      sorter: (a, b) => dayjs(a.created_at).valueOf() - dayjs(b.created_at).valueOf(),
      render: (date) => date ? dayjs(date).format("DD.MM.YYYY") : "—",
    },
    {
      title: "Действия",
      key: "actions",
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Просмотр">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => setViewId(record.id)}
              size="small"
            />
          </Tooltip>
          <Tooltip title="Связать дела">
            <Button
              type="text"
              icon={<LinkOutlined />}
              onClick={() => setLinkFor(record)}
              size="small"
            />
          </Tooltip>
          {record.parent_id && (
            <Tooltip title="Отвязать от родительского дела">
              <Button
                type="text"
                icon={<BranchesOutlined />}
                onClick={() => handleUnlinkCase(record.id)}
                size="small"
              />
            </Tooltip>
          )}
          <Popconfirm
            title="Удалить дело?"
            onConfirm={() => handleDeleteCase(record.id, record.project_id)}
            okText="Да"
            cancelText="Нет"
          >
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              size="small"
              loading={deleteCaseMutation.isPending}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ], [handleDeleteCase, handleUnlinkCase, deleteCaseMutation.isPending]);

  // Статистика
  const statistics = useMemo(() => {
    const total = filteredCases.length;
    const closedStages = stages.filter((s) => /закры|завер/i.test(s.name));
    const closedStageIds = closedStages.map((s) => s.id);
    const closed = filteredCases.filter((c) => closedStageIds.includes(c.status)).length;
    const open = total - closed;
    return { total, closed, open };
  }, [filteredCases, stages]);

  return (
    <ConfigProvider locale={ruRU}>
      <div style={{ padding: 24 }}>
        <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? "Скрыть форму" : "Добавить дело"}
          </Button>
          
          <Button
            type={showFilters ? "primary" : "default"}
            onClick={handleToggleFilters}
          >
            {showFilters ? "Скрыть фильтры" : "Показать фильтры"}
          </Button>
          
          <Button
            icon={<SettingOutlined />}
            onClick={() => setShowColumnsDrawer(true)}
          />
          
          <ExportCourtCasesButton cases={filteredCases} />
        </div>

        {showAddForm && (
          <Card style={{ marginBottom: 24 }}>
            <AddCourtCaseFormAntd
              onCreated={() => setShowAddForm(false)}
              initialValues={initialValues}
            />
          </Card>
        )}

        {showFilters && (
          <Card style={{ marginBottom: 24 }}>
            <CourtCasesFilters
              options={filterOptions}
              onSubmit={handleFiltersSubmit}
              onReset={handleFiltersReset}
              initialValues={filters}
            />
          </Card>
        )}

        {error ? (
          <Alert
            type="error"
            message={`Ошибка загрузки данных: ${error.message}`}
            style={{ marginBottom: 16 }}
          />
        ) : (
          <Table
            columns={columns}
            dataSource={filteredCases}
            rowKey="id"
            loading={casesLoading}
            pagination={{
              pageSize,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} из ${total} записей`,
              onShowSizeChange: (current, size) => setPageSize(size),
            }}
            scroll={{ x: 1500 }}
            size="small"
          />
        )}

        <div style={{ marginTop: 16 }}>
          <Typography.Text>
            Всего дел: {statistics.total}, из них открытых: {statistics.open}, закрытых: {statistics.closed}
          </Typography.Text>
        </div>

        <LinkCasesDialog
          open={!!linkFor}
          parent={linkFor}
          cases={filteredCases}
          loading={linkCases.isPending}
          onClose={() => setLinkFor(null)}
          onSubmit={handleLinkCases}
        />

        <CourtCaseViewModal
          open={viewId !== null}
          caseId={viewId}
          onClose={() => setViewId(null)}
        />

        <React.Suspense fallback={null}>
          <TableColumnsDrawer
            open={showColumnsDrawer}
            columns={[]}
            widths={{}}
            onWidthsChange={() => {}}
            onChange={() => {}}
            onClose={() => setShowColumnsDrawer(false)}
            onReset={() => {}}
          />
        </React.Suspense>
      </div>
    </ConfigProvider>
  );
}