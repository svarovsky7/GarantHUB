import React, { useMemo } from "react";
import dayjs from "dayjs";
import { Table, Tooltip, Space, Button, Popconfirm, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  EyeOutlined,
  DeleteOutlined,
  PlusOutlined,
  BranchesOutlined,
  FileTextOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import { useDeleteClaim } from "@/entities/claim";
import type { ClaimWithNames } from "@/shared/types/claimWithNames";
import ClaimStatusSelect from "@/features/claim/ClaimStatusSelect";

const fmt = (d: any) =>
  d && dayjs.isDayjs(d) && d.isValid() ? d.format("DD.MM.YYYY") : "—";
const fmtDateTime = (d: any) =>
  d && dayjs.isDayjs(d) && d.isValid() ? d.format("DD.MM.YYYY HH:mm") : "—";

interface Props {
  claims: ClaimWithNames[];
  loading?: boolean;
  columns?: ColumnsType<any>;
  onView?: (id: number) => void;
  onAddChild?: (parent: ClaimWithNames) => void;
  onUnlink?: (id: number) => void;
  lockedUnitIds?: number[];
  showPagination?: boolean;
}

export default function ClaimsTable({
  claims,
  loading,
  columns: columnsProp,
  onView,
  onAddChild,
  onUnlink,
  lockedUnitIds = [],
  showPagination = true,
}: Props) {
  const { mutateAsync: remove, isPending } = useDeleteClaim();
  const defaultColumns: ColumnsType<any> = useMemo(
    () => [
      {
        title: "",
        dataIndex: "treeIcon",
        width: 40,
        render: (_: any, record: any) => {
          if (!record.parent_id) {
            return (
              <Tooltip title="Основная претензия">
                <FileTextOutlined style={{ color: "#1890ff", fontSize: 17 }} />
              </Tooltip>
            );
          }
          return (
            <Tooltip title="Связанная претензия">
              <BranchesOutlined style={{ color: "#52c41a", fontSize: 16 }} />
            </Tooltip>
          );
        },
      },
      {
        title: "ID",
        dataIndex: "id",
        width: 80,
        sorter: (a, b) => a.id - b.id,
      },
      {
        title: "Проект",
        dataIndex: "projectName",
        width: 180,
        sorter: (a, b) => a.projectName.localeCompare(b.projectName),
      },
      {
        title: "Корпус",
        dataIndex: "buildings",
        width: 120,
        sorter: (a, b) => (a.buildings || "").localeCompare(b.buildings || ""),
      },
      {
        title: "Объекты",
        dataIndex: "unitNames",
        width: 160,
        sorter: (a, b) => a.unitNames.localeCompare(b.unitNames),
      },
      {
        title: "Статус",
        dataIndex: "claim_status_id",
        width: 160,
        sorter: (a, b) => a.statusName.localeCompare(b.statusName),
        render: (_: any, row: any) => (
          <ClaimStatusSelect
            claimId={row.id}
            statusId={row.claim_status_id}
            statusColor={row.statusColor}
            statusName={row.statusName}
            locked={row.unit_ids?.some((id: number) =>
              lockedUnitIds.includes(id),
            )}
          />
        ),
      },
      {
        title: "№ претензии",
        dataIndex: "claim_no",
        width: 160,
        sorter: (a, b) => a.claim_no.localeCompare(b.claim_no),
      },
      {
        title: "Дата претензии",
        dataIndex: "claimedOn",
        width: 120,
        sorter: (a, b) =>
          (a.claimedOn ? a.claimedOn.valueOf() : 0) -
          (b.claimedOn ? b.claimedOn.valueOf() : 0),
        render: (v) => fmt(v),
      },
      {
        title: "Дата получения Застройщиком",
        dataIndex: "acceptedOn",
        width: 120,
        sorter: (a, b) =>
          (a.acceptedOn ? a.acceptedOn.valueOf() : 0) -
          (b.acceptedOn ? b.acceptedOn.valueOf() : 0),
        render: (v) => fmt(v),
      },
      {
        title: "Дата регистрации претензии",
        dataIndex: "registeredOn",
        width: 120,
        sorter: (a, b) =>
          (a.registeredOn ? a.registeredOn.valueOf() : 0) -
          (b.registeredOn ? b.registeredOn.valueOf() : 0),
        render: (v) => fmt(v),
      },
      {
        title: "Дата устранения",
        dataIndex: "resolvedOn",
        width: 120,
        sorter: (a, b) =>
          (a.resolvedOn ? a.resolvedOn.valueOf() : 0) -
          (b.resolvedOn ? b.resolvedOn.valueOf() : 0),
        render: (v) => fmt(v),
      },
      {
        title: "Закрепленный инженер",
        dataIndex: "responsibleEngineerName",
        width: 180,
        sorter: (a, b) =>
          (a.responsibleEngineerName || "").localeCompare(
            b.responsibleEngineerName || "",
          ),
      },
      {
        title: "Добавлено",
        dataIndex: "createdAt",
        width: 160,
        sorter: (a, b) =>
          (a.createdAt ? a.createdAt.valueOf() : 0) -
          (b.createdAt ? b.createdAt.valueOf() : 0),
        render: (v) => fmtDateTime(v),
      },
      {
        title: "Автор",
        dataIndex: "createdByName",
        width: 160,
        sorter: (a, b) =>
          (a.createdByName || "").localeCompare(b.createdByName || ""),
      },
      {
        title: "Действия",
        key: "actions",
        width: 140,
        render: (_: any, record) => (
          <Space size="middle">
            <Tooltip title="Просмотр">
              <Button
                size="small"
                type="text"
                icon={<EyeOutlined />}
                onClick={() => onView && onView(record.id)}
              />
            </Tooltip>
            <Button
              size="small"
              type="text"
              icon={<PlusOutlined />}
              onClick={() => onAddChild && onAddChild(record)}
            />
            {record.parent_id && (
              <Tooltip title="Исключить из связи">
                <Button
                  size="small"
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
                  onClick={() => onUnlink && onUnlink(record.id)}
                />
              </Tooltip>
            )}
            <Popconfirm
              title="Удалить претензию?"
              okText="Да"
              cancelText="Нет"
              onConfirm={async () => {
                await remove({ id: record.id });
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
    ],
    [onView, remove, isPending],
  );

  const columnsWithResize = columnsProp ?? defaultColumns;

  // Claims are already filtered in parent component

  const treeData = useMemo(() => {
    const map = new Map<number, any>();
    const roots: any[] = [];
    claims.forEach((c) => {
      const row = { ...c, key: c.id, children: [] as any[] };
      map.set(c.id, row);
    });
    claims.forEach((c) => {
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
  }, [claims]);

  const [expandedRowKeys, setExpandedRowKeys] = React.useState<React.Key[]>([]);
  const [pageSize, setPageSize] = React.useState(100);

  React.useEffect(() => {
    // По умолчанию все строки свернуты
    setExpandedRowKeys([]);
  }, [claims]);

  const rowClassName = (row: ClaimWithNames) => {
    const checking = row.statusName?.toLowerCase().includes("провер");
    const closed = row.statusName?.toLowerCase().includes("закры");
    const preTrial =
      row.pre_trial_claim || row.statusName?.toLowerCase().includes("досудеб");
    const locked = row.unit_ids?.some((id) => lockedUnitIds.includes(id));
    if (locked) return "locked-object-row";
    if (checking || row.hasCheckingDefect) return "claim-checking-row";
    if (preTrial) return "claim-pretrial-row";
    if (closed) return "claim-closed-row";
    return "";
  };

  return (
    <Table
      rowKey="id"
      columns={columnsWithResize}
      sticky={{ offsetHeader: 80 }}
      dataSource={treeData}
      loading={loading}
      pagination={showPagination ? {
        pageSize,
        showSizeChanger: true,
        onChange: (_p, size) => size && setPageSize(size),
      } : false}
      size="middle"
      expandable={{
        expandRowByClick: true,
        indentSize: 24,
        expandedRowKeys,
        onExpand: (expanded, record) => {
          setExpandedRowKeys((prev) => {
            const set = new Set(prev);
            if (expanded) {
              set.add(record.id);
            } else {
              set.delete(record.id);
            }
            return Array.from(set);
          });
        },
      }}
      rowClassName={(row: any) => {
        const base = rowClassName(row);
        return row.parent_id
          ? `child-claim-row ${base}`
          : `main-claim-row ${base}`;
      }}
      style={{ background: "#fff" }}
    />
  );
}
