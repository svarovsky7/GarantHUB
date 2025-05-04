import React from 'react';
import {
    Stack, TextField, Button, CircularProgress,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { useAddPerson, useUpdatePerson } from '../../entities/person';
import { useNotify } from '../../shared/hooks/useNotify';

const schema = z.object({
    full_name: z.string().min(1, 'Обязательно'),
    phone: z.union([z.literal(''), z.string().min(5)]).default(''),
    email: z.union([z.literal(''), z.string().email('Неверный e-mail')]).default(''),
});

export default function PersonForm({ initialData, onSuccess, onCancel }) {
    const notify = useNotify();
    const isEdit = Boolean(initialData?.id);

    const add    = useAddPerson();
    const update = useUpdatePerson();

    const {
        control, handleSubmit, setError,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            full_name: initialData?.full_name ?? '',
            phone    : initialData?.phone     ?? '',
            email    : initialData?.email     ?? '',
        },
        mode: 'onTouched',
    });

    const submit = async (data) => {
        try {
            if (isEdit) {
                await update.mutateAsync({ id: initialData.id, updates: data });
                notify.success('Запись обновлена');
            } else {
                await add.mutateAsync(data);
                notify.success('Запись создана');
            }
            onSuccess?.();
        } catch (err) {
            if (/уже существует/i.test(err.message)) {
                setError('full_name', { type: 'duplicate', message: 'Такое ФИО уже есть', shouldFocus: true });
                const el = document.getElementById('person-full_name');
                el?.classList.remove('shake'); void el?.offsetWidth; el?.classList.add('shake');
            }
            notify.error(err.message);
        }
    };

    return (
        <form onSubmit={handleSubmit(submit)} noValidate>
            <Stack spacing={2} sx={{ maxWidth: 420 }}>

                {['full_name', 'phone', 'email'].map((field) => (
                    <Controller
                        key={field} name={field} control={control}
                        render={({ field: f }) => (
                            <TextField
                                {...f}
                                id={`person-${field}`}
                                label={{ full_name: 'ФИО', phone: 'Телефон', email: 'E-mail' }[field]}
                                required={field === 'full_name'}
                                error={!!errors[field]}
                                helperText={errors[field]?.message}
                                fullWidth
                            />
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
                    <Button variant="text" onClick={onCancel} disabled={isSubmitting}>
                        Отмена
                    </Button>
                </Stack>
            </Stack>
        </form>
    );
}
