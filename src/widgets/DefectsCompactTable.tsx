import React from 'react';
import { Table, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { DefectWithNames } from '@/shared/types/defectWithNames';
import { EyeOutlined } from '@ant-design/icons';
import DefectViewModal from '@/features/defect/DefectViewModal';

interface Props {
  /** Список дефектов для отображения */
  defects: DefectWithNames[];
}

/** Краткая таблица дефектов. Показывает только тип, описание и статус. */
export default function DefectsCompactTable({ defects }: Props) {
  const [viewId, setViewId] = React.useState<number | null>(null);
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
    {
      title: '',
      dataIndex: 'actions',
      width: 60,
      render: (_: unknown, row) => (
        <Button
          size="small"
          type="text"
          icon={<EyeOutlined />}
          onClick={() => setViewId(row.id)}
        />
      ),
    },
  ];
  return (
    <>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={defects}
        pagination={false}
        size="small"
      />
      <DefectViewModal
        open={viewId !== null}
        defectId={viewId}
        onClose={() => setViewId(null)}
      />
    </>
  );
}
