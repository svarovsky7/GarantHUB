// CHANGE: Полный список писем, отдельное окно, фильтрация по номеру/теме/корреспонденту

import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Input, Table, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CorrespondenceLetter } from '@/shared/types/correspondence';

interface Props {
  open: boolean;
  parent: CorrespondenceLetter | null;
  letters: CorrespondenceLetter[];
  onClose: () => void;
  onSubmit: (ids: string[]) => void;
}

/** Диалог выбора писем для связывания */
export default function LinkLettersDialog({
                                            open,
                                            parent,
                                            letters,
                                            onClose,
                                            onSubmit,
                                          }: Props) {
  // CHANGE: Состояние фильтра и выбранных писем
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setSelected([]); // сбрасываем при открытии
    setSearch('');
  }, [parent, open]);

  // CHANGE: Исключаем текущее письмо и применяем фильтр поиска
  const parents = useMemo(() => {
    const ids = new Set<string>();
    letters.forEach((l) => {
      if (l.parent_id) ids.add(l.parent_id);
    });
    return ids;
  }, [letters]);

  const filteredLetters = useMemo(() => {
    const term = search.trim().toLowerCase();
    return letters
        .filter((l) => l.id !== parent?.id)
        .filter((l) => l.parent_id === null)
        .filter((l) => !parents.has(l.id))
        .filter(
          (l) =>
            !term ||
            l.number.toLowerCase().includes(term) ||
            (l.subject ?? '').toLowerCase().includes(term) ||
            (l.sender ?? '').toLowerCase().includes(term) ||
            (l.receiver ?? '').toLowerCase().includes(term),
        );
  }, [letters, parent, search, parents]);

  // CHANGE: Описываем колонки таблицы для Antd Table
  const columns: ColumnsType<CorrespondenceLetter> = [
    {
      title: '№ письма',
      dataIndex: 'number',
      key: 'number',
      width: 120,
    },
    {
      title: 'Тема',
      dataIndex: 'subject',
      key: 'subject',
      ellipsis: true,
    },
    {
      title: 'Отправитель',
      dataIndex: 'sender',
      key: 'sender',
      ellipsis: true,
      width: 160,
    },
    {
      title: 'Получатель',
      dataIndex: 'receiver',
      key: 'receiver',
      ellipsis: true,
      width: 160,
    },
  ];

  // CHANGE: рендерим окно с фильтром, таблицей и кнопками
  return (
      <Modal
          title="Связать существующие письма"
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
            placeholder="Поиск по номеру, теме, корреспонденту"
            value={search}
            onChange={e => setSearch(e.target.value)}
            allowClear
            style={{ marginBottom: 16 }}
        />
        <Table<CorrespondenceLetter>
            rowKey="id"
            columns={columns}
            dataSource={filteredLetters}
            size="small"
            pagination={{ pageSize: 8, showSizeChanger: false }}
            scroll={{ y: 320 }}
            rowSelection={{
              selectedRowKeys: selected,
              onChange: (keys) => setSelected(keys as string[]),
            }}
            locale={{ emptyText: 'Нет подходящих писем' }}
        />
      </Modal>
  );
}
