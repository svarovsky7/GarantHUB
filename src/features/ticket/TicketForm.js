// -----------------------------------------------------------------------------
// Форма создания / редактирования замечания
// Проект подставляется автоматически из useProjectId и не редактируется
// -----------------------------------------------------------------------------
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import {
    Stack, TextField, Switch, Button, Divider, Autocomplete,
    Typography, CircularProgress, Box,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate, useParams } from 'react-router-dom';

import { useUnitsByProject }   from '@/entities/unit';
import { useTicketTypes }      from '@/entities/ticketType';
import { useTicketStatuses }   from '@/entities/ticketStatus';
import { useCreateTicket, useTicket } from '@/entities/ticket';

import { useProjectId }        from '@/shared/hooks/useProjectId';   // CHANGE: текущий проект
import FileDropZone            from '@/shared/ui/FileDropZone';
import AttachmentPreviewList   from '@/shared/ui/AttachmentPreviewList';

/* ---------- validation ---------- */
const schema = yup.object({
    project_id  : yup.number().required(),
    unit_id     : yup.number().nullable(),
    type_id     : yup.number().required('Тип обязателен'),
    status_id   : yup.number().required('Статус обязателен'),
    title       : yup.string().trim().required('Заголовок обязателен').min(3),
    description : yup.string().trim().nullable(),
    is_warranty : yup.boolean().defined(),
    received_at : yup.mixed()
        .required('Дата получения обязательна')
        .test('is-dayjs', 'Некорректная дата', v => dayjs.isDayjs(v) && v.isValid()),
    fixed_at    : yup.mixed()
        .nullable()
        .test('is-dayjs-or-null', 'Некорректная дата', v => v === null || (dayjs.isDayjs(v) && v.isValid())),
}).required();

