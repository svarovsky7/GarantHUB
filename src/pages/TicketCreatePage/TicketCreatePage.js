import React from 'react';
import { Container, Paper, Typography } from '@mui/material';
import WarrantyTicketForm from '../../features/ticket/WarrantyTicketForm';

const TicketCreatePage = () => (
    <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
                Новое замечание
            </Typography>

            {/* Форма уже содержит выбор проекта и объекта */}
            <WarrantyTicketForm />
        </Paper>
    </Container>
);

export default TicketCreatePage;