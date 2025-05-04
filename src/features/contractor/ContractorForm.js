import React from 'react';
import {
    Stack, TextField, Button, CircularProgress,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import {
    useAddContractor,
    useUpdateContractor,
} from '../../entities/contractor';
import { useNotify } from '../../shared/hooks/useNotify';

const schema = z.object({
    name : z.string().min(1, 'Обязательно'),
    inn  : z.string().min(5,  'Обязательно'),
    phone: z.union([z.literal(''), z.string().min(5)]).default(''),
    email: z.union([z.literal(''), z.string().email('Неверный e-mail')]).default(''),
});

export default function ContractorForm({ initialData, onSuccess, onCancel }) {
    const notify = useNotify();
    const isEdit = Boolean(initialData?.id);

    const add    = useAddContractor();
    const update = useUpdateContractor();

    const {
        control, handleSubmit, setError,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            name : initialData?.name  ?? '',
            inn  : initialData?.inn   ?? '',
            phone: initialData?.phone ?? '',
            email: initialData?.email ?? '',
        },
        mode: 'onTouched',
    });

    const submit = async (data) => {
        try {
            if (isEdit) {
                await update.mutateAsync({ id: initialData.id, updates: data });
                notify.success('Компания обновлена');
            } else {
                await add.mutateAsync({ ...data, is_individual: false });
                notify.success('Компания добавлена');
            }
            onSuccess?.();
        } catch (err) {
            if (/уже существует/i.test(err.message)) {
                ['name', 'inn'].forEach((f) =>
                    setError(f, { type: 'duplicate', message: 'Уже есть в базе', shouldFocus: true }),
                );
                ['name', 'inn'].forEach((id) => {
                    const el = document.getElementById(`contractor-${id}`);
                    el?.classList.remove('shake'); void el?.offsetWidth; el?.classList.add('shake');
                });
            }
            notify.error(err.message);
        }
    };

    return (
        <form onSubmit={handleSubmit(submit)} noValidate>
            <Stack spacing={2} sx={{ maxWidth: 420 }}>

                {['name', 'inn', 'phone', 'email'].map((field) => (
                    <Controller
                        key={field} name={field} control={control}
                        render={({ field: f }) => (
                            <TextField
                                {...f}
                                id={`contractor-${field}`}
                                label={{
                                    name : 'Название компании',
                                    inn  : 'ИНН',
                                    phone: 'Телефон',
                                    email: 'E-mail',
                                }[field]}
                                required={field === 'name' || field === 'inn'}
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
