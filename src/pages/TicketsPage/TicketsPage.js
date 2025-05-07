import React, { useState } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';

import {
    Box,
    Typography,
    Stack,
    Button,
    TextField,
    Autocomplete,
    FormControlLabel,
    Switch,
} from '@mui/material';
import {
    LocalizationProvider,
    DatePicker,
} from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

import { useProjects } from '@/entities/project';
import { useUnitsByProject } from '@/entities/unit';
import { useTicketTypes } from '@/entities/ticketType';
import { useAddTicket } from '@/entities/ticket';
import { useNotify } from '@/shared/hooks/useNotify';

dayjs.locale('ru');

export default function TicketsPage() {
    const notify = useNotify();

    // Справочники
    const { data: projects = [] } = useProjects();
    const { data: types = [] } = useTicketTypes();

    // Состояние фильтров формы
    const [filters, setFilters] = useState({
        project_id: '',
        unit_id: null,
        type_id: '',
        title: '',
        description: '',
        is_warranty: false,
        received_at: dayjs(),
        files: null,
    });

    // Единицы по выбранному проекту
    const { data: units = [] } = useUnitsByProject(filters.project_id);

    const addTicket = useAddTicket();

    const onSubmit = async (e) => {
        e.preventDefault();
        const f = filters;
        if (!f.project_id || !f.unit_id) {
            notify.error('Выберите проект и объект');
            return;
        }

        try {
            await addTicket.mutateAsync({
                project_id: Number(f.project_id),
                unit_id: Number(f.unit_id),
                type_id: Number(f.type_id),
                is_warranty: f.is_warranty,
                received_at: dayjs(f.received_at).format('YYYY-MM-DD'),
                title: f.title,
                description: f.description,
                attachments: Array.from(f.files ?? []),
            });
            notify.success('Замечание сохранено');
            setFilters((prev) => ({
                ...prev,
                unit_id: null,
                type_id: '',
                title: '',
                description: '',
                files: null,
            }));
        } catch (err) {
            notify.error(err.message);
        }
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
            <Box component="main" sx={{ maxWidth: 1140, mx: 'auto', py: 8, px: 3 }}>
                {/* Форма создания замечания */}
                <Box component="section" sx={{ mb: 5 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
                        Новое замечание
                    </Typography>
                    <Box component="form" onSubmit={onSubmit}>
                        <Stack spacing={2}>
                            {/* Проект */}
                            <Autocomplete
                                options={projects}
                                getOptionLabel={(p) => p.name}
                                isOptionEqualToValue={(o, v) => o.id === v.id}
                                value={projects.find((p) => p.id === filters.project_id) || null}
                                onChange={(_, v) =>
                                    setFilters((f) => ({
                                        ...f,
                                        project_id: v?.id || '',
                                        unit_id: null,
                                    }))
                                }
                                renderInput={(params) => (
                                    <TextField {...params} label="Проект" required />
                                )}
                            />

                            {/* Объект */}
                            <Autocomplete
                                options={units}
                                getOptionLabel={(u) => u.name}
                                isOptionEqualToValue={(o, v) => o.id === v.id}
                                value={units.find((u) => u.id === filters.unit_id) || null}
                                onChange={(_, v) =>
                                    setFilters((f) => ({
                                        ...f,
                                        unit_id: v?.id || null,
                                    }))
                                }
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Объект"
                                        required
                                        placeholder="Выберите объект"
                                    />
                                )}
                                filterOptions={(options, { inputValue }) =>
                                    options.filter((option) =>
                                        option.name.toLowerCase().includes(inputValue.toLowerCase())
                                    )
                                }
                            />

                            {/* Дата получения */}
                            <DatePicker
                                label="Дата получения"
                                format="DD.MM.YYYY"
                                value={filters.received_at}
                                onChange={(d) => setFilters((f) => ({ ...f, received_at: d }))}
                                slotProps={{ textField: { fullWidth: true, required: true } }}
                            />

                            {/* Тип замечания */}
                            <Autocomplete
                                options={types}
                                getOptionLabel={(t) => t.name}
                                isOptionEqualToValue={(o, v) => o.id === v.id}
                                value={types.find((t) => t.id === filters.type_id) || null}
                                onChange={(_, v) =>
                                    setFilters((f) => ({ ...f, type_id: v?.id || '' }))
                                }
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Тип замечания"
                                        required
                                        placeholder="Выберите тип"
                                    />
                                )}
                                filterOptions={(options, { inputValue }) =>
                                    options.filter((option) =>
                                        option.name.toLowerCase().includes(inputValue.toLowerCase())
                                    )
                                }
                            />

                            {/* Гарантия */}
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={filters.is_warranty}
                                        onChange={(e) =>
                                            setFilters((f) => ({
                                                ...f,
                                                is_warranty: e.target.checked,
                                            }))
                                        }
                                    />
                                }
                                label={filters.is_warranty ? 'Гарантия' : 'Не гарантия'}
                            />

                            {/* Краткий текст */}
                            <TextField
                                label="Краткий текст"
                                value={filters.title}
                                onChange={(e) =>
                                    setFilters((f) => ({ ...f, title: e.target.value }))
                                }
                                fullWidth
                            />

                            {/* Описание */}
                            <TextField
                                label="Описание"
                                value={filters.description}
                                onChange={(e) =>
                                    setFilters((f) => ({ ...f, description: e.target.value }))
                                }
                                fullWidth
                                multiline
                                rows={4}
                            />

                            {/* Файлы */}
                            <Button variant="outlined" component="label">
                                Прикрепить файлы
                                <input
                                    hidden
                                    multiple
                                    type="file"
                                    onChange={(e) =>
                                        setFilters((f) => ({ ...f, files: e.target.files }))
                                    }
                                />
                            </Button>

                            <Button type="submit" variant="contained" sx={{ width: 200 }}>
                                Сохранить
                            </Button>
                        </Stack>
                    </Box>
                </Box>
            </Box>
        </LocalizationProvider>
    );
}