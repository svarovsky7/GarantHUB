// src/features/ticketStatus/TicketStatusForm.js
import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Stack, TextField, Button, DialogActions } from '@mui/material';

/**
 * @typedef {Object} TicketStatusFormProps
 * @property {Object} [initialData] начальные значения (edit-mode)
 * @property {(data:Object)=>void} onSubmit
 * @property {()=>void} onCancel
 */

/** Диалоговая форма статуса */
export default function TicketStatusForm({ initialData, onSubmit, onCancel }) {
    const {
        control,
        handleSubmit,
        formState: { isSubmitting },
    } = useForm({
        defaultValues: {
            name       : initialData?.name        ?? '',
            description: initialData?.description ?? '',
            color      : initialData?.color       ?? '#1976d2', // CHANGE
        },
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Stack spacing={2} sx={{ mt: 1, minWidth: 320 }}>
                <Controller
                    name="name"
                    control={control}
                    rules={{ required: 'Название обязательно' }}
                    render={({ field, fieldState }) => (
                        <TextField
                                {...field}
                                label="Название"
                                error={!!fieldState.error}
                                helperText={fieldState.error?.message}
                                fullWidth
                                autoFocus
                            />
                    )}
                />

                    <Controller
                        name="description"
                        control={control}
                        render={({ field }) => (
                            <TextField
                                {...field}
                                label="Описание"
                                multiline
                                rows={3}
                                fullWidth
                            />
                        )}
                    />

                <Controller
                    name="color"
                    control={control}
                    rules={{ required: 'Цвет обязателен' }}
                    render={({ field }) => (
                        <TextField
                            {...field}
                            label="Цвет статуса"
                            type="color"
                            fullWidth
                            inputProps={{ style: { height: 48, padding: 0 } }}
                        />
                    )}
                />
                <DialogActions sx={{ px: 0 }}>
                    <Button onClick={onCancel}>Отмена</Button>
                    <Button type="submit" variant="contained" disabled={isSubmitting}>
                        Сохранить
                    </Button>
                </DialogActions>
            </Stack>
        </form>
    );
}
