import React from 'react';
import dayjs from 'dayjs';
import { Table, Button, Tooltip, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EyeOutlined } from '@ant-design/icons';

interface Item {
  id: number;
  description: string;
  defectTypeName?: string | null;
  defectStatusName?: string | null;
  is_warranty?: boolean;
  received_at?: string | null;
  fixed_at?: string | null;
  fixByName?: string | null;
}

interface Props {
  /** Список дефектов */
  items: Item[];
  /** Callback удаления дефекта */
  onRemove?: (id: number) => void;
  /** Открытие просмотра дефекта */
  onView?: (id: number) => void;
}

/**
 * Таблица дефектов в карточке претензии.
 * Показывает минимальный набор полей и кнопку удаления.
 */
export default function TicketDefectsTable({ items, onRemove, onView }: Props) {
  const fmt = (d: string | null | undefined) =>
    d ? dayjs(d).format('DD.MM.YYYY') : '—';

  const columns: ColumnsType<Item> = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: 'Описание', dataIndex: 'description' },
    {
      title: 'Тип',
      dataIndex: 'defectTypeName',
      render: (v: string | null) => v || '—',
    },
    {
      title: 'Статус',
      dataIndex: 'defectStatusName',
      render: (v: string | null) => v || '—',
    },
    {
      title: 'Гарантия',
      dataIndex: 'is_warranty',
      width: 100,
      render: (v: boolean | undefined) => (v ? 'Да' : 'Нет'),
    },
    {
      title: 'Дата получения',
      dataIndex: 'received_at',
      width: 120,
      render: fmt,
    },
    {
      title: 'Дата устранения',
      dataIndex: 'fixed_at',
      width: 120,
      render: fmt,
    },
    {
      title: 'Кем устраняется',
      dataIndex: 'fixByName',
      render: (v: string | null) => v || '—',
    },
  ];

  if (onRemove || onView) {
    columns.push({
      title: 'Действия',
      key: 'actions',
      width: 100,
      render: (_, row) => (
        <Space size="middle">
          {onView && (
            <Tooltip title="Просмотр">
              <Button
                size="small"
                type="text"
                icon={<EyeOutlined />}
                onClick={() => onView(row.id)}
              />
            </Tooltip>
          )}
          {onRemove && (
            <Button size="small" danger onClick={() => onRemove(row.id)}>
              Удалить
            </Button>
          )}
        </Space>
      ),
    });
  }

  return (
    <Table
      rowKey="id"
      rowClassName={(row) => (row.id < 0 ? 'new-row' : '')}
      columns={columns}
      dataSource={items}
      pagination={false}
      size="small"
    />
  );
}

