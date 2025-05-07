// src/features/ticket/TicketForm.js
// -------------------------------------------------------------
// Универсальная форма создания тикета с множественной загрузкой
// -------------------------------------------------------------
import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import {
    Stack,
    TextField,
    Button,
    CircularProgress,
    Autocomplete,
    Switch,
    FormControlLabel,
    Skeleton,
    LinearProgress,
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
import AttachmentPreviewList from './AttachmentPreviewList';

/* ---------- начальные значения формы ---------- */
const defaultValues = {
    project_id: '',
    unit_id: null,
    type_id: '',
    title: '',
    description: '',
    is_warranty: false,
    received_at: dayjs(),
};

dayjs.locale('ru');

export default function TicketForm() {
    const notify = useNotify();

    /* -------------------- react-hook-form -------------------- */
    const {
        control,
        handleSubmit,
        watch,
        reset,
        formState: { isSubmitting },
    } = useForm({ defaultValues, mode: 'onTouched' });

    /* ------------------- справочники ------------------- */
    const { data: projects = [], isLoading: projLoad } = useProjects();
    const { data: types = [], isLoading: typeLoad } = useTicketTypes();

    const projectId = watch('project_id');
    const { data: units = [], isLoading: unitLoad } = useUnitsByProject(projectId);

    /* ------------------- файлы (state) ------------------- */
    const [files, setFiles] = React.useState([]); // File[]

    const appendFiles = (fileList) => {
        // убираем дубликаты (по name+size)
        setFiles((prev) => {
            const map = new Map(prev.map((f) => [`${f.name}-${f.size}`, f]));
            Array.from(fileList).forEach((f) =>
                map.set(`${f.name}-${f.size}`, f),
            );
            return Array.from(map.values());
        });
    };

    const removeFile = (idx) =>
        setFiles((prev) => prev.filter((_, i) => i !== idx));

    /* ------------------- мутация ------------------- */
    const { mutateAsync: addTicket } = useAddTicket();

    const onSubmit = async (fields) => {
        if (!fields.project_id || !fields.unit_id) {
            notify.error('Выберите проект и объект');
            return;
        }

        try {
            await addTicket({
                project_id: Number(fields.project_id),
                unit_id: Number(fields.unit_id),
                type_id: Number(fields.type_id),
                is_warranty: !!fields.is_warranty,
                received_at: dayjs(fields.received_at).format('YYYY-MM-DD'),
                title: fields.title,
                description: fields.description,
                attachments: files, // ← передаём выбранные файлы
            });
            notify.success('Замечание сохранено');
            if (files.length) notify.success('Файл(ы) загружены');
            reset(defaultValues);
            setFiles([]);
        } catch (error) {
            notify.error(`Ошибка: ${error.message}`);
        }
    };

    /* =========================== UI =========================== */
    return (
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
                {isSubmitting && <LinearProgress sx={{ mb: 2 }} />}

                <Stack spacing={3} sx={{ maxWidth: 640 }}>
                    {/* ----- Проект ----- */}
                    {projLoad ? (
                        <Skeleton variant="rectangular" height={56} />
                    ) : (
                        <Controller
                            name="project_id"
                            control={control}
                            rules={{ required: true }}
                            render={({ field }) => (
                                <Autocomplete
                                    options={projects}
                                    getOptionLabel={(p) => p.name}
                                    isOptionEqualToValue={(o, v) => o.id === v.id}
                                    value={projects.find((p) => p.id === field.value) || null}
                                    onChange={(_, v) => field.onChange(v?.id ?? '')}
                                    renderInput={(params) => (
                                        <TextField {...params} label="Проект" required fullWidth />
                                    )}
                                />
                            )}
                        />
                    )}

                    {/* ----- Объект ----- */}
                    {unitLoad ? (
                        <Skeleton variant="rectangular" height={56} />
                    ) : (
                        <Controller
                            name="unit_id"
                            control={control}
                            rules={{ required: true }}
                            render={({ field }) => (
                                <Autocomplete
                                    options={units}
                                    getOptionLabel={(u) => u.name}
                                    isOptionEqualToValue={(o, v) => o.id === v.id}
                                    value={units.find((u) => u.id === field.value) || null}
                                    onChange={(_, v) => field.onChange(v?.id ?? null)}
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
                    )}

                    {/* ----- Дата получения ----- */}
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

                    {/* ----- Тип замечания ----- */}
                    {typeLoad ? (
                        <Skeleton variant="rectangular" height={56} />
                    ) : (
                        <Controller
                            name="type_id"
                            control={control}
                            rules={{ required: true }}
                            render={({ field }) => (
                                <Autocomplete
                                    options={types}
                                    getOptionLabel={(t) => t.name}
                                    isOptionEqualToValue={(o, v) => o.id === v.id}
                                    value={types.find((t) => t.id === field.value) || null}
                                    onChange={(_, v) => field.onChange(v?.id ?? '')}
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
                    )}

                    {/* ----- Гарантия ----- */}
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

                    {/* ----- Краткий текст ----- */}
                    <Controller
                        name="title"
                        control={control}
                        render={({ field }) => (
                            <TextField {...field} label="Краткий текст" fullWidth />
                        )}
                    />

                    {/* ----- Подробное описание ----- */}
                    <Controller
                        name="description"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="Описание"
                                multiline
                                rows={4}
                                fullWidth
                            />
                        )}
                    />

                    {/* ----- Файлы ----- */}
                    <Button variant="outlined" component="label">
                        Прикрепить файлы
                        <input
                            hidden
                            multiple
                            type="file"
                            accept="image/*,.pdf,.doc,.docx,.xlsx,.xls"
                            onChange={(e) => appendFiles(e.target.files)}
                        />
                    </Button>

                    {/* ----- Превью + удаление ----- */}
                    <AttachmentPreviewList files={files} onRemove={removeFile} />

                    {/* ----- Actions ----- */}
                    <Stack direction="row" justifyContent="flex-end">
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={isSubmitting}
                            startIcon={isSubmitting && <CircularProgress size={18} />}
                        >
                            Сохранить замечание
                        </Button>
                    </Stack>
                </Stack>
            </form>
        </LocalizationProvider>
    );
}
