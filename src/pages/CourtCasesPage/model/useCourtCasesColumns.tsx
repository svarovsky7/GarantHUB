import React, { useState, useEffect, useMemo } from "react";
import dayjs from "dayjs";
import { Button, Space, Popconfirm, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  DeleteOutlined,
  LinkOutlined,
  FileTextOutlined,
  BranchesOutlined,
  EyeOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { formatRub } from "@/shared/utils/formatCurrency";
import type { CourtCase } from "@/shared/types/courtCase";
import type { TableColumnSetting } from "@/shared/types/tableColumnSetting";
import { useDeleteCourtCase, useUnlinkCase } from "@/entities/courtCase";
import CourtCaseStatusSelect from "@/features/courtCase/CourtCaseStatusSelect";
import type { CourtCaseEnriched } from "./useCourtCasesData";
import type { RolePermission } from "@/shared/types/rolePermission";

const LS_COLUMNS_KEY = "courtCasesColumns";
const LS_COLUMN_WIDTHS_KEY = "courtCasesColumnWidths";

interface UseCourtCasesColumnsProps {
  perm?: RolePermission;
  onView: (id: number) => void;
  onLink: (record: CourtCase) => void;
}

/**
 * Hook for managing court cases table columns configuration
 * @returns Columns configuration, state handlers, and reset function
 */
export function useCourtCasesColumns({
  perm,
  onView,
  onLink,
}: UseCourtCasesColumnsProps) {
  const deleteCaseMutation = useDeleteCourtCase();
  const unlinkCase = useUnlinkCase();

  // Base columns definition
  const baseColumns: Record<string, ColumnsType<CourtCaseEnriched>[number]> = useMemo(() => ({
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
      sorter: (a, b) => (a.projectName || "").localeCompare(b.projectName || ""),
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
      sorter: (a, b) => (a.projectObject || "").localeCompare(b.projectObject || ""),
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
        <div style={{ textAlign: "center", lineHeight: "1.2" }}>
          Сумма
          <br />
          требований
        </div>
      ),
      dataIndex: "totalClaimAmount",
      width: 150,
      sorter: (a, b) => (a.totalClaimAmount ?? 0) - (b.totalClaimAmount ?? 0),
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
        <div style={{ textAlign: "center", lineHeight: "1.2" }}>
          Дата начала
          <br />
          устранения
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
        <div style={{ textAlign: "center", lineHeight: "1.2" }}>
          Дата окончания
          <br />
          устранения
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
        <div style={{ textAlign: "center", lineHeight: "1.2" }}>
          Прошло дней с начала
          <br />
          устранения
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
              onClick={() => onView(record.id)}
            />
          </Tooltip>
          <Button
            type="text"
            icon={<PlusOutlined />}
            onClick={() => onLink(record)}
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
  }), [perm, onView, onLink, deleteCaseMutation, unlinkCase]);

  // Columns state (visibility and order)
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
          (d) => !filtered.some((f) => f.key === d.key)
        );
        return [...filtered, ...missing];
      }
    } catch {}
    return defaults;
  });

  // Column widths state
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    try {
      return JSON.parse(localStorage.getItem(LS_COLUMN_WIDTHS_KEY) || "{}");
    } catch {
      return {};
    }
  });

  // Reset columns to default
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

  // Persist columns state
  useEffect(() => {
    try {
      localStorage.setItem(LS_COLUMNS_KEY, JSON.stringify(columnsState));
    } catch {}
  }, [columnsState]);

  // Persist column widths
  useEffect(() => {
    try {
      localStorage.setItem(LS_COLUMN_WIDTHS_KEY, JSON.stringify(columnWidths));
    } catch {}
  }, [columnWidths]);

  // Build final columns array
  const columns: ColumnsType<CourtCaseEnriched> = useMemo(
    () =>
      columnsState
        .filter((c) => c.visible)
        .map((c) => ({
          ...baseColumns[c.key],
          width: columnWidths[c.key] ?? baseColumns[c.key].width,
        })),
    [columnsState, baseColumns, columnWidths]
  );

  return {
    columns,
    columnsState,
    setColumnsState,
    columnWidths,
    setColumnWidths,
    baseColumns,
    handleResetColumns,
  };
}
