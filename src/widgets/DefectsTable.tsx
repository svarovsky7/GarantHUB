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
  /** 🚀 Серверная пагинация */
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize?: number) => void;
  };
}

/**
 * Таблица дефектов с возможностью изменения колонок и просмотра карточки.
 * Заголовок фиксируется при прокрутке, как и на странице претензий.
 *
 * 🚀 ОПТИМИЗАЦИЯ: Поддерживает серверную пагинацию через prop pagination
 */
const DefectsTable = React.memo<Props>(({
  defects,
  filters,
  loading,
  columns: columnsProp,
  onView,
  lockedUnitIds = [],
  pagination: paginationProp,
}) => {
  const { mutateAsync: remove, isPending } = useDeleteDefect();
  const filtered = useMemo(
    () => filterDefects(defects, filters),
    [defects, filters],
  );

  const defaultColumns: ColumnsType<DefectWithInfo> = useMemo(() => [
    {
      title: "ID",
      dataIndex: "id",
      width: 60,
      sorter: (a, b) => a.id - b.id,
      defaultSortOrder: 'descend' as const,
    },
    {
      title: "ID претензии",
      dataIndex: "claimIds",
      width: 85,
      sorter: (a, b) => naturalCompareArrays(a.claimIds, b.claimIds),
      render: (v: number[]) => v.join(", "),
    },
    {
      title: "Дней",
      dataIndex: "days",
      width: 60,
      sorter: (a, b) => (a.days ?? -1) - (b.days ?? -1),
    },
    {
      title: "Проект",
      dataIndex: "projectNames",
      width: 110,
      sorter: (a, b) =>
        (a.projectNames || "").localeCompare(b.projectNames || ""),
      ellipsis: true,
    },
    {
      title: "Корпус",
      dataIndex: "buildingNames",
      width: 80,
      sorter: (a, b) =>
        (a.buildingNames || "").localeCompare(b.buildingNames || ""),
      ellipsis: true,
    },
    {
      title: "Объекты",
      dataIndex: "unitNamesList",
      width: 100,
      sorter: (a, b) => (a.unitNames || "").localeCompare(b.unitNames || ""),
      render: (_: string[], row) => (
        <>
          {row.unitNamesList?.map((n, i) => (
            <div key={i} style={{ whiteSpace: "nowrap", fontSize: '11px', lineHeight: '1.3' }}>
              {n}
            </div>
          ))}
        </>
      ),
    },
    {
      title: "Описание",
      dataIndex: "description",
      width: 250,
      sorter: (a, b) => a.description.localeCompare(b.description),
      ellipsis: { showTitle: false },
      render: (text: string) => (
        <Tooltip title={text} placement="topLeft">
          <span>{text}</span>
        </Tooltip>
      ),
    },
    {
      title: "Тип",
      dataIndex: "defectTypeName",
      width: 80,
      sorter: (a, b) =>
        (a.defectTypeName || "").localeCompare(b.defectTypeName || ""),
      ellipsis: true,
    },
    {
      title: "Статус",
      dataIndex: "status_id",
      width: 120,
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
      title: "Гар.",
      dataIndex: "is_warranty",
      width: 50,
      sorter: (a, b) => Number(a.is_warranty) - Number(b.is_warranty),
      render: (v: boolean) => (v ? "Да" : "Нет"),
    },
    {
      title: "Кем устраняется",
      dataIndex: "fixByName",
      width: 110,
      sorter: (a, b) => (a.fixByName || "").localeCompare(b.fixByName || ""),
      ellipsis: true,
    },
    {
      title: "Получено",
      dataIndex: "received_at",
      width: 85,
      sorter: (a, b) =>
        (a.received_at ? dayjs(a.received_at).valueOf() : 0) -
        (b.received_at ? dayjs(b.received_at).valueOf() : 0),
      render: fmt,
    },
    {
      title: "Добавлено",
      dataIndex: "created_at",
      width: 110,
      sorter: (a, b) =>
        (a.created_at ? dayjs(a.created_at).valueOf() : 0) -
        (b.created_at ? dayjs(b.created_at).valueOf() : 0),
      render: fmtDateTime,
    },
    {
      title: "Автор",
      dataIndex: "createdByName",
      width: 100,
      sorter: (a, b) =>
        (a.createdByName || "").localeCompare(b.createdByName || ""),
      ellipsis: true,
    },
    {
      title: "Устранено",
      dataIndex: "fixed_at",
      width: 85,
      sorter: (a, b) =>
        (a.fixed_at ? dayjs(a.fixed_at).valueOf() : 0) -
        (b.fixed_at ? dayjs(b.fixed_at).valueOf() : 0),
      render: fmt,
    },
    {
      title: "Действия",
      key: "actions",
      width: 75,
      fixed: 'right' as const,
      render: (_, row) => (
        <Space size={4}>
          <Tooltip title="Просмотр">
            <Button
              size="small"
              type="text"
              icon={<EyeOutlined />}
              onClick={() => onView && onView(row.id)}
            />
          </Tooltip>
          <Popconfirm
            title="Удалить?"
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

  // 🚀 Клиентская пагинация (fallback для обратной совместимости)
  const [clientPageSize, setClientPageSize] = React.useState(50);

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

  // 🚀 Используем серверную пагинацию если передана, иначе клиентскую
  const paginationConfig = paginationProp
    ? {
        current: paginationProp.current,
        pageSize: paginationProp.pageSize,
        total: paginationProp.total,
        showSizeChanger: true,
        onChange: paginationProp.onChange,
      }
    : {
        pageSize: clientPageSize,
        showSizeChanger: true,
        onChange: (_p: number, size?: number) => size && setClientPageSize(size),
      };

  return (
    <Table
      rowKey="id"
      columns={columnsWithResize}
      sticky={{ offsetHeader: 80 }}
      dataSource={filtered}
      pagination={paginationConfig}
      size="small"
      /** Стилизуем строки аналогично таблице писем */
      rowClassName={rowClassName}
      style={{ background: "#fff", fontSize: '12px' }}
    />
  );
});

DefectsTable.displayName = 'DefectsTable';

export default DefectsTable;
