import React, { useState } from 'react';
import {
  Box,
  Paper,
  Stack,
  Typography,
  Select,
  MenuItem,
  Autocomplete,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
} from '@mui/material';
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


import { useUsers } from '@/entities/user';
import { useLetterTypes } from '@/entities/letterType';
import { useProjects } from '@/entities/project';
import { useUnitsByProject } from '@/entities/unit';



interface Filters {
  type?: 'incoming' | 'outgoing' | '';
  project?: number | '';
  unit?: number | '';
  correspondent?: string;
  subject?: string;
  content?: string;
  search?: string;
}

/** Страница учёта корреспонденции */
export default function CorrespondencePage() {
  const { data: letters = [] } = useLetters();
  const add = useAddLetter();
  const remove = useDeleteLetter();
  const [filters, setFilters] = useState<Filters>({
    type: '',
    project: '',
    unit: '',
    correspondent: '',
    subject: '',
    content: '',
    search: '',
  });
  const [view, setView] = useState<CorrespondenceLetter | null>(null);
  const [snackbar, setSnackbar] = useState<string | null>(null);



  const { data: users = [] } = useUsers();
  const { data: letterTypes = [] } = useLetterTypes();
  const { data: projects = [] } = useProjects();
  const { data: units = [] } = useUnitsByProject(
    view?.project_id ?? (filters.project ? Number(filters.project) : null),
  );


  const handleAdd = (data: AddLetterFormData) => {
    add.mutate(
      {
        type: data.type,
        number: data.number,
        date: data.date ? data.date.toISOString() : dayjs().toISOString(),
        correspondent: data.correspondent,
        subject: data.subject,
        content: data.content,


        responsible_user_id: data.responsible_user_id,
        letter_type_id: data.letter_type_id,
        project_id: data.project_id,
        unit_id: data.unit_id,

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
    if (filters.project && l.project_id !== Number(filters.project)) return false;
    if (filters.unit && l.unit_id !== Number(filters.unit)) return false;
    if (
      filters.correspondent &&
      !l.correspondent.toLowerCase().includes(filters.correspondent.toLowerCase())
    )
      return false;
    if (
      filters.subject &&
      !l.subject.toLowerCase().includes(filters.subject.toLowerCase())
    )
      return false;
    if (
      filters.content &&
      !l.content.toLowerCase().includes(filters.content.toLowerCase())
    )
      return false;
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
        <Box className="filter-grid" sx={{ mb: 2 }}>
          <Select
            value={filters.type}
            onChange={(e) =>
              setFilters((f) => ({ ...f, type: e.target.value as any }))
            }
            displayEmpty
            size="small"
            fullWidth
          >
            <MenuItem value="">Все типы</MenuItem>
            <MenuItem value="incoming">Входящее</MenuItem>
            <MenuItem value="outgoing">Исходящее</MenuItem>
          </Select>
          <Autocomplete
            options={projects}
            getOptionLabel={(o) => o?.name ?? ''}
            isOptionEqualToValue={(o, v) => o?.id === v?.id}
            value={projects.find((p) => p.id === Number(filters.project)) || null}
            onChange={(_, v) =>
              setFilters((f) => ({ ...f, project: v ? v.id : '', unit: '' }))
            }
            renderInput={(params) => (
              <TextField {...params} size="small" label="Проект" />
            )}
            fullWidth
          />
          <Autocomplete
            options={units}
            getOptionLabel={(o) => o?.name ?? ''}
            isOptionEqualToValue={(o, v) => o?.id === v?.id}
            value={units.find((u) => u.id === Number(filters.unit)) || null}
            onChange={(_, v) =>
              setFilters((f) => ({ ...f, unit: v ? v.id : '' }))
            }
            renderInput={(params) => (
              <TextField {...params} size="small" label="Объект" />
            )}
            fullWidth
            disabled={!filters.project}
          />
          <TextField
            size="small"
            label="Корреспондент"
            value={filters.correspondent}
            onChange={(e) =>
              setFilters((f) => ({ ...f, correspondent: e.target.value }))
            }
            fullWidth
          />
          <TextField
            size="small"
            label="В теме"
            value={filters.subject}
            onChange={(e) =>
              setFilters((f) => ({ ...f, subject: e.target.value }))
            }
            fullWidth
          />
          <TextField
            size="small"
            label="В содержании"
            value={filters.content}
            onChange={(e) =>
              setFilters((f) => ({ ...f, content: e.target.value }))
            }
            fullWidth
          />
          <TextField
            size="small"
            placeholder="Поиск"
            value={filters.search}
            onChange={(e) =>
              setFilters((f) => ({ ...f, search: e.target.value }))
            }
            fullWidth
          />
          <Button
            onClick={() =>
              setFilters({
                type: '',
                project: '',
                unit: '',
                correspondent: '',
                subject: '',
                content: '',
                search: '',
              })
            }
          >
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


            {view.project_id && (
              <Typography gutterBottom>
                Проект: {projects.find((p) => p.id === view.project_id)?.name}
              </Typography>
            )}
            {view.unit_id && (
              <Typography gutterBottom>
                Объект: {units.find((u) => u.id === view.unit_id)?.name}
              </Typography>
            )}
            {view.letter_type_id && (
              <Typography gutterBottom>
                Категория: {letterTypes.find((t) => t.id === view.letter_type_id)?.name}
              </Typography>
            )}
            {view.responsible_user_id && (
              <Typography gutterBottom>
                Ответственный: {users.find((u) => u.id === view.responsible_user_id)?.name}
              </Typography>
            )}

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


  );
}
