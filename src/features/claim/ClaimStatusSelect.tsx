import React from 'react';
import { Select, Tag, Modal } from 'antd';
import { useClaimStatuses } from '@/entities/claimStatus';
import { useUpdateClaim } from '@/entities/claim';

interface ClaimStatusSelectProps {
  claimId: number;
  statusId: number | null;
  statusColor?: string | null;
  statusName?: string | null;
  /** Признак, что претензия содержит заблокированные объекты */
  locked?: boolean;
}

export default function ClaimStatusSelect({
  claimId,
  statusId,
  statusColor,
  statusName,
  locked,
}: ClaimStatusSelectProps) {
  const { data: statuses = [], isLoading } = useClaimStatuses();
  const update = useUpdateClaim();
  const [editing, setEditing] = React.useState(false);

  const options = React.useMemo(
    () => statuses.map((s) => ({ label: <Tag color={s.color ?? undefined}>{s.name}</Tag>, value: s.id })),
    [statuses],
  );

  const current = React.useMemo(
    () =>
      statuses.find((s) => s.id === statusId) ||
      (statusId ? { id: statusId, name: statusName ?? String(statusId), color: statusColor ?? undefined } : null),
    [statuses, statusId, statusName, statusColor],
  );

  const handleChange = (value: number) => {
    if (locked) {
      Modal.warning({
        title: 'Объект заблокирован',
        content: 'Работы по устранению замечаний запрещено выполнять.',
      });
      setEditing(false);
      return;
    }
    update.mutate({ id: claimId, updates: { claim_status_id: value } });
    setEditing(false);
  };

  if (!editing) {
    return (
      <Tag
        color={current?.color}
        onClick={() => {
          if (locked) {
            Modal.warning({
              title: 'Объект заблокирован',
              content: 'Работы по устранению замечаний запрещено выполнять.',
            });
          } else {
            setEditing(true);
          }
        }}
        style={{ cursor: 'pointer' }}
      >
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
