import React from 'react';
import {
    Box,
    TextField,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Button,
} from '@mui/material';

const statusesRu = [
    { value: '', label: 'Все статусы' },
    { value: 'active', label: 'В процессе' },
    { value: 'won', label: 'Выиграно' },
    { value: 'lost', label: 'Проиграно' },
    { value: 'settled', label: 'Урегулировано' },
];

export default function CourtCasesFilters({ filters, setFilters, onReset }) {
    return (
        <Box className="filter-grid" sx={{ mb: 2 }}>
            <FormControl>
                <InputLabel>Статус</InputLabel>
                <Select
                    value={filters.status}
                    label="Статус"
                    onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                >
                    {statusesRu.map((s) => (
                        <MenuItem key={s.value} value={s.value}>
                            {s.label}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <TextField
                label="Объект"
                value={filters.unit}
                onChange={(e) => setFilters((f) => ({ ...f, unit: e.target.value }))}
                placeholder="Фильтр по объекту"
            />

            <TextField
                label="Юрист"
                value={filters.lawyer}
                onChange={(e) => setFilters((f) => ({ ...f, lawyer: e.target.value }))}
                placeholder="Фильтр по юристу"
            />

            <TextField
                label="Поиск"
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                placeholder="Поиск по номеру, истцу, ответчику..."
            />

            <Button color="inherit" variant="outlined" onClick={onReset}>
                Сброс
            </Button>
        </Box>
    );
}
