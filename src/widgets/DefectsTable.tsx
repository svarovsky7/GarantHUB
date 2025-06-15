import React, { useMemo } from "react";
import dayjs from "dayjs";
import {
  Table,
  Button,
  Tooltip,
  Skeleton,
  Popconfirm,
  message,
  Space,
  Tag,
} from "antd";
import {
  EyeOutlined,
  DeleteOutlined,
  CheckCircleTwoTone,
  CloseCircleTwoTone,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useDeleteDefect } from "@/entities/defect";
import DefectStatusSelect from "@/features/defect/DefectStatusSelect";
import type { DefectWithInfo } from "@/shared/types/defect";
import type { DefectFilters } from "@/shared/types/defectFilters";
import { filterDefects } from "@/shared/utils/defectFilter";

const fmt = (v: string | null) => (v ? dayjs(v).format("DD.MM.YYYY") : "—");

interface Props {
  defects: DefectWithInfo[];
  filters: DefectFilters;
  loading?: boolean;
  /** Колонки таблицы. Если не переданы, используется набор по умолчанию */
  columns?: ColumnsType<DefectWithInfo>;
  onView?: (id: number) => void;
}

export default function DefectsTable({
  defects,
  filters,
  loading,
  columns: columnsProp,
  onView,
}: Props) {
  const { mutateAsync: remove, isPending } = useDeleteDefect();
  const filtered = useMemo(
    () => filterDefects(defects, filters),
    [defects, filters],
  );

  const defaultColumns: ColumnsType<DefectWithInfo> = [
    {
      title: "ID дефекта",
      dataIndex: "id",
      sorter: (a, b) => a.id - b.id,
    },
    {
      title: "ID замечание",
      dataIndex: "ticketIds",
      sorter: (a, b) =>
        a.ticketIds.join(",").localeCompare(b.ticketIds.join(",")),
      render: (v: number[]) => v.join(", "),
    },
    {
      title: "Устранён",
      dataIndex: "is_fixed",
      sorter: (a, b) => Number(a.is_fixed) - Number(b.is_fixed),
      render: (v: boolean) =>
        v ? (
          <Tag icon={<CheckCircleTwoTone twoToneColor="#52c41a" />} color="success">
            Да
          </Tag>
        ) : (
          <Tag icon={<CloseCircleTwoTone twoToneColor="#eb2f96" />} color="default">
            Нет
          </Tag>
        ),
    },
    {
      title: (
        <span>
          Прошло дней
          <br />с даты получения
        </span>
      ),
      dataIndex: "days",
      sorter: (a, b) => (a.days ?? -1) - (b.days ?? -1),
    },
    {
      title: "Проект",
      dataIndex: "projectNames",
      sorter: (a, b) =>
        (a.projectNames || "").localeCompare(b.projectNames || ""),
    },
    {
      title: "Объекты",
      dataIndex: "unitNamesList",
      sorter: (a, b) => (a.unitNames || "").localeCompare(b.unitNames || ""),
      render: (_: string[], row) => (
        <>
          {row.unitNamesList?.map((n, i) => (
            <div key={i} style={{ whiteSpace: "nowrap" }}>
              {n}
            </div>
          ))}
        </>
      ),
    },
    {
      title: "Описание",
      dataIndex: "description",
      sorter: (a, b) => a.description.localeCompare(b.description),
    },
    {
      title: "Тип",
      dataIndex: "defectTypeName",
      sorter: (a, b) =>
        (a.defectTypeName || "").localeCompare(b.defectTypeName || ""),
    },
    {
      title: "Статус",
      dataIndex: "defect_status_id",
      sorter: (a, b) =>
        (a.defectStatusName || "").localeCompare(b.defectStatusName || ""),
      render: (_: number, row) => (
        <DefectStatusSelect
          defectId={row.id}
          statusId={row.defect_status_id}
          statusName={row.defectStatusName}
        />
      ),
    },
    {
      title: "Кем устраняется",
      dataIndex: "fixByName",
      sorter: (a, b) => (a.fixByName || "").localeCompare(b.fixByName || ""),
    },
    {
      title: "Дата получения",
      dataIndex: "received_at",
      sorter: (a, b) =>
        (a.received_at ? dayjs(a.received_at).valueOf() : 0) -
        (b.received_at ? dayjs(b.received_at).valueOf() : 0),
      render: fmt,
    },
    {
      title: "Дата устранения",
      dataIndex: "fixed_at",
      sorter: (a, b) =>
        (a.fixed_at ? dayjs(a.fixed_at).valueOf() : 0) -
        (b.fixed_at ? dayjs(b.fixed_at).valueOf() : 0),
      render: fmt,
    },
    {
      title: "Действия",
      key: "actions",
      width: 100,
      render: (_, row) => (
        <Space size="middle">
          <Tooltip title="Просмотр">
            <Button
              size="small"
              type="text"
              icon={<EyeOutlined />}
              onClick={() => onView && onView(row.id)}
            />
          </Tooltip>
          <Popconfirm
            title="Удалить дефект?"
            okText="Да"
            cancelText="Нет"
            onConfirm={async () => {
              await remove(row.id);
              message.success("Удалено");
            }}
            disabled={isPending}
          >
            <Button
              size="small"
              type="text"
              danger
              icon={<DeleteOutlined />}
              loading={isPending}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const columns = columnsProp ?? defaultColumns;

  if (loading) return <Skeleton active paragraph={{ rows: 6 }} />;

  const rowClassName = (row: DefectWithInfo) => {
    const closed = row.defectStatusName?.toLowerCase().includes("закры");
    if (closed) return "main-defect-row defect-closed-row";
    if (row.is_fixed) return "main-defect-row defect-confirmed-row";
    return "main-defect-row";
  };

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={filtered}
      pagination={{ pageSize: 25, showSizeChanger: true }}
      size="middle"
      /** Стилизуем строки аналогично таблице писем */
      rowClassName={rowClassName}
      style={{ background: "#fff" }}
    />
  );
}
