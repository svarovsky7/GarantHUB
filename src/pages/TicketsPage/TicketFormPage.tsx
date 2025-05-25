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
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <Paper elevation={3} sx={{ borderRadius: 2, overflow: "hidden" }}>
          <Box sx={{ bgcolor: "primary.main", color: "#fff", py: 2, px: 3 }}>
            <Typography variant="h6" fontWeight={600}>
              {title}
            </Typography>
          </Box>
          <Box sx={{ p: { xs: 3, md: 5 } }}>
            <Alert severity="warning">
              Не выбран проект. Пожалуйста, выберите проект в верхней панели для
              создания замечания.
            </Alert>
          </Box>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Paper elevation={3} sx={{ borderRadius: 2, overflow: "hidden" }}>
        {/* --- фиолетовый header --- */}
        <Box sx={{ bgcolor: "primary.main", color: "#fff", py: 2, px: 3 }}>
          <Typography variant="h6" fontWeight={600}>
            {title}
          </Typography>
        </Box>
        {/* --- форма --- */}
        <Box sx={{ p: { xs: 3, md: 5 } }}>
          <TicketForm
            key={`${projectId ?? "none"}-${ticketId ?? "new"}`}
            ticketId={ticketId}
            onCreated={() => {}}
            onCancel={() => {}}
          />
        </Box>
      </Paper>
    </Box>
  );
}
