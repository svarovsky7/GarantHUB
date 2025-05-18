// src/features/ticketStatus/TicketStatusForm.js
import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Stack, TextField,
} from '@mui/material';

/**
 * @typedef {Object} TicketStatusFormProps
 * @property {Object} [initialData] начальные значения (edit-mode)
 * @property {(data:Object)=>void} onSubmit
 * @property {()=>void} onCancel
 */

/** Диалоговая форма статуса */
export default function TicketStatusForm({
                                             initialData,
                                             onSubmit,
                                             onCancel,
                                         }) {
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
        <Dialog open onClose={onCancel} fullWidth maxWidth="sm">
            <DialogTitle>
                {initialData ? 'Редактировать статус' : 'Создать статус'}
            </DialogTitle>

            <DialogContent dividers>
                <Stack spacing={2} sx={{ mt: 1 }}>
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
                </Stack>
            </DialogContent>

            <DialogActions>
                <Button onClick={onCancel}>Отмена</Button>
                <Button
                    variant="contained"
                    onClick={handleSubmit(onSubmit)}
                    disabled={isSubmitting}
                >
                    Сохранить
                </Button>
            </DialogActions>
        </Dialog>
    );
}
