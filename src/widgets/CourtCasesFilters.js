import React from 'react';
import { Grid, TextField, MenuItem, FormControl, InputLabel, Select, Button, Paper } from '@mui/material';

const statusesRu = [
    { value: '', label: 'Все статусы' },
    { value: 'active', label: 'В процессе' },
    { value: 'won', label: 'Выиграно' },
    { value: 'lost', label: 'Проиграно' },
    { value: 'settled', label: 'Урегулировано' },
];

export default function CourtCasesFilters({ filters, setFilters, onReset }) {
    return (
        <Paper elevation={0} sx={{ mb: 2, p: 0, background: 'none' }}>
            <Grid container spacing={2} alignItems="end">
                <Grid item xs={12} sm={3}>
                    <FormControl fullWidth>
                        <InputLabel>Статус</InputLabel>
                        <Select
                            value={filters.status}
                            label="Статус"
                            onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
                        >
                            {statusesRu.map((s) => (
                                <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} sm={3}>
                    <TextField
                        label="Объект"
                        value={filters.unit}
                        onChange={(e) => setFilters(f => ({ ...f, unit: e.target.value }))}
                        fullWidth
                        placeholder="Фильтр по объекту"
                    />
                </Grid>
                <Grid item xs={12} sm={3}>
                    <TextField
                        label="Юрист"
                        value={filters.lawyer}
                        onChange={(e) => setFilters(f => ({ ...f, lawyer: e.target.value }))}
                        fullWidth
                        placeholder="Фильтр по юристу"
                    />
                </Grid>
                <Grid item xs={12} sm={3}>
                    <TextField
                        label="Поиск"
                        value={filters.search}
                        onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                        fullWidth
                        placeholder="Поиск по номеру, истцу, ответчику..."
                    />
                </Grid>
                <Grid item xs={12} sm={2}>
                    <Button fullWidth color="inherit" variant="outlined" sx={{ mt: { xs: 1, sm: 0 } }} onClick={onReset}>
                        Сброс
                    </Button>
                </Grid>
            </Grid>
        </Paper>
    );
}
