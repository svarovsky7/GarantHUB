import React from 'react';
import { Table, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';

interface Item {
  id: number;
  description: string;
  defectTypeName?: string | null;
}

interface Props {
  /** Список дефектов */
  items: Item[];
  /** Callback удаления дефекта */
  onRemove?: (id: number) => void;
}

/**
 * Таблица дефектов в карточке претензии.
 * Показывает минимальный набор полей и кнопку удаления.
 */
export default function TicketDefectsTable({ items, onRemove }: Props) {
  const columns: ColumnsType<Item> = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: 'Описание', dataIndex: 'description' },
    {
      title: 'Тип',
      dataIndex: 'defectTypeName',
      render: (v: string | null) => v || '—',
    },
  ];

  if (onRemove) {
    columns.push({
      title: 'Действия',
      key: 'actions',
      width: 100,
      render: (_, row) => (
        <Button size="small" danger onClick={() => onRemove(row.id)}>
          Удалить
        </Button>
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

