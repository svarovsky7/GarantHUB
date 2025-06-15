import React from 'react';
import { Select, Tag } from 'antd';
import { useUpdateDefectFixed } from '@/entities/defect';

interface Props {
  defectId: number;
  isFixed: boolean;
}

/**
 * Инлайн‑редактор признака устранения дефекта.
 * Отображает текущее значение как тег. По клику — выпадающий список.
 */
export default function DefectFixedSelect({ defectId, isFixed }: Props) {
  const update = useUpdateDefectFixed();
  const [editing, setEditing] = React.useState(false);

  const handleChange = (value: 'yes' | 'no') => {
    update.mutate({ id: defectId, isFixed: value === 'yes' });
    setEditing(false);
  };

  if (!editing) {
    return (
      <Tag
        color={isFixed ? 'success' : 'default'}
        onClick={() => setEditing(true)}
        style={{ cursor: 'pointer' }}
      >
        {isFixed ? 'Да' : 'Нет'}
      </Tag>
    );
  }

  return (
    <Select
      size="small"
      autoFocus
      open
      defaultValue={isFixed ? 'yes' : 'no'}
      onBlur={() => setEditing(false)}
      onChange={handleChange}
      loading={update.isPending}
      options={[
        { label: 'Да', value: 'yes' },
        { label: 'Нет', value: 'no' },
      ]}
      style={{ width: '100%' }}
    />
  );
}
