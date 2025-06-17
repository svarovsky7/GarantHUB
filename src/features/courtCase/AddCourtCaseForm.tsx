import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Stack,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  DialogActions,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs, { Dayjs } from 'dayjs';
import { useVisibleProjects } from '@/entities/project';
import { useUnitsByProject } from '@/entities/unit';
import { useUsers } from '@/entities/user';
import { useCourtCaseStatuses } from '@/entities/courtCaseStatus';
import { useAddCourtCase } from '@/entities/courtCase';
import { useAuthStore } from '@/shared/store/authStore';
import { useNotify } from '@/shared/hooks/useNotify';

export interface AddCourtCaseFormValues {
  project_id: number | null;
  unit_ids: number[];
  number: string;
  date: Dayjs | null;
  responsible_lawyer_id: string | null;
  status: number | null;
  description: string;
}

interface Props {
  initialProjectId?: number | null;
  initialUnitId?: number | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * Форма добавления судебного дела. Использует минимальный набор полей.
 */
export default function AddCourtCaseForm({
  initialProjectId = null,
  initialUnitId = null,
  onSuccess,
  onCancel,
}: Props) {
  const profileId = useAuthStore((s) => s.profile?.id ?? null);
  const { control, handleSubmit, watch, setValue } = useForm<AddCourtCaseFormValues>({
    defaultValues: {
      project_id: initialProjectId,
      unit_ids: initialUnitId != null ? [initialUnitId] : [],
      number: '',
      date: dayjs(),
      responsible_lawyer_id: profileId,
      status: null,
      description: '',
    },
  });

  const projectId = watch('project_id');

  const { data: projects = [] } = useVisibleProjects();
  const { data: units = [] } = useUnitsByProject(projectId);
  const { data: users = [] } = useUsers();
  const { data: stages = [] } = useCourtCaseStatuses();

  useEffect(() => {
    setValue('unit_ids', initialUnitId != null ? [initialUnitId] : []);
  }, [initialUnitId, setValue]);

  const addCase = useAddCourtCase();
  const notify = useNotify();

  const submit = async (values: AddCourtCaseFormValues) => {
    try {
      await addCase.mutateAsync({
        project_id: values.project_id!,
        unit_ids: values.unit_ids,
        number: values.number,
        date: values.date ? values.date.format('YYYY-MM-DD') : null,
        plaintiff_person_id: null,
        plaintiff_contractor_id: null,
        defendant_person_id: null,
        defendant_contractor_id: null,
        responsible_lawyer_id: values.responsible_lawyer_id,
        status: values.status ?? 1,
        fix_start_date: null,
        fix_end_date: null,
        description: values.description || '',
        attachment_ids: [],
      } as any);
      notify.success('Дело успешно добавлено!');
      onSuccess?.();
    } catch (e: any) {
      notify.error(e.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(submit)} noValidate>
      <Stack spacing={2} sx={{ minWidth: 300 }}>
        <Controller
          name="project_id"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <FormControl fullWidth>
              <InputLabel id="project-label">Проект</InputLabel>
              <Select {...field} labelId="project-label" label="Проект">
                {projects.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        />
        <Controller
          name="unit_ids"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <FormControl fullWidth>
              <InputLabel id="unit-label">Объект</InputLabel>
              <Select
                {...field}
                multiple
                labelId="unit-label"
                label="Объект"
                value={field.value}
              >
                {units.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        />
        <Controller
          name="responsible_lawyer_id"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth>
              <InputLabel id="lawyer-label">Ответственный юрист</InputLabel>
              <Select
                {...field}
                labelId="lawyer-label"
                label="Ответственный юрист"
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value || null)}
              >
                <MenuItem value="">
                  <em>Не указан</em>
                </MenuItem>
                {users.map((u) => (
                  <MenuItem key={u.id} value={u.id}>
                    {u.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        />
        <Controller
          name="status"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <FormControl fullWidth>
              <InputLabel id="status-label">Статус</InputLabel>
              <Select {...field} labelId="status-label" label="Статус">
                {stages.map((s) => (
                  <MenuItem key={s.id} value={s.id}>
                    {s.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        />
        <Controller
          name="number"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <TextField {...field} label="Номер дела" fullWidth required />
          )}
        />
        <Controller
          name="date"
          control={control}
          rules={{ required: true }}
          render={({ field }) => (
            <DatePicker
              {...field}
              format="DD.MM.YYYY"
              value={field.value}
              onChange={(d) => field.onChange(d)}
              slotProps={{ textField: { fullWidth: true, required: true } }}
            />
          )}
        />
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <TextField {...field} label="Описание" fullWidth multiline rows={3} />
          )}
        />
        <DialogActions sx={{ px: 0 }}>
          {onCancel && (
            <Button onClick={onCancel}>Отмена</Button>
          )}
          <Button type="submit" variant="contained">
            Добавить дело
          </Button>
        </DialogActions>
      </Stack>
    </form>
  );
}
