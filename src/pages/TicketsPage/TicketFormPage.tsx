// src/pages/TicketsPage/TicketFormPage.js
import React from "react";
import { Box, Paper, Typography, Alert } from "@mui/material";
import { useParams } from "react-router-dom";

import TicketForm from "@/features/ticket/TicketForm";
import { useProjectId } from "@/shared/hooks/useProjectId";

export default function TicketFormPage() {
  const { ticketId } = useParams();
  const title = ticketId ? "Редактирование замечания" : "Добавление замечания";

  const projectId = useProjectId();

  // --- Если проект не выбран ---
  if (!projectId) {
    return (
      <Box sx={{ p: { xs: 2, md: 4 } }} data-oid="ud4zqhf">
        <Paper
          elevation={3}
          sx={{ borderRadius: 2, overflow: "hidden" }}
          data-oid="rm90rno"
        >
          <Box
            sx={{ bgcolor: "primary.main", color: "#fff", py: 2, px: 3 }}
            data-oid="u_5l6cr"
          >
            <Typography variant="h6" fontWeight={600} data-oid="3j2vmmo">
              {title}
            </Typography>
          </Box>
          <Box sx={{ p: { xs: 3, md: 5 } }} data-oid="28xq_.v">
            <Alert severity="warning" data-oid="ouv6eyf">
              Не выбран проект. Пожалуйста, выберите проект в верхней панели для
              создания замечания.
            </Alert>
          </Box>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }} data-oid="m:bq6:t">
      <Paper
        elevation={3}
        sx={{ borderRadius: 2, overflow: "hidden" }}
        data-oid="uayz--t"
      >
        {/* --- фиолетовый header --- */}
        <Box
          sx={{ bgcolor: "primary.main", color: "#fff", py: 2, px: 3 }}
          data-oid="yy5sznx"
        >
          <Typography variant="h6" fontWeight={600} data-oid="ur8s4gz">
            {title}
          </Typography>
        </Box>
        {/* --- форма --- */}
        <Box sx={{ p: { xs: 3, md: 5 } }} data-oid="ack65dk">
          <TicketForm
            key={`${projectId ?? "none"}-${ticketId ?? "new"}`}
            ticketId={ticketId}
            onCreated={() => {}}
            onCancel={() => {}}
            data-oid="q.qqqcr"
          />
        </Box>
      </Paper>
    </Box>
  );
}
