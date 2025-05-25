import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { TextField, Stack, Select, MenuItem, Button, DialogActions } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import type { CaseStatus } from '@/shared/types/courtCase';

export interface CourtCaseFormValues {
  number: string;
  date: string | null;
  project_object: string;
  plaintiff: string;
  defendant: string;
  responsible_lawyer: string;
  status: CaseStatus;
  claim_amount: number | '';
  remediation_start_date: string | null;
  remediation_end_date: string | null;
  description: string;
}

interface Props {
  onSubmit: (values: CourtCaseFormValues) => void;
}

export default function CourtCaseForm({ onSubmit }: Props) {
  const { control, handleSubmit, reset } = useForm<CourtCaseFormValues>({
    defaultValues: {
      number: '',
      date: null,
      project_object: '',
      plaintiff: '',
      defendant: '',
      responsible_lawyer: '',
      status: 'active',
      claim_amount: '',
      remediation_start_date: null,
      remediation_end_date: null,
      description: '',
    },
  });

  const submit = (values: CourtCaseFormValues) => {
    onSubmit(values);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(submit)} noValidate>
      <Stack spacing={2}>
        <Controller
          name="number"
          control={control}
          rules={{ required: 'Номер обязателен' }}
          render={({ field, fieldState }) => (
            <TextField {...field} label="Номер дела" fullWidth required error={!!fieldState.error} helperText={fieldState.error?.message} />
          )}
        />
        <Controller
          name="date"
          control={control}
          rules={{ required: 'Дата обязательна' }}
          render={({ field, fieldState }) => (
            <DatePicker
              {...field}
              format="DD.MM.YYYY"
              value={field.value ? dayjs(field.value) : null}
              onChange={(d) => field.onChange(d ? d.format('YYYY-MM-DD') : null)}
              slotProps={{ textField: { fullWidth: true, required: true, error: !!fieldState.error, helperText: fieldState.error?.message } }}
            />
          )}
        />
        <Controller
          name="project_object"
          control={control}
          rules={{ required: 'Объект обязателен' }}
          render={({ field, fieldState }) => (
            <TextField {...field} label="Объект" fullWidth required error={!!fieldState.error} helperText={fieldState.error?.message} />
          )}
        />
        <Controller
          name="plaintiff"
          control={control}
          rules={{ required: 'Истец обязателен' }}
          render={({ field, fieldState }) => (
            <TextField {...field} label="Истец" fullWidth required error={!!fieldState.error} helperText={fieldState.error?.message} />
          )}
        />
        <Controller
          name="defendant"
          control={control}
          rules={{ required: 'Ответчик обязателен' }}
          render={({ field, fieldState }) => (
            <TextField {...field} label="Ответчик" fullWidth required error={!!fieldState.error} helperText={fieldState.error?.message} />
          )}
        />
        <Controller
          name="responsible_lawyer"
          control={control}
          rules={{ required: 'Юрист обязателен' }}
          render={({ field, fieldState }) => (
            <TextField {...field} label="Ответственный юрист" fullWidth required error={!!fieldState.error} helperText={fieldState.error?.message} />
          )}
        />
        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <Select {...field} fullWidth>
              <MenuItem value="active">В процессе</MenuItem>
              <MenuItem value="won">Выиграно</MenuItem>
              <MenuItem value="lost">Проиграно</MenuItem>
              <MenuItem value="settled">Урегулировано</MenuItem>
            </Select>
          )}
        />
        <Controller
          name="claim_amount"
          control={control}
          render={({ field }) => (
            <TextField {...field} label="Сумма иска" type="number" fullWidth />
          )}
        />
        <Controller
          name="remediation_start_date"
          control={control}
          render={({ field }) => (
            <DatePicker
              {...field}
              format="DD.MM.YYYY"
              value={field.value ? dayjs(field.value) : null}
              onChange={(d) => field.onChange(d ? d.format('YYYY-MM-DD') : null)}
              slotProps={{ textField: { fullWidth: true, label: 'Дата начала устранения' } }}
            />
          )}
        />
        <Controller
          name="remediation_end_date"
          control={control}
          render={({ field }) => (
            <DatePicker
              {...field}
              format="DD.MM.YYYY"
              value={field.value ? dayjs(field.value) : null}
              onChange={(d) => field.onChange(d ? d.format('YYYY-MM-DD') : null)}
              slotProps={{ textField: { fullWidth: true, label: 'Дата завершения устранения' } }}
            />
          )}
        />
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <TextField {...field} label="Описание дела" fullWidth multiline rows={3} />
          )}
        />
        <DialogActions sx={{ px: 0 }}>
          <Button type="submit" variant="contained">Добавить дело</Button>
        </DialogActions>
      </Stack>
    </form>
  );
}
