import React from 'react';
import { Select, Tag, Modal } from 'antd';
import { useDefectStatuses } from '@/entities/defectStatus';
import { useUpdateDefectStatus } from '@/entities/defect';

interface Props {
  defectId: number;
  statusId: number | null;
  statusName?: string | null;
  statusColor?: string | null;
  /** Признак, что дефект содержит заблокированные объекты */
  locked?: boolean;
}

/** Выпадающий список для смены статуса дефекта в таблице */
export default function DefectStatusSelect({
  defectId,
  statusId,
  statusName,
  statusColor,
  locked,
}: Props) {
  const { data: statuses = [], isLoading } = useDefectStatuses();
  const update = useUpdateDefectStatus();
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
        ? {
            id: statusId,
            name: statusName ?? String(statusId),
            color: statusColor ?? undefined,
          }
        : null),
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
    (update as any).mutate({ id: defectId, statusId: value });
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
