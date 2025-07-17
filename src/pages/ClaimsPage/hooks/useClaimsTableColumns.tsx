import { useState, useEffect, useMemo, useCallback } from 'react';
import { Tooltip, Space, Button, Popconfirm } from 'antd';
import { 
  EyeOutlined, 
  DeleteOutlined, 
  BranchesOutlined, 
  FileTextOutlined 
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { TableColumnSetting } from '@/shared/types/tableColumnSetting';
import type { ClaimWithNames } from '@/shared/types/claimWithNames';
import type { ClaimTableData } from '../types/ClaimTableData';
import ClaimStatusSelect from '@/features/claim/ClaimStatusSelect';
import dayjs from 'dayjs';

const LS_COLUMNS_KEY = "claimsColumns";
const LS_COLUMN_WIDTHS_KEY = "claimsColumnWidths";

export function useClaimsTableColumns(handlers?: {
  onView?: (id: number) => void;
  onLink?: (claim: ClaimTableData) => void;
  onDelete?: (id: number) => void;
}) {
  // Хелперы для форматирования
  const fmt = (d: dayjs.Dayjs | null | undefined) =>
    d && dayjs.isDayjs(d) && d.isValid() ? d.format("DD.MM.YYYY") : "—";
  const fmtDateTime = (d: dayjs.Dayjs | null | undefined) =>
    d && dayjs.isDayjs(d) && d.isValid() ? d.format("DD.MM.YYYY HH:mm") : "—";

  // Base columns definition
  const getBaseColumns = useCallback(() => {
    return {
      treeIcon: {
        title: "",
        dataIndex: "treeIcon",
        width: 40,
        render: (_: unknown, record: ClaimTableData) => {
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
      id: {
        title: "ID",
        dataIndex: "id",
        width: 80,
        sorter: (a: ClaimTableData, b: ClaimTableData) => a.id - b.id,
      },
      projectName: {
        title: "Проект",
        dataIndex: "projectName",
        width: 180,
        sorter: (a: ClaimTableData, b: ClaimTableData) => a.projectName.localeCompare(b.projectName),
      },
      buildings: {
        title: "Корпус",
        dataIndex: "buildings",
        width: 120,
        sorter: (a: ClaimTableData, b: ClaimTableData) => (a.buildings || "").localeCompare(b.buildings || ""),
      },
      unitNames: {
        title: "Объекты",
        dataIndex: "unitNames",
        width: 160,
        sorter: (a: ClaimTableData, b: ClaimTableData) => a.unitNames.localeCompare(b.unitNames),
      },
      claim_status_id: {
        title: "Статус",
        dataIndex: "claim_status_id",
        width: 160,
        sorter: (a: ClaimTableData, b: ClaimTableData) => a.statusName.localeCompare(b.statusName),
        render: (_: unknown, row: ClaimTableData) => (
          <ClaimStatusSelect
            claimId={row.id}
            statusId={row.claim_status_id}
            statusColor={row.statusColor}
          />
        ),
      },
      claim_no: {
        title: "№ претензии",
        dataIndex: "claim_no",
        width: 160,
        sorter: (a: ClaimTableData, b: ClaimTableData) => a.claim_no.localeCompare(b.claim_no),
      },
      claimedOn: {
        title: "Дата претензии",
        dataIndex: "claimedOn",
        width: 120,
        sorter: (a: ClaimTableData, b: ClaimTableData) =>
          (a.claimedOn ? a.claimedOn.valueOf() : 0) -
          (b.claimedOn ? b.claimedOn.valueOf() : 0),
        render: (v: dayjs.Dayjs | null) => fmt(v),
      },
      acceptedOn: {
        title: "Дата принятия",
        dataIndex: "acceptedOn",
        width: 120,
        sorter: (a: ClaimTableData, b: ClaimTableData) =>
          (a.acceptedOn ? a.acceptedOn.valueOf() : 0) -
          (b.acceptedOn ? b.acceptedOn.valueOf() : 0),
        render: (v: dayjs.Dayjs | null) => fmt(v),
      },
      registeredOn: {
        title: "Дата регистрации",
        dataIndex: "registeredOn",
        width: 120,
        sorter: (a: ClaimTableData, b: ClaimTableData) =>
          (a.registeredOn ? a.registeredOn.valueOf() : 0) -
          (b.registeredOn ? b.registeredOn.valueOf() : 0),
        render: (v: dayjs.Dayjs | null) => fmt(v),
      },
      resolvedOn: {
        title: "Устранить до",
        dataIndex: "resolvedOn",
        width: 120,
        sorter: (a: ClaimTableData, b: ClaimTableData) =>
          (a.resolvedOn ? a.resolvedOn.valueOf() : 0) -
          (b.resolvedOn ? b.resolvedOn.valueOf() : 0),
        render: (v: dayjs.Dayjs | null) => fmt(v),
      },
      responsibleEngineerName: {
        title: "Ответственный инженер",
        dataIndex: "responsibleEngineerName",
        width: 180,
        sorter: (a: ClaimTableData, b: ClaimTableData) =>
          (a.responsibleEngineerName || "").localeCompare(
            b.responsibleEngineerName || "",
          ),
      },
      createdAt: {
        title: "Создано",
        dataIndex: "createdAt",
        width: 160,
        sorter: (a: ClaimTableData, b: ClaimTableData) =>
          (a.createdAt ? a.createdAt.valueOf() : 0) -
          (b.createdAt ? b.createdAt.valueOf() : 0),
        render: (v: dayjs.Dayjs | null) => fmtDateTime(v),
      },
      createdByName: {
        title: "Автор",
        dataIndex: "createdByName",
        width: 160,
        sorter: (a: ClaimTableData, b: ClaimTableData) =>
          (a.createdByName || "").localeCompare(b.createdByName || ""),
      },
      actions: {
        title: "Действия",
        key: "actions",
        width: 140,
        render: (_: unknown, record: ClaimTableData) => (
          <Space size="middle">
            <Tooltip title="Просмотр">
              <Button 
                type="text" 
                icon={<EyeOutlined />} 
                onClick={() => handlers?.onView?.(record.id)} 
              />
            </Tooltip>
            <Tooltip title="Связать">
              <Button 
                type="text" 
                icon={<BranchesOutlined />} 
                onClick={() => handlers?.onLink?.(record)} 
              />
            </Tooltip>
            <Popconfirm
              title="Удалить претензию?"
              okText="Да"
              cancelText="Нет"
              onConfirm={() => handlers?.onDelete?.(record.id)}
            >
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        ),
      },
    } as Record<string, ColumnsType<ClaimTableData>[number]>;
  }, [handlers]);

  const baseColumns = useMemo(getBaseColumns, [getBaseColumns]);

  // Columns state
  const [columnsState, setColumnsState] = useState<TableColumnSetting[]>(() => {
    const defaults = Object.keys(baseColumns).map((key) => ({
      key,
      title: baseColumns[key].title as string,
      visible: !['createdAt', 'createdByName'].includes(key),
    }));

    try {
      const saved = localStorage.getItem(LS_COLUMNS_KEY);
      if (saved) {
        let parsed = JSON.parse(saved) as TableColumnSetting[];
        parsed = parsed.map((c) => {
          if (typeof c.title !== 'string') {
            const def = defaults.find((d) => d.key === c.key);
            return { ...c, title: def?.title ?? '' };
          }
          return c;
        });
        return parsed.filter((c) => baseColumns[c.key]);
      }
    } catch {}
    
    return defaults;
  });

  // Column widths
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    try {
      return JSON.parse(localStorage.getItem(LS_COLUMN_WIDTHS_KEY) || '{}');
    } catch {
      return {};
    }
  });

  // Save to localStorage
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

  // Reset columns handler
  const handleResetColumns = useCallback(() => {
    const defaults = Object.keys(baseColumns).map((key) => ({
      key,
      title: baseColumns[key].title as string,
      visible: !['createdAt', 'createdByName'].includes(key),
    }));
    
    try {
      localStorage.removeItem(LS_COLUMN_WIDTHS_KEY);
    } catch {}
    
    setColumnWidths({});
    setColumnsState(defaults);
  }, [baseColumns]);

  // Final columns for table
  const columns: ColumnsType<ClaimTableData> = useMemo(() => {
    return columnsState
      .filter((c) => c.visible && baseColumns[c.key])
      .map((c) => ({
        ...baseColumns[c.key],
        width: columnWidths[c.key] ?? baseColumns[c.key].width,
      }));
  }, [columnsState, baseColumns, columnWidths]);

  return {
    columns,
    columnsState,
    columnWidths,
    baseColumns,
    setColumnsState,
    setColumnWidths,
    handleResetColumns,
  };
}