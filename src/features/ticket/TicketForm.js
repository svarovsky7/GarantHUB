// src/features/ticket/TicketForm.js
// -------------------------------------------------------------
// Форма создания / регистрации замечания
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

import { useProjects }          from '@/entities/project';
import { useUnitsByProject }    from '@/entities/unit';
import { useTicketTypes }       from '@/entities/ticketType';
import { useTicketStatuses }    from '@/entities/ticketStatus';
import { useAddTicket }         from '@/entities/ticket';

import { useNotify }            from '@/shared/hooks/useNotify';
import AttachmentPreviewList    from './AttachmentPreviewList';

/* ---------- init ---------- */
dayjs.locale('ru');

const defaultValues = {
    project_id : '',
    unit_id    : null,
    type_id    : '',
    status_id  : '',     // ← новый контрол
    title      : '',
    description: '',
    is_warranty: false,
    received_at: dayjs(),
    fixed_at   : null,
};

export default function TicketForm() {
    const notify = useNotify();

    /* ---- form ---- */
    const {
        control,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { isSubmitting },
    } = useForm({ defaultValues, mode: 'onTouched' });

    /* ---- directories ---- */
    const { data: projects  = [], isLoading: projLoad } = useProjects();
    const { data: types     = [], isLoading: typeLoad } = useTicketTypes();
    const { data: statuses  = [], isLoading: statLoad } = useTicketStatuses();

    const projectId = watch('project_id');
    const { data: units = [], isLoading: unitLoad } = useUnitsByProject(projectId);

    /* ---- attachments ---- */
    const [files, setFiles] = React.useState([]);

    const appendFiles = (fileList) =>
        setFiles((prev) => {
            const m = new Map(prev.map((f) => [`${f.name}-${f.size}`, f]));
            Array.from(fileList).forEach((f) =>
                m.set(`${f.name}-${f.size}`, f),
            );
            return Array.from(m.values());
        });

    const removeFile = (idx) =>
        setFiles((prev) => prev.filter((_, i) => i !== idx));

    /* ---- default status once loaded ---- */
    React.useEffect(() => {
        if (statuses.length && !watch('status_id')) {
            setValue('status_id', statuses[0].id, { shouldValidate: true });
        }
    }, [statuses, setValue, watch]);

    /* ---- mutation ---- */
    const { mutateAsync: addTicket } = useAddTicket();

    const onSubmit = async (fields) => {
        if (!fields.project_id || !fields.unit_id) {
            notify.error('Выберите проект и объект');
            return;
        }

        try {
            await addTicket({
                project_id : Number(fields.project_id),
                unit_id    : Number(fields.unit_id),
                type_id    : Number(fields.type_id),
                status_id  : Number(fields.status_id),
                is_warranty: !!fields.is_warranty,
                received_at: dayjs(fields.received_at).format('YYYY-MM-DD'),
                fixed_at   : fields.fixed_at
                    ? dayjs(fields.fixed_at).format('YYYY-MM-DD')
                    : null,
                title      : fields.title,
                description: fields.description,
                attachments: files,
            });
            notify.success('Замечание сохранено');
            reset(defaultValues);
            setFiles([]);
        } catch (e) {
            notify.error(`Ошибка: ${e.message}`);
        }
    };

    /* ====================== UI ====================== */
    return (
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
                {isSubmitting && <LinearProgress sx={{ mb: 2 }} />}

                <Stack spacing={3} sx={{ maxWidth: 640 }}>
                    {/* ---- Проект ---- */}
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

                    {/* ---- Объект ---- */}
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

                    {/* ---- Дата получения ---- */}
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

                    {/* ---- Дата устранения ---- */}
                    <Controller
                        name="fixed_at"
                        control={control}
                        render={({ field }) => (
                            <DatePicker
                                label="Дата устранения"
                                format="DD.MM.YYYY"
                                value={field.value}
                                onChange={(d) => field.onChange(d)}
                                slotProps={{ textField: { fullWidth: true } }}
                            />
                        )}
                    />

                    {/* ---- Тип ---- */}
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

                    {/* ---- Статус ---- */}
                    {statLoad ? (
                        <Skeleton variant="rectangular" height={56} />
                    ) : (
                        <Controller
                            name="status_id"
                            control={control}
                            rules={{ required: true }}
                            render={({ field }) => (
                                <Autocomplete
                                    options={statuses}
                                    getOptionLabel={(s) => s.name}
                                    isOptionEqualToValue={(o, v) => o.id === v.id}
                                    value={statuses.find((s) => s.id === field.value) || null}
                                    onChange={(_, v) => field.onChange(v?.id ?? '')}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Статус"
                                            required
                                            fullWidth
                                        />
                                    )}
                                />
                            )}
                        />
                    )}

                    {/* ---- Гарантия ---- */}
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

                    {/* ---- Заголовок ---- */}
                    <Controller
                        name="title"
                        control={control}
                        render={({ field }) => (
                            <TextField {...field} label="Краткий текст" fullWidth />
                        )}
                    />

                    {/* ---- Описание ---- */}
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

                    {/* ---- Файлы ---- */}
                    <Button variant="outlined" component="label">
                        Прикрепить файлы
                        <input
                            hidden
                            multiple
                            type="file"
                            accept="image/*,pdf,doc,docx,xlsx,xls"
                            onChange={(e) => appendFiles(e.target.files)}
                        />
                    </Button>

                    <AttachmentPreviewList files={files} onRemove={removeFile} />

                    {/* ---- Actions ---- */}
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
