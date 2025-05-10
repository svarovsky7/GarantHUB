// src/pages/TicketsPage/AddTicketPage.js
import React from 'react';
import { Container, Paper, Typography, Box } from '@mui/material';
import TicketForm from '@/features/ticket/TicketForm';

export default function AddTicketPage() {
    return (
        <Container maxWidth="md" sx={{ py: 3 }}>
            <Paper elevation={3} sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
                <Box sx={{ mb: 3, textAlign: 'center' }}>
                    <Typography variant="h4" gutterBottom>
                        Регистрация нового замечания
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                        Заполните форму ниже
                    </Typography>
                </Box>

                <TicketForm />
            </Paper>
        </Container>
    );
}
