import React from 'react';
import { Select, Tag } from 'antd';
import { useLetterStatuses } from '@/entities/letterStatus';
import { useUpdateLetterStatus } from '@/entities/correspondence';

interface Props {
  letterId: string;
  statusId: number | null;
  statusName?: string | null;
  statusColor?: string | null;
}

export default function LetterStatusSelect({
  letterId,
  statusId,
  statusName,
  statusColor,
}: Props) {
  const { data: statuses = [], isLoading } = useLetterStatuses();
  const update = useUpdateLetterStatus();
  const [editing, setEditing] = React.useState(false);

  const options = React.useMemo(
    () =>
      statuses.map((s) => ({
        label: <Tag color={s.color ?? undefined}>{s.name}</Tag>,
        value: s.id,
      })),
    [statuses],
  );

  const current = React.useMemo(
    () =>
      statuses.find((s) => s.id === statusId) ||
      (statusId
        ? { id: statusId, name: statusName ?? String(statusId), color: statusColor ?? undefined }
        : null),
    [statuses, statusId, statusName, statusColor],
  );

  const handleChange = (value: number) => {
    (update as any).mutate({ id: letterId, statusId: value });
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
