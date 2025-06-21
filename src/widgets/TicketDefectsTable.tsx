import React from 'react';
import dayjs from 'dayjs';
import { Table, Button, Tooltip, Space, Popconfirm, message } from 'antd';
import { EyeOutlined, CheckOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useDefectsWithNames, useDeleteDefect } from '@/entities/defect';
import DefectStatusSelect from '@/features/defect/DefectStatusSelect';
import DefectViewModal from '@/features/defect/DefectViewModal';
import DefectFixModal from '@/features/defect/DefectFixModal';
import type { DefectWithNames } from '@/shared/types/defectWithNames';

interface Props {
  /** Идентификаторы дефектов для загрузки */
  defectIds?: number[];
  /** Готовые данные для отображения (если есть) */
  items?: DefectWithNames[];
  /** Обработчик удаления строки */
  onRemove?: (id: number) => void;
}

/** Таблица дефектов конкретного замечания */
export default function TicketDefectsTable({ defectIds = [], items, onRemove }: Props) {
  const { data: fetched = [], isLoading: loadingDefects } = useDefectsWithNames(defectIds);
  const { mutateAsync: removeDefect, isPending } = useDeleteDefect();
  const [data, setData] = React.useState<DefectWithNames[]>(items ?? fetched);

  React.useEffect(() => {
    setData(items ?? fetched);
  }, [items, fetched]);

  const isLoading = items ? false : loadingDefects;
  const [viewId, setViewId] = React.useState<number | null>(null);
  const [fixId, setFixId] = React.useState<number | null>(null);

  const columns: ColumnsType<DefectWithNames> = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: 'Описание', dataIndex: 'description', ellipsis: true },
    { title: 'Тип', dataIndex: 'defectTypeName', width: 140 },
    {
      title: 'Статус',
      dataIndex: 'defect_status_id',
      width: 160,
      render: (_: unknown, row) => (
        <DefectStatusSelect
          defectId={row.id}
          statusId={row.defect_status_id}
          statusName={row.defectStatusName ?? undefined}
          statusColor={row.defectStatusColor ?? undefined}
        />
      ),
    },
    {
      title: 'Дата получения',
      dataIndex: 'received_at',
      width: 120,
      render: (v: string | null) => (v ? dayjs(v).format('DD.MM.YYYY') : '—'),
    },
    {
      title: 'Дата устранения',
      dataIndex: 'fixed_at',
      width: 120,
      render: (v: string | null) => (v ? dayjs(v).format('DD.MM.YYYY') : '—'),
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 100,
      render: (_: unknown, row) => (
        <Space size="middle">
          <Tooltip title="Просмотр">
            <Button size="small" type="text" icon={<EyeOutlined />} onClick={() => setViewId(row.id)} />
          </Tooltip>
          <Tooltip title="Устранён">
            <Button
              size="small"
              type="text"
              icon={<CheckOutlined style={{ color: '#52c41a', fontSize: 16 }} />}
              onClick={() => setFixId(row.id)}
            />
          </Tooltip>
          <Popconfirm
            title="Удалить дефект?"
            okText="Да"
            cancelText="Нет"
            onConfirm={async () => {
              if (onRemove) {
                onRemove(row.id);
                setData((p) => p.filter((d) => d.id !== row.id));
              } else {
                await removeDefect(row.id);
                setData((p) => p.filter((d) => d.id !== row.id));
                message.success('Удалено');
              }
            }}
            disabled={isPending}
          >
            <Button size="small" type="text" danger icon={<DeleteOutlined />} loading={isPending} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Table
        rowKey="id"
        size="small"
        pagination={false}
        columns={columns}
        dataSource={data}
        loading={isLoading}
      />
      <DefectViewModal open={viewId !== null} defectId={viewId} onClose={() => setViewId(null)} />
      <DefectFixModal open={fixId !== null} defectId={fixId} onClose={() => setFixId(null)} />
    </>
  );
}
