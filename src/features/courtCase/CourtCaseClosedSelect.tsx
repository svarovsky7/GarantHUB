import React from 'react';
import { Select } from 'antd';
import { useUpdateCourtCase } from '@/entities/courtCase';

interface Props {
  caseId: number;
  isClosed: boolean;
}

/**
 * Переключатель закрытия судебного дела.
 */
export default function CourtCaseClosedSelect({ caseId, isClosed }: Props) {
  const update = useUpdateCourtCase();

  const handleChange = (value: string) => {
    update.mutate({ id: caseId, updates: { is_closed: value === 'closed' } });
  };

  return (
    <Select
      size="small"
      value={isClosed ? 'closed' : 'open'}
      onChange={handleChange}
      loading={update.isPending}
      style={{ width: '100%' }}
      options={[
        { label: 'открыто', value: 'open' },
        { label: 'закрыто', value: 'closed' },
      ]}
    />
  );
}
