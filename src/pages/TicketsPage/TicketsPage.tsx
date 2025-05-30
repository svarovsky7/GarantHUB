// -----------------------------------------------------------------------------
// Страница «/tickets» – фильтры + таблица
// -----------------------------------------------------------------------------
import React, { useState, useMemo } from "react";
import { ConfigProvider, Typography, Alert, Card } from "antd";
import ruRU from "antd/locale/ru_RU";
import { useSnackbar } from "notistack";
import { useQueryClient } from "@tanstack/react-query";

import { useTickets } from "@/entities/ticket";
import { useUsers } from "@/entities/user";
import TicketsTable from "@/widgets/TicketsTable";
import TicketsFilters from "@/widgets/TicketsFilters";
import TicketFormAntd from "@/features/ticket/TicketFormAntd";

export default function TicketsPage() {
  const { enqueueSnackbar } = useSnackbar();
  const { data: tickets = [], isLoading, error } = useTickets();
  const { data: users = [] } = useUsers();
  const qc = useQueryClient();
  const [filters, setFilters] = useState({});

  /* toast api-ошибки */
  React.useEffect(() => {
    if (error) enqueueSnackbar(error.message, { variant: "error" });
  }, [error, enqueueSnackbar]);

  const userMap = useMemo(() => {
    const map = {};
    users.forEach((u) => {
      map[u.id] = u.name;
    });
    return map;
  }, [users]);

  const ticketsWithNames = useMemo(
    () =>
      tickets.map((t) => ({
        ...t,
        responsibleEngineerName: userMap[t.responsibleEngineerId] ?? null,
        createdByName: userMap[t.createdBy] ?? null,
      })),
    [tickets, userMap],
  );

  /* списки для <Select> (уникальные значения) */
  const options = useMemo(() => {
    const uniq = (arr, key) =>
      Array.from(new Set(arr.map((i) => i[key]).filter(Boolean))).map((v) => ({
        label: v,
        value: v,
      }));
    return {
      projects: uniq(ticketsWithNames, "projectName"),
      units: uniq(ticketsWithNames, "unitName"),
      statuses: uniq(ticketsWithNames, "statusName"),
      types: uniq(ticketsWithNames, "typeName"),
      authors: uniq(ticketsWithNames, "createdByName"),
      responsibleEngineers: uniq(ticketsWithNames, "responsibleEngineerName"),
    };
  }, [ticketsWithNames]);

  return (
    <ConfigProvider locale={ruRU}>
      <>
        <Typography.Title level={4} style={{ marginBottom: 16 }}>Замечания</Typography.Title>

        <Card style={{ marginBottom: 24 }}>
          <TicketFormAntd onCreated={() => qc.invalidateQueries({ queryKey: ['tickets'] })} />
        </Card>

        <Card style={{ marginBottom: 24 }}>
          <TicketsFilters options={options} onChange={setFilters} />
        </Card>

        <Card>
          {error ? (
            <Alert type="error" message={error.message} />
          ) : (
            <TicketsTable
              tickets={ticketsWithNames}
              filters={filters}
              loading={isLoading}
            />
          )}
        </Card>
      </>
    </ConfigProvider>
  );
}
