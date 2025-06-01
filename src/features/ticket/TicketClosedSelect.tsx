import React from "react";
import { Select } from "antd";
import { useUpdateTicketClosed } from "@/entities/ticket";

interface Props {
  ticketId: number;
  isClosed: boolean;
}

/**
 * Выпадающий список для отметки закрытия замечания.
 */
export default function TicketClosedSelect({ ticketId, isClosed }: Props) {
  const update = useUpdateTicketClosed();
  const handleChange = (value: string) => {
    update.mutate({ id: ticketId, isClosed: value === "closed" });
  };

  return (
    <Select
      size="small"
      value={isClosed ? "closed" : "open"}
      style={{ width: "100%" }}
      onChange={handleChange}
      options={[
        { label: "открыто", value: "open" },
        { label: "закрыто", value: "closed" },
      ]}
      loading={update.isPending}
    />
  );
}
