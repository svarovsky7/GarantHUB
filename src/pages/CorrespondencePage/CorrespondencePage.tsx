import React, { useState } from 'react';
import {
  Box,
  Paper,
  Stack,
  Typography,
  Select,
  MenuItem,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
} from '@mui/material';
import {
  LocalizationProvider,
} from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { AddLetterFormData } from '@/features/correspondence/AddLetterForm';
import AddLetterForm from '@/features/correspondence/AddLetterForm';
import CorrespondenceTable from '@/widgets/CorrespondenceTable';
import {
  useLetters,
  useAddLetter,
  useDeleteLetter,
} from '@/entities/correspondence';
import { CorrespondenceLetter } from '@/shared/types/correspondence';

interface Filters {
  type?: 'incoming' | 'outgoing' | '';
  search?: string;
}

/** Страница учёта корреспонденции */
export default function CorrespondencePage() {
  const { data: letters = [] } = useLetters();
  const add = useAddLetter();
  const remove = useDeleteLetter();
  const [filters, setFilters] = useState<Filters>({ type: '', search: '' });
  const [view, setView] = useState<CorrespondenceLetter | null>(null);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const handleAdd = (data: AddLetterFormData) => {
    add.mutate(
      {
        type: data.type,
        number: data.number,
        date: data.date ? data.date.toISOString() : dayjs().toISOString(),
        correspondent: data.correspondent,
        subject: data.subject,
        content: data.content,
      },
      {
        onSuccess: () => setSnackbar('Письмо добавлено'),
      },
    );
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Удалить письмо?')) return;
    remove.mutate(id, {
      onSuccess: () => setSnackbar('Письмо удалено'),
    });
  };

  const filtered = letters.filter((l) => {
    if (filters.type && l.type !== filters.type) return false;
    if (
      filters.search &&
      !(
        l.number.includes(filters.search) ||
        l.correspondent.toLowerCase().includes(filters.search.toLowerCase()) ||
        l.subject.toLowerCase().includes(filters.search.toLowerCase())
      )
    )
      return false;
    return true;
  });

  const total = letters.length;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
      <Stack spacing={3} sx={{ mt: 2 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Система учета корреспонденции
        </Typography>
        <Typography>Управление входящими и исходящими письмами</Typography>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <AddLetterForm onSubmit={handleAdd} />
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 2,
            mb: 2,
          }}
        >
          <Select
            value={filters.type}
            onChange={(e) =>
              setFilters((f) => ({ ...f, type: e.target.value as any }))
            }
            displayEmpty
            size="small"
          >
            <MenuItem value="">Все типы</MenuItem>
            <MenuItem value="incoming">Входящее</MenuItem>
            <MenuItem value="outgoing">Исходящее</MenuItem>
          </Select>
          <TextField
            size="small"
            placeholder="Поиск"
            value={filters.search}
            onChange={(e) =>
              setFilters((f) => ({ ...f, search: e.target.value }))
            }
          />
          <Button onClick={() => setFilters({ type: '', search: '' })}>
            Сбросить фильтры
          </Button>
        </Box>
        <CorrespondenceTable
          letters={filtered}
          onView={setView}
          onDelete={handleDelete}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Typography variant="body2">Всего писем: {total}</Typography>
        </Box>
      </Paper>

      <Dialog open={!!view} onClose={() => setView(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Детали письма</DialogTitle>
        {view && (
          <DialogContent dividers>
            <Typography variant="subtitle2" gutterBottom>
              {view.type === 'incoming' ? 'Входящее' : 'Исходящее'} письмо №{' '}
              {view.number}
            </Typography>
            <Typography gutterBottom>
              Дата: {dayjs(view.date).format('DD.MM.YYYY')}
            </Typography>
            <Typography gutterBottom>Корреспондент: {view.correspondent}</Typography>
            <Typography gutterBottom>Тема: {view.subject}</Typography>
            <Typography sx={{ whiteSpace: 'pre-wrap' }}>{view.content}</Typography>
          </DialogContent>
        )}
        <DialogActions>
          <Button onClick={() => setView(null)}>Закрыть</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snackbar}
        autoHideDuration={3000}
        onClose={() => setSnackbar(null)}
        message={snackbar}
      />
      </Stack>
    </LocalizationProvider>
  );
}
