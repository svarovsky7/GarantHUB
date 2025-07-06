import React from 'react';
import { Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { DefectWithNames } from '@/shared/types/defectWithNames';

interface Props {
  /** Список дефектов для отображения */
  defects: DefectWithNames[];
}

/** Краткая таблица дефектов. Показывает только тип, описание и статус. */
export default function DefectsCompactTable({ defects }: Props) {
  const columns: ColumnsType<DefectWithNames> = [
    {
      title: 'Тип',
      dataIndex: 'defectTypeName',
      render: (v: string | null) => v || '—',
      width: 160,
    },
    { title: 'Описание', dataIndex: 'description' },
    {
      title: 'Статус',
      dataIndex: 'defectStatusName',
      render: (v: string | null) => v || '—',
      width: 160,
    },
  ];
  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={defects}
      pagination={false}
      size="small"
    />
  );
}
