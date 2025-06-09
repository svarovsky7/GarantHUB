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
  defaultValues: CourtCaseFormValues;
  /** Если true, форма отображается только для чтения */
  disabled?: boolean;
  onSubmit?: (values: CourtCaseFormValues) => void;
  onClose?: () => void; // для интеграции с модалкой (кнопка "Закрыть" опционально)
}

export default function CourtCaseForm({
                                        defaultValues,
                                        disabled = false,
                                        onSubmit,
                                        onClose,
                                      }: Props) {
  const { control, handleSubmit, reset } = useForm<CourtCaseFormValues>({
    defaultValues,
  });

  const submit = (values: CourtCaseFormValues) => {
    if (onSubmit) {
      onSubmit(values);
      reset();
    }
  };

  return (
      <form onSubmit={handleSubmit(submit)} noValidate>
        <Stack spacing={2}>
          <Controller
              name="number"
              control={control}
              rules={{ required: 'Номер обязателен' }}
              render={({ field, fieldState }) => (
                  <TextField
                      {...field}
                      label="Номер дела"
                      fullWidth
                      required
                      disabled={disabled}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                  />
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
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          required: true,
                          disabled,
                          error: !!fieldState.error,
                          helperText: fieldState.error?.message,
                        },
                      }}
                  />
              )}
          />
          <Controller
              name="project_object"
              control={control}
              rules={{ required: 'Объект обязателен' }}
              render={({ field, fieldState }) => (
                  <TextField
                      {...field}
                      label="Объект"
                      fullWidth
                      required
                      disabled={disabled}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                  />
              )}
          />
          <Controller
              name="plaintiff"
              control={control}
              rules={{ required: 'Истец обязателен' }}
              render={({ field, fieldState }) => (
                  <TextField
                      {...field}
                      label="Истец"
                      fullWidth
                      required
                      disabled={disabled}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                  />
              )}
          />
          <Controller
              name="defendant"
              control={control}
              rules={{ required: 'Ответчик обязателен' }}
              render={({ field, fieldState }) => (
                  <TextField
                      {...field}
                      label="Ответчик"
                      fullWidth
                      required
                      disabled={disabled}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                  />
              )}
          />
          <Controller
              name="responsible_lawyer"
              control={control}
              rules={{ required: 'Юрист обязателен' }}
              render={({ field, fieldState }) => (
                  <TextField
                      {...field}
                      label="Ответственный юрист"
                      fullWidth
                      required
                      disabled={disabled}
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                  />
              )}
          />
          <Controller
              name="status"
              control={control}
              render={({ field }) => (
                  <Select {...field} fullWidth disabled={disabled}>
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
                  <TextField {...field} label="Сумма иска" type="number" fullWidth disabled={disabled} />
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
                      slotProps={{ textField: { fullWidth: true, label: 'Дата начала устранения', disabled } }}
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
                      slotProps={{ textField: { fullWidth: true, label: 'Дата завершения устранения', disabled } }}
                  />
              )}
          />
          <Controller
              name="description"
              control={control}
              render={({ field }) => (
                  <TextField {...field} label="Описание дела" fullWidth multiline rows={3} disabled={disabled} />
              )}
          />
          {!disabled && onSubmit && (
              <DialogActions sx={{ px: 0 }}>
                <Button type="submit" variant="contained">Сохранить</Button>
                {onClose && (
                    <Button onClick={onClose} variant="outlined">Отмена</Button>
                )}
              </DialogActions>
          )}
          {disabled && onClose && (
              <DialogActions sx={{ px: 0 }}>
                <Button onClick={onClose} variant="outlined">Закрыть</Button>
              </DialogActions>
          )}
        </Stack>
      </form>
  );
}
