import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import { useQueryClient } from '@tanstack/react-query';

import {
    Stack,
    TextField,
    Button,
    Snackbar,
    CircularProgress,
    Autocomplete,
    Switch,
    FormControlLabel,
    Alert,
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

dayjs.locale('ru');

const defaultValues = {
    project_id: '',
    unit_id: null,
    type_id: '',
    title: '',
    description: '',
    is_warranty: false,
    received_at: dayjs(),
    files: null,
};

export default function TicketForm() {
    const queryClient = useQueryClient();
    const {
        control,
        handleSubmit,
        watch,
        reset,
        formState: { isSubmitting },
    } = useForm({ defaultValues, mode: 'onTouched' });

    /* directories */
    const addTicket = useAddTicket();
    const { data: projects = [] } = useProjects();
    const { data: types = [] } = useTicketTypes();

    /* units by selected project */
    const projectId = watch('project_id');
    const { data: units = [] } = useUnitsByProject(projectId);

    /* ---------- submit ---------- */
    const onSubmit = async (raw) => {
        const { files, ...fields } = raw;
        if (!fields.project_id || !fields.unit_id) {
            alert('Выберите проект и объект');
            return;
        }
        try {
            await addTicket.mutateAsync({
                project_id: Number(fields.project_id),
                unit_id: Number(fields.unit_id),
                type_id: Number(fields.type_id),
                is_warranty: !!fields.is_warranty,
                received_at: dayjs(fields.received_at).format('YYYY-MM-DD'),
                title: fields.title,
                description: fields.description,
                attachments: Array.from(files ?? []),
            });
            reset(defaultValues);
            queryClient.invalidateQueries(['tickets']);
        } catch (error) {
            alert(`Ошибка при добавлении: ${error.message}`);
        }
    };

    /* ---------- UI ---------- */
    return (
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <Stack spacing={3} sx={{ maxWidth: 640 }}>
                    {/* --- проект --- */}
                    <Controller
                        name="project_id"
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                            <Autocomplete
                                options={projects}
                                getOptionLabel={(p) => p.name}
                                isOptionEqualToValue={(o, v) => o.id === v.id}
                                onChange={(_, v) => field.onChange(v?.id ?? '')}
                                value={projects.find((p) => p.id === field.value) || null}
                                renderInput={(params) => (
                                    <TextField {...params} label="Проект" required fullWidth />
                                )}
                            />
                        )}
                    />

                    {/* --- объект --- */}
                    <Controller
                        name="unit_id"
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                            <Autocomplete
                                freeSolo
                                options={units}
                                getOptionLabel={(u) => u.name}
                                isOptionEqualToValue={(o, v) => o.id === v.id}
                                onChange={(_, v) => field.onChange(v?.id ?? null)}
                                value={units.find((u) => u.id === field.value) || null}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Объект"
                                        required
                                        fullWidth
                                        placeholder="Начните ввод…"
                                    />
                                )}
                            />
                        )}
                    />

                    {/* --- дата получения --- */}
                    <Controller
                        name="received_at"
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                            <DatePicker
                                label="Дата получения"
                                format="DD.MM.YYYY"
                                value={field.value}
                                onChange={(d) => field.onChange(d)}
                                slotProps={{ textField: { fullWidth: true, required: true } }}
                            />
                        )}
                    />

                    {/* --- тип --- */}
                    <Controller
                        name="type_id"
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                            <Autocomplete
                                freeSolo
                                options={types}
                                getOptionLabel={(t) => t.name}
                                isOptionEqualToValue={(o, v) => o.id === v.id}
                                onChange={(_, v) => field.onChange(v?.id ?? '')}
                                value={types.find((t) => t.id === field.value) || null}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Тип замечания"
                                        required
                                        fullWidth
                                        placeholder="Начните ввод…"
                                    />
                                )}
                            />
                        )}
                    />

                    {/* --- гарантия --- */}
                    <Controller
                        name="is_warranty"
                        control={control}
                        render={({ field }) => (
                            <FormControlLabel
                                control={<Switch {...field} checked={field.value} />}
                                label={field.value ? 'Гарантия' : 'Не гарантия'}
                            />
                        )}
                    />

                    {/* --- краткий текст / описание --- */}
                    <Controller
                        name="title"
                        control={control}
                        render={({ field }) => (
                            <TextField {...field} label="Краткий текст" fullWidth />
                        )}
                    />
                    <Controller
                        name="description"
                        control={control}
                        render={({ field }) => (
                            <TextField {...field} label="Описание" multiline rows={4} fullWidth />
                        )}
                    />

                    {/* --- файлы --- */}
                    <Controller
                        name="files"
                        control={control}
                        render={({ field }) => (
                            <Button variant="outlined" component="label">
                                Прикрепить файлы
                                <input
                                    hidden
                                    multiple
                                    type="file"
                                    onChange={(e) => field.onChange(e.target.files)}
                                />
                            </Button>
                        )}
                    />

                    {/* --- actions --- */}
                    <Stack direction="row" justifyContent="flex-end">
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={isSubmitting}
                            startIcon={isSubmitting && <CircularProgress size={18} />}
                        >
                            Добавить
                        </Button>
                    </Stack>
                </Stack>
            </form>

            <Snackbar
                open={addTicket.isSuccess}
                autoHideDuration={4000}
                message="Замечание сохранено"
                onClose={() => addTicket.reset()}
            />
            <Snackbar
                open={addTicket.isError}
                autoHideDuration={4000}
                onClose={() => addTicket.reset()}
            >
                <Alert severity="error" onClose={() => addTicket.reset()}>
                    Ошибка: {addTicket.error?.message || 'Неизвестная ошибка'}
                </Alert>
            </Snackbar>
        </LocalizationProvider>
    );
}