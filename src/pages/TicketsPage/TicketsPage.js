// src/pages/TicketsPage/TicketsPage.js

import React, { useState, useMemo } from 'react';
import {
    Box, Paper, Stack, Typography, Button, Alert,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import { useSnackbar } from 'notistack';

import { useTickets } from '@/entities/ticket';
import { useUsers }   from '@/entities/user';
import TicketsTable   from '@/widgets/TicketsTable';
import TicketsFilters from '@/widgets/TicketsFilters';

export default function TicketsPage() {
    const { enqueueSnackbar } = useSnackbar();
    const { data: tickets = [], isLoading, error } = useTickets();
    const { data: users = [] } = useUsers();
    const [filters, setFilters] = useState({});

    React.useEffect(() => {
        if (error) enqueueSnackbar(error.message, { variant: 'error' });
    }, [error, enqueueSnackbar]);

    const userMap = useMemo(() => {
        const map = {};
        users.forEach((u) => { map[u.id] = u.name; });
        return map;
    }, [users]);

    const ticketsWithEngineers = useMemo(
        () => tickets.map((t) => ({
            ...t,
            responsibleEngineerName: userMap[t.responsibleEngineerId] ?? null,
        })),
        [tickets, userMap],
    );

    const options = useMemo(() => {
        const uniq = (arr, key) =>
            Array.from(new Set(arr.map((i) => i[key]).filter(Boolean))).map((v) => ({
                label: v, value: v,
            }));
        return {
            projects: uniq(ticketsWithEngineers, 'projectName'),
            units: uniq(ticketsWithEngineers, 'unitName'),
            statuses: uniq(ticketsWithEngineers, 'statusName'),
            types: uniq(ticketsWithEngineers, 'typeName'),
            authors: uniq(ticketsWithEngineers, 'createdByName'),
            responsibleEngineers: uniq(ticketsWithEngineers, 'responsibleEngineerName'),
        };
    }, [ticketsWithEngineers]);

    return (
        <Box sx={{ width: '100%', px: 0, py: 3 }}>
            <Paper
                elevation={3}
                sx={{
                    p: { xs: 2, sm: 3, md: 4 },
                    borderRadius: 2,
                    overflow: 'visible',
                }}
            >
                <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    justifyContent="space-between"
                    alignItems={{ xs: 'flex-start', md: 'center' }}
                    spacing={2}
                    sx={{ mb: 3 }}
                >
                    <Typography variant="h4">Список замечаний</Typography>
                    <Button
                        component={RouterLink}
                        to="/tickets/new"
                        variant="contained"
                        startIcon={<AddIcon />}
                    >
                        Новое замечание
                    </Button>
                </Stack>
                <TicketsFilters
                    options={options}
                    onChange={setFilters}
                />
                <Box sx={{ width: '100%' }}>
                    {error ? (
                        <Alert severity="error" sx={{ mt: 2 }}>{error.message}</Alert>
                    ) : (
                        <TicketsTable
                            tickets={ticketsWithEngineers}
                            filters={filters}
                            loading={isLoading}
                        />
                    )}
                </Box>
            </Paper>
        </Box>
    );
}
