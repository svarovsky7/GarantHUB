// -----------------------------------------------------------------------------
// Страница «/tickets» – фильтры + таблица
// -----------------------------------------------------------------------------
import React, { useState, useMemo } from "react";
import { Box, Paper, Typography, Alert } from "@mui/material";
import { useSnackbar } from "notistack";
import { useQueryClient } from "@tanstack/react-query";

import { useTickets } from "@/entities/ticket";
import { useUsers } from "@/entities/user";
import TicketsTable from "@/widgets/TicketsTable";
import TicketsFilters from "@/widgets/TicketsFilters";
import TicketForm from "@/features/ticket/TicketForm";

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
    <Box sx={{ width: "100%", px: 0, py: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Замечания
      </Typography>

      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3, md: 4 }, mb: 3, borderRadius: 2 }}>
        <TicketForm onCreated={() => qc.invalidateQueries({ queryKey: ['tickets'] })} />
      </Paper>

      <Paper
        elevation={3}
        sx={{ p: { xs: 2, sm: 3, md: 4 }, mb: 3, borderRadius: 2 }}
      >
        <TicketsFilters options={options} onChange={setFilters} />
      </Paper>

      <Paper
        elevation={3}
        sx={{
          p: { xs: 2, sm: 3, md: 4 },
          borderRadius: 2,
          overflow: "visible",
        }}
      >
        {error ? (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error.message}
          </Alert>
        ) : (
          <TicketsTable
            tickets={ticketsWithNames}
            filters={filters}
            loading={isLoading}
          />
        )}
      </Paper>
    </Box>
  );
}
