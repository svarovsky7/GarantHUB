import React, { useState, useMemo } from 'react';
import { Grid, Paper, Typography, TextField, Select, MenuItem } from '@mui/material';
import CourtCaseForm from '@/features/courtCase/CourtCaseForm';
import CourtCasesTable from '@/widgets/CourtCasesTable';
import { useCourtCases, useAddCourtCase, useDeleteCourtCase } from '@/entities/courtCase';
import { useNotify } from '@/shared/hooks/useNotify';
import { useProjectId } from '@/shared/hooks/useProjectId';
import type { CourtCase } from '@/shared/types/courtCase';

export default function CourtCasesPage() {
  const notify = useNotify();
  const projectId = useProjectId();
  const { data: cases = [], isPending } = useCourtCases();
  const addCase = useAddCourtCase();
  const delCase = useDeleteCourtCase();

  const [filters, setFilters] = useState({ status: '', object: '', lawyer: '', search: '' });

  const handleAdd = async (values: any) => {
    try {
      await addCase.mutateAsync({ ...values, project_id: projectId });
      notify.success('Дело добавлено');
    } catch (e: any) {
      notify.error(e.message);
    }
  };

  const handleDelete = async (c: CourtCase) => {
    if (!window.confirm('Удалить дело?')) return;
    try {
      await delCase.mutateAsync(c.id);
      notify.success('Дело удалено');
    } catch (e: any) {
      notify.error(e.message);
    }
  };

  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      const search = filters.search.toLowerCase();
      const matchesSearch =
        c.number.toLowerCase().includes(search) ||
        c.plaintiff.toLowerCase().includes(search) ||
        c.defendant.toLowerCase().includes(search) ||
        c.description.toLowerCase().includes(search);
      const matchesStatus = !filters.status || c.status === filters.status;
      const matchesObject = !filters.object || c.project_object.toLowerCase().includes(filters.object.toLowerCase());
      const matchesLawyer = !filters.lawyer || c.responsible_lawyer.toLowerCase().includes(filters.lawyer.toLowerCase());
      return matchesSearch && matchesStatus && matchesObject && matchesLawyer;
    });
  }, [cases, filters]);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Добавить новое судебное дело
          </Typography>
          <CourtCaseForm onSubmit={handleAdd} />
        </Paper>
      </Grid>
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom>
            Таблица судебных дел
          </Typography>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item>
              <Select
                fullWidth
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                displayEmpty
              >
                <MenuItem value="">Все статусы</MenuItem>
                <MenuItem value="active">В процессе</MenuItem>
                <MenuItem value="won">Выиграно</MenuItem>
                <MenuItem value="lost">Проиграно</MenuItem>
                <MenuItem value="settled">Урегулировано</MenuItem>
              </Select>
            </Grid>
            <Grid item>
              <TextField
                placeholder="Фильтр по объекту"
                value={filters.object}
                onChange={(e) => setFilters({ ...filters, object: e.target.value })}
              />
            </Grid>
            <Grid item>
              <TextField
                placeholder="Фильтр по юристу"
                value={filters.lawyer}
                onChange={(e) => setFilters({ ...filters, lawyer: e.target.value })}
              />
            </Grid>
            <Grid item xs>
              <TextField
                placeholder="Поиск по номеру, истцу, ответчику..."
                fullWidth
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </Grid>
          </Grid>
          <CourtCasesTable cases={filteredCases} loading={isPending} onView={() => {}} onDelete={handleDelete} />
        </Paper>
      </Grid>
    </Grid>
  );
}
