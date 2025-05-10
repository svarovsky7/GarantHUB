// src/pages/TicketsPage/TicketsListPage.js
// -------------------------------------------------------------
// Перечень замечаний: выровненные фильтры, таблица без горизонт. скролла,
// экспорт в Excel с поддержкой кириллицы (xlsx)
// -------------------------------------------------------------
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Grid,
    Stack,
    Paper,
    TextField,
    Typography,
    Button,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    TablePagination,
    Chip,
    Container,
} from '@mui/material';
import {
    LocalizationProvider,
    DatePicker,
} from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';

import AddIcon        from '@mui/icons-material/Add';
import DownloadIcon   from '@mui/icons-material/Download';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import FilterAltIcon  from '@mui/icons-material/FilterAlt';

import * as XLSX from 'xlsx';                       // NEW

import { useProjects }       from '@/entities/project';
import { useTicketTypes }    from '@/entities/ticketType';
import { useTicketStatuses } from '@/entities/ticketStatus';
import { useTickets }        from '@/entities/ticket';
import { useNotify }         from '@/shared/hooks/useNotify';

dayjs.locale('ru');

/* ---------- константы ---------- */
const warrantyOptions = [
    { id: 'all',  label: 'Все' },
    { id: true,   label: 'Да' },
    { id: false,  label: 'Нет' },
];

const headCells = [
    { id: 'received', label: 'Дата получения' },
    { id: 'fixed',    label: 'Дата устранения' },
    { id: 'project',  label: 'Проект' },
    { id: 'unit',     label: 'Объект' },
    { id: 'id',       label: '№' },
    { id: 'status',   label: 'Статус' },
    { id: 'warr',     label: 'Гарантия' },
    { id: 'author',   label: 'Кем добавлено' },
    { id: 'type',     label: 'Тип' },
];

/* ===================================================================== */

