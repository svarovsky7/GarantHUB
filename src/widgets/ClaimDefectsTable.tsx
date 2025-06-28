import React from 'react';
import dayjs from 'dayjs';
import {
  Table,
  Switch,
  Tooltip,
  Skeleton,
  Button,
  Space,
  Popconfirm,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EyeOutlined, DeleteOutlined } from '@ant-design/icons';
import type { DefectWithNames } from '@/shared/types/defectWithNames';
import DefectStatusSelect from '@/features/defect/DefectStatusSelect';
import DefectFilesRow from './DefectFilesRow';

export interface ClaimDefectsTableProps {
  items: DefectWithNames[];
  loading?: boolean;
  onView?: (id: number) => void;
  onRemove?: (id: number) => void;
  onWarrantyChange?: (id: number, val: boolean) => void;
}

export default function ClaimDefectsTable({
  items,
  loading,
  onView,
  onRemove,
  onWarrantyChange,
}: ClaimDefectsTableProps) {
  const [expanded, setExpanded] = React.useState<number[]>([]);

  const columns: ColumnsType<DefectWithNames> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      sorter: (a, b) => a.id - b.id,
      defaultSortOrder: 'ascend',
    },
    {
      title: 'Описание',
      dataIndex: 'description',
      ellipsis: true,
      render: (v: string) => (
        <Tooltip title={v} placement="topLeft">
          {v}
        </Tooltip>
      ),
    },
    {
      title: 'Тип',
      dataIndex: 'defectTypeName',
      width: 120,
      render: (v: string | null) => v ?? '—',
    },
    {
      title: 'Статус',
      dataIndex: 'status_id',
      width: 160,
      render: (_: any, row) => (
        <DefectStatusSelect
          defectId={row.id}
          statusId={row.status_id}
          statusName={row.defectStatusName}
          statusColor={row.defectStatusColor}
        />
      ),
    },
    {
      title: 'Гарантия',
      dataIndex: 'is_warranty',
      width: 100,
      render: (v: boolean, row) => (
        <Switch
          size="small"
          checked={v}
          onChange={(val) => onWarrantyChange?.(row.id, val)}
        />
      ),
    },
    {
      title: 'Дата получения',
      dataIndex: 'received_at',
      width: 120,
      render: (v: string | null) =>
        v ? dayjs(v).format('DD.MM.YYYY') : '—',
    },
    {
      title: 'Дата устранения',
      dataIndex: 'fixed_at',
      width: 120,
      render: (v: string | null) =>
        v ? dayjs(v).format('DD.MM.YYYY') : '—',
    },
    {
      title: 'Исполнитель',
      dataIndex: 'contractor_id',
      width: 120,
      render: (_: any, row) => (
        <Switch
          size="small"
          checkedChildren="подряд"
          unCheckedChildren="собст"
          checked={row.contractor_id !== null}
          disabled
        />
      ),
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 100,
      render: (_: any, row) => (
        <Space size="middle">
          <Tooltip title="Просмотр">
            <Button
              size="small"
              type="text"
              icon={<EyeOutlined />}
              onClick={() => onView?.(row.id)}
            />
          </Tooltip>
          <Popconfirm
            title="Удалить дефект?"
            okText="Да"
            cancelText="Нет"
            onConfirm={() => {
              onRemove?.(row.id);
            }}
          >
            <Button size="small" type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (loading) return <Skeleton active paragraph={{ rows: 4 }} />;

  return (
    <Table
      rowKey="id"
      size="small"
      columns={columns}
      dataSource={items}
      pagination={false}
      expandable={{
        expandedRowRender: (rec) => (
          <DefectFilesRow defectId={rec.id} expanded={expanded.includes(rec.id)} />
        ),
        onExpand: (ex, rec) => {
          setExpanded((p) =>
            ex ? [...p, rec.id] : p.filter((id) => id !== rec.id),
          );
        },
      }}
    />
  );
}
