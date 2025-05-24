import React from "react";
import { Paper, Typography, CircularProgress, Box } from "@mui/material";
import { useProjects } from "@/entities/project";
import { useAllTicketsSimple } from "@/entities/ticket";
import { useTicketStatuses } from "@/entities/ticketStatus";

export default function StatsPage() {
  const { data: projects = [], isPending: loadingProjects } = useProjects();
  const {
    data: tickets = [],
    isPending: loadingTickets,
    error,
  } = useAllTicketsSimple();
  const { data: statuses = [] } = useTicketStatuses();

  const totalTickets = tickets.length;
  const byStatus = React.useMemo(() => {
    const m = {};
    tickets.forEach((t) => {
      m[t.status_id] = (m[t.status_id] || 0) + 1;
    });
    return m;
  }, [tickets]);

  if (loadingProjects || loadingTickets) {
    return <CircularProgress data-oid="vu7rjr-" />;
  }

  return (
    <Paper sx={{ p: 3 }} data-oid="hpqw32s">
      <Typography variant="h4" gutterBottom data-oid="7rxjnl3">
        Статистика
      </Typography>
      <Typography data-oid=".zp_urh">
        Количество проектов: {projects.length}
      </Typography>
      <Typography sx={{ mt: 1 }} data-oid="e0g2:bg">
        Всего замечаний: {totalTickets}
      </Typography>
      <Box sx={{ mt: 2 }} data-oid="hcynarv">
        {statuses.map((st) => (
          <Typography key={st.id} data-oid="9h_6632">
            {st.name}: {byStatus[st.id] ?? 0}
          </Typography>
        ))}
      </Box>
      {error && (
        <Typography color="error" sx={{ mt: 2 }} data-oid="6zpmpep">
          {error.message}
        </Typography>
      )}
    </Paper>
  );
}
