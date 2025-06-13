import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Stack, TextField, Button, DialogActions } from '@mui/material';

interface LetterStatusFormProps {
  initialData?: { name: string; color?: string | null } | null;
  onSubmit: (values: { name: string; color: string }) => void;
  onCancel: () => void;
}

export default function LetterStatusForm({ initialData, onSubmit, onCancel }: LetterStatusFormProps) {
  const { control, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: {
      name: initialData?.name ?? '',
      color: initialData?.color ?? '#1976d2',
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
