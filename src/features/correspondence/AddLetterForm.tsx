import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Grid,
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
      <Grid container spacing={2} sx={{ maxWidth: 600 }}>
        <Grid item xs={12} sm={4}>
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select fullWidth {...field} label="Тип письма">
                <MenuItem value="incoming">Входящее</MenuItem>
                <MenuItem value="outgoing">Исходящее</MenuItem>
              </Select>
            )}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Controller
            name="number"
            control={control}
            rules={{ required: 'Номер обязателен' }}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Номер письма"
                fullWidth
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Controller
            name="date"
            control={control}
            rules={{ required: 'Дата обязательна' }}
            render={({ field }) => (
              <DatePicker {...field} label="Дата" format="DD.MM.YYYY" />
            )}
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <Controller
            name="correspondent"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="Корреспондент" fullWidth />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Controller
            name="subject"
            control={control}
            render={({ field }) => (
              <TextField {...field} label="Тема" fullWidth />
            )}
          />
        </Grid>
        <Grid item xs={12} sm={4} />

        <Grid item xs={12} sm={8}>
          <Controller
            name="content"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Содержание"
                multiline
                rows={3}
                fullWidth
              />
            )}
          />
        </Grid>
        <Grid
          item
          xs={12}
          sm={4}
          sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end' }}
        >
          <Button variant="contained" type="submit">
            Добавить письмо
          </Button>
        </Grid>
      </Grid>
    </form>
  );
}
