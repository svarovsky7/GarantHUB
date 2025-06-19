import React from 'react';
import { Select, Tag } from 'antd';
import type { CorrespondenceLetter } from '@/shared/types/correspondence';
import { useUpdateLetterDirection } from '@/entities/correspondence';

interface Props {
  /** ID письма */
  letterId: string;
  /** Текущий тип письма */
  type: CorrespondenceLetter['type'];
}

/**
 * Выпадающий список для смены типа письма (входящее/исходящее)
 * непосредственно в таблице.
 */
export default function LetterDirectionSelect({ letterId, type }: Props) {
  const update = useUpdateLetterDirection();
  const [editing, setEditing] = React.useState(false);

  const handleChange = (value: 'incoming' | 'outgoing') => {
    update.mutate({ id: letterId, direction: value });
    setEditing(false);
  };

  if (!editing) {
    return (
      <Tag
        color={type === 'incoming' ? 'success' : 'processing'}
        onClick={() => setEditing(true)}
        style={{ cursor: 'pointer' }}
      >
        {type === 'incoming' ? 'Входящее' : 'Исходящее'}
      </Tag>
    );
  }

  return (
    <Select
      size="small"
      autoFocus
      open
      defaultValue={type}
      onBlur={() => setEditing(false)}
      onChange={handleChange}
      loading={update.isPending}
      options={[
        { label: 'Входящее', value: 'incoming' },
        { label: 'Исходящее', value: 'outgoing' },
      ]}
      style={{ width: '100%' }}
    />
  );
}
