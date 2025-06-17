import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Stack,
  TextField,
  DialogActions,
  Button,
  CircularProgress,
  MenuItem,
} from '@mui/material';
import { useVisibleProjects } from '@/entities/project';
import { useDefectTypes } from '@/entities/defectType';

interface FormValues {
  project_id: number | '';
  defect_type_id: number | '';
  fix_days: number | '';
}

interface Props {
  initialData?: { project_id?: number; defect_type_id?: number; fix_days?: number };
  onSubmit: (values: { project_id: number; defect_type_id: number; fix_days: number }) => void;
  onCancel: () => void;
}

export default function DefectDeadlineForm({ initialData, onSubmit, onCancel }: Props) {
  const { control, handleSubmit, formState: { isSubmitting } } = useForm<FormValues>({
    defaultValues: {
      project_id: initialData?.project_id ?? '',
      defect_type_id: initialData?.defect_type_id ?? '',
      fix_days: initialData?.fix_days ?? '',
    },
  });

  const { data: projects = [] } = useVisibleProjects();
  const { data: types = [] } = useDefectTypes();

  return (
    <form onSubmit={handleSubmit((v) => onSubmit({
      project_id: Number(v.project_id),
      defect_type_id: Number(v.defect_type_id),
      fix_days: Number(v.fix_days),
    }))} noValidate>
      <Stack spacing={2} sx={{ minWidth: 320 }}>
        <Controller
          name="project_id"
          control={control}
          rules={{ required: 'Проект обязателен' }}
          render={({ field, fieldState }) => (
            <TextField {...field} select label="Проект" fullWidth required error={!!fieldState.error} helperText={fieldState.error?.message}>
              {projects.map((p) => (
                <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
              ))}
            </TextField>
          )}
        />
        <Controller
          name="defect_type_id"
          control={control}
          rules={{ required: 'Тип дефекта обязателен' }}
          render={({ field, fieldState }) => (
            <TextField {...field} select label="Тип дефекта" fullWidth required error={!!fieldState.error} helperText={fieldState.error?.message}>
              {types.map((t) => (
                <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
              ))}
            </TextField>
          )}
        />
        <Controller
          name="fix_days"
          control={control}
          rules={{ required: 'Срок обязателен', min: { value: 1, message: 'Минимум 1 день' } }}
          render={({ field, fieldState }) => (
            <TextField {...field} type="number" label="Срок устранения (дни)" fullWidth required error={!!fieldState.error} helperText={fieldState.error?.message} />
          )}
        />
        <DialogActions sx={{ px: 0 }}>
          <Button onClick={onCancel}>Отмена</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting} startIcon={isSubmitting && <CircularProgress size={18} color="inherit" />}>
            Сохранить
          </Button>
        </DialogActions>
      </Stack>
    </form>
  );
}
