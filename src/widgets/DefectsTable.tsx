import React, { useMemo } from 'react';
import dayjs from 'dayjs';
import { Table, Button, Tooltip, Skeleton, Popconfirm, message } from 'antd';
import { EyeOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useDeleteDefect } from '@/entities/defect';
import type { DefectWithInfo } from '@/shared/types/defect';
import type { DefectFilters } from '@/shared/types/defectFilters';

const fmt = (v: string | null) =>
  v ? dayjs(v).format('DD.MM.YYYY') : '—';

interface Props {
  defects: DefectWithInfo[];
  filters: DefectFilters;
  loading?: boolean;
  /** Колонки таблицы. Если не переданы, используется набор по умолчанию */
  columns?: ColumnsType<DefectWithInfo>;
  onView?: (id: number) => void;
}

export default function DefectsTable({ defects, filters, loading, columns: columnsProp, onView }: Props) {
  const { mutateAsync: remove, isPending } = useDeleteDefect();
  const filtered = useMemo(() => {
    return defects.filter((d) => {
      if (filters.id && !filters.id.includes(d.id)) return false;
      if (filters.ticketId && !d.ticketIds.some((t) => filters.ticketId!.includes(t))) return false;
      if (filters.units && filters.units.length && !d.unitIds.some((u) => filters.units!.includes(u))) return false;
      if (filters.period) {
        const [from, to] = filters.period;
        const created = dayjs(d.created_at);
        if (!created.isSameOrAfter(from, 'day') || !created.isSameOrBefore(to, 'day')) return false;
      }
      return true;
    });
  }, [defects, filters]);

  const defaultColumns: ColumnsType<DefectWithInfo> = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '№ замечания', dataIndex: 'ticketIds', render: (v) => v.join(', ') },
    { title: 'Объекты', dataIndex: 'unitNames' },
    { title: 'Описание', dataIndex: 'description' },
    { title: 'Тип', dataIndex: 'defectTypeName' },
    { title: 'Статус', dataIndex: 'defectStatusName' },
    { title: 'Дата получения', dataIndex: 'received_at', render: fmt },
    { title: 'Дата создания', dataIndex: 'created_at', render: fmt },
    {
      title: 'Действия',
      key: 'actions',
      width: 100,
      render: (_, row) => (
        <>
          <Tooltip title="Просмотр">
            <Button size="small" type="text" icon={<EyeOutlined />} onClick={() => onView && onView(row.id)} />
          </Tooltip>
          <Popconfirm
            title="Удалить дефект?"
            okText="Да"
            cancelText="Нет"
            onConfirm={async () => {
              await remove(row.id);
              message.success('Удалено');
            }}
            disabled={isPending}
          >
            <Button size="small" type="text" danger icon={<DeleteOutlined />} loading={isPending} />
          </Popconfirm>
        </>
      ),
    },
  ];

  const columns = columnsProp ?? defaultColumns;

  if (loading) return <Skeleton active paragraph={{ rows: 6 }} />;

  return <Table rowKey="id" columns={columns} dataSource={filtered} pagination={{ pageSize: 25 }} />;
}
