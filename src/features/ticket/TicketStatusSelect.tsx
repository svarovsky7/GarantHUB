import React from "react";
import { Select } from "antd";
import { useTicketStatuses } from "@/entities/ticketStatus";
import { useUpdateTicketStatus } from "@/entities/ticket";

interface TicketStatusSelectProps {
  ticketId: number;
  statusId: number | null;
}

/**
 * Выпадающий список для смены статуса замечания напрямую из таблицы.
 */
export default function TicketStatusSelect({ ticketId, statusId }: TicketStatusSelectProps) {
  const { data: statuses = [] } = useTicketStatuses();
  const update = useUpdateTicketStatus();

  const handleChange = (value: number) => {
    update.mutate({ id: ticketId, statusId: value });
  };

  return (
    <Select
      size="small"
      value={statusId ?? undefined}
      onChange={handleChange}
      loading={update.isPending}
      options={statuses.map((s) => ({ label: s.name, value: s.id }))}
      style={{ width: "100%" }}
    />
  );
}
