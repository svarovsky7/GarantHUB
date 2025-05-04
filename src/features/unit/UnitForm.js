import React from 'react';
import {
    Stack, TextField, MenuItem, Button, CircularProgress,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { useProjects } from '../../entities/project';
import { usePersons  } from '../../entities/person';
import { useAddUnit, useUpdateUnit } from '../../entities/unit';
import { useNotify } from '../../shared/hooks/useNotify';

/* ----- схема ----- */
const schema = z.object({
    project_id: z.coerce.number().min(1, 'Обязательно'),
    person_id : z.union([z.literal(''), z.coerce.number().int()]).default(''),
    name      : z.string().min(1, 'Обязательно'),
    building  : z.coerce.string().optional(),
    section   : z.coerce.string().optional(),
    floor     : z.coerce.string().optional(),
});

export default function UnitForm({ initialData, onSuccess, onCancel }) {
    const notify = useNotify();
    const isEdit = Boolean(initialData?.id);

    const { data: projects = [] } = useProjects();
    const { data: persons  = [] } = usePersons();

    const add    = useAddUnit();
    const update = useUpdateUnit();

    const {
        control, handleSubmit, setError,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            project_id: initialData?.project_id?.toString() ?? '',
            person_id : initialData?.person_id?.toString()  ?? '',
            name      : initialData?.name      ?? '',
            building  : initialData?.building  ?? '',
            section   : initialData?.section   ?? '',
            floor     : initialData?.floor     ?? '',
        },
        mode: 'onTouched',
    });

    const submit = async (data) => {
        const payload = {
            ...data,
            project_id: Number(data.project_id),
            person_id : data.person_id === '' ? null : Number(data.person_id),
        };

        try {
            if (isEdit) {
                await update.mutateAsync({ id: initialData.id, updates: payload });
                notify.success('Объект обновлён');
            } else {
                await add.mutateAsync(payload);
                notify.success('Объект создан');
            }
            onSuccess?.();
        } catch (err) {
            if (/уже существует/i.test(err.message)) {
                ['project_id', 'name'].forEach((f) =>
                    setError(f, { type: 'duplicate', message: 'Дубликат', shouldFocus: true }),
                );
                ['project_id', 'name'].forEach((id) => {
                    const el = document.getElementById(`unit-${id}`);
                    el?.classList.remove('shake'); void el?.offsetWidth; el?.classList.add('shake');
                });
            }
            notify.error(err.message);
        }
    };

    return (
        <form onSubmit={handleSubmit(submit)} noValidate>
            <Stack spacing={2} sx={{ maxWidth: 420 }}>

                <Controller
                    name="project_id" control={control}
                    render={({ field }) => (
                        <TextField
                            {...field} select required fullWidth
                            id="unit-project_id"
                            label="Проект"
                            error={!!errors.project_id}
                            helperText={errors.project_id?.message}
                        >
                            <MenuItem value="">—</MenuItem>
                            {projects.map((p) => (
                                <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                            ))}
                        </TextField>
                    )}
                />

                <Controller
                    name="person_id" control={control}
                    render={({ field }) => (
                        <TextField {...field} select fullWidth label="Физическое лицо" id="unit-person_id">
                            <MenuItem value="">—</MenuItem>
                            {persons.map((pr) => (
                                <MenuItem key={pr.id} value={pr.id}>{pr.full_name}</MenuItem>
                            ))}
                        </TextField>
                    )}
                />

                <Controller
                    name="name" control={control}
                    render={({ field }) => (
                        <TextField
                            {...field} label="Квартира / Лот" required fullWidth id="unit-name"
                            error={!!errors.name} helperText={errors.name?.message}
                        />
                    )}
                />

                {['building', 'section', 'floor'].map((field) => (
                    <Controller
                        key={field} name={field} control={control}
                        render={({ field: f }) => (
                            <TextField {...f} label={{
                                building: 'Корпус', section: 'Секция', floor: 'Этаж',
                            }[field]} fullWidth />
                        )}
                    />
                ))}

                <Stack direction="row" spacing={2} justifyContent="flex-end">
                    <Button
                        type="submit" variant="contained" disabled={isSubmitting}
                        startIcon={isSubmitting && <CircularProgress size={18} />}
                    >
                        Сохранить
                    </Button>
                    <Button variant="text" onClick={onCancel} disabled={isSubmitting}>Отмена</Button>
                </Stack>
            </Stack>
        </form>
    );
}
