import React, { useMemo } from 'react';
import dayjs from 'dayjs';
import { Table, Space, Button, Popconfirm, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EyeOutlined, DeleteOutlined, PlusOutlined, MailOutlined, BranchesOutlined, LinkOutlined } from '@ant-design/icons';
import { CorrespondenceLetter } from '@/shared/types/correspondence';

interface Option { id: number | string; name: string; }

interface CorrespondenceTableProps {
  letters: CorrespondenceLetter[];
  onView: (letter: CorrespondenceLetter) => void;
  onDelete: (id: string) => void;
  onAddChild: (parent: CorrespondenceLetter) => void;
  onUnlink: (letterId: string) => void; // <--- новый проп
  users: Option[];
  letterTypes: Option[];
  projects: Option[];
  units: Option[];
}

/** Таблица писем с иерархией и кнопкой "исключить из связи" */
export default function CorrespondenceTable({
                                              letters,
                                              onView,
                                              onDelete,
                                              onAddChild,
                                              onUnlink,
                                              users,
                                              letterTypes,
                                              projects,
                                              units,
                                            }: CorrespondenceTableProps) {
  const maps = useMemo(() => {
    const m = {
      user: {} as Record<string, string>,
      type: {} as Record<number, string>,
      project: {} as Record<number, string>,
      unit: {} as Record<number, string>,
    };
    users.forEach((u) => (m.user[u.id as string] = u.name));
    letterTypes.forEach((t) => (m.type[t.id as number] = t.name));
    projects.forEach((p) => (m.project[p.id as number] = p.name));
    units.forEach((u) => (m.unit[u.id as number] = u.name));
    return m;
  }, [users, letterTypes, projects, units]);

  const treeData = useMemo(() => {
    const map = new Map<string, any>();
    const roots: any[] = [];

    letters.forEach((l) => {
      const row = {
        ...l,
        key: l.id,
        projectName: l.project_id ? maps.project[l.project_id] : null,
        unitNames: l.unit_ids
            .map((id) => maps.unit[id])
            .filter(Boolean)
            .join(', '),
        letterTypeName: l.letter_type_id ? maps.type[l.letter_type_id] : null,
        responsibleName: l.responsible_user_id
            ? maps.user[l.responsible_user_id]
            : null,
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

  const columns: ColumnsType<any> = [
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
    },
    {
      title: 'Тип',
      dataIndex: 'type',
      width: 100,
      sorter: (a, b) => a.type.localeCompare(b.type),
      render: (v: string) => (
          <Tag color={v === 'incoming' ? 'success' : 'processing'}>
            {v === 'incoming' ? 'Входящее' : 'Исходящее'}
          </Tag>
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
      sorter: (a, b) => (a.sender || '').localeCompare(b.sender || ''),
      render: (val: string, record: any) => (
        <span style={record.parent_id ? { color: '#888' } : {}}>{val}</span>
      ),
    },
    {
      title: 'Получатель',
      dataIndex: 'receiver',
      sorter: (a, b) => (a.receiver || '').localeCompare(b.receiver || ''),
      render: (val: string, record: any) => (
        <span style={record.parent_id ? { color: '#888' } : {}}>{val}</span>
      ),
    },
    {
      title: 'Тема',
      dataIndex: 'subject',
      sorter: (a, b) => a.subject.localeCompare(b.subject),
      render: (val: string, record: any) =>
          <span style={record.parent_id ? { color: '#888' } : {}}>{val}</span>,
    },
    {
      title: 'Проект',
      dataIndex: 'projectName',
      sorter: (a, b) => (a.projectName || '').localeCompare(b.projectName || ''),
    },
    {
      title: 'Объекты',
      dataIndex: 'unitNames',
      sorter: (a, b) => (a.unitNames || '').localeCompare(b.unitNames || ''),
    },
    {
      title: 'Категория',
      dataIndex: 'letterTypeName',
      sorter: (a, b) =>
          (a.letterTypeName || '').localeCompare(b.letterTypeName || ''),
    },
    {
      title: 'Ответственный',
      dataIndex: 'responsibleName',
      sorter: (a, b) =>
          (a.responsibleName || '').localeCompare(b.responsibleName || ''),
      render: (name: string) => name || '—',
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 130,
      render: (_: any, record: CorrespondenceLetter) => (
          <Space size="middle">
            <Button
                type="text"
                icon={<EyeOutlined />}
                onClick={() => onView(record)}
            />
            <Button
                type="text"
                icon={<PlusOutlined />}
                onClick={() => onAddChild(record)}
            />
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
  ];

  const rowClassName = (record: any) => {
    if (!record.parent_id) return 'main-letter-row';
    return 'child-letter-row';
  };

  return (
      <Table
          rowKey="id"
          columns={columns}
          dataSource={treeData}
          pagination={{ pageSize: 25, showSizeChanger: true }}
          size="middle"
          expandable={{
            expandRowByClick: true,
            defaultExpandAllRows: true,
            indentSize: 24,
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
