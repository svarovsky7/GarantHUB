import { useState, useEffect, useMemo, useCallback } from 'react';
import { Tooltip, Tag, Button, Space, Popconfirm } from 'antd';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import type { TableColumnSetting } from '@/shared/types/tableColumnSetting';
import type { CorrespondenceLetter } from '@/shared/types/correspondence';
import LetterStatusSelect from '@/features/correspondence/LetterStatusSelect';
import {
  MailOutlined,
  BranchesOutlined,
  DeleteOutlined,
  PlusOutlined,
  LinkOutlined,
  EyeOutlined,
} from '@ant-design/icons';

const LS_COLUMNS_KEY = 'correspondenceColumns';
const LS_COLUMN_WIDTHS_KEY = 'correspondenceColumnWidths';

interface UseCorrespondenceColumnsParams {
  onDelete: (id: string) => void;
  onAddChild: (letter: CorrespondenceLetter) => void;
  onUnlink: (id: string) => void;
  onView: (id: string) => void;
  allUnits: any[];
}

/**
 * Hook for managing table columns configuration
 */
export function useCorrespondenceColumns({
  onDelete,
  onAddChild,
  onUnlink,
  onView,
  allUnits,
}: UseCorrespondenceColumnsParams) {
  const getBaseColumns = useCallback(() => {
    return {
      treeIcon: {
        title: '',
        dataIndex: 'treeIcon',
        width: 35,
        render: (_: any, record: any) => {
          if (!record.parent_id) {
            return (
              <Tooltip title="Главное письмо">
                <MailOutlined style={{ color: '#1890ff', fontSize: 14 }} />
              </Tooltip>
            );
          }
          return (
            <Tooltip title="Связанное письмо">
              <BranchesOutlined style={{ color: '#52c41a', fontSize: 14 }} />
            </Tooltip>
          );
        },
      },
      id: {
        title: 'ID',
        dataIndex: 'id',
        width: 60,
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
        width: 100,
        sorter: (a: any, b: any) => a.number.localeCompare(b.number),
        render: (num: string, record: any) => (
          <b style={!record.parent_id ? { fontWeight: 600 } : {}}>{num}</b>
        ),
      },
      date: {
        title: 'Дата',
        dataIndex: 'date',
        width: 90,
        sorter: (a: any, b: any) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf(),
        render: (v: string) => dayjs(v).format('DD.MM.YYYY'),
      },
      sender: {
        title: 'Отправитель',
        dataIndex: 'sender',
        width: 130,
        sorter: (a: any, b: any) => (a.sender || '').localeCompare(b.sender || ''),
        ellipsis: true,
        render: (val: string, record: any) => (
          <span style={record.parent_id ? { color: '#888' } : {}}>{val}</span>
        ),
      },
      receiver: {
        title: 'Получатель',
        dataIndex: 'receiver',
        width: 130,
        sorter: (a: any, b: any) => (a.receiver || '').localeCompare(b.receiver || ''),
        ellipsis: true,
        render: (val: string, record: any) => (
          <span style={record.parent_id ? { color: '#888' } : {}}>{val}</span>
        ),
      },
      subject: {
        title: 'Тема',
        dataIndex: 'subject',
        width: 300,
        sorter: (a: any, b: any) => a.subject.localeCompare(b.subject),
        ellipsis: { showTitle: false },
        render: (val: string, record: any) => (
          <Tooltip title={val} placement="topLeft">
            <span style={record.parent_id ? { color: '#888' } : {}}>{val}</span>
          </Tooltip>
        ),
      },
      projectName: {
        title: 'Проект',
        dataIndex: 'projectName',
        width: 110,
        sorter: (a: any, b: any) => (a.projectName || '').localeCompare(b.projectName || ''),
        ellipsis: true,
      },
      building: {
        title: 'Корпус',
        dataIndex: 'building',
        width: 80,
        sorter: (a: any, b: any) => (a.building || '').localeCompare(b.building || ''),
        ellipsis: true,
        render: (building: string, record: any) => {
          if (!building) {
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
        width: 130,
        sorter: (a: any, b: any) => (a.unitNames || '').localeCompare(b.unitNames || ''),
        ellipsis: true,
      },
      letterTypeName: {
        title: 'Категория',
        dataIndex: 'letterTypeName',
        width: 110,
        sorter: (a: any, b: any) => (a.letterTypeName || '').localeCompare(b.letterTypeName || ''),
        ellipsis: true,
      },
      statusName: {
        title: 'Статус',
        dataIndex: 'statusName',
        width: 120,
        sorter: (a: any, b: any) => (a.statusName || '').localeCompare(b.statusName || ''),
        render: (_: any, row: any) => (
          <LetterStatusSelect letterId={row.id} statusId={row.status_id} statusName={row.statusName} />
        ),
      },
      responsibleName: {
        title: 'Ответств.',
        dataIndex: 'responsibleName',
        width: 100,
        sorter: (a: any, b: any) => (a.responsibleName || '').localeCompare(b.responsibleName || ''),
        ellipsis: true,
        render: (name: string) => name || '—',
      },
      createdAt: {
        title: 'Добавлено',
        dataIndex: 'created_at',
        width: 110,
        sorter: (a: any, b: any) =>
          (a.created_at ? dayjs(a.created_at).valueOf() : 0) -
          (b.created_at ? dayjs(b.created_at).valueOf() : 0),
        render: (v: string | null) => (v ? dayjs(v).format('DD.MM.YYYY HH:mm') : '—'),
      },
      createdByName: {
        title: 'Автор',
        dataIndex: 'createdByName',
        width: 100,
        sorter: (a: any, b: any) => (a.createdByName || '').localeCompare(b.createdByName || ''),
        ellipsis: true,
      },
      actions: {
        title: 'Действия',
        key: 'actions',
        width: 120,
        fixed: 'right' as const,
        render: (_: any, record: CorrespondenceLetter) => (
          <Space size={4}>
            <Tooltip title="Просмотр">
              <Button size="small" type="text" icon={<EyeOutlined />} onClick={() => onView(record.id)} />
            </Tooltip>
            <Button size="small" type="text" icon={<PlusOutlined />} onClick={() => onAddChild(record)} />
            {record.parent_id && (
              <Tooltip title="Исключить из связи">
                <Button
                  size="small"
                  type="text"
                  icon={<LinkOutlined style={{ color: '#c41d7f', textDecoration: 'line-through', fontWeight: 700 }} />}
                  onClick={() => onUnlink(record.id)}
                />
              </Tooltip>
            )}
            <Popconfirm title="Удалить?" okText="Да" cancelText="Нет" onConfirm={() => onDelete(record.id)}>
              <Button size="small" type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        ),
      },
    } as Record<string, ColumnsType<any>[number]>;
  }, [onDelete, onAddChild, onUnlink, onView, allUnits]);

  const [columnsState, setColumnsState] = useState<TableColumnSetting[]>(() => {
    const base = getBaseColumns();
    const defaults = Object.keys(base).map((key) => ({
      key,
      title: base[key].title as string,
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
        return parsed.filter((c) => base[c.key]);
      }
    } catch {}
    return defaults;
  });

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    try {
      return JSON.parse(localStorage.getItem(LS_COLUMN_WIDTHS_KEY) || '{}');
    } catch {
      return {};
    }
  });

  const handleResetColumns = useCallback(() => {
    const base = getBaseColumns();
    const defaults = Object.keys(base).map((key) => ({
      key,
      title: base[key].title as string,
      visible: !['createdAt', 'createdByName'].includes(key),
    }));
    try {
      localStorage.removeItem(LS_COLUMN_WIDTHS_KEY);
    } catch {}
    setColumnWidths({});
    setColumnsState(defaults);
  }, [getBaseColumns]);

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

  const baseColumns = useMemo(getBaseColumns, [getBaseColumns]);

  const columns: ColumnsType<any> = useMemo(
    () =>
      columnsState
        .filter((c) => c.visible)
        .map((c) => ({
          ...baseColumns[c.key],
          width: columnWidths[c.key] ?? baseColumns[c.key].width,
        })),
    [columnsState, baseColumns, columnWidths],
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
