import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Stack, TextField, Button, DialogActions } from '@mui/material';

interface Props {
  initialData?: { id?: number; name?: string };
  onSubmit: (values: { name: string }) => void;
  onCancel: () => void;
}

export default function DefectStatusForm({ initialData, onSubmit, onCancel }: Props) {
  const { control, handleSubmit, formState: { isSubmitting } } = useForm({
    defaultValues: { name: initialData?.name ?? '' },
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
              label="Название статуса"
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
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            Сохранить
          </Button>
        </DialogActions>
      </Stack>
    </form>
  );
}
