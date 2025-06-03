import React from "react";
import { Select, Tag } from "antd";
import { useTicketStatuses } from "@/entities/ticketStatus";
import { useUpdateTicketStatus } from "@/entities/ticket";

interface TicketStatusSelectProps {
  ticketId: number;
  statusId: number | null;
  /** цвет статуса, используется до загрузки списка */
  statusColor?: string | null;
  /** имя статуса, используется до загрузки списка */
  statusName?: string | null;
}

/**
 * Выпадающий список для смены статуса замечания напрямую из таблицы.
 */
export default function TicketStatusSelect({
  ticketId,
  statusId,
  statusColor,
  statusName,
}: TicketStatusSelectProps) {
  const { data: statuses = [] } = useTicketStatuses();
  const update = useUpdateTicketStatus();

  const handleChange = (value: number) => {
    update.mutate({ id: ticketId, statusId: value });
  };

  const options = statuses.map((s) => ({
    label: <Tag color={s.color ?? undefined}>{s.name}</Tag>,
    value: s.id,
  }));

  const selected = options.find((o) => o.value === statusId);
  const fallback = statusId ? (
    <Tag color={statusColor ?? undefined}>{statusName ?? statusId}</Tag>
  ) : undefined;

  return (
    <Select
      size="small"
      value={statusId ?? undefined}
      onChange={handleChange}
      loading={update.isPending}
      optionLabelProp="label"
      options={options}
      style={{ width: "100%" }}
    >
      {selected ? null : fallback}
    </Select>
  );
}
