/**
 * Форма контрагента.
 * Блокирует дубль по (Название + ИНН).
 */
import React from 'react';
import {
    Stack,
    TextField,
    Button,
    CircularProgress,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import {
    useAddContractor,
    useUpdateContractor,
} from '@/entities/contractor';
import { useNotify } from '@/shared/hooks/useNotify';

const schema = z.object({
    name : z.string().trim().min(1, 'Обязательно'),
    inn  : z.string().trim().min(10, 'Мин. 10 символов'),
    phone: z.string().trim().optional(),
    email: z.union([z.literal(''), z.string().email('Неверный e-mail')]),
    comment: z.string().trim().optional(),
});

export default function ContractorForm({
                                           initialData = null,
                                           onSuccess,
                                           onCancel,
                                       }) {
    const notify = useNotify();
    const add    = useAddContractor();
    const update = useUpdateContractor();
    const isEdit = !!initialData;

    const {
        control,
        handleSubmit,
        setError,
        reset,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues: {
            name   : initialData?.name    ?? '',
            inn    : initialData?.inn     ?? '',
            phone  : initialData?.phone   ?? '',
            email  : initialData?.email   ?? '',
            comment: initialData?.comment ?? '',
        },
    });

    const submit = async (raw) => {
        const vals = { ...raw, name: raw.name.trim() };
        try {
            if (isEdit) {
                await update.mutateAsync({ id: initialData.id, updates: vals });
                notify.success('Контрагент обновлён');
            } else {
                await add.mutateAsync(vals);
                notify.success('Контрагент создан');
                reset({ ...vals, name: '', inn: '' }); // очистка ключевых
            }
            onSuccess?.();
        } catch (err) {
            if (/Компания с таким/i.test(err.message)) {
                (['name', 'inn'] as const).forEach((f) =>
                    setError(f, { type: 'duplicate', message: 'Пара уже занята' }),
                );
            }
            notify.error(err.message);
        }
    };

    const fields = ['name', 'inn', 'phone', 'email', 'comment'] as const;

    return (
        <form onSubmit={handleSubmit(submit)} noValidate>
            <Stack spacing={2} sx={{ maxWidth: 480 }}>
                {fields.map((f) => (
                    <Controller
                        key={f}
                        name={f}
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label={{
                                    name   : 'Название компании *',
                                    inn    : 'ИНН *',
                                    phone  : 'Телефон',
                                    email  : 'E-mail',
                                    comment: 'Комментарий',
                                }[f]}
                                required={['name', 'inn'].includes(f)}
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