export default function TicketsListPage() {
    const nav   = useNavigate();
    const toast = useNotify();

    /* ---------- данные ---------- */
    const { data: tickets = [] }    = useTickets();
    const { data: projects = [] }   = useProjects();
    const { data: types = [] }      = useTicketTypes();
    const { data: statuses = [] }   = useTicketStatuses();

    /* ---------- фильтры ---------- */
    const [flt, setFlt] = useState({
        from: null, to: null, proj: '', unitQ: '',
        warr: 'all', stat: '', type: '', num: '',
    });

    const update = (k, v) =>
        setFlt((p) => ({ ...p, [k]: v?.target ? v.target.value : v }));

    const reset = () => setFlt({
        from: null, to: null, proj: '', unitQ: '',
        warr: 'all', stat: '', type: '', num: '',
    });

    /* ---------- подготовка строк ---------- */
    const rows = useMemo(() => tickets.map((t) => ({
        id      : t.id,
        received: t.received_at,
        fixed   : t.fixed_at ?? '—',
        project : t.unit?.project?.name ?? '—',
        unit    : t.unit?.name ?? '—',
        status  : t.status?.name ?? '—',
        warr    : t.is_warranty ? 'Да' : 'Нет',
        author  : t.profile?.name ?? '—',
        type    : t.type?.name ?? '—',
    })), [tickets]);

    const filtered = useMemo(() => rows.filter((r) => {
        if (flt.from && dayjs(r.received).isBefore(flt.from, 'day')) return false;
        if (flt.to   && dayjs(r.received).isAfter (flt.to,   'day')) return false;
        if (flt.proj && r.project !== flt.proj)             return false;
        if (flt.unitQ && !r.unit.toLowerCase().includes(flt.unitQ.toLowerCase())) return false;
        if (flt.warr !== 'all' && (flt.warr === 'true' ? 'Да' : 'Нет') !== r.warr) return false;
        if (flt.stat && r.status !== flt.stat)             return false;
        if (flt.type && r.type  !== flt.type)              return false;
        if (flt.num  && !r.id.toString().includes(flt.num))return false;
        return true;
    }), [rows, flt]);

    /* ---------- экспорт в Excel ---------- */
    const exportXlsx = () => {
        const wsData = [
            headCells.map((h) => h.label),
            ...filtered.map((r) => headCells.map((h) => r[h.id])),
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Tickets');

        /* автоширина столбцов */
        const colWidths = wsData[0].map((_, c) => ({
            wch: Math.max(...wsData.map((row) => (row[c]?.toString().length ?? 0))) + 2,
        }));
        ws['!cols'] = colWidths;

        const fileName = `tickets_${dayjs().format('YYYYMMDD_HHmm')}.xlsx`;
        XLSX.writeFile(wb, fileName, { bookType: 'xlsx', type: 'binary' });
        toast.success('Excel выгружен');
    };

    /* ============================= UI ============================= */
    return (
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
            <Container maxWidth={false} sx={{ py: 3 }}>
                <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
                    Перечень замечаний
                </Typography>

                {/* ------------------ Фильтры ------------------ */}
                <Paper sx={{ p: 3, mb: 4, borderRadius: 2 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12} md={2}>
                            <DatePicker
                                label="Дата от"
                                value={flt.from}
                                onChange={(v) => update('from', v)}
                                slotProps={{ textField: { size: 'small', fullWidth: true } }}
                            />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <DatePicker
                                label="Дата до"
                                value={flt.to}
                                onChange={(v) => update('to', v)}
                                slotProps={{ textField: { size: 'small', fullWidth: true } }}
                            />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextField
                                label="Проект"
                                size="small"
                                fullWidth
                                select
                                SelectProps={{ native: true }}
                                value={flt.proj}
                                onChange={(e) => update('proj', e.target.value)}
                            >
                                <option value="" />
                                {projects.map((p) => (
                                    <option key={p.id} value={p.name}>{p.name}</option>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextField
                                label="Объект (поиск)"
                                size="small"
                                fullWidth
                                value={flt.unitQ}
                                onChange={(e) => update('unitQ', e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextField
                                label="Гарантия"
                                size="small"
                                fullWidth
                                select
                                SelectProps={{ native: true }}
                                value={flt.warr}
                                onChange={(e) => update('warr', e.target.value)}
                            >
                                {warrantyOptions.map((o) => (
                                    <option key={o.id} value={o.id}>{o.label}</option>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextField
                                label="Номер"
                                size="small"
                                fullWidth
                                value={flt.num}
                                onChange={(e) => update('num', e.target.value)}
                            />
                        </Grid>

                        {/* ----- Вторая строка ----- */}
                        <Grid item xs={12} md={2}>
                            <TextField
                                label="Статус"
                                size="small"
                                fullWidth
                                select
                                SelectProps={{ native: true }}
                                value={flt.stat}
                                onChange={(e) => update('stat', e.target.value)}
                            >
                                <option value="" />
                                {statuses.map((s) => (
                                    <option key={s.id} value={s.name}>{s.name}</option>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextField
                                label="Тип"
                                size="small"
                                fullWidth
                                select
                                SelectProps={{ native: true }}
                                value={flt.type}
                                onChange={(e) => update('type', e.target.value)}
                            >
                                <option value="" />
                                {types.map((t) => (
                                    <option key={t.id} value={t.name}>{t.name}</option>
                                ))}
                            </TextField>
                        </Grid>
                    </Grid>

                    <Stack direction="row" spacing={2} sx={{ mt: 3 }} justifyContent="space-between">
                        <Stack direction="row" spacing={1}>
                            <Button variant="contained" startIcon={<FilterAltIcon />}>
                                Применить
                            </Button>
                            <Button variant="outlined" startIcon={<RestartAltIcon />} onClick={reset}>
                                Сбросить
                            </Button>
                        </Stack>
                        <Button
                            variant="contained"
                            color="success"
                            startIcon={<DownloadIcon />}
                            onClick={exportXlsx}              /* <-- NEW */
                            disabled={!filtered.length}
                        >
                            Excel
                        </Button>
                    </Stack>
                </Paper>

                {/* ------------------ Таблица ------------------ */}
                <Paper sx={{ p: 2, borderRadius: 2 }}>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
                        <Typography variant="h6">
                            Список&nbsp;
                            <Typography component="span" variant="subtitle2" color="text.secondary">
                                {filtered.length}
                            </Typography>
                        </Typography>
                        <Button variant="contained" startIcon={<AddIcon />} onClick={() => nav('/tickets/new')}>
                            Новое замечание
                        </Button>
                    </Stack>

                    <Table size="small" sx={{ width: '100%', tableLayout: 'fixed' }}>
                        <TableHead>
                            <TableRow>
                                {headCells.map((h) => (
                                    <TableCell key={h.id} sx={{ fontWeight: 600 }}>
                                        {h.label}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filtered.map((r) => (
                                <TableRow key={r.id} hover>
                                    <TableCell>{r.received}</TableCell>
                                    <TableCell>{r.fixed}</TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{r.project}</TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{r.unit}</TableCell>
                                    <TableCell>{r.id}</TableCell>
                                    <TableCell>{r.status}</TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            label={r.warr}
                                            size="small"
                                            color={r.warr === 'Да' ? 'info' : 'default'}
                                        />
                                    </TableCell>
                                    <TableCell>{r.author}</TableCell>
                                    <TableCell>{r.type}</TableCell>
                                </TableRow>
                            ))}
                            {!filtered.length && (
                                <TableRow>
                                    <TableCell colSpan={headCells.length} align="center" sx={{ py: 4 }}>
                                        Нет данных
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>

                    <TablePagination
                        rowsPerPageOptions={[10, 25, 50]}
                        component="div"
                        count={filtered.length}
                        rowsPerPage={10}
                        page={0}
                        onPageChange={() => {}}
                        onRowsPerPageChange={() => {}}
                        labelRowsPerPage="Строк на странице:"
                    />
                </Paper>
            </Container>
        </LocalizationProvider>
    );
}
