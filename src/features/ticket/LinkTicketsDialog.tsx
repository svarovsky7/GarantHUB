import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Input, Table, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Ticket } from '@/shared/types/ticket';

interface Props {
  open: boolean;
  parent: Ticket | null;
  tickets: Ticket[];
  onClose: () => void;
  onSubmit: (ids: string[]) => void;
}

/** Диалог выбора замечаний для связывания */
export default function LinkTicketsDialog({
  open,
  parent,
  tickets,
  onClose,
  onSubmit,
}: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setSelected([]);
    setSearch('');
  }, [parent, open]);

  const parents = useMemo(() => {
    const ids = new Set<string>();
    tickets.forEach((t) => {
      if (t.parent_id) ids.add(String(t.parent_id));
    });
    return ids;
  }, [tickets]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return tickets
      .filter((t) => String(t.id) !== String(parent?.id))
      .filter((t) => t.parent_id == null)
      .filter((t) => !parents.has(String(t.id)))
      .filter(
        (t) =>
          !term ||
          String(t.id).includes(term) ||
          (t.title ?? '').toLowerCase().includes(term),
      );
  }, [tickets, parent, search, parents]);

  const columns: ColumnsType<Ticket> = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: 'Название', dataIndex: 'title', ellipsis: true },
    { title: 'Статус', dataIndex: 'statusName', width: 160 },
  ];

  return (
    <Modal
      title="Связать существующие замечания"
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Отмена
        </Button>,
        <Button
          key="link"
          type="primary"
          disabled={selected.length === 0}
          onClick={() => onSubmit(selected)}
        >
          Связать
        </Button>,
      ]}
      width={700}
      destroyOnClose
    >
      <Input
        placeholder="Поиск по ID или названию"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        allowClear
        style={{ marginBottom: 16 }}
      />
      <Table<Ticket>
        rowKey="id"
        columns={columns}
        dataSource={filtered}
        size="small"
        pagination={{ pageSize: 8, showSizeChanger: false }}
        scroll={{ y: 320 }}
        rowSelection={{
          selectedRowKeys: selected,
          onChange: (keys) => setSelected(keys as string[]),
        }}
        locale={{ emptyText: 'Нет подходящих замечаний' }}
      />
    </Modal>
  );
}
