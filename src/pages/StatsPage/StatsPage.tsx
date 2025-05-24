import React from 'react';
import { Paper, Typography, CircularProgress, Box } from '@mui/material';
import { useProjects } from '@/entities/project';
import { useAllTicketsSimple } from '@/entities/ticket';
import { useTicketStatuses } from '@/entities/ticketStatus';

export default function StatsPage() {
    const { data: projects = [], isPending: loadingProjects } = useProjects();
    const { data: tickets = [], isPending: loadingTickets, error } = useAllTicketsSimple();
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
        return <CircularProgress />;
    }

    return (
        <Paper sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Статистика</Typography>
            <Typography>Количество проектов: {projects.length}</Typography>
            <Typography sx={{ mt: 1 }}>Всего замечаний: {totalTickets}</Typography>
            <Box sx={{ mt: 2 }}>
                {statuses.map((st) => (
                    <Typography key={st.id}>{st.name}: {byStatus[st.id] ?? 0}</Typography>
                ))}
            </Box>
            {error && (
                <Typography color="error" sx={{ mt: 2 }}>{error.message}</Typography>
            )}
        </Paper>
    );
}
