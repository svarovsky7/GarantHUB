import React from "react";
import { Select, Tag } from "antd";
import { useTicketStatuses } from "@/entities/ticketStatus";
import { useUpdateTicketStatus } from "@/entities/ticket";

/** Свойства компонента TicketStatusSelect */
interface TicketStatusSelectProps {
  ticketId: number;
  statusId: number | null;
  /** цвет статуса, используется до загрузки списка */
  statusColor?: string | null;
  /** имя статуса, используется до загрузки списка */
  statusName?: string | null;
  /** идентификатор проекта замечания */
  projectId?: number;
}

/**
 * Инлайн‑редактор статуса замечания в таблице.
 * По клику отображает выпадающий список со списком статусов.
 */
export default function TicketStatusSelect({
  ticketId,
  statusId,
  statusColor,
  statusName,
  projectId,
}: TicketStatusSelectProps) {
  const { data: statuses = [], isLoading } = useTicketStatuses();
  const update = useUpdateTicketStatus();

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
    (update as any).mutate({ id: ticketId, statusId: value, projectId });
    setEditing(false);
  };

  if (!editing) {
    return (
      <Tag color={current?.color} onClick={() => setEditing(true)} style={{ cursor: "pointer" }}>
        {current?.name ?? "—"}
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
      style={{ width: "100%" }}
    />
  );
}
