// src/features/person/PersonForm.js
// -----------------------------------------------------------------------------
// Inline-форма добавления / редактирования физического лица
// -----------------------------------------------------------------------------
import React, { useMemo } from 'react';
import {
    Paper, Stack, Typography, TextField, MenuItem,
    Button, IconButton, CircularProgress, Skeleton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { useProjects }        from '@/entities/project';
import { useAddPerson, useUpdatePerson } from '@/entities/person';
import { useNotify }          from '@/shared/hooks/useNotify';

/* ------------------------------ validation ------------------------------ */

const schema = z.object({
    project_id: z.number({ invalid_type_error: 'Проект обязателен' }),
    full_name : z.string().min(3, 'Укажите ФИО'),
    phone     : z.string().optional(),
    email     : z
        .string()
        .email('Некорректный e-mail')
        .or(z.literal('').transform(() => undefined))
        .optional(),
});

/**
 * @param {{
 *   initialData?: {
 *     id:number,
 *     project_id:number,
 *     full_name:string,
 *     phone?:string|null,
 *     email?:string|null
 *   },
 *   onSuccess: () => void,
 *   onCancel: () => void
 * }} props
 */
export default function PersonForm({ initialData, onSuccess, onCancel }) {
    const isEdit = !!initialData;
    const notify = useNotify();

    const addMut = useAddPerson();
    const updMut = useUpdatePerson();

    const {
        data: projects = [],
        isPending: projLoading,
    } = useProjects();

    const defaults = useMemo(
        () =>
            initialData
                ? {
                    project_id: initialData.project_id,
                    full_name : initialData.full_name,
                    phone     : initialData.phone ?? '',
                    email     : initialData.email ?? '',
                }
                : {},
        [initialData],
    );

    const {
        control,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm({
        defaultValues: defaults,
        resolver: zodResolver(schema),
        mode: 'onTouched',
    });

    /* ------------------------------- submit ------------------------------- */
    const submit = async (values) => {
        const payload = {
            project_id: values.project_id,
            full_name : values.full_name.trim(),
            phone     : values.phone || null,
            email     : values.email || null,
        };

        try {
            if (isEdit) {
                await updMut.mutateAsync({ id: initialData.id, updates: payload });
                notify.success('Запись обновлена');
            } else {
                await addMut.mutateAsync(payload);
                notify.success('Физлицо добавлено');
            }
            onSuccess?.();
        } catch (e) {
            notify.error(e.message);
        }
    };

    /* --------------------------------  UI  -------------------------------- */
    return (
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
            <Stack direction="row" justifyContent="space-between" mb={2}>
                <Typography variant="h6">
                    {isEdit ? 'Редактировать физлицо' : 'Добавить физлицо'}
                </Typography>
                <IconButton onClick={onCancel} size="small">
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Stack>

            <form onSubmit={handleSubmit(submit)} noValidate>
                <Stack spacing={2}>
                    {/* project_id ---------------------------------------------------- */}
                    {projLoading ? (
                        <Skeleton variant="rectangular" height={56} />
                    ) : (
                        <Controller
                            control={control}
                            name="project_id"
                            render={({ field }) => (
                                <TextField
                                    {...field}
                                    select
                                    label="Проект *"
                                    error={!!errors.project_id}
                                    helperText={errors.project_id?.message}
                                    fullWidth
                                >
                                    {projects.map((p) => (
                                        <MenuItem key={p.id} value={p.id}>
                                            {p.name}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            )}
                        />
                    )}

                    {/* full_name ----------------------------------------------------- */}
                    <Controller
                        control={control}
                        name="full_name"
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="ФИО *"
                                error={!!errors.full_name}
                                helperText={errors.full_name?.message}
                                fullWidth
                            />
                        )}
                    />

                    {/* phone --------------------------------------------------------- */}
                    <Controller
                        control={control}
                        name="phone"
                        render={({ field }) => (
                            <TextField {...field} label="Телефон" fullWidth />
                        )}
                    />

                    {/* email --------------------------------------------------------- */}
                    <Controller
                        control={control}
                        name="email"
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="E-mail"
                                error={!!errors.email}
                                helperText={errors.email?.message}
                                fullWidth
                            />
                        )}
                    />

                    {/* actions ------------------------------------------------------- */}
                    <Stack direction="row" spacing={2} justifyContent="flex-end">
                        <Button onClick={onCancel}>Отмена</Button>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={isSubmitting}
                            startIcon={
                                isSubmitting && (
                                    <CircularProgress size={18} color="inherit" />
                                )
                            }
                        >
                            Сохранить
                        </Button>
                    </Stack>
                </Stack>
            </form>
        </Paper>
    );
}