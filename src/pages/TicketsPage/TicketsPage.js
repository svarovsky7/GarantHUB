import React, { useMemo, useState } from 'react';
import {
    Box, Select, MenuItem, TextField, Typography, Button,
    Table, TableHead, TableRow, TableCell, TableBody,
    InputLabel, FormControl,
} from '@mui/material';

import { useProjects }    from '../../entities/project';
import { useTicketTypes } from '../../entities/ticketType';
import { useTickets, useAddTicket } from '../../entities/ticket';  // единственный импорт из ticket
import { useAddUnit }      from '../../entities/unit';
import { useNotify }       from '../../shared/hooks/useNotify';

/* -------------------------------------------------- helpers */
const filterTickets = ({ tickets }) => tickets;

/* -------------------------------------------------- page */
export default function TicketsPage() {
    const notify = useNotify();

    /* directories */
    const { data: projects = [] } = useProjects();
    const { data: types    = [] } = useTicketTypes();
    const { data: raw      = [] } = useTickets();
    const tickets = useMemo(() => filterTickets({ tickets: raw }), [raw]);

    /* mutations */
    const addUnit   = useAddUnit();
    const addTicket = useAddTicket();

    /* local form state */
    const [form, setForm] = useState({
        project_id : '',
        unit_name  : '',
        type_id    : '',
        title      : '',
        description: '',
        files      : [],
    });

    /* ---------------- handlers */
    const handleChange = (field) => (e) =>
        setForm({ ...form, [field]: e.target.value });

    const handleFiles = (e) =>
        setForm({ ...form, files: Array.from(e.target.files ?? []) });

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!form.project_id || !form.unit_name) {
            notify.error('Выберите проект и введите объект');
            return;
        }

        try {
            /* unit */
            const { id: unit_id } = await addUnit.mutateAsync({
                name      : form.unit_name.trim(),
                project_id: Number(form.project_id),
            });

            /* ticket */
            await addTicket.mutateAsync({
                project_id : Number(form.project_id),
                unit_id,
                type_id    : Number(form.type_id) || null,
                title      : form.title,
                description: form.description,
                attachments: form.files,
            });

            notify.success('Замечание сохранено');

            /* reset */
            setForm({
                project_id : '',
                unit_name  : '',
                type_id    : '',
                title      : '',
                description: '',
                files      : [],
            });
        } catch (err) {
            notify.error(err.message);
        }
    };

    /* ---------------- render */
    return (
        <Box component="main" sx={{ maxWidth: 1140, mx: 'auto', py: 8, px: 3 }}>

            {/* ---------- Новое замечание ---------- */}
            <Box component="section" sx={{ mb: 5 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
                    Новое замечание
                </Typography>

                <Box
                    component="form"
                    onSubmit={onSubmit}
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(12, 1fr)',
                        columnGap: 3,
                        rowGap: 2,
                    }}
                >
                    {/* проект */}
                    <FormControl sx={{ gridColumn: 'span 12' }} required>
                        <InputLabel>Проект</InputLabel>
                        <Select
                            value={form.project_id}
                            label="Проект"
                            onChange={handleChange('project_id')}
                            fullWidth
                        >
                            {projects.map((p) => (
                                <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {/* объект */}
                    <TextField
                        placeholder="Наименование объекта"
                        value={form.unit_name}
                        onChange={handleChange('unit_name')}
                        fullWidth
                        required
                        sx={{ gridColumn: 'span 12' }}
                    />

                    {/* тип замечания */}
                    <FormControl sx={{ gridColumn: 'span 12' }} required>
                        <InputLabel>Тип замечания</InputLabel>
                        <Select
                            value={form.type_id}
                            label="Тип замечания"
                            onChange={handleChange('type_id')}
                            fullWidth
                        >
                            {types.map((t) => (
                                <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <TextField
                        placeholder="Краткий текст замечания"
                        value={form.title}
                        onChange={handleChange('title')}
                        fullWidth
                        sx={{ gridColumn: 'span 12' }}
                    />

                    <TextField
                        placeholder="Описание"
                        value={form.description}
                        onChange={handleChange('description')}
                        multiline rows={4}
                        fullWidth
                        sx={{ gridColumn: 'span 12' }}
                    />

                    {/* файлы */}
                    <Box sx={{ gridColumn: 'span 12' }}>
                        <input
                            id="attachments"
                            hidden
                            multiple
                            type="file"
                            onChange={handleFiles}
                        />
                        <label htmlFor="attachments">
                            <Button variant="outlined" component="span">
                                Прикрепить файлы
                            </Button>
                        </label>
                        <Typography variant="body2" sx={{ ml: 2, display: 'inline' }}>
                            {form.files.length ? `${form.files.length} файл(ов) выбрано` : ''}
                        </Typography>
                    </Box>

                    <Box sx={{ gridColumn: 'span 12', mt: 3 }}>
                        <Button type="submit" variant="contained" sx={{ width: 200 }}>
                            Сохранить
                        </Button>
                    </Box>
                </Box>
            </Box>

            {/* ---------- Таблица ---------- */}
            <Box component="section">
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
                    Все замечания
                </Typography>

                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell align="center">ID</TableCell>
                            <TableCell>Проект</TableCell>
                            <TableCell>Объект</TableCell>
                            <TableCell>Тип</TableCell>
                            <TableCell align="center">СтатусID</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {tickets.map((t) => (
                            <TableRow key={t.id}>
                                <TableCell align="center">{t.id}</TableCell>
                                <TableCell>{t.unit?.project?.name}</TableCell>
                                <TableCell>{t.unit?.name}</TableCell>
                                <TableCell>{t.type?.name}</TableCell>
                                <TableCell align="center">{t.status_id}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Box>
        </Box>
    );
}
