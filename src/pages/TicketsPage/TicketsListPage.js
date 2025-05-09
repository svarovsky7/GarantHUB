/* eslint-disable react/prop-types */
/**
 * Обновлённая страница «Журнал замечаний» (MUI v5 + TanStack Query v5).
 * Теперь соответствует макету (см. CANVAticketsList.html) и поддерживает
 * сворачиваемую панель фильтров. :contentReference[oaicite:0]{index=0}:contentReference[oaicite:1]{index=1}
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Button,
    Collapse,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    TableSortLabel,
    Skeleton,
    Snackbar,
    Alert,
    IconButton
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { saveAs } from 'file-saver';

import {
    useQuery,
    useQueryClient,
    keepPreviousData
} from '@tanstack/react-query';

import { supabase } from '@/shared/api/supabaseClient';

/* ---------- Supabase helpers ---------- */
async function fetchTickets(filters, sort) {
    let q = supabase.from('tickets').select(`
        id, created_at, received_at, is_warranty,
        units:unit_id            ( name ),
        ticket_statuses:status_id( name ),
        profiles:responsible_user_id( name )
    `);

    if (filters.id)            q = q.eq('id', filters.id);
    if (filters.unitId !== undefined) q = q.eq('unit_id', filters.unitId);
    if (filters.statusId)      q = q.eq('status_id', filters.statusId);
    if (filters.responsibleId) q = q.eq('responsible_user_id', filters.responsibleId);
    if (filters.createdFrom)   q = q.gte('created_at', filters.createdFrom);
    if (filters.createdTo)     q = q.lte('created_at', filters.createdTo);
    if (filters.receivedFrom)  q = q.gte('received_at', filters.receivedFrom);
    if (filters.receivedTo)    q = q.lte('received_at', filters.receivedTo);
    if (filters.isWarranty !== undefined) q = q.eq('is_warranty', filters.isWarranty);

    q = q.order(sort.field, { ascending: sort.order === 'asc' });

    const { data, error } = await q;
    if (error) throw error;

    return data.map((r) => ({
        id:               r.id,
        created_at:       r.created_at,
        received_at:      r.received_at,
        is_warranty:      r.is_warranty,
        unit_name:        r.units?.name            ?? '—',
        status_name:      r.ticket_statuses?.name  ?? '—',
        responsible_name: r.profiles?.name         ?? '—'
    }));
}

async function fetchUnits() {
    const { data, error } = await supabase.from('units')
        .select('id, name')
        .order('name', { ascending: true });
    if (error) throw error;
    return data;
}