/* ---------- компонент ---------- */
export default function TicketForm() {
    const navigate   = useNavigate();
    const { ticketId } = useParams();
    const isEditMode = Boolean(ticketId);

    const projectId = useProjectId();                         // CHANGE: выбранный в шапке проект

    /* ---------- запросы ---------- */
    const { data: ticket,   isLoading: isLoadingTicket,
        updateAsync: updateTicket, updating: isUpdatingTicket } = useTicket(ticketId);

    const { data: types    = [], isLoading: isLoadingTypes    } = useTicketTypes();
    const { data: statuses = [], isLoading: isLoadingStatuses } = useTicketStatuses();
    const { data: units    = [], isLoading: isLoadingUnits    } = useUnitsByProject(projectId, !!projectId);

    /* ---------- RHF ---------- */
    const methods = useForm({
        resolver      : yupResolver(schema),
        defaultValues : {
            project_id  : projectId,                          // CHANGE: сразу записываем projectId
            unit_id     : null,
            type_id     : null,
            status_id   : null,
            title       : '',
            description : '',
            is_warranty : false,
            received_at : dayjs(),
            fixed_at    : null,
        },
    });
    const { control, reset, setValue, handleSubmit,
        formState: { errors, isSubmitting } } = methods;

    /* --- подгружаем данные билета в режимe редактирования ----------------- */
    useEffect(() => {
        if (isEditMode && ticket) {
            reset({
                project_id  : ticket.projectId,               // read-only, но нужен для валидации
                unit_id     : ticket.unitId ?? null,
                type_id     : ticket.typeId,
                status_id   : ticket.statusId,
                title       : ticket.title,
                description : ticket.description ?? '',
                is_warranty : ticket.isWarranty,
                received_at : ticket.receivedAt,
                fixed_at    : ticket.fixedAt,
            });
            setRemoteFiles(ticket.attachments ?? []);
        }
    }, [isEditMode, ticket, reset]);

    /* --- при переключении проекта в шапке обновляем скрытое поле ---------- */
    useEffect(() => {
        setValue('project_id', projectId);
    }, [projectId, setValue]);

    /* ---------- вложения ---------- */
    const [remoteFiles, setRemoteFiles] = useState([]);       // файлы уже на сервере
    const [newFiles,    setNewFiles]    = useState([]);       // новые файлы

    const handleDropFiles = useCallback((files) => {
        setNewFiles(prev => [...prev, ...files]);
    }, []);

    const handleRemoveNewFile    = (idx)   => setNewFiles(prev => prev.filter((_, i) => i !== idx));
    const handleRemoveRemoteFile = (id)    => setRemoteFiles(prev => prev.filter(f => f.id !== id));

    /* ---------- submit ---------- */
    const { mutateAsync: createTicket, isPending: isCreatingTicket } = useCreateTicket();

    const serialize = (data) => ({
        project_id  : data.project_id,
        unit_id     : data.unit_id ?? null,
        type_id     : data.type_id,
        status_id   : data.status_id,
        title       : data.title.trim(),
        description : data.description?.trim() || null,
        is_warranty : data.is_warranty,
        received_at : dayjs(data.received_at).format('YYYY-MM-DD'),
        fixed_at    : data.fixed_at ? dayjs(data.fixed_at).format('YYYY-MM-DD') : null,
    });

    const onSubmit = async (data) => {
        const dto = serialize(data);

        if (isEditMode) {
            const removedIds = ticket.attachments
                .filter(f => !remoteFiles.some(r => r.id === f.id))
                .map(f => f.id);

            await updateTicket({
                id: Number(ticketId),
                ...dto,
                newAttachments      : newFiles,
                removedAttachmentIds: removedIds,
            });
        } else {
            await createTicket({ ...dto, attachments: newFiles });
        }
        navigate('/tickets');
    };

    /* ---------- loaders ---------- */
    const isLoading = (isEditMode && isLoadingTicket) ||
        isLoadingTypes || isLoadingStatuses ||
        (!isEditMode && !projectId) ||
        (projectId && isLoadingUnits);

    if (isLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 240 }}>
                <CircularProgress />
            </Box>
        );
    }

    /* ---------- UI ---------- */
    return (
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
            <FormProvider {...methods}>
                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    <Stack spacing={3}>

                        {/* Unit ----------------------------------------------------------- */}
                        <Controller
                            name="unit_id"
                            control={control}
                            render={({ field, fieldState: { error } }) => (
                                <Autocomplete
                                    {...field}
                                    options={units}
                                    loading={isLoadingUnits}
                                    getOptionLabel={(o) => o?.name ?? ''}
                                    isOptionEqualToValue={(o, v) => o?.id === v?.id}
                                    onChange={(_, v) => field.onChange(v ? v.id : null)}
                                    value={units.find(u => u.id === field.value) || null}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Объект"
                                            error={!!error}
                                            helperText={error?.message}
                                            InputProps={{
                                                ...params.InputProps,
                                                endAdornment: (
                                                    <>
                                                        {isLoadingUnits && <CircularProgress size={20} />}
                                                        {params.InputProps.endAdornment}
                                                    </>
                                                ),
                                            }}
                                        />
                                    )}
                                />
                            )}
                        />

                        {/* Type ----------------------------------------------------------- */}
                        <Controller
                            name="type_id"
                            control={control}
                            render={({ field, fieldState: { error } }) => (
                                <Autocomplete
                                    {...field}
                                    options={types}
                                    loading={isLoadingTypes}
                                    getOptionLabel={(o) => o?.name ?? ''}
                                    isOptionEqualToValue={(o, v) => o?.id === v?.id}
                                    onChange={(_, v) => field.onChange(v ? v.id : null)}
                                    value={types.find(t => t.id === field.value) || null}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Тип замечания"
                                            required
                                            error={!!error}
                                            helperText={error?.message}
                                            InputProps={{
                                                ...params.InputProps,
                                                endAdornment: (
                                                    <>
                                                        {isLoadingTypes && <CircularProgress size={20} />}
                                                        {params.InputProps.endAdornment}
                                                    </>
                                                ),
                                            }}
                                        />
                                    )}
                                />
                            )}
                        />

                        {/* Status --------------------------------------------------------- */}
                        <Controller
                            name="status_id"
                            control={control}
                            render={({ field, fieldState: { error } }) => (
                                <Autocomplete
                                    {...field}
                                    options={statuses}
                                    loading={isLoadingStatuses}
                                    getOptionLabel={(o) => o?.name ?? ''}
                                    isOptionEqualToValue={(o, v) => o?.id === v?.id}
                                    onChange={(_, v) => field.onChange(v ? v.id : null)}
                                    value={statuses.find(s => s.id === field.value) || null}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Статус"
                                            required
                                            error={!!error}
                                            helperText={error?.message}
                                            InputProps={{
                                                ...params.InputProps,
                                                endAdornment: (
                                                    <>
                                                        {isLoadingStatuses && <CircularProgress size={20} />}
                                                        {params.InputProps.endAdornment}
                                                    </>
                                                ),
                                            }}
                                        />
                                    )}
                                />
                            )}
                        />

                        {/* Dates ---------------------------------------------------------- */}
                        <Controller
                            name="received_at"
                            control={control}
                            render={({ field, fieldState: { error } }) => (
                                <DatePicker
                                    label="Дата получения *"
                                    value={field.value}
                                    onChange={field.onChange}
                                    slotProps={{
                                        textField: { fullWidth: true, required: true, error: !!error, helperText: error?.message },
                                    }}
                                />
                            )}
                        />
                        <Controller
                            name="fixed_at"
                            control={control}
                            render={({ field, fieldState: { error } }) => (
                                <DatePicker
                                    label="Дата устранения"
                                    value={field.value}
                                    onChange={field.onChange}
                                    slotProps={{
                                        textField: { fullWidth: true, error: !!error, helperText: error?.message },
                                    }}
                                />
                            )}
                        />

                        {/* Warranty flag -------------------------------------------------- */}
                        <Controller
                            name="is_warranty"
                            control={control}
                            render={({ field }) => (
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <Switch {...field} checked={field.value} />
                                    <Typography onClick={() => field.onChange(!field.value)} sx={{ cursor: 'pointer' }}>
                                        Гарантийный случай
                                    </Typography>
                                </Stack>
                            )}
                        />

                        {/* Title / Description ------------------------------------------- */}
                        <Controller
                            name="title"
                            control={control}
                            render={({ field, fieldState: { error } }) => (
                                <TextField
                                    {...field}
                                    label="Краткое описание"
                                    required
                                    fullWidth
                                    error={!!error}
                                    helperText={error?.message}
                                />
                            )}
                        />
                        <Controller
                            name="description"
                            control={control}
                            render={({ field, fieldState: { error } }) => (
                                <TextField
                                    {...field}
                                    label="Подробное описание"
                                    multiline
                                    minRows={4}
                                    fullWidth
                                    error={!!error}
                                    helperText={error?.message}
                                />
                            )}
                        />

                        {/* Attachments ---------------------------------------------------- */}
                        <Divider />
                        <Typography variant="h6">Вложения</Typography>
                        <FileDropZone onFiles={handleDropFiles} />
                        <AttachmentPreviewList
                            remoteFiles={remoteFiles}
                            newFiles={newFiles}
                            onRemoveRemote={handleRemoveRemoteFile}
                            onRemoveNew={handleRemoveNewFile}
                        />

                        {/* Buttons -------------------------------------------------------- */}
                        <Stack direction="row" spacing={2} justifyContent="flex-end">
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={isSubmitting || isCreatingTicket || isUpdatingTicket}
                            >
                                {(isSubmitting || isCreatingTicket || isUpdatingTicket)
                                    ? <CircularProgress size={24} sx={{ color: 'white' }} />
                                    : isEditMode ? 'Сохранить' : 'Создать'}
                            </Button>
                            <Button
                                variant="outlined"
                                color="inherit"
                                onClick={() => navigate('/tickets')}
                                disabled={isSubmitting || isCreatingTicket || isUpdatingTicket}
                            >
                                Отмена
                            </Button>
                        </Stack>
                    </Stack>
                </form>
            </FormProvider>
        </LocalizationProvider>
    );
}