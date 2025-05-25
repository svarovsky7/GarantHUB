import React, { useMemo } from 'react';
import dayjs from 'dayjs';
import { Table, Space, Button, Popconfirm, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EyeOutlined, DeleteOutlined } from '@ant-design/icons';
import { CorrespondenceLetter } from '@/shared/types/correspondence';

interface Option { id: number | string; name: string; }

interface CorrespondenceTableProps {
  letters: CorrespondenceLetter[];
  onView: (letter: CorrespondenceLetter) => void;
  onDelete: (id: string) => void;
  users: Option[];
  letterTypes: Option[];
  projects: Option[];
  units: Option[];
}

/** Таблица писем на Ant Design */
export default function CorrespondenceTable({
  letters,
  onView,
  onDelete,
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

  const columns: ColumnsType<any> = [
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
    },
    {
      title: 'Дата',
      dataIndex: 'date',
      width: 120,
      sorter: (a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf(),
      render: (v: string) => dayjs(v).format('DD.MM.YYYY'),
    },
    {
      title: 'Корреспондент',
      dataIndex: 'correspondent',
      sorter: (a, b) => a.correspondent.localeCompare(b.correspondent),
    },
    {
      title: 'Тема',
      dataIndex: 'subject',
      sorter: (a, b) => a.subject.localeCompare(b.subject),
    },
    {
      title: 'Проект',
      dataIndex: 'projectName',
      sorter: (a, b) => (a.projectName || '').localeCompare(b.projectName || ''),
    },
    {
      title: 'Объект',
      dataIndex: 'unitName',
      sorter: (a, b) => (a.unitName || '').localeCompare(b.unitName || ''),
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
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 100,
      render: (_: any, record: CorrespondenceLetter) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => onView(record)}
          />
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

  const dataSource = useMemo(
    () =>
      letters.map((l) => ({
        ...l,
        projectName: l.project_id ? maps.project[l.project_id] : null,
        unitName: l.unit_id ? maps.unit[l.unit_id] : null,
        letterTypeName: l.letter_type_id ? maps.type[l.letter_type_id] : null,
        responsibleName: l.responsible_user_id
          ? maps.user[l.responsible_user_id]
          : null,
      })),
    [letters, maps],
  );

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={dataSource}
      pagination={{ pageSize: 25, showSizeChanger: true }}
      size="middle"
    />
  );
}
