import React, { useMemo, useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { Table, Space, Button, Popconfirm, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DeleteOutlined, PlusOutlined, MailOutlined, BranchesOutlined, LinkOutlined, EyeOutlined } from '@ant-design/icons';
import { CorrespondenceLetter } from '@/shared/types/correspondence';
import LetterStatusSelect from '@/features/correspondence/LetterStatusSelect';
import LetterDirectionSelect from '@/features/correspondence/LetterDirectionSelect';

interface Option { id: number | string; name: string; }

interface CorrespondenceTableProps {
  letters: CorrespondenceLetter[];
  onDelete: (id: string) => void;
  onAddChild: (parent: CorrespondenceLetter) => void;
  onUnlink: (letterId: string) => void;
  onView?: (id: string) => void;
  /** Колонки таблицы. Если не переданы, используется набор по умолчанию */
  columns?: ColumnsType<any>;
  users: Option[];
  letterTypes: Option[];
  projects: Option[];
  units: Option[];
  statuses: Option[];
  lockedUnitIds?: number[];
}

/** Ключ в localStorage для хранения раскрывшихся строк */
const LS_EXPANDED_KEY = 'correspondenceExpandedRows';

/** Таблица писем с иерархией и кнопкой "исключить из связи" */
export default function CorrespondenceTable({
                                              letters,
                                              onDelete,
                                              onAddChild,
                                              onUnlink,
                                              onView,
                                              columns: columnsProp,
                                              users,
                                              letterTypes,
                                              projects,
                                              units,
                                              statuses,
                                              lockedUnitIds = [],
                                            }: CorrespondenceTableProps) {
  const maps = useMemo(() => {
    const m = {
      user: {} as Record<string, string>,
      type: {} as Record<number, string>,
      project: {} as Record<number, string>,
      unit: {} as Record<number, string>,
      status: {} as Record<number, string>,
    };
    users.forEach((u) => (m.user[u.id as string] = u.name));
    letterTypes.forEach((t) => (m.type[t.id as number] = t.name));
    projects.forEach((p) => (m.project[p.id as number] = p.name));
    units.forEach((u) => (m.unit[u.id as number] = u.name));
    statuses.forEach((s) => (m.status[s.id as number] = s.name));
    return m;
  }, [users, letterTypes, projects, units, statuses]);

  const treeData = useMemo(() => {
    const map = new Map<string, any>();
    const roots: any[] = [];

    letters.forEach((l) => {
      // Extract building from units
      const letterUnits = units.filter(unit => l.unit_ids.includes(unit.id as number));
      const buildings = Array.from(new Set(letterUnits.map(unit => (unit as any).building).filter(Boolean)));
      const building = buildings.join(', ') || '';
      
      const row = {
        ...l,
        key: l.id,
        projectName: l.project_id ? maps.project[l.project_id] : null,
        unitNames: l.unit_ids
            .map((id) => maps.unit[id])
            .filter(Boolean)
            .join(', '),
        building,
        letterTypeName: l.letter_type_id ? maps.type[l.letter_type_id] : null,
        responsibleName: l.responsible_user_id
            ? maps.user[l.responsible_user_id]
            : null,
        createdByName: l.created_by ? maps.user[l.created_by] : null,
        statusName: l.status_id ? maps.status[l.status_id] : null,
        children: [],
      };
      map.set(l.id, row);
    });

    letters.forEach((l) => {
      const row = map.get(l.id);
      if (l.parent_id && map.has(l.parent_id)) {
        map.get(l.parent_id).children.push(row);
      } else {
        roots.push(row);
      }
    });

    map.forEach((row) => {
      if (!row.children || row.children.length === 0) {
        row.children = undefined;
      }
    });

    return roots;
  }, [letters, maps]);

  const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>([]);
  const [pageSize, setPageSize] = useState(100);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_EXPANDED_KEY);
      if (saved) {
        const parsed: React.Key[] = JSON.parse(saved);
        const valid = parsed.filter((id) => letters.some((l) => String(l.id) === String(id)));
        setExpandedRowKeys(valid);
        return;
      }
    } catch {}
    setExpandedRowKeys(letters.map((l) => l.id));
  }, [letters]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_EXPANDED_KEY, JSON.stringify(expandedRowKeys));
    } catch {}
  }, [expandedRowKeys]);

  const defaultColumns: ColumnsType<any> = React.useMemo(
    () => [
    {
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
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      sorter: (a, b) => Number(a.id) - Number(b.id),
      defaultSortOrder: 'descend' as const,
    },
    {
      title: 'Тип',
      dataIndex: 'type',
      width: 120,
      sorter: (a, b) => a.type.localeCompare(b.type),
      render: (_: string, row: CorrespondenceLetter) => (
        <LetterDirectionSelect letterId={row.id} type={row.type} />
      ),
    },
    {
      title: 'Номер',
      dataIndex: 'number',
      width: 120,
      sorter: (a, b) => a.number.localeCompare(b.number),
      render: (num: string, record: any) =>
          <b style={!record.parent_id ? { fontWeight: 600 } : {}}>{num}</b>,
    },
    {
      title: 'Дата',
      dataIndex: 'date',
      width: 120,
      sorter: (a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf(),
      render: (v: string) => dayjs(v).format('DD.MM.YYYY'),
    },
    {
      title: 'Отправитель',
      dataIndex: 'sender',
      width: 160,
      sorter: (a, b) => (a.sender || '').localeCompare(b.sender || ''),
      render: (val: string, record: any) => (
        <span style={record.parent_id ? { color: '#888' } : {}}>{val}</span>
      ),
    },
    {
      title: 'Получатель',
      dataIndex: 'receiver',
      width: 160,
      sorter: (a, b) => (a.receiver || '').localeCompare(b.receiver || ''),
      render: (val: string, record: any) => (
        <span style={record.parent_id ? { color: '#888' } : {}}>{val}</span>
      ),
    },
    {
      title: 'Тема',
      dataIndex: 'subject',
      width: 600,
      sorter: (a, b) => a.subject.localeCompare(b.subject),
      render: (val: string, record: any) =>
          <span style={record.parent_id ? { color: '#888' } : {}}>{val}</span>,
    },
    {
      title: 'Проект',
      dataIndex: 'projectName',
      width: 180,
      sorter: (a, b) => (a.projectName || '').localeCompare(b.projectName || ''),
    },
    {
      title: 'Корпус',
      dataIndex: 'building',
      width: 120,
      sorter: (a, b) => (a.building || '').localeCompare(b.building || ''),
      render: (building: string) => building || '—',
    },
    {
      title: 'Объекты',
      dataIndex: 'unitNames',
      width: 200,
      sorter: (a, b) => (a.unitNames || '').localeCompare(b.unitNames || ''),
    },
    {
      title: 'Категория',
      dataIndex: 'letterTypeName',
      width: 160,
      sorter: (a, b) =>
          (a.letterTypeName || '').localeCompare(b.letterTypeName || ''),
    },
    {
      title: 'Статус',
      dataIndex: 'statusName',
      width: 160,
      sorter: (a, b) => (a.statusName || '').localeCompare(b.statusName || ''),
      render: (_: any, row: any) => (
        <LetterStatusSelect
          letterId={row.id}
          statusId={row.status_id}
          statusName={row.statusName}
        />
      ),
    },
    {
      title: 'Ответственный',
      dataIndex: 'responsibleName',
      width: 160,
      sorter: (a, b) =>
          (a.responsibleName || '').localeCompare(b.responsibleName || ''),
      render: (name: string) => name || '—',
    },
    {
      title: 'Добавлено',
      dataIndex: 'created_at',
      width: 160,
      sorter: (a, b) =>
        (a.created_at ? dayjs(a.created_at).valueOf() : 0) -
        (b.created_at ? dayjs(b.created_at).valueOf() : 0),
      render: (v: string | null) => (v ? dayjs(v).format('DD.MM.YYYY HH:mm') : '—'),
    },
    {
      title: 'Автор',
      dataIndex: 'createdByName',
      width: 160,
      sorter: (a, b) => (a.createdByName || '').localeCompare(b.createdByName || ''),
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 150,
      render: (_: any, record: CorrespondenceLetter) => (
          <Space size="middle">
            {onView && (
              <Tooltip title="Просмотр">
                <Button type="text" icon={<EyeOutlined />} onClick={() => onView(record.id)} />
              </Tooltip>
            )}
            <Button type="text" icon={<PlusOutlined />} onClick={() => onAddChild(record)} />
            {/* Только для связанных писем — показать кнопку "исключить" */}
            {record.parent_id && (
                <Tooltip title="Исключить из связи">
                  <Button
                      type="text"
                      icon={
                        <LinkOutlined
                            style={{
                              color: '#c41d7f',
                              textDecoration: 'line-through',
                              fontWeight: 700,
                            }}
                        />
                      }
                      onClick={() => onUnlink(record.id)}
                  />
                </Tooltip>
            )}
            <Popconfirm
                title="Удалить письмо?"
                okText="Да"
                cancelText="Нет"
                onConfirm={() => onDelete(record.id)}
            >
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
      ),
    },
  ],
    [onAddChild, onUnlink, onDelete, onView],
  );
  const resizableColumns = columnsProp ?? defaultColumns;

  const rowClassName = (record: any) => {
    const base = record.parent_id ? 'child-letter-row' : 'main-letter-row';
    const locked = record.unit_ids?.some((id: number) => lockedUnitIds.includes(id));
    return locked ? `${base} locked-object-row` : base;
  };

  return (
      <Table
          rowKey="id"
          columns={resizableColumns}
          sticky={{ offsetHeader: 40 }}
          dataSource={treeData}
          pagination={{
            pageSize,
            showSizeChanger: true,
            onChange: (_p, size) => size && setPageSize(size),
          }}
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
          rowClassName={rowClassName}
          style={{ background: '#fff' }}
      />
  );
}

/** Стили (пример, вставить в index.css)
 .main-letter-row {
 background: #eaf4ff !important;
 font-weight: 600;
 box-shadow: 0 1px 0 #b5d3f7;
 }
 .child-letter-row {
 background: #f8fafb !important;
 color: #888;
 font-style: italic;
 border-left: 3px solid #52c41a;
 }
 */
