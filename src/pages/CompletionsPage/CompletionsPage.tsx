import React, { useState, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tooltip,
  Popconfirm,
  message,
  Modal,
  Typography,
} from 'antd';
import {
  PlusOutlined,
  EyeOutlined,
  DeleteOutlined,
  EditOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  useContractorCompletions,
  useDeleteContractorCompletion,
  useCompletionDefects,
} from '@/entities/contractorCompletion';
import type { ContractorCompletionWithDetails } from '@/shared/types/contractorCompletion';

const CompletionFormModal = React.lazy(() => import('@/features/completion/CompletionFormModal'));
const CompletionDefectsModal = React.lazy(() => import('@/features/completion/CompletionDefectsModal'));

export default function CompletionsPage() {
  const { data: completions = [], isLoading } = useContractorCompletions();
  const deleteCompletion = useDeleteContractorCompletion();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [viewingId, setViewingId] = useState<number | null>(null);

  const handleAdd = useCallback(() => {
    setEditingId(null);
    setShowForm(true);
  }, []);

  const handleEdit = useCallback((id: number) => {
    setEditingId(id);
    setShowForm(true);
  }, []);

  const handleView = useCallback((id: number) => {
    setViewingId(id);
  }, []);

  const handleDelete = useCallback(
    async (id: number) => {
      try {
        await deleteCompletion.mutateAsync(id);
        message.success('Выполнение удалено');
      } catch (error) {
        message.error('Ошибка при удалении');
      }
    },
    [deleteCompletion],
  );

  const columns: ColumnsType<ContractorCompletionWithDetails> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 60,
      sorter: (a, b) => a.id - b.id,
      defaultSortOrder: 'descend',
    },
    {
      title: 'Номер Larix',
      dataIndex: 'larix_number',
      width: 120,
      sorter: (a, b) => a.larix_number.localeCompare(b.larix_number),
    },
    {
      title: 'Контрагент',
      dataIndex: 'contractorName',
      width: 180,
      sorter: (a, b) => (a.contractorName || '').localeCompare(b.contractorName || ''),
      ellipsis: true,
      render: (name: string) => name || '—',
    },
    {
      title: 'Проект',
      dataIndex: 'projectName',
      width: 150,
      sorter: (a, b) => (a.projectName || '').localeCompare(b.projectName || ''),
      ellipsis: true,
      render: (name: string) => name || '—',
    },
    {
      title: 'Дефектов',
      dataIndex: 'defectsCount',
      width: 80,
      sorter: (a, b) => (a.defectsCount || 0) - (b.defectsCount || 0),
      render: (count: number) => count || 0,
    },
    {
      title: 'Создано',
      dataIndex: 'created_at',
      width: 110,
      sorter: (a, b) => dayjs(a.created_at).valueOf() - dayjs(b.created_at).valueOf(),
      render: (date: string) => dayjs(date).format('DD.MM.YYYY HH:mm'),
    },
    {
      title: 'Автор',
      dataIndex: 'createdByName',
      width: 120,
      sorter: (a, b) => (a.createdByName || '').localeCompare(b.createdByName || ''),
      ellipsis: true,
      render: (name: string) => name || '—',
    },
    {
      title: 'Действия',
      key: 'actions',
      width: 100,
      fixed: 'right' as const,
      render: (_: any, record: ContractorCompletionWithDetails) => (
        <Space size={4}>
          <Tooltip title="Просмотр дефектов">
            <Button
              size="small"
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handleView(record.id)}
            />
          </Tooltip>
          <Tooltip title="Редактировать">
            <Button
              size="small"
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record.id)}
            />
          </Tooltip>
          <Popconfirm
            title="Удалить выполнение?"
            description="Все связи с дефектами также будут удалены"
            okText="Да"
            cancelText="Нет"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button
              size="small"
              type="text"
              danger
              icon={<DeleteOutlined />}
              loading={deleteCompletion.isPending}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Добавить выполнение
        </Button>
      </div>

      <Card>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={completions}
          loading={isLoading}
          size="small"
          pagination={{
            pageSize: 50,
            showSizeChanger: true,
            showTotal: (total) => `Всего: ${total}`,
          }}
          style={{ fontSize: '12px' }}
        />
      </Card>

      <React.Suspense fallback={null}>
        <CompletionFormModal
          open={showForm}
          completionId={editingId}
          onClose={() => {
            setShowForm(false);
            setEditingId(null);
          }}
        />
      </React.Suspense>

      <React.Suspense fallback={null}>
        <CompletionDefectsModal
          open={viewingId !== null}
          completionId={viewingId}
          onClose={() => setViewingId(null)}
        />
      </React.Suspense>
    </div>
  );
}
