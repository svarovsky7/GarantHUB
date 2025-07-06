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
} from "antd";
import { EyeOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import { useDeleteDefect } from "@/entities/defect";
import DefectStatusSelect from "@/features/defect/DefectStatusSelect";
import type { DefectWithInfo } from "@/shared/types/defect";
import type { DefectFilters } from "@/shared/types/defectFilters";
import { filterDefects } from "@/shared/utils/defectFilter";
import { naturalCompareArrays } from "@/shared/utils/naturalSort";

const fmt = (v: string | null) => (v ? dayjs(v).format("DD.MM.YYYY") : "—");
const fmtDateTime = (v: string | null) =>
  v ? dayjs(v).format("DD.MM.YYYY HH:mm") : "—";

interface Props {
  defects: DefectWithInfo[];
  filters: DefectFilters;
  loading?: boolean;
  /** Колонки таблицы. Если не переданы, используется набор по умолчанию */
  columns?: ColumnsType<DefectWithInfo>;
  onView?: (id: number) => void;
  lockedUnitIds?: number[];
}

/**
 * Таблица дефектов с возможностью изменения колонок и просмотра карточки.
 * Заголовок фиксируется при прокрутке, как и на странице претензий.
 */
export default function DefectsTable({
  defects,
  filters,
  loading,
  columns: columnsProp,
  onView,
  lockedUnitIds = [],
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
      width: 80,
      sorter: (a, b) => a.id - b.id,
      defaultSortOrder: 'descend' as const,
    },
    {
      title: "ID претензии",
      dataIndex: "claimIds",
      width: 120,
      sorter: (a, b) => naturalCompareArrays(a.claimIds, b.claimIds),
      render: (v: number[]) => v.join(", "),
    },
    {
      title: (
        <span>
          Прошло дней
          <br />с даты получения
        </span>
      ),
      dataIndex: "days",
      width: 120,
      sorter: (a, b) => (a.days ?? -1) - (b.days ?? -1),
    },
    {
      title: "Проект",
      dataIndex: "projectNames",
      width: 180,
      sorter: (a, b) =>
        (a.projectNames || "").localeCompare(b.projectNames || ""),
    },
    {
      title: "Корпус",
      dataIndex: "buildingNames",
      width: 120,
      sorter: (a, b) =>
        (a.buildingNames || "").localeCompare(b.buildingNames || ""),
    },
    {
      title: "Объекты",
      dataIndex: "unitNamesList",
      width: 160,
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
      width: 600,
      sorter: (a, b) => a.description.localeCompare(b.description),
    },
    {
      title: "Тип",
      dataIndex: "defectTypeName",
      width: 120,
      sorter: (a, b) =>
        (a.defectTypeName || "").localeCompare(b.defectTypeName || ""),
    },
    {
      title: "Статус",
      dataIndex: "status_id",
      width: 160,
      sorter: (a, b) =>
        (a.defectStatusName || "").localeCompare(b.defectStatusName || ""),
      render: (_: number, row) => (
        <DefectStatusSelect
          defectId={row.id}
          statusId={row.status_id}
          statusName={row.defectStatusName}
          statusColor={row.defectStatusColor}
          locked={row.unit_id != null && lockedUnitIds.includes(row.unit_id)}
        />
      ),
    },
    {
      title: "Кем устраняется",
      dataIndex: "fixByName",
      width: 180,
      sorter: (a, b) => (a.fixByName || "").localeCompare(b.fixByName || ""),
    },
    {
      title: "Дата получения",
      dataIndex: "received_at",
      width: 120,
      sorter: (a, b) =>
        (a.received_at ? dayjs(a.received_at).valueOf() : 0) -
        (b.received_at ? dayjs(b.received_at).valueOf() : 0),
      render: fmt,
    },
    {
      title: "Добавлено",
      dataIndex: "created_at",
      width: 160,
      sorter: (a, b) =>
        (a.created_at ? dayjs(a.created_at).valueOf() : 0) -
        (b.created_at ? dayjs(b.created_at).valueOf() : 0),
      render: fmtDateTime,
    },
    {
      title: "Автор",
      dataIndex: "createdByName",
      width: 160,
      sorter: (a, b) =>
        (a.createdByName || "").localeCompare(b.createdByName || ""),
    },
    {
      title: "Дата устранения",
      dataIndex: "fixed_at",
      width: 120,
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

  const columnsWithResize = columnsProp ?? defaultColumns;
  const [pageSize, setPageSize] = React.useState(100);

  if (loading) return <Skeleton active paragraph={{ rows: 6 }} />;

  const rowClassName = (row: DefectWithInfo) => {
    const classes = ["main-defect-row"];
    const checking = row.defectStatusName?.toLowerCase().includes("провер");
    const closed = row.defectStatusName?.toLowerCase().includes("закры");
    const preTrial = row.hasPretrialClaim;
    const locked = row.unit_id != null && lockedUnitIds.includes(row.unit_id);
    if (checking) classes.push("defect-confirmed-row");
    if (preTrial) classes.push("defect-pretrial-row");
    if (closed) classes.push("defect-closed-row");
    if (locked) classes.push("locked-object-row");
    return classes.join(" ");
  };

  return (
    <Table
      rowKey="id"
      columns={columnsWithResize}
      sticky={{ offsetHeader: 64 }}
      dataSource={filtered}
      pagination={{
        pageSize,
        showSizeChanger: true,
        onChange: (_p, size) => size && setPageSize(size),
      }}
      size="middle"
      /** Стилизуем строки аналогично таблице писем */
      rowClassName={rowClassName}
      style={{ background: "#fff" }}
    />
  );
}
