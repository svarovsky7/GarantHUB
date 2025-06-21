import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Input, Table, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { ClaimWithNames } from '@/shared/types/claimWithNames';

interface Props {
  open: boolean;
  parent: ClaimWithNames | null;
  claims: ClaimWithNames[];
  onClose: () => void;
  onSubmit: (ids: string[]) => void;
}

/** Диалог выбора претензий для связывания */
export default function LinkClaimsDialog({ open, parent, claims, onClose, onSubmit }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setSelected([]);
    setSearch('');
  }, [parent, open]);

  const parents = useMemo(() => {
    const ids = new Set<string>();
    claims.forEach((c) => {
      if (c.parent_id) ids.add(String(c.parent_id));
    });
    return ids;
  }, [claims]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return claims
      .filter((c) => String(c.id) !== String(parent?.id))
      .filter((c) => c.parent_id == null)
      .filter((c) => !parents.has(String(c.id)))
      .filter((c) => !term || String(c.id).includes(term) || c.claim_no.toLowerCase().includes(term));
  }, [claims, parent, search, parents]);

  const columns: ColumnsType<ClaimWithNames> = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '№ претензии', dataIndex: 'claim_no', ellipsis: true },
    { title: 'Статус', dataIndex: 'statusName', width: 160 },
  ];

  return (
    <Modal
      title="Связать существующие претензии"
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Отмена
        </Button>,
        <Button key="link" type="primary" disabled={selected.length === 0} onClick={() => onSubmit(selected)}>
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
      <Table<ClaimWithNames>
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
        locale={{ emptyText: 'Нет подходящих претензий' }}
      />
    </Modal>
  );
}
