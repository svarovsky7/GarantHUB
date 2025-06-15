import React from 'react';
import { Select, Tag } from 'antd';
import { useCourtCaseStatuses } from '@/entities/courtCaseStatus';
import { useUpdateCourtCase } from '@/entities/courtCase';

interface Props {
  caseId: number;
  status: number;
}

/**
 * Выпадающий список для смены статуса судебного дела непосредственно из таблицы.
 */
export default function CourtCaseStatusSelect({ caseId, status }: Props) {
  const { data: stages = [] } = useCourtCaseStatuses();
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
      optionLabelProp="label"
      options={stages.map((s) => ({
        label: <Tag color={s.color ?? undefined}>{s.name}</Tag>,
        value: s.id,
      }))}
      style={{ width: '100%' }}
    />
  );
}
