import React from 'react';
import { Select } from 'antd';
import { useLitigationStages } from '@/entities/litigationStage';
import { useUpdateCourtCase } from '@/entities/courtCase';

interface Props {
  caseId: number;
  status: number;
}

/**
 * Выпадающий список для смены статуса судебного дела непосредственно из таблицы.
 */
export default function CourtCaseStatusSelect({ caseId, status }: Props) {
  const { data: stages = [] } = useLitigationStages();
  const update = useUpdateCourtCase();

  const handleChange = (value: number) => {
    update.mutate({ id: caseId, updates: { status: value } });
  };

  return (
    <Select
      size="small"
      value={status}
      onChange={handleChange}
      loading={update.isPending}
      options={stages.map((s) => ({ label: s.name, value: s.id }))}
      style={{ width: '100%' }}
    />
  );
}
