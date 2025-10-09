import React from 'react';
import { Modal, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useCompletionDefects, useContractorCompletion } from '@/entities/contractorCompletion';

interface Props {
  open: boolean;
  completionId: number | null;
  onClose: () => void;
}

export default function CompletionDefectsModal({ open, completionId, onClose }: Props) {
  const { data: completion } = useContractorCompletion(completionId);
  const { data: defects = [], isLoading } = useCompletionDefects(completionId);

  const columns: ColumnsType<any> = [
    {
      title: 'ID дефекта',
      dataIndex: ['defects', 'id'],
      width: 80,
      sorter: (a, b) => a.defects.id - b.defects.id,
    },
    {
      title: 'Описание',
      dataIndex: ['defects', 'description'],
      width: 300,
      ellipsis: true,
    },
    {
      title: 'Статус',
      dataIndex: ['defects', 'defect_status', 'name'],
      width: 140,
      render: (_: string, record: any) => {
        const status = record.defects?.defect_status;
        if (!status) return '—';
        return (
          <Tag color={status.color || 'default'}>
            {status.name}
          </Tag>
        );
      },
    },
    {
      title: 'Получено',
      dataIndex: ['defects', 'received_at'],
      width: 100,
      render: (date: string) => date ? dayjs(date).format('DD.MM.YYYY') : '—',
    },
    {
      title: 'Устранено',
      dataIndex: ['defects', 'fixed_at'],
      width: 100,
      render: (date: string) => date ? dayjs(date).format('DD.MM.YYYY') : '—',
    },
  ];

  return (
    <Modal
      title={
        <div>
          <Typography.Title level={5} style={{ margin: 0 }}>
            Дефекты в выполнении
          </Typography.Title>
          {completion && (
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
              Larix: {completion.larix_number} | Контрагент: {completion.contractorName || '—'}
            </Typography.Text>
          )}
        </div>
      }
      open={open}
      onCancel={onClose}
      width={900}
      footer={null}
    >
      <Table
        rowKey="id"
        columns={columns}
        dataSource={defects}
        loading={isLoading}
        size="small"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Всего дефектов: ${total}`,
        }}
        style={{ marginTop: 16, fontSize: '12px' }}
      />
    </Modal>
  );
}