/* ---------- Component ---------- */
export default function TicketsListPage() {
    const defaultFilters = {
        id: '',
        unitId: undefined,
        statusId: '',
        responsibleId: '',
        createdFrom: '',
        createdTo: '',
        receivedFrom: '',
        receivedTo: '',
        isWarranty: undefined
    };

    const queryClient           = useQueryClient();
    const [filters, setFilters] = useState(defaultFilters);
    const [localFlt, setLocalF] = useState(defaultFilters);
    const [sort, setSort]       = useState({ field: 'created_at', order: 'desc' });
    const [openFilters, setOpenFilters] = useState(true);
    const [sb, setSb]           = useState({ open: false, msg: '' });

    /* tickets */
    const {
        data: tickets = [],
        isLoading,
        error
    } = useQuery({
        queryKey: ['tickets', filters, sort],
        queryFn : () => fetchTickets(filters, sort),
        staleTime: 10_000,
        placeholderData: keepPreviousData
    });

    /* units */
    const { data: units = [] } = useQuery({
        queryKey: ['units'],
        queryFn : fetchUnits,
        staleTime: 600_000
    });

    useEffect(() => {
        if (error) setSb({ open: true, msg: error.message ?? 'Ошибка загрузки' });
    }, [error]);

    /* helpers */
    const sortDir = (f) => (sort.field === f ? sort.order : false);
    const toggleSort = (field) =>
        setSort((p) =>
            p.field === field ? { field, order: p.order === 'asc' ? 'desc' : 'asc' }
                : { field, order: 'asc' });

    const applyFilters = () => setFilters(localFlt);
    const resetFilters = () => { setLocalF(defaultFilters); setFilters(defaultFilters); };

    const exportCsv = () => {
        const header = 'id;created_at;received_at;unit;status;responsible;is_warranty\n';
        const rows = tickets
            .map((t) =>
                [
                    t.id,
                    t.created_at,
                    t.received_at,
                    t.unit_name,
                    t.status_name,
                    t.responsible_name,
                    t.is_warranty ? 'yes' : 'no'
                ].join(';')
            )
            .join('\n');
        saveAs(
            new Blob([header + rows], { type: 'text/csv;charset=utf-8;' }),
            `tickets_${Date.now()}.csv`
        );
    };

    const ticketsCount = useMemo(() => tickets.length, [tickets]);

    /* ---------- Render ---------- */
    return (
        <Box sx={{ p: { xs: 2, md: 4 } }}>
            {/* Header */}
            <Box sx={{ mb: 6 }}>
                <Typography variant="h4" fontWeight={700} color="text.primary" gutterBottom>
                    Журнал замечаний
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                    Полный список всех замечаний с возможностью фильтрации
                </Typography>
            </Box>

            {/* Filters section (card + toggle) */}
            <Paper
                elevation={0}
                sx={{
                    mb: 6,
                    p: 3,
                    borderRadius: 2,
                    backgroundColor: '#fff',
                    boxShadow: '0 1px 4px rgba(0,0,0,.08)'
                }}
            >
                <Box
                    sx={{
                        mb: 2,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}
                >
                    <Typography variant="h6" fontWeight={600}>
                        Фильтры
                    </Typography>

                    <Button
                        size="small"
                        color="primary"
                        endIcon={
                            openFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />
                        }
                        onClick={() => setOpenFilters((p) => !p)}
                        sx={{ fontWeight: 500 }}
                    >
                        {openFilters ? 'Скрыть фильтры' : 'Показать фильтры'}
                    </Button>
                </Box>

                <Collapse in={openFilters} timeout="auto" unmountOnExit>
                    <Grid container spacing={2}>
                        {/* № замечания */}
                        <Grid item xs={12} sm={6} lg={4}>
                            <TextField
                                label="№ замечания"
                                type="number"
                                fullWidth
                                value={localFlt.id}
                                onChange={(e) =>
                                    setLocalF({ ...localFlt, id: e.target.value })
                                }
                            />
                        </Grid>

                        {/* Объект */}
                        <Grid item xs={12} sm={6} lg={4}>
                            <FormControl fullWidth>
                                <InputLabel>Объект</InputLabel>
                                <Select
                                    label="Объект"
                                    value={localFlt.unitId ?? ''}
                                    onChange={(e) =>
                                        setLocalF({
                                            ...localFlt,
                                            unitId:
                                                e.target.value === ''
                                                    ? undefined
                                                    : e.target.value
                                        })
                                    }
                                >
                                    <MenuItem value="">Все объекты</MenuItem>
                                    {units.map((u) => (
                                        <MenuItem key={u.id} value={u.id}>
                                            {u.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Статус */}
                        <Grid item xs={12} sm={6} lg={4}>
                            <FormControl fullWidth>
                                <InputLabel>Статус</InputLabel>
                                <Select
                                    label="Статус"
                                    value={localFlt.statusId}
                                    onChange={(e) =>
                                        setLocalF({
                                            ...localFlt,
                                            statusId: e.target.value
                                        })
                                    }
                                >
                                    <MenuItem value="">Все</MenuItem>
                                    <MenuItem value={1}>Открыт</MenuItem>
                                    <MenuItem value={2}>В работе</MenuItem>
                                    <MenuItem value={3}>Закрыт</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Кем добавлено */}
                        <Grid item xs={12} sm={6} lg={4}>
                            <FormControl fullWidth>
                                <InputLabel>Кем добавлено</InputLabel>
                                <Select
                                    label="Кем добавлено"
                                    value={localFlt.responsibleId}
                                    onChange={(e) =>
                                        setLocalF({
                                            ...localFlt,
                                            responsibleId: e.target.value
                                        })
                                    }
                                >
                                    <MenuItem value="">Все</MenuItem>
                                    <MenuItem value="uuid-1">Иван И.</MenuItem>
                                    <MenuItem value="uuid-2">Пётр С.</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Гарантия */}
                        <Grid item xs={12} sm={6} lg={4}>
                            <FormControl fullWidth>
                                <InputLabel>Гарантия</InputLabel>
                                <Select
                                    label="Гарантия"
                                    value={
                                        localFlt.isWarranty === undefined
                                            ? ''
                                            : localFlt.isWarranty
                                                ? 'yes'
                                                : 'no'
                                    }
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        setLocalF({
                                            ...localFlt,
                                            isWarranty:
                                                v === ''
                                                    ? undefined
                                                    : v === 'yes'
                                        });
                                    }}
                                >
                                    <MenuItem value="">Все</MenuItem>
                                    <MenuItem value="yes">Гарантийные</MenuItem>
                                    <MenuItem value="no">Негарантийные</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Apply / Reset */}
                        <Grid
                            item
                            xs={12}
                            lg={4}
                            sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}
                        >
                            <Button
                                variant="contained"
                                fullWidth
                                onClick={applyFilters}
                            >
                                Применить
                            </Button>
                            <Button
                                variant="outlined"
                                fullWidth
                                onClick={resetFilters}
                            >
                                Сбросить
                            </Button>
                        </Grid>
                    </Grid>
                </Collapse>
            </Paper>

            {/* Actions toolbar */}
            <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
                <Button
                    variant="contained"
                    startIcon={<RefreshIcon />}
                    onClick={() =>
                        queryClient.invalidateQueries({ queryKey: ['tickets'] })
                    }
                >
                    Обновить
                </Button>
                <Button
                    variant="outlined"
                    startIcon={<FileDownloadIcon />}
                    onClick={exportCsv}
                    disabled={!ticketsCount}
                >
                    Экспорт CSV
                </Button>
            </Box>

            {/* Table */}
            <Box className="tickets-table-wrapper">
                <Table className="tickets-table" size="small">
                    <TableHead sx={{ bgcolor: 'grey.100' }}>
                        <TableRow>
                            {[
                                ['created_at', 'Дата создания'],
                                ['unit_id', 'Объект'],
                                ['id', '№'],
                                ['status_id', 'Статус'],
                                ['responsible_user_id', 'Кем добавлено'],
                                ['received_at', 'Дата получения'],
                                ['is_warranty', 'Гарантия']
                            ].map(([field, label]) => (
                                <TableCell key={field} sx={{ whiteSpace: 'nowrap' }}>
                                    <TableSortLabel
                                        active={sort.field === field}
                                        direction={sortDir(field) || 'asc'}
                                        onClick={() => toggleSort(field)}
                                    >
                                        {label}
                                    </TableSortLabel>
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {isLoading ? (
                            [...Array(10)].map((_, i) => (
                                <TableRow key={i}>
                                    {Array.from({ length: 7 }).map((__, j) => (
                                        <TableCell key={j}>
                                            <Skeleton variant="text" width="100%" />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : tickets.length ? (
                            tickets.map((t) => (
                                <TableRow key={t.id} hover>
                                    <TableCell>
                                        {new Date(t.created_at).toLocaleString()}
                                    </TableCell>
                                    <TableCell>{t.unit_name}</TableCell>
                                    <TableCell>{t.id}</TableCell>
                                    <TableCell>{t.status_name}</TableCell>
                                    <TableCell>{t.responsible_name}</TableCell>
                                    <TableCell>
                                        {t.received_at
                                            ? new Date(
                                                t.received_at
                                            ).toLocaleDateString()
                                            : '—'}
                                    </TableCell>
                                    <TableCell>
                                        {t.is_warranty ? 'Да' : 'Нет'}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} align="center">
                                    Нет данных по выбранным условиям
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Box>

            {/* Snackbar ошибок */}
            <Snackbar
                open={sb.open}
                autoHideDuration={6000}
                onClose={() => setSb({ ...sb, open: false })}
            >
                <Alert
                    severity="error"
                    onClose={() => setSb({ ...sb, open: false })}
                    sx={{ width: '100%' }}
                >
                    {sb.msg}
                </Alert>
            </Snackbar>
        </Box>
    );
}
