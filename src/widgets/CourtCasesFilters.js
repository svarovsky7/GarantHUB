import React from 'react';
import { Grid, TextField, MenuItem, FormControl, InputLabel, Select } from '@mui/material';

const statusesRu = [
    { value: '', label: 'Все статусы' },
    { value: 'active', label: 'В процессе' },
    { value: 'won', label: 'Выиграно' },
    { value: 'lost', label: 'Проиграно' },
    { value: 'closed', label: 'Закрыто' },
];

export default function CourtCasesFilters({ filters, setFilters }) {
    return (
        <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                    <InputLabel>Статус дела</InputLabel>
                    <Select
                        value={filters.status}
                        label="Статус дела"
                        onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                    >
                        {statusesRu.map((s) => (
                            <MenuItem key={s.value} value={s.value}>
                                {s.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
                <TextField
                    fullWidth
                    size="small"
                    label="Объект"
                    value={filters.unit}
                    onChange={(e) => setFilters((f) => ({ ...f, unit: e.target.value }))}
                    placeholder="Фильтр по объекту"
                />
            </Grid>
            <Grid item xs={12} md={3}>
                <TextField
                    fullWidth
                    size="small"
                    label="Ответственный юрист"
                    value={filters.lawyer}
                    onChange={(e) => setFilters((f) => ({ ...f, lawyer: e.target.value }))}
                    placeholder="Фильтр по юристу"
                />
            </Grid>
            <Grid item xs={12} md={4}>
                <TextField
                    fullWidth
                    size="small"
                    type="search"
                    label="Поиск"
                    value={filters.search}
                    onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                    placeholder="Поиск по номеру, истцу, ответчику…"
                />
            </Grid>
        </Grid>
    );
}
