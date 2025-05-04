/* features/person/PersonForm.js */
import React from 'react';
import {
    Stack,
    TextField,
    MenuItem,
    Button,
    CircularProgress,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { useProjects } from '@entities/project';
import { useAddPerson, useUpdatePerson } from '@entities/person';
import { useNotify } from '@shared/hooks/useNotify';

/* схема валидации */
const schema = z.object({
    project_id: z.preprocess((v) => Number(v), z.number().int().positive('Выберите проект')),
    full_name : z.string().min(1, 'Обязательно'),
    phone     : z.union([z.literal(''), z.string().min(5)]).default(''),
    email     : z.union([z.literal(''), z.string().email('Неверный e-mail')]).default(''),
});

export default function PersonForm({ initialData, onSuccess, onCancel }) {
    const notify = useNotify();
    const isEdit = Boolean(initialData?.id);

    const add    = useAddPerson();
    const update = useUpdatePerson();

    const { data: projects = [] } = useProjects();

    const {
        control,
        handleSubmit,
        setError,
        reset,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            project_id: initialData?.project_id ?? '',
            full_name : initialData?.full_name  ?? '',
            phone     : initialData?.phone      ?? '',
            email     : initialData?.email      ?? '',
        },
        mode: 'onTouched',
    });

    const submit = async (raw) => {
        const data = { ...raw, project_id: Number(raw.project_id) };

        try {
            if (isEdit) {
                await update.mutateAsync({ id: initialData.id, updates: data });
                notify.success('Запись обновлена');
            } else {
                await add.mutateAsync(data);
                notify.success('Запись создана');
                reset({ ...data, full_name: '', phone: '', email: '' });
            }
            onSuccess?.();
        } catch (err) {
            if (/ФИО уже существует/i.test(err.message)) {    // CHANGE
                setError('full_name', {
                    type        : 'duplicate',
                    message     : 'Такое ФИО уже есть в этом проекте',
                    shouldFocus : true,
                });
            }
            notify.error(err.message);
        }
    };

    return (
        <form onSubmit={handleSubmit(submit)} noValidate>
            <Stack spacing={2} sx={{ maxWidth: 440 }}>
                {/* проект */}
                <Controller
                    name="project_id"
                    control={control}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            select
                            label="Проект"
                            required
                            fullWidth
                            autoComplete="off"
                            error={!!errors.project_id}
                            helperText={errors.project_id?.message}
                        >
                            {projects.map((p) => (
                                <MenuItem key={p.id} value={p.id}>
                                    {p.name}
                                </MenuItem>
                            ))}
                        </TextField>
                    )}
                />

                {/* ФИО, телефон, email */}
                {['full_name', 'phone', 'email'].map((f) => (
                    <Controller
                        key={f}
                        name={f}
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                id={`person-${f}`}
                                label={{
                                    full_name: 'ФИО',
                                    phone    : 'Телефон',
                                    email    : 'E-mail',
                                }[f]}
                                required={f === 'full_name'}
                                fullWidth
                                autoComplete="off"
                                error={!!errors[f]}
                                helperText={errors[f]?.message}
                            />
                        )}
                    />
                ))}

                <Stack direction="row" spacing={2} justifyContent="flex-end">
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={isSubmitting}
                        startIcon={isSubmitting && <CircularProgress size={18} />}
                    >
                        Сохранить
                    </Button>
                    <Button variant="text" onClick={onCancel} disabled={isSubmitting}>
                        Отмена
                    </Button>
                </Stack>
            </Stack>
        </form>
    );
}
