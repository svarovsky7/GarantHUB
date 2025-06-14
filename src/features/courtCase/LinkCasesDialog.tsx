import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Input, Table, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CourtCase } from '@/shared/types/courtCase';

interface Props {
  open: boolean;
  parent: CourtCase | null;
  cases: (CourtCase & any)[];
  onClose: () => void;
  onSubmit: (ids: string[]) => void;
}

/** Диалог выбора судебных дел для связывания */
export default function LinkCasesDialog({ open, parent, cases, onClose, onSubmit }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setSelected([]);
    setSearch('');
  }, [parent, open]);

  const parents = useMemo(() => {
    const ids = new Set<string>();
    cases.forEach((c) => {
      if (c.parent_id) ids.add(String(c.parent_id));
    });
    return ids;
  }, [cases]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return cases
      .filter((c) => String(c.id) !== String(parent?.id))
      .filter((c) => c.parent_id == null)
      .filter((c) => !parents.has(String(c.id)))
      .filter(
        (c) =>
          !term ||
          String(c.id).includes(term) ||
          (c.number ?? '').toLowerCase().includes(term),
      );
  }, [cases, parent, search, parents]);

  const columns: ColumnsType<CourtCase & any> = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '№ дела', dataIndex: 'number', ellipsis: true },
    { title: 'Статус', dataIndex: 'statusName', width: 160 },
  ];

  return (
    <Modal
      title="Связать существующие дела"
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
      destroyOnHidden
    >
      <Input
        placeholder="Поиск по ID или номеру"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        allowClear
        style={{ marginBottom: 16 }}
      />
      <Table<CourtCase & any>
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
        locale={{ emptyText: 'Нет подходящих дел' }}
      />
    </Modal>
  );
}
