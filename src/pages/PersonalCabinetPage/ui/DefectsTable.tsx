import React from 'react';
import { Table, Tag, Select, Button, Tooltip, Typography } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text } = Typography;

interface DefectsTableProps {
  defects: any[];
  defectStatuses: any[];
  editingDefectStatus: number | null;
  onEditStatus: (id: number) => void;
  onUpdateStatus: (defectId: number, statusId: number) => void;
  onCancelEdit: () => void;
  onViewDefect: (id: number) => void;
}

export default function DefectsTable({
  defects,
  defectStatuses,
  editingDefectStatus,
  onEditStatus,
  onUpdateStatus,
  onCancelEdit,
  onViewDefect
}: DefectsTableProps) {
  return (
    <Table
      dataSource={defects}
      rowKey="id"
      pagination={false}
      size="small"
      columns={[
        {
          title: 'Тип дефекта',
          dataIndex: ['type', 'name'],
          key: 'type',
          sorter: (a, b) => (a.type?.name || '').localeCompare(b.type?.name || ''),
          render: (text) => text || '-',
        },
        {
          title: 'Описание',
          dataIndex: 'description',
          key: 'description',
          ellipsis: true,
          sorter: (a, b) => (a.description || '').localeCompare(b.description || ''),
        },
        {
          title: 'Статус',
          dataIndex: ['status', 'name'],
          key: 'status',
          sorter: (a, b) => (a.status?.name || '').localeCompare(b.status?.name || ''),
          render: (text, record) => {
            if (editingDefectStatus === record.id) {
              return (
                <Select
                  size="small"
                  style={{ width: '100%' }}
                  value={record.status_id}
                  onChange={(value) => onUpdateStatus(record.id, value)}
                  onBlur={onCancelEdit}
                  autoFocus
                >
                  {defectStatuses.map(status => (
                    <Select.Option key={status.id} value={status.id}>
                      <Tag color={status.color}>{status.name}</Tag>
                    </Select.Option>
                  ))}
                </Select>
              );
            }
            return (
              <Tag
                color={record.status?.color}
                style={{ cursor: 'pointer' }}
                onClick={() => onEditStatus(record.id)}
              >
                {text || '-'}
              </Tag>
            );
          },
        },
        {
          title: 'Исполнитель',
          key: 'executor',
          sorter: (a, b) => {
            const aExec = a.brigade?.name || a.contractor?.name || '';
            const bExec = b.brigade?.name || b.contractor?.name || '';
            return aExec.localeCompare(bExec);
          },
          render: (_, record) => (
            <Text type="secondary">
              {record.brigade?.name || record.contractor?.name || '-'}
            </Text>
          ),
        },
        {
          title: 'Получен',
          dataIndex: 'received_at',
          key: 'received_at',
          sorter: (a, b) => {
            if (!a.received_at) return 1;
            if (!b.received_at) return -1;
            return dayjs(a.received_at).unix() - dayjs(b.received_at).unix();
          },
          render: (date) => date ? dayjs(date).format('DD.MM.YYYY') : '-',
        },
        {
          title: 'Устранен',
          dataIndex: 'fixed_at',
          key: 'fixed_at',
          sorter: (a, b) => {
            if (!a.fixed_at) return 1;
            if (!b.fixed_at) return -1;
            return dayjs(a.fixed_at).unix() - dayjs(b.fixed_at).unix();
          },
          render: (date) => date ? dayjs(date).format('DD.MM.YYYY') : '-',
        },
        {
          title: 'Гарантия',
          dataIndex: 'is_warranty',
          key: 'is_warranty',
          align: 'center' as const,
          sorter: (a, b) => (a.is_warranty ? 1 : 0) - (b.is_warranty ? 1 : 0),
          render: (isWarranty) => (
            isWarranty ?
              <CheckCircleOutlined style={{ color: '#52c41a' }} /> :
              <ClockCircleOutlined style={{ color: '#8c8c8c' }} />
          ),
        },
        {
          title: 'Действия',
          key: 'actions',
          align: 'center' as const,
          render: (_, record) => (
            <Tooltip title="Просмотр дефекта">
              <Button
                type="link"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => onViewDefect(record.id)}
              />
            </Tooltip>
          ),
        },
      ]}
    />
  );
}
