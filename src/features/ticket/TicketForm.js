// src/features/ticket/TicketForm.js
// -------------------------------------------------------------
// Форма создания / регистрации замечания
// -------------------------------------------------------------
import React, { useState, useEffect, useCallback, useRef } from 'react';
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
    Typography,
    Box,
} from '@mui/material';
import {
    LocalizationProvider,
    DatePicker,
} from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import CloudUploadIcon   from '@mui/icons-material/CloudUpload';
import ErrorOutlineIcon  from '@mui/icons-material/ErrorOutline';

import { useProjects }       from '@/entities/project';
import { useUnitsByProject } from '@/entities/unit';
import { useTicketTypes }    from '@/entities/ticketType';
import { useTicketStatuses } from '@/entities/ticketStatus';
import { useAddTicket }      from '@/entities/ticket';

import { useNotify }         from '@/shared/hooks/useNotify';
import AttachmentPreviewList from './AttachmentPreviewList';

dayjs.locale('ru');

/* ---------- initial form state ---------- */
const defaultValues = {
    project_id : '',
    unit_id    : null,
    type_id    : '',
    status_id  : '',
    title      : '',
    description: '',
    is_warranty: false,
    received_at: dayjs(),
    fixed_at   : null,
};

export default function TicketForm() {
    const notify        = useNotify();
    const fileInputRef  = useRef(null);          // для очистки value

    /* ---------------- form ---------------- */
    const {
        control,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors, touchedFields, dirtyFields },
    } = useForm({ defaultValues, mode: 'onTouched' });

    /* ---------------- directories ---------------- */
    const { data: projects  = [], isLoading: projLoad, error: projErr } = useProjects();
    const { data: types     = [], isLoading: typeLoad, error: typeErr } = useTicketTypes();
    const { data: statuses  = [], isLoading: statLoad, error: statErr } = useTicketStatuses();

    const projectId = watch('project_id');
    const { data: units = [], isLoading: unitLoad, error: unitErr } =
        useUnitsByProject(projectId);

    useEffect(() => {
        projErr && notify.error(`Ошибка проектов: ${projErr.message}`);
        typeErr && notify.error(`Ошибка типов: ${typeErr.message}`);
        statErr && notify.error(`Ошибка статусов: ${statErr.message}`);
        unitErr && projectId && notify.error(`Ошибка объектов: ${unitErr.message}`);
    }, [projErr, typeErr, statErr, unitErr, projectId, notify]);

    /* ---------------- attachments ---------------- */
    const [files, setFiles] = useState([]);

    const appendFiles = useCallback((fileList) => {
        if (!fileList?.length) return;
        setFiles((prev) => {
            const map = new Map(prev.map((f) => [`${f.name}-${f.size}`, f]));
            Array.from(fileList).forEach((f) => map.set(`${f.name}-${f.size}`, f));
            return Array.from(map.values());
        });
        // разрешить повторно выбрать этот же файл
        if (fileInputRef.current) fileInputRef.current.value = '';
    }, []);

    const removeFile = useCallback(
        (idx) => setFiles((prev) => prev.filter((_, i) => i !== idx)),
        [],
    );

    /* ---------- default status («новое» или первый) ---------- */
    useEffect(() => {
        if (statuses.length && !watch('status_id') && !touchedFields.status_id) {
            const def = statuses.find((s) => s.name?.toLowerCase() === 'новое') ?? statuses[0];
            def && setValue('status_id', def.id, { shouldValidate: true });
        }
    }, [statuses, watch, touchedFields.status_id, setValue]);

    /* ---------------- mutation ---------------- */
    const { mutateAsync: addTicket, isPending: isAdding } = useAddTicket();

    const onSubmit = async (data) => {
        if (!data.project_id) { notify.error('Выберите проект'); return; }
        if (!data.unit_id)    { notify.error('Выберите объект'); return; }

        try {
            await addTicket({
                ...data,
                project_id : Number(data.project_id),
                unit_id    : Number(data.unit_id),
                type_id    : Number(data.type_id),
                status_id  : Number(data.status_id),
                is_warranty: !!data.is_warranty,
                received_at: dayjs(data.received_at).format('YYYY-MM-DD'),
                fixed_at   : data.fixed_at ? dayjs(data.fixed_at).format('YYYY-MM-DD') : null,
                attachments: files,
            });
            notify.success('Замечание сохранено');
            reset({ ...defaultValues, project_id: data.project_id });
            setFiles([]);
        } catch (e) {
            console.error(e);
            notify.error(`Ошибка: ${e.message}`);
        }
    };

    /* ---------- clear unit when project changes ---------- */
    useEffect(() => {
        if (dirtyFields.project_id) setValue('unit_id', null, { shouldValidate: true });
    }, [projectId, dirtyFields.project_id, setValue]);

    /* ====================== UI ====================== */
    return (
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
                {isAdding && (
                    <LinearProgress
                        sx={{ mb: 2, position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1201 }}
                    />
                )}

                <Stack spacing={3} sx={{ maxWidth: 720, mx: 'auto', p: { xs: 2, md: 3 } }}>
                    {/* -------- Проект -------- */}
                    {projLoad ? (
                        <Skeleton variant="rectangular" height={56} />
                    ) : (
                        <Controller
                            name="project_id"
                            control={control}
                            rules={{ required: 'Проект обязателен' }}
                            render={({ field }) => (
                                <Autocomplete
                                    {...field}
                                    options={projects}
                                    getOptionLabel={(p) => p?.name || ''}
                                    isOptionEqualToValue={(o, v) => o.id === v.id}
                                    value={projects.find((p) => p.id === field.value) || null}
                                    onChange={(_, v) => field.onChange(v?.id ?? '')}
                                    disabled={isAdding}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Проект"
                                            required
                                            error={!!errors.project_id}
                                            helperText={errors.project_id?.message}
                                        />
                                    )}
                                />
                            )}
                        />
                    )}

                    {/* -------- Объект -------- */}
                    {unitLoad && projectId ? (
                        <Skeleton variant="rectangular" height={56} />
                    ) : (
                        <Controller
                            name="unit_id"
                            control={control}
                            rules={{ required: 'Объект обязателен' }}
                            render={({ field }) => (
                                <Autocomplete
                                    {...field}
                                    options={units}
                                    getOptionLabel={(u) => u?.name || ''}
                                    isOptionEqualToValue={(o, v) => o.id === v.id}
                                    value={units.find((u) => u.id === field.value) || null}
                                    onChange={(_, v) => field.onChange(v?.id ?? null)}
                                    disabled={isAdding}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Объект"
                                            required
                                            error={!!errors.unit_id}
                                            helperText={errors.unit_id?.message}
                                        />
                                    )}
                                />
                            )}
                        />
                    )}

                    {/* -------- Дата получения -------- */}
                    <Controller
                        name="received_at"
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                            <DatePicker
                                {...field}
                                label="Дата получения"
                                format="DD.MM.YYYY"
                                disabled={isAdding}
                                slotProps={{ textField: { required: true, fullWidth: true } }}
                            />
                        )}
                    />

                    {/* -------- Дата устранения -------- */}
                    <Controller
                        name="fixed_at"
                        control={control}
                        render={({ field }) => (
                            <DatePicker
                                {...field}
                                label="Дата устранения (план/факт)"
                                format="DD.MM.YYYY"
                                disabled={isAdding}
                                slotProps={{ textField: { fullWidth: true } }}
                            />
                        )}
                    />

                    {/* -------- Тип -------- */}
                    {typeLoad ? (
                        <Skeleton variant="rectangular" height={56} />
                    ) : (
                        <Controller
                            name="type_id"
                            control={control}
                            rules={{ required: 'Тип обязателен' }}
                            render={({ field }) => (
                                <Autocomplete
                                    {...field}
                                    options={types}
                                    getOptionLabel={(t) => t?.name || ''}
                                    isOptionEqualToValue={(o, v) => o.id === v.id}
                                    value={types.find((t) => t.id === field.value) || null}
                                    onChange={(_, v) => field.onChange(v?.id ?? '')}
                                    disabled={isAdding}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Тип замечания"
                                            required
                                            error={!!errors.type_id}
                                            helperText={errors.type_id?.message}
                                        />
                                    )}
                                />
                            )}
                        />
                    )}

                    {/* -------- Статус -------- */}
                    {statLoad ? (
                        <Skeleton variant="rectangular" height={56} />
                    ) : (
                        <Controller
                            name="status_id"
                            control={control}
                            rules={{ required: 'Статус обязателен' }}
                            render={({ field }) => (
                                <Autocomplete
                                    {...field}
                                    options={statuses}
                                    getOptionLabel={(s) => s?.name || ''}
                                    isOptionEqualToValue={(o, v) => o.id === v.id}
                                    value={statuses.find((s) => s.id === field.value) || null}
                                    onChange={(_, v) => field.onChange(v?.id ?? '')}
                                    disabled={isAdding}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Статус"
                                            required
                                            error={!!errors.status_id}
                                            helperText={errors.status_id?.message}
                                        />
                                    )}
                                />
                            )}
                        />
                    )}

                    {/* -------- Гарантия -------- */}
                    <Controller
                        name="is_warranty"
                        control={control}
                        render={({ field }) => (
                            <FormControlLabel
                                control={<Switch {...field} checked={field.value} disabled={isAdding} />}
                                label="Гарантийный случай"
                            />
                        )}
                    />

                    {/* -------- Заголовок -------- */}
                    <Controller
                        name="title"
                        control={control}
                        render={({ field }) => (
                            <TextField {...field} label="Краткий текст" fullWidth disabled={isAdding} />
                        )}
                    />

                    {/* -------- Описание -------- */}
                    <Controller
                        name="description"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="Подробное описание"
                                multiline
                                rows={4}
                                fullWidth
                                disabled={isAdding}
                            />
                        )}
                    />

                    {/* -------- Files -------- */}
                    <Box sx={{ border: '1px dashed grey', p: 2, borderRadius: 1, textAlign: 'center' }}>
                        <Button
                            variant="outlined"
                            component="label"
                            startIcon={<CloudUploadIcon />}
                            disabled={isAdding}
                            fullWidth
                        >
                            Прикрепить файлы
                            <input
                                ref={fileInputRef}
                                hidden
                                multiple
                                type="file"
                                onChange={(e) => appendFiles(e.target.files)}
                            />
                        </Button>
                    </Box>

                    <AttachmentPreviewList files={files} onRemove={removeFile} />

                    {/* -------- Actions -------- */}
                    <Stack direction="row" justifyContent="flex-end" spacing={2}>
                        <Button
                            variant="outlined"
                            onClick={() => {
                                reset(defaultValues);
                                setFiles([]);
                            }}
                            disabled={isAdding}
                        >
                            Очистить
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={isAdding}
                            startIcon={isAdding && <CircularProgress size={18} color="inherit" />}
                        >
                            {isAdding ? 'Сохранение…' : 'Сохранить'}
                        </Button>
                    </Stack>

                    {/* -------- summary error -------- */}
                    {Object.keys(errors).length > 0 && !isAdding && (
                        <Typography
                            color="error"
                            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                        >
                            <ErrorOutlineIcon fontSize="small" /> Пожалуйста, исправьте ошибки формы
                        </Typography>
                    )}
                </Stack>
            </form>
        </LocalizationProvider>
    );
}
