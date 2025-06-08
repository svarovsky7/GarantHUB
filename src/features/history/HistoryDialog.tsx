import React from 'react';
import dayjs from 'dayjs';
import { Modal, Table, Tag, ConfigProvider } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import type { ColumnsType } from 'antd/es/table';
import { useUnitHistory } from '@/entities/history';
import type { HistoryEventWithUser } from '@/shared/types/history';

interface HistoryDialogProps {
  open: boolean;
  unit: { id: number; name: string } | null;
  onClose: () => void;
}

/** Диалог отображения истории объекта */
export default function HistoryDialog({ open, unit, onClose }: HistoryDialogProps) {
  const { data = [], isLoading } = useUnitHistory(unit?.id);

  const actionLabels: Record<string, string> = {
    created: 'Создан',
    updated: 'Обновлен',
    deleted: 'Удален',
  };

  const typeLabels: Record<string, string> = {
    ticket: 'Замечание',
    letter: 'Письмо',
    court_case: 'Судебное дело',
  };

  const columns: ColumnsType<HistoryEventWithUser> = [
    {
      title: 'Дата',
      dataIndex: 'changed_at',
      render: (d: string) => dayjs(d).format('DD.MM.YYYY HH:mm'),
    },
    {
      title: 'Действие',
      dataIndex: 'action',
      render: (a: string) => <Tag>{actionLabels[a] ?? a}</Tag>,
    },
    {
      title: 'Тип',
      dataIndex: 'entity_type',
      render: (t: string) => typeLabels[t] ?? t,
    },
    {
      title: 'ID',
      dataIndex: 'entity_id',
    },
    {
      title: 'Пользователь',
      dataIndex: 'user_name',
      render: (n: string | null) => n || '—',
    },
  ];

  return (
    <ConfigProvider locale={ruRU}>
      <Modal
        open={open}
        onCancel={onClose}
        footer={null}
        title={unit ? `История объекта ${unit.name}` : 'История'}
        width={700}
        zIndex={1400}
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={data}
          loading={isLoading}
          pagination={{ pageSize: 10 }}
          size="small"
        />
      </Modal>
    </ConfigProvider>
  );
}
