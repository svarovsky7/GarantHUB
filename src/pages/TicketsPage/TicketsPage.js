// src/pages/TicketsPage/TicketsPage.js
// -------------------------------------------------------------
// SPA-страница "Создание замечания". Реиспользует TicketForm.
// -------------------------------------------------------------
import React from 'react';
import { Box, Typography } from '@mui/material';
import TicketForm from '@/features/ticket/TicketForm';

export default function TicketsPage() {
    return (
        <Box component="main" sx={{ maxWidth: 1140, mx: 'auto', py: 8, px: 3 }}>
            <Box component="section">
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
                    Новое замечание
                </Typography>
                <TicketForm /> {/* CHANGE: теперь отдельный контрол */}
            </Box>
        </Box>
    );
}
