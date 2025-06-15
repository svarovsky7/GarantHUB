import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  DialogActions,
  Stack,
  TextField,
  Button,
  CircularProgress,
} from '@mui/material';
import { useAddBrigade, useUpdateBrigade } from '@/entities/brigade';
import { useNotify } from '@/shared/hooks/useNotify';

interface Props {
  initialData?: { id?: number; name?: string; description?: string | null } | null;
  onSuccess?: () => void;
  onCancel: () => void;
}

export default function BrigadeForm({ initialData = null, onSuccess, onCancel }: Props) {
  const notify = useNotify();
  const add = useAddBrigade();
  const update = useUpdateBrigade();
  const isEdit = !!initialData;
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      name: initialData?.name ?? '',
      description: initialData?.description ?? '',
    },
  });

  const submit = async (vals: { name: string; description?: string | null }) => {
    try {
      if (isEdit && initialData?.id) {
        await update.mutateAsync({ id: initialData.id, updates: vals });
        notify.success('Бригада обновлена');
      } else {
        await add.mutateAsync(vals);
        notify.success('Бригада создана');
        reset({ name: '', description: '' });
      }
      onSuccess?.();
    } catch (e: any) {
      notify.error(e.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} noValidate>
      <Stack spacing={2} sx={{ minWidth: 320 }}>
        <Controller
          name="name"
          control={control}
          rules={{ required: 'Название обязательно' }}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              label="Название бригады"
              fullWidth
              required
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
              autoFocus
            />
          )}
        />
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <TextField {...field} label="Описание" fullWidth multiline rows={2} />
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
