import React from 'react';
import { Select, Tag } from 'antd';
import { useCourtCaseStatuses } from '@/entities/courtCaseStatus';
import { useUpdateCourtCase } from '@/entities/courtCase';

interface Props {
  caseId: number;
  /** ID текущего статуса */
  statusId: number | null;
  /** Имя статуса до загрузки справочника */
  statusName?: string | null;
  /** Цвет статуса до загрузки справочника */
  statusColor?: string | null;
}

/**
 * Выпадающий список для смены статуса судебного дела непосредственно из таблицы.
 */
export default function CourtCaseStatusSelect({
  caseId,
  statusId,
  statusName,
  statusColor,
}: Props) {
  const { data: stages = [], isLoading } = useCourtCaseStatuses();
  const update = useUpdateCourtCase();
  const [editing, setEditing] = React.useState(false);

  const options = React.useMemo(
    () =>
      stages.map((s) => ({
        label: <Tag color={s.color ?? undefined}>{s.name}</Tag>,
        value: s.id,
      })),
    [stages],
  );

  const current = React.useMemo(
    () =>
      stages.find((s) => s.id === statusId) ||
      (statusId
        ? { id: statusId, name: statusName ?? String(statusId), color: statusColor ?? undefined }
        : null),
    [stages, statusId, statusName, statusColor],
  );

  const handleChange = (value: number) => {
    update.mutate({ id: caseId, updates: { status: value } });
    setEditing(false);
  };

  if (!editing) {
    return (
      <Tag color={current?.color} onClick={() => setEditing(true)} style={{ cursor: 'pointer' }}>
        {current?.name ?? '—'}
      </Tag>
    );
  }

  return (
    <Select
      size="small"
      autoFocus
      open
      defaultValue={statusId ?? undefined}
      onBlur={() => setEditing(false)}
      onChange={handleChange}
      loading={isLoading || update.isPending}
      optionLabelProp="label"
      options={options}
      style={{ width: '100%' }}
    />
  );
}
