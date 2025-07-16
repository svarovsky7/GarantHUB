import { useState, useEffect, useMemo, useCallback } from 'react';
import { Tooltip, Space, Button, Popconfirm, Tag } from 'antd';
import { 
  EyeOutlined, 
  DeleteOutlined, 
  BranchesOutlined, 
  MailOutlined,
  PlusOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { TableColumnSetting } from '@/shared/types/tableColumnSetting';
import type { CorrespondenceLetter } from '@/shared/types/correspondence';
import type { Unit } from '@/shared/types/unit';
import LetterStatusSelect from '@/features/correspondence/LetterStatusSelect';
import dayjs from 'dayjs';

const LS_COLUMNS_KEY = 'correspondenceColumns';
const LS_COLUMN_WIDTHS_KEY = 'correspondenceColumnWidths';

export function useCorrespondenceTableColumns(
  allUnits: Unit[],
  onView: (id: string) => void,
  onAddChild: (letter: CorrespondenceLetter) => void,
  onUnlink: (id: string) => void,
  onDelete: (id: string) => void,
) {
  const getBaseColumns = useCallback(() => {
    return {
      treeIcon: {
        title: '',
        dataIndex: 'treeIcon',
        width: 40,
        render: (_: any, record: any) => {
          if (!record.parent_id) {
            return (
              <Tooltip title="Главное письмо">
                <MailOutlined style={{ color: '#1890ff', fontSize: 17 }} />
              </Tooltip>
            );
          }
          return (
            <Tooltip title="Связанное письмо">
              <BranchesOutlined style={{ color: '#52c41a', fontSize: 16 }} />
            </Tooltip>
          );
        },
      },
      id: {
        title: 'ID',
        dataIndex: 'id',
        width: 80,
        sorter: (a: any, b: any) => Number(a.id) - Number(b.id),
        defaultSortOrder: 'descend' as const,
      },
      type: {
        title: 'Тип',
        dataIndex: 'type',
        width: 100,
        sorter: (a: any, b: any) => a.type.localeCompare(b.type),
        render: (v: string) => (
          <Tag color={v === 'incoming' ? 'success' : 'processing'}>
            {v === 'incoming' ? 'Входящее' : 'Исходящее'}
          </Tag>
        ),
      },
      number: {
        title: 'Номер',
        dataIndex: 'number',
        width: 120,
        sorter: (a: any, b: any) => a.number.localeCompare(b.number),
        render: (num: string, record: any) => (
          <b style={!record.parent_id ? { fontWeight: 600 } : {}}>{num}</b>
        ),
      },
      date: {
        title: 'Дата',
        dataIndex: 'date',
        width: 120,
        sorter: (a: any, b: any) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf(),
        render: (v: string) => dayjs(v).format('DD.MM.YYYY'),
      },
      sender: {
        title: 'Отправитель',
        dataIndex: 'sender',
        width: 160,
        sorter: (a: any, b: any) => (a.sender || '').localeCompare(b.sender || ''),
        render: (val: string, record: any) => (
          <span style={record.parent_id ? { color: '#888' } : {}}>{val}</span>
        ),
      },
      receiver: {
        title: 'Получатель',
        dataIndex: 'receiver',
        width: 160,
        sorter: (a: any, b: any) => (a.receiver || '').localeCompare(b.receiver || ''),
        render: (val: string, record: any) => (
          <span style={record.parent_id ? { color: '#888' } : {}}>{val}</span>
        ),
      },
      subject: {
        title: 'Тема',
        dataIndex: 'subject',
        width: 600,
        sorter: (a: any, b: any) => a.subject.localeCompare(b.subject),
        render: (val: string, record: any) => (
          <span style={record.parent_id ? { color: '#888' } : {}}>{val}</span>
        ),
      },
      projectName: {
        title: 'Проект',
        dataIndex: 'projectName',
        width: 180,
        sorter: (a: any, b: any) => (a.projectName || '').localeCompare(b.projectName || ''),
      },
      building: {
        title: 'Корпус',
        dataIndex: 'building',
        width: 120,
        sorter: (a: any, b: any) => (a.building || '').localeCompare(b.building || ''),
        render: (building: string, record: any) => {
          if (!building) {
            // Extract building from unit names if not directly available
            const letterUnits = allUnits.filter(unit => record.unit_ids.includes(unit.id));
            const buildings = Array.from(new Set(letterUnits.map(unit => unit.building).filter(Boolean)));
            return buildings.join(', ') || '—';
          }
          return building;
        },
      },
      unitNames: {
        title: 'Объекты',
        dataIndex: 'unitNames',
        width: 200,
        sorter: (a: any, b: any) => (a.unitNames || '').localeCompare(b.unitNames || ''),
      },
      letterTypeName: {
        title: 'Категория',
        dataIndex: 'letterTypeName',
        width: 160,
        sorter: (a: any, b: any) => (a.letterTypeName || '').localeCompare(b.letterTypeName || ''),
      },
      statusName: {
        title: 'Статус',
        dataIndex: 'statusName',
        width: 160,
        sorter: (a: any, b: any) => (a.statusName || '').localeCompare(b.statusName || ''),
        render: (_: any, row: any) => (
          <LetterStatusSelect letterId={row.id} statusId={row.status_id} statusName={row.statusName} />
        ),
      },
      responsibleName: {
        title: 'Ответственный',
        dataIndex: 'responsibleName',
        width: 160,
        sorter: (a: any, b: any) => (a.responsibleName || '').localeCompare(b.responsibleName || ''),
        render: (name: string) => name || '—',
      },
      createdAt: {
        title: 'Добавлено',
        dataIndex: 'created_at',
        width: 160,
        sorter: (a: any, b: any) =>
          (a.created_at ? dayjs(a.created_at).valueOf() : 0) -
          (b.created_at ? dayjs(b.created_at).valueOf() : 0),
        render: (v: string | null) => (v ? dayjs(v).format('DD.MM.YYYY HH:mm') : '—'),
      },
      createdByName: {
        title: 'Автор',
        dataIndex: 'createdByName',
        width: 160,
        sorter: (a: any, b: any) => (a.createdByName || '').localeCompare(b.createdByName || ''),
      },
      actions: {
        title: 'Действия',
        key: 'actions',
        width: 150,
        render: (_: any, record: CorrespondenceLetter) => (
          <Space size="middle">
            <Tooltip title="Просмотр">
              <Button type="text" icon={<EyeOutlined />} onClick={() => onView(record.id)} />
            </Tooltip>
            <Button type="text" icon={<PlusOutlined />} onClick={() => onAddChild(record)} />
            {record.parent_id && (
              <Tooltip title="Исключить из связи">
                <Button
                  type="text"
                  icon={<LinkOutlined style={{ color: '#c41d7f', textDecoration: 'line-through', fontWeight: 700 }} />}
                  onClick={() => onUnlink(record.id)}
                />
              </Tooltip>
            )}
            <Popconfirm title="Удалить письмо?" okText="Да" cancelText="Нет" onConfirm={() => onDelete(record.id)}>
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        ),
      },
    } as Record<string, ColumnsType<any>[number]>;
  }, [allUnits, onView, onAddChild, onUnlink, onDelete]);

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
  const columns: ColumnsType<any> = useMemo(() => {
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