import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
    Stack, TextField, Button, Snackbar,
    CircularProgress, MenuItem,
} from '@mui/material';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';

import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs }         from '@mui/x-date-pickers/AdapterDayjs';

import { useProjects }      from '../../entities/project';
import { useTicketTypes }   from '../../entities/ticketType';
import { useAddTicket }     from '../../entities/ticket';
import { useAddUnit }       from '../../entities/unit';              // CHANGE

dayjs.locale('ru');

/* ---------- defaults ---------- */
const defaultValues = {
    project_id : '',
    unit_name  : '',                                                // CHANGE
    type_id    : '',
    title      : '',
    description: '',
    files      : null,
};

export default function WarrantyTicketForm() {
    const {
        control, handleSubmit, watch, reset,
        formState: { isSubmitting },
    } = useForm({ defaultValues, mode: 'onTouched' });

    /* --- hooks --- */
    const addTicket = useAddTicket();
    const addUnit   = useAddUnit();                                  // CHANGE
    const { data: projects = [] } = useProjects();
    const { data: types    = [] } = useTicketTypes();

    const projectId = watch('project_id');

    /* ---------- submit ---------- */
    const onSubmit = async (raw) => {
        const { files, ...fields } = raw;

        if (!fields.project_id || !fields.unit_name) {
            alert('Выберите проект и введите название объекта');
            return;
        }

        /* 1. получаем / создаём объект */
        const { id: unit_id } = await addUnit.mutateAsync({
            name: fields.unit_name.trim(),
            project_id: Number(fields.project_id),
        });

        /* 2. сохраняем заявку */
        await addTicket.mutateAsync({
            project_id : Number(fields.project_id),
            unit_id,
            type_id    : Number(fields.type_id),
            title      : fields.title || fields.description?.slice(0, 120),
            description: fields.description,
            attachments: Array.from(files ?? []),
        });

        reset(defaultValues);
    };

    /* ---------- UI ---------- */
    return (
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <Stack spacing={3} sx={{ maxWidth: 640 }}>
                    {/* --- проект --- */}
                    <Controller
                        name="project_id" control={control} rules={{ required: true }}
                        render={({ field }) => (
                            <TextField {...field} select label="Проект" fullWidth required>
                                <MenuItem value="">—</MenuItem>
                                {projects.map(p => (
                                    <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                                ))}
                            </TextField>
                        )}
                    />

                    {/* --- объект вводом --- */}                         {/* CHANGE */}
                    <Controller
                        name="unit_name" control={control} rules={{ required: true }}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="Название объекта"
                                placeholder="Напр. Квартира 45"
                                fullWidth
                                required
                            />
                        )}
                    />

                    {/* --- тип --- */}
                    <Controller
                        name="type_id" control={control} rules={{ required: true }}
                        render={({ field }) => (
                            <TextField {...field} select label="Тип замечания" fullWidth required>
                                <MenuItem value="">—</MenuItem>
                                {types.map(t => (
                                    <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                                ))}
                            </TextField>
                        )}
                    />

                    {/* --- текст / описание --- */}
                    <Controller
                        name="title" control={control}
                        render={({ field }) => (
                            <TextField {...field} label="Краткий текст" multiline rows={2} fullWidth />
                        )}
                    />
                    <Controller
                        name="description" control={control}
                        render={({ field }) => (
                            <TextField {...field} label="Описание" multiline rows={3} fullWidth />
                        )}
                    />

                    {/* --- файлы --- */}
                    <Controller
                        name="files" control={control}
                        render={({ field }) => (
                            <Button variant="outlined" component="label">
                                Прикрепить файлы
                                <input hidden multiple type="file" onChange={(e) => field.onChange(e.target.files)} />
                            </Button>
                        )}
                    />

                    {/* --- actions --- */}
                    <Stack direction="row" justifyContent="flex-end">
                        <Button
                            type="submit" variant="contained" disabled={isSubmitting}
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
        </LocalizationProvider>
    );
}
