import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { DialogActions, Stack, TextField, Button, CircularProgress } from '@mui/material';

/**
 * @param {{
 *   initialData?: { id?: number, name?: string },
 *   onSubmit: (data: { name: string }) => void,
 *   onCancel: () => void
 * }} props
 */
export default function TicketTypeForm({ initialData, onSubmit, onCancel }) {
    const {
        control,
        handleSubmit,
        formState: { isSubmitting }
    } = useForm({
        defaultValues: {
            name: initialData?.name ?? '',
        },
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Stack spacing={2} sx={{ minWidth: 320 }}>
                <Controller
                    name="name"
                    control={control}
                    rules={{ required: 'Название обязательно' }}
                    render={({ field, fieldState }) => (
                        <TextField
                            {...field}
                            label="Название типа"
                            fullWidth
                            required
                            error={!!fieldState.error}
                            helperText={fieldState.error?.message}
                            autoFocus
                        />
                    )}
                />
                <DialogActions sx={{ px: 0 }}>
                    <Button onClick={onCancel}>Отмена</Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={isSubmitting}
                        startIcon={isSubmitting && <CircularProgress size={18} color="inherit" />}
                    >
                        Сохранить
                    </Button>
                </DialogActions>
            </Stack>
        </form>
    );
}
