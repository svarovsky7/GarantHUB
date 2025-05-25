import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Stack,
  TextField,
  Select,
  MenuItem,
  Button,
  Autocomplete,
  CircularProgress,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { useUsers } from '@/entities/user';
import { useLetterTypes } from '@/entities/letterType';
import { useProjects } from '@/entities/project';
import { useUnitsByProject } from '@/entities/unit';

export interface AddLetterFormData {
  type: 'incoming' | 'outgoing';
  number: string;
  date: Dayjs | null;
  correspondent: string;
  subject: string;
  content: string;
  responsible_user_id: string | null;
  letter_type_id: number | null;
  project_id: number | null;
  unit_id: number | null;
}

interface AddLetterFormProps {
  onSubmit: (data: AddLetterFormData) => void;
}

/** Форма добавления письма */
export default function AddLetterForm({ onSubmit }: AddLetterFormProps) {
  const { control, handleSubmit, reset, watch, setValue } =
    useForm<AddLetterFormData>({
      defaultValues: {
        type: 'incoming',
        number: '',
        date: dayjs(),
        correspondent: '',
        subject: '',
        content: '',
        responsible_user_id: null,
        letter_type_id: null,
        project_id: null,
      unit_id: null,
      },
    });

  const projectId = watch('project_id');

  const { data: users = [], isLoading: loadingUsers } = useUsers();
  const { data: letterTypes = [], isLoading: loadingTypes } = useLetterTypes();
  const { data: projects = [], isLoading: loadingProjects } = useProjects();
  const { data: units = [], isLoading: loadingUnits } = useUnitsByProject(projectId);

  useEffect(() => {
    setValue('unit_id', null);
  }, [projectId, setValue]);

  const submit = (data: AddLetterFormData) => {
    onSubmit(data);
    reset();
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
      <form onSubmit={handleSubmit(submit)} noValidate>
        <Stack spacing={2} sx={{ maxWidth: 400 }}>
        <Controller
          name="type"
          control={control}
          render={({ field }) => (
            <Select {...field} label="Тип письма">
              <MenuItem value="incoming">Входящее</MenuItem>
              <MenuItem value="outgoing">Исходящее</MenuItem>
            </Select>
          )}
        />
        <Controller
          name="number"
          control={control}
          rules={{ required: 'Номер обязателен' }}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              label="Номер письма"
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
            />
          )}
        />
        <Controller
          name="date"
          control={control}
          rules={{ required: 'Дата обязательна' }}
          render={({ field }) => (
            <DatePicker
              {...field}
              label="Дата"
              format="DD.MM.YYYY"
            />
          )}
        />
        <Controller
          name="responsible_user_id"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <Autocomplete
              {...field}
              options={users}
              loading={loadingUsers}
              getOptionLabel={(o) => o?.name ?? ''}
              isOptionEqualToValue={(o, v) => o?.id === v?.id}
              onChange={(_, v) => field.onChange(v ? v.id : null)}
              value={users.find((u) => u.id === field.value) || null}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Ответственный"
                  error={!!error}
                  helperText={error?.message}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingUsers && <CircularProgress size={20} />}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          )}
        />
        <Controller
          name="letter_type_id"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <Autocomplete
              {...field}
              options={letterTypes}
              loading={loadingTypes}
              getOptionLabel={(o) => o?.name ?? ''}
              isOptionEqualToValue={(o, v) => o?.id === v?.id}
              onChange={(_, v) => field.onChange(v ? v.id : null)}
              value={letterTypes.find((t) => t.id === field.value) || null}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Категория письма"
                  error={!!error}
                  helperText={error?.message}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingTypes && <CircularProgress size={20} />}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          )}
        />
        <Controller
          name="project_id"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <Autocomplete
              {...field}
              options={projects}
              loading={loadingProjects}
              getOptionLabel={(o) => o?.name ?? ''}
              isOptionEqualToValue={(o, v) => o?.id === v?.id}
              onChange={(_, v) => field.onChange(v ? v.id : null)}
              value={projects.find((p) => p.id === field.value) || null}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Проект"
                  error={!!error}
                  helperText={error?.message}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingProjects && <CircularProgress size={20} />}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          )}
        />
        <Controller
          name="unit_id"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <Autocomplete
              {...field}
              options={units}
              loading={loadingUnits}
              getOptionLabel={(o) => o?.name ?? ''}
              isOptionEqualToValue={(o, v) => o?.id === v?.id}
              onChange={(_, v) => field.onChange(v ? v.id : null)}
              value={units.find((u) => u.id === field.value) || null}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Объект"
                  error={!!error}
                  helperText={error?.message}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingUnits && <CircularProgress size={20} />}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          )}
        />
        <Controller
          name="correspondent"
          control={control}
          render={({ field }) => (
            <TextField {...field} label="Корреспондент" />
          )}
        />
        <Controller
          name="subject"
          control={control}
          render={({ field }) => (
            <TextField {...field} label="Тема" />
          )}
        />
        <Controller
          name="content"
          control={control}
          render={({ field }) => (
            <TextField {...field} label="Содержание" multiline rows={3} />
          )}
        />
        <Button variant="contained" type="submit" sx={{ alignSelf: 'flex-end' }}>
          Добавить письмо
        </Button>
      </Stack>
    </form>
    </LocalizationProvider>
  );
}
