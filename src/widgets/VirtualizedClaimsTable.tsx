import React, { useMemo, useCallback, useState } from "react";
import { FixedSizeList as List } from "react-window";
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
import type { ClaimFilters } from "@/shared/types/claimFilters";
import type { ClaimWithNames } from "@/shared/types/claimWithNames";
import ClaimStatusSelect from "@/features/claim/ClaimStatusSelect";
import dayjs from "dayjs";

const ITEM_HEIGHT = 56; // Высота строки таблицы

const fmt = (d: any) =>
  d && dayjs.isDayjs(d) && d.isValid() ? d.format("DD.MM.YYYY") : "—";

interface VirtualRowProps {
  index: number;
  style: React.CSSProperties;
  data: {
    items: ClaimWithNames[];
    columns: ColumnsType<any>;
    onView?: (id: number) => void;
    onAddChild?: (parent: ClaimWithNames) => void;
    onUnlink?: (id: number) => void;
    lockedUnitIds: number[];
  };
}

const VirtualRow = React.memo<VirtualRowProps>(({ index, style, data }) => {
  const { items, columns, onView, onAddChild, onUnlink, lockedUnitIds } = data;
  const item = items[index];
  
  if (!item) return null;

  const rowClassName = () => {
    const checking = item.statusName?.toLowerCase().includes("провер");
    const closed = item.statusName?.toLowerCase().includes("закры");
    const preTrial =
      item.pre_trial_claim || item.statusName?.toLowerCase().includes("досудеб");
    const locked = item.unit_ids?.some((id) => lockedUnitIds.includes(id));
    
    let className = "virtual-table-row";
    if (locked) className += " locked-object-row";
    else if (checking) className += " claim-checking-row";
    else if (preTrial) className += " claim-pretrial-row";
    else if (closed) className += " claim-closed-row";
    
    if (item.parent_id) className += " child-claim-row";
    else className += " main-claim-row";
    
    return className;
  };

  return (
    <div style={style} className={rowClassName()}>
      <div className="virtual-table-row-content">
        {columns.map((col: any, colIndex) => {
          const value = item[col.dataIndex as keyof ClaimWithNames];
          let content;

          switch (col.dataIndex) {
            case "treeIcon":
              content = !item.parent_id ? (
                <Tooltip title="Основная претензия">
                  <FileTextOutlined style={{ color: "#1890ff", fontSize: 17 }} />
                </Tooltip>
              ) : (
                <Tooltip title="Связанная претензия">
                  <BranchesOutlined style={{ color: "#52c41a", fontSize: 16 }} />
                </Tooltip>
              );
              break;

            case "claim_status_id":
              content = (
                <ClaimStatusSelect
                  claimId={item.id}
                  statusId={item.claim_status_id}
                  statusColor={item.statusColor}
                  statusName={item.statusName}
                  locked={item.unit_ids?.some((id: number) =>
                    lockedUnitIds.includes(id),
                  )}
                />
              );
              break;

            default:
              if (col.key === "actions") {
                content = (
                  <Space size="small">
                    <Tooltip title="Просмотр">
                      <Button
                        size="small"
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={() => onView && onView(item.id)}
                      />
                    </Tooltip>
                    <Button
                      size="small"
                      type="text"
                      icon={<PlusOutlined />}
                      onClick={() => onAddChild && onAddChild(item)}
                    />
                    {item.parent_id && (
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
                          onClick={() => onUnlink && onUnlink(item.id)}
                        />
                      </Tooltip>
                    )}
                    <DeleteButton item={item} />
                  </Space>
                );
              } else if (col.render) {
                content = col.render(value, item, index);
              } else {
                content = value?.toString() || "—";
              }
          }

          return (
            <div
              key={colIndex}
              className="virtual-table-cell"
              style={{ width: col.width || 100, minWidth: col.width || 100 }}
            >
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
});

const DeleteButton = React.memo<{ item: ClaimWithNames }>(({ item }) => {
  const { mutateAsync: remove, isPending } = useDeleteClaim();
  
  return (
    <Popconfirm
      title="Удалить претензию?"
      okText="Да"
      cancelText="Нет"
      onConfirm={async () => {
        await remove({ id: item.id });
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
  );
});

interface Props {
  claims: ClaimWithNames[];
  filters: ClaimFilters;
  loading?: boolean;
  columns?: ColumnsType<any>;
  onView?: (id: number) => void;
  onAddChild?: (parent: ClaimWithNames) => void;
  onUnlink?: (id: number) => void;
  lockedUnitIds?: number[];
  height?: number;
}

export default function VirtualizedClaimsTable({
  claims,
  filters,
  loading,
  columns: columnsProp,
  onView,
  onAddChild,
  onUnlink,
  lockedUnitIds = [],
  height = 600,
}: Props) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  
  const defaultColumns: ColumnsType<any> = useMemo(
    () => [
      {
        title: "",
        dataIndex: "treeIcon",
        width: 40,
      },
      {
        title: "ID",
        dataIndex: "id",
        width: 80,
      },
      {
        title: "Проект",
        dataIndex: "projectName",
        width: 180,
      },
      {
        title: "Корпус", 
        dataIndex: "buildings",
        width: 120,
      },
      {
        title: "Объекты",
        dataIndex: "unitNames", 
        width: 160,
      },
      {
        title: "Статус",
        dataIndex: "claim_status_id",
        width: 160,
      },
      {
        title: "№ претензии",
        dataIndex: "claim_no",
        width: 160,
      },
      {
        title: "Дата претензии",
        dataIndex: "claimedOn",
        width: 120,
        render: (v) => fmt(v),
      },
      {
        title: "Дата получения Застройщиком",
        dataIndex: "acceptedOn", 
        width: 120,
        render: (v) => fmt(v),
      },
      {
        title: "Дата регистрации претензии",
        dataIndex: "registeredOn",
        width: 120,
        render: (v) => fmt(v),
      },
      {
        title: "Дата устранения",
        dataIndex: "resolvedOn",
        width: 120,
        render: (v) => fmt(v),
      },
      {
        title: "Закрепленный инженер",
        dataIndex: "responsibleEngineerName",
        width: 180,
      },
      {
        title: "Действия",
        key: "actions",
        width: 140,
      },
    ],
    []
  );

  const columns = columnsProp ?? defaultColumns;

  const filtered = useMemo(() => {
    return claims.filter((c) => {
      const matchesProject =
        !filters.project || c.projectName === filters.project;
      const matchesUnits =
        !filters.units ||
        (() => {
          const units = c.unitNumbers
            ? c.unitNumbers.split(",").map((n) => n.trim())
            : [];
          return filters.units.every((u) => units.includes(u));
        })();
      const matchesBuilding =
        !filters.building ||
        (() => {
          const blds = c.buildings
            ? c.buildings.split(",").map((n) => n.trim())
            : [];
          return blds.includes(filters.building!);
        })();
      const matchesStatus = !filters.status || c.statusName === filters.status;
      const matchesResponsible =
        !filters.responsible ||
        c.responsibleEngineerName === filters.responsible;
      const matchesAuthor =
        !filters.author || c.createdByName === filters.author;
      const matchesNumber =
        !filters.claim_no || c.claim_no.includes(filters.claim_no);
      const matchesIds = !filters.id || filters.id.includes(c.id);
      const matchesDescription =
        !filters.description ||
        (c.description ?? "").includes(filters.description);
      const matchesHideClosed = !(
        filters.hideClosed && /(закры|не\s*гаран)/i.test(c.statusName)
      );
      const matchesPeriod =
        !filters.period ||
        (c.registeredOn &&
          c.registeredOn.isSameOrAfter(filters.period[0], "day") &&
          c.registeredOn.isSameOrBefore(filters.period[1], "day"));
      const matchesClaimedPeriod =
        !filters.claimedPeriod ||
        (c.claimedOn &&
          c.claimedOn.isSameOrAfter(filters.claimedPeriod[0], "day") &&
          c.claimedOn.isSameOrBefore(filters.claimedPeriod[1], "day"));
      const matchesAcceptedPeriod =
        !filters.acceptedPeriod ||
        (c.acceptedOn &&
          c.acceptedOn.isSameOrAfter(filters.acceptedPeriod[0], "day") &&
          c.acceptedOn.isSameOrBefore(filters.acceptedPeriod[1], "day"));
      const matchesResolvedPeriod =
        !filters.resolvedPeriod ||
        (c.resolvedOn &&
          c.resolvedOn.isSameOrAfter(filters.resolvedPeriod[0], "day") &&
          c.resolvedOn.isSameOrBefore(filters.resolvedPeriod[1], "day"));
      return (
        matchesProject &&
        matchesUnits &&
        matchesBuilding &&
        matchesStatus &&
        matchesResponsible &&
        matchesAuthor &&
        matchesNumber &&
        matchesIds &&
        matchesDescription &&
        matchesHideClosed &&
        matchesPeriod &&
        matchesClaimedPeriod &&
        matchesAcceptedPeriod &&
        matchesResolvedPeriod
      );
    });
  }, [claims, filters]);

  const paginatedData = useMemo(() => {
    const start = page * pageSize;
    const end = start + pageSize;
    return filtered.slice(start, end);
  }, [filtered, page, pageSize]);

  const itemData = useMemo(
    () => ({
      items: paginatedData,
      columns,
      onView,
      onAddChild,
      onUnlink,
      lockedUnitIds,
    }),
    [paginatedData, columns, onView, onAddChild, onUnlink, lockedUnitIds]
  );

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        Загрузка...
      </div>
    );
  }

  const totalPages = Math.ceil(filtered.length / pageSize);

  return (
    <div className="virtualized-claims-table">
      <style>{`
        .virtual-table-row {
          display: flex;
          align-items: center;
          border-bottom: 1px solid #f0f0f0;
          padding: 8px 0;
          background: #fff;
        }
        
        .virtual-table-row:hover {
          background: #fafafa;
        }
        
        .virtual-table-row-content {
          display: flex;
          width: 100%;
          align-items: center;
        }
        
        .virtual-table-cell {
          padding: 4px 8px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          border-right: 1px solid #f0f0f0;
          display: flex;
          align-items: center;
        }
        
        .virtual-table-cell:last-child {
          border-right: none;
        }
        
        .claim-checking-row {
          background-color: #fff7e6 !important;
        }
        
        .claim-pretrial-row {
          background-color: #f6ffed !important;
        }
        
        .claim-closed-row {
          background-color: #f0f0f0 !important;
        }
        
        .locked-object-row {
          background-color: #fff2f0 !important;
        }
        
        .child-claim-row {
          padding-left: 24px;
        }
      `}</style>
      
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>
            Показано {paginatedData.length} из {filtered.length} претензий
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span>Размер страницы:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(0);
              }}
              style={{ padding: "4px 8px" }}
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
          </div>
        </div>
      </div>
      
      <div style={{ border: "1px solid #f0f0f0", borderRadius: 6 }}>
        <div
          style={{
            display: "flex",
            background: "#fafafa",
            borderBottom: "1px solid #f0f0f0",
            fontWeight: 600,
          }}
        >
          {columns.map((col: any, index) => (
            <div
              key={index}
              className="virtual-table-cell"
              style={{ width: col.width || 100, minWidth: col.width || 100 }}
            >
              {col.title}
            </div>
          ))}
        </div>
        
        <List
          height={height}
          itemCount={paginatedData.length}
          itemSize={ITEM_HEIGHT}
          itemData={itemData}
          width="100%"
        >
          {VirtualRow}
        </List>
      </div>
      
      {totalPages > 1 && (
        <div style={{ marginTop: 16, textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}>
            <Button
              disabled={page === 0}
              onClick={() => setPage(0)}
            >
              Первая
            </Button>
            <Button
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
            >
              Предыдущая
            </Button>
            <span style={{ margin: "0 16px" }}>
              Страница {page + 1} из {totalPages}
            </span>
            <Button
              disabled={page >= totalPages - 1}
              onClick={() => setPage(page + 1)}
            >
              Следующая
            </Button>
            <Button
              disabled={page >= totalPages - 1}
              onClick={() => setPage(totalPages - 1)}
            >
              Последняя
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}