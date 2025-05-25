import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Stack,
  TextField,
  Select,
  MenuItem,
  Button,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';

export interface AddLetterFormData {
  type: 'incoming' | 'outgoing';
  number: string;
  date: Dayjs | null;
  correspondent: string;
  subject: string;
  content: string;
}

interface AddLetterFormProps {
  onSubmit: (data: AddLetterFormData) => void;
}

/** Форма добавления письма */
export default function AddLetterForm({ onSubmit }: AddLetterFormProps) {
  const { control, handleSubmit, reset } = useForm<AddLetterFormData>({
    defaultValues: {
      type: 'incoming',
      number: '',
      date: dayjs(),
      correspondent: '',
      subject: '',
      content: '',
    },
  });

  const submit = (data: AddLetterFormData) => {
    onSubmit(data);
    reset();
  };

  return (
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
  );
}
