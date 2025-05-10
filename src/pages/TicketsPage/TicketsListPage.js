// src/pages/TicketsListPage/TicketsListPage.js
//------------------------------------------------
import React from 'react';
import {
    Box,
    Stack,
    Paper,
    TextField,
    Tooltip,
    Typography,
    IconButton,
    CircularProgress,
    Autocomplete,
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    TableSortLabel,        // ⬅️ добавили
} from '@mui/material';
import {
    LocalizationProvider,
    DatePicker,
} from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';

import DownloadIcon from '@mui/icons-material/Download';

import { useTickets } from '@/entities/ticket';
import { useProjects } from '@/entities/project';
import { useTicketTypes } from '@/entities/ticketType';
import { useNotify } from '@/shared/hooks/useNotify';

dayjs.locale('ru');

/* ---------- литералы ---------- */
const warrantyOptions = [
    { id: 'all',   label: 'Все' },
    { id: 'true',  label: 'Да'  },
    { id: 'false', label: 'Нет' },
];

/* ---------- утилиты для сортировки ---------- */
function descendingComparator(a, b, orderBy) {
    if (b[orderBy] < a[orderBy]) return -1;
    if (b[orderBy] > a[orderBy]) return 1;
    return 0;
}
function getComparator(order, orderBy) {
    return order === 'desc'
        ? (a, b) => descendingComparator(a, b, orderBy)
        : (a, b) => -descendingComparator(a, b, orderBy);
}
function stableSort(array, comparator) {
    return array
        .map((el, idx) => [el, idx])
        .sort((a, b) => {
            const cmp = comparator(a[0], b[0]);
            if (cmp !== 0) return cmp;
            return a[1] - b[1];
        })
        .map((el) => el[0]);
}

/* ==================================================================== */

