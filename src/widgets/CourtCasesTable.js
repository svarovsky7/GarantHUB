import React, { useMemo } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Button, Chip, Skeleton, Tooltip, Stack
} from '@mui/material';
import { Delete, Visibility } from '@mui/icons-material';

// Статус Chip
const getStatusChip = (status) => {
    switch (status) {
        case 'active': return <Chip label="В процессе" color="warning" size="small" />;
        case 'won': return <Chip label="Выиграно" color="success" size="small" />;
        case 'lost': return <Chip label="Проиграно" color="error" size="small" />;
        case 'settled': return <Chip label="Урегулировано" color="info" size="small" />;
        default: return <Chip label={status || "—"} size="small" />;
    }
};
const formatDate = (dateStr) => dateStr ? new Date(dateStr).toLocaleDateString('ru-RU') : '';
const formatSum = (val) => val ? `${Number(val).toLocaleString('ru-RU')} ₽` : '-';

// Фильтрация/сортировка через dataSource, если нужно
export default function CourtCasesTable({ rows, loading, onView, onDelete }) {
    if (loading) return <Skeleton variant="rectangular" height={350} sx={{ my: 3 }} />;
    return (
        <TableContainer>
            <Table size="medium">
                <TableHead>
                    <TableRow sx={{ backgroundColor: '#f3f4f6' }}>
                        <TableCell>№ дела</TableCell>
                        <TableCell>Дата</TableCell>
                        <TableCell>Объект</TableCell>
                        <TableCell>Истец</TableCell>
                        <TableCell>Ответчик</TableCell>
                        <TableCell>Юрист</TableCell>
                        <TableCell>Статус</TableCell>
                        <TableCell>Сумма иска</TableCell>
                        <TableCell align="right">Действия</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {rows.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={9} align="center" sx={{ color: '#888' }}>
                                Нет данных для отображения
                            </TableCell>
                        </TableRow>
                    ) : (
                        rows.map(row => (
                            <TableRow
                                key={row.id}
                                hover
                                sx={{ '&:hover': { backgroundColor: '#f1f5fa' }, transition: 'background 0.2s' }}
                            >
                                <TableCell>{row.internal_no || row.number}</TableCell>
                                <TableCell>{formatDate(row.date)}</TableCell>
                                <TableCell>{row.unit_name || row.projectObject}</TableCell>
                                <TableCell>{row.plaintiff}</TableCell>
                                <TableCell>{row.defendant}</TableCell>
                                <TableCell>{row.lawyer_name || row.responsibleLawyer}</TableCell>
                                <TableCell>{getStatusChip(row.status)}</TableCell>
                                <TableCell>{formatSum(row.claimAmount)}</TableCell>
                                <TableCell align="right">
                                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                                        <Tooltip title="Просмотр">
                                            <Button
                                                onClick={() => onView(row)}
                                                size="small"
                                                variant="contained"
                                                color="primary"
                                                sx={{ minWidth: 36, borderRadius: 2 }}
                                            >
                                                <Visibility />
                                            </Button>
                                        </Tooltip>
                                        <Tooltip title="Удалить">
                                            <Button
                                                onClick={() => onDelete(row.id)}
                                                size="small"
                                                variant="contained"
                                                color="error"
                                                sx={{ minWidth: 36, borderRadius: 2 }}
                                            >
                                                <Delete />
                                            </Button>
                                        </Tooltip>
                                    </Stack>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
