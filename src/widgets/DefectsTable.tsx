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
const DefectsTable = React.memo<Props>(({
  defects,
  filters,
  loading,
  columns: columnsProp,
  onView,
  lockedUnitIds = [],
}) => {
  const { mutateAsync: remove, isPending } = useDeleteDefect();
  const filtered = useMemo(
    () => filterDefects(defects, filters),
    [defects, filters],
  );

  const defaultColumns: ColumnsType<DefectWithInfo> = useMemo(() => [
    {
      title: "ID дефекта",
      dataIndex: "id",
      width: 70,
      sorter: (a, b) => a.id - b.id,
      defaultSortOrder: 'descend' as const,
    },
    {
      title: "ID претензии",
      dataIndex: "claimIds",
      width: 100,
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
      width: 100,
      sorter: (a, b) => (a.days ?? -1) - (b.days ?? -1),
    },
    {
      title: "Проект",
      dataIndex: "projectNames",
      width: 140,
      sorter: (a, b) =>
        (a.projectNames || "").localeCompare(b.projectNames || ""),
    },
    {
      title: "Корпус",
      dataIndex: "buildingNames",
      width: 100,
      sorter: (a, b) =>
        (a.buildingNames || "").localeCompare(b.buildingNames || ""),
    },
    {
      title: "Объекты",
      dataIndex: "unitNamesList",
      width: 130,
      sorter: (a, b) => (a.unitNames || "").localeCompare(b.unitNames || ""),
      render: (_: string[], row) => (
        <>
          {row.unitNamesList?.map((n, i) => (
            <div key={i} style={{ whiteSpace: "nowrap", fontSize: '12px' }}>
              {n}
            </div>
          ))}
        </>
      ),
    },
    {
      title: "Описание",
      dataIndex: "description",
      width: 300,
      sorter: (a, b) => a.description.localeCompare(b.description),
      ellipsis: { showTitle: false },
      render: (text: string) => (
        <Tooltip title={text} placement="topLeft">
          <span style={{ fontSize: '12px' }}>{text}</span>
        </Tooltip>
      ),
    },
    {
      title: "Тип",
      dataIndex: "defectTypeName",
      width: 100,
      sorter: (a, b) =>
        (a.defectTypeName || "").localeCompare(b.defectTypeName || ""),
      ellipsis: true,
    },
    {
      title: "Статус",
      dataIndex: "status_id",
      width: 140,
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
      title: "Гарантия",
      dataIndex: "is_warranty",
      width: 80,
      sorter: (a, b) => Number(a.is_warranty) - Number(b.is_warranty),
      render: (v: boolean) => (v ? "Да" : "Нет"),
    },
    {
      title: "Кем устраняется",
      dataIndex: "fixByName",
      width: 140,
      sorter: (a, b) => (a.fixByName || "").localeCompare(b.fixByName || ""),
      ellipsis: true,
    },
    {
      title: "Дата получения",
      dataIndex: "received_at",
      width: 100,
      sorter: (a, b) =>
        (a.received_at ? dayjs(a.received_at).valueOf() : 0) -
        (b.received_at ? dayjs(b.received_at).valueOf() : 0),
      render: fmt,
    },
    {
      title: "Добавлено",
      dataIndex: "created_at",
      width: 130,
      sorter: (a, b) =>
        (a.created_at ? dayjs(a.created_at).valueOf() : 0) -
        (b.created_at ? dayjs(b.created_at).valueOf() : 0),
      render: fmtDateTime,
    },
    {
      title: "Автор",
      dataIndex: "createdByName",
      width: 130,
      sorter: (a, b) =>
        (a.createdByName || "").localeCompare(b.createdByName || ""),
      ellipsis: true,
    },
    {
      title: "Дата устранения",
      dataIndex: "fixed_at",
      width: 100,
      sorter: (a, b) =>
        (a.fixed_at ? dayjs(a.fixed_at).valueOf() : 0) -
        (b.fixed_at ? dayjs(b.fixed_at).valueOf() : 0),
      render: fmt,
    },
    {
      title: "Действия",
      key: "actions",
      width: 90,
      render: (_, row) => (
        <Space size="small">
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
  ], [onView, remove, isPending, lockedUnitIds]);

  const columnsWithResize = columnsProp ?? defaultColumns;
  const [pageSize, setPageSize] = React.useState(50);

  const rowClassName = React.useCallback((row: DefectWithInfo) => {
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
  }, [lockedUnitIds]);

  if (loading) return <Skeleton active paragraph={{ rows: 6 }} />;

  return (
    <Table
      rowKey="id"
      columns={columnsWithResize}
      sticky={{ offsetHeader: 80 }}
      dataSource={filtered}
      pagination={{
        pageSize,
        showSizeChanger: true,
        onChange: (_p, size) => size && setPageSize(size),
      }}
      size="small"
      /** Стилизуем строки аналогично таблице писем */
      rowClassName={rowClassName}
      style={{ background: "#fff", fontSize: '13px' }}
    />
  );
});

DefectsTable.displayName = 'DefectsTable';

export default DefectsTable;