export default function TicketsListPage() {
    const notify = useNotify();

    /* -------- загрузка данных -------- */
    const {
        data: tickets = [],
        isLoading,
        isError,
        error,
    } = useTickets();
    const { data: projects = [] } = useProjects();
    const { data: types    = [] } = useTicketTypes();

    /* -------- фильтры -------- */
    const [dateFrom, setDateFrom] = React.useState(null);
    const [dateTo,   setDateTo]   = React.useState(null);
    const [project,  setProject]  = React.useState(null);
    const [type,     setType]     = React.useState(null);
    const [warranty, setWarranty] = React.useState('all');

    /* -------- сортировка -------- */
    const [orderBy, setOrderBy]   = React.useState('created');
    const [order,   setOrder]     = React.useState('desc');

    /* -------- snackbar при ошибке -------- */
    React.useEffect(() => {
        if (isError) notify.error(error.message);
    }, [isError, error, notify]);

    /* ------------------------------------------------------------------ */
    /*                        подготовка строк                            */
    /* ------------------------------------------------------------------ */
    const filteredTickets = React.useMemo(
        () =>
            tickets.filter((t) => {
                if (dateFrom && dayjs(t.created_at).isBefore(dateFrom, 'day')) return false;
                if (dateTo   && dayjs(t.created_at).isAfter (dateTo,   'day')) return false;
                if (project  && t.unit?.project?.id !== project.id)            return false;
                if (type     && t.type?.id          !== type.id)               return false;
                if (warranty !== 'all' && t.is_warranty !== (warranty === 'true')) return false;
                return true;
            }),
        [tickets, dateFrom, dateTo, project, type, warranty]
    );

    /** плоские строки для таблицы */
    const rawRows = React.useMemo(
        () =>
            filteredTickets.map((t) => ({
                id:       t.id,
                created:  t.created_at ?? t.created ?? null,
                project:  t.unit?.project?.name ?? '',
                unit:     t.unit?.name ?? '',
                type:     t.type?.name ?? '',
                status:   t.status?.name ?? t.status_id ?? '',
                warranty: t.is_warranty,
            })),
        [filteredTickets]
    );

    /* — отсортированные строки — */
    const rows = React.useMemo(
        () => stableSort(rawRows, getComparator(order, orderBy)),
        [rawRows, order, orderBy]
    );

    /* ------------------------------------------------------------------ */
    /*                            экспорт CSV                             */
    /* ------------------------------------------------------------------ */
    const handleExport = () => {
        const csv = [
            'Дата;Проект;Объект;ID;Тип;Статус;Гарантия',
            ...rows.map((r) =>
                [
                    r.created ? dayjs(r.created).format('DD.MM.YYYY HH:mm') : '',
                    r.project,
                    r.unit,
                    r.id,
                    r.type,
                    r.status,
                    r.warranty ? 'Да' : 'Нет',
                ].join(';')
            ),
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url;
        a.download = `tickets_${dayjs().format('YYYYMMDD_HHmm')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        notify.success('Экспорт завершён');
    };

    /* ------------------- обработчик заголовков ------------------- */
    const createSortHandler = (property) => () => {
        if (orderBy === property) {
            setOrder(order === 'asc' ? 'desc' : 'asc');
        } else {
            setOrderBy(property);
            setOrder('asc');
        }
    };

    /* ------------------------------------------------------------------ */
    /*                               UI                                   */
    /* ------------------------------------------------------------------ */
    return (
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
            <Stack spacing={3}>
                <Typography variant="h4" fontWeight={700}>
                    Перечень замечаний
                </Typography>

                {/* ---------------- панель фильтров ---------------- */}
                <Paper sx={{ p: 2 }}>
                    <Stack
                        direction={{ xs: 'column', md: 'row' }}
                        spacing={2}
                        useFlexGap
                        flexWrap="wrap"
                    >
                        {/* ...фильтры без изменений... */}
                        <DatePicker
                            label="Создано с"
                            value={dateFrom}
                            onChange={setDateFrom}
                            slotProps={{ textField: { size: 'small' } }}
                        />
                        <DatePicker
                            label="Создано по"
                            value={dateTo}
                            onChange={setDateTo}
                            slotProps={{ textField: { size: 'small' } }}
                        />
                        <Autocomplete
                            options={projects}
                            getOptionLabel={(o) => o.name}
                            isOptionEqualToValue={(o, v) => o.id === v.id}
                            value={project}
                            onChange={(_, v) => setProject(v)}
                            renderInput={(p) => (
                                <TextField {...p} label="Проект" size="small" />
                            )}
                            sx={{ minWidth: 200 }}
                        />
                        <Autocomplete
                            options={types}
                            getOptionLabel={(o) => o.name}
                            isOptionEqualToValue={(o, v) => o.id === v.id}
                            value={type}
                            onChange={(_, v) => setType(v)}
                            renderInput={(p) => (
                                <TextField {...p} label="Тип" size="small" />
                            )}
                            sx={{ minWidth: 200 }}
                        />
                        <Autocomplete
                            options={warrantyOptions}
                            getOptionLabel={(o) => o.label}
                            isOptionEqualToValue={(o, v) => o.id === v.id}
                            value={warrantyOptions.find((o) => o.id === warranty)}
                            onChange={(_, v) => setWarranty(v?.id ?? 'all')}
                            renderInput={(p) => (
                                <TextField {...p} label="Гарантия" size="small" />
                            )}
                            sx={{ minWidth: 160 }}
                        />
                        <Box flexGrow={1} />
                        <Tooltip title="Экспорт в CSV">
              <span>
                <IconButton onClick={handleExport} disabled={!rows.length}>
                  <DownloadIcon />
                </IconButton>
              </span>
                        </Tooltip>
                    </Stack>
                </Paper>

                {/* ---------------- таблица ---------------- */}
                <Paper sx={{ position: 'relative', maxHeight: 560 }}>
                    {isLoading ? (
                        <Stack
                            justifyContent="center"
                            alignItems="center"
                            sx={{ height: 560 }}
                        >
                            <CircularProgress />
                        </Stack>
                    ) : (
                        <TableContainer sx={{ maxHeight: 560 }}>
                            <Table stickyHeader size="small">
                                <TableHead>
                                    <TableRow>
                                        {/* ====== заголовки с сортировкой ====== */}
                                        {[
                                            { id: 'created',  label: 'Дата создания', align: 'left', min: 160 },
                                            { id: 'project',  label: 'Проект',         align: 'left', min: 180 },
                                            { id: 'unit',     label: 'Объект',         align: 'left', min: 160 },
                                            { id: 'id',       label: '№ замечания',    align: 'left', min: 130 },
                                            { id: 'type',     label: 'Тип',            align: 'left', min: 160 },
                                            { id: 'status',   label: 'Статус',         align: 'left', min: 140 },
                                            { id: 'warranty', label: 'Гарантия',       align: 'center', min: 110 },
                                        ].map((col) => (
                                            <TableCell
                                                key={col.id}
                                                sortDirection={orderBy === col.id ? order : false}
                                                sx={{ minWidth: col.min }}
                                                align={col.align}
                                            >
                                                <TableSortLabel
                                                    active={orderBy === col.id}
                                                    direction={orderBy === col.id ? order : 'asc'}
                                                    onClick={createSortHandler(col.id)}
                                                >
                                                    {col.label}
                                                </TableSortLabel>
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                </TableHead>

                                <TableBody>
                                    {rows.map((r, idx) => (
                                        <TableRow
                                            key={r.id}
                                            hover
                                            sx={{
                                                backgroundColor:
                                                    idx % 2 ? 'rgba(0,0,0,.02)' : 'inherit',
                                            }}
                                        >
                                            <TableCell>
                                                {r.created
                                                    ? dayjs(r.created).format('DD.MM.YYYY HH:mm')
                                                    : ''}
                                            </TableCell>
                                            <TableCell>{r.project}</TableCell>
                                            <TableCell>{r.unit}</TableCell>
                                            <TableCell>{r.id}</TableCell>
                                            <TableCell>{r.type}</TableCell>
                                            <TableCell>{r.status}</TableCell>
                                            <TableCell align="center">
                                                {r.warranty ? '✓' : '✕'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {!rows.length && (
                                        <TableRow>
                                            <TableCell colSpan={7} align="center">
                                                Нет данных
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Paper>
            </Stack>
        </LocalizationProvider>
    );
}
