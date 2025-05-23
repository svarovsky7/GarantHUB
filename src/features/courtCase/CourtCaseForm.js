import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Stack, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions, Autocomplete } from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useUnitsByProject } from '@/entities/unit';
import { useLitigationStages } from '@/entities/litigationStage';
import { useCourtCaseStatuses } from '@/entities/courtCaseStatus';
import { useUsers } from '@/entities/user';

export default function CourtCaseForm({ initialData, onSubmit, onCancel }) {
    const { data: stages = [] } = useLitigationStages();
    const { data: statuses = [] } = useCourtCaseStatuses();
    const { data: users = [] } = useUsers();
    const { data: units = [] } = useUnitsByProject(initialData?.project_id, true);

    const { control, handleSubmit, reset } = useForm({
        defaultValues: {
            internal_no: '',
            project_id: initialData?.project_id ?? null,
            unit_id: null,
            stage_id: null,
            status: 'NEW',
            responsible_lawyer_id: null,
            fix_start_date: null,
            fix_end_date: null,
            comments: '',
        },
    });

    useEffect(() => {
        if (initialData) {
            reset({
                internal_no: initialData.internal_no,
                project_id: initialData.project_id,
                unit_id: initialData.unit_id,
                stage_id: initialData.stage_id,
                status: initialData.status,
                responsible_lawyer_id: initialData.responsible_lawyer_id,
                fix_start_date: initialData.fix_start_date ? dayjs(initialData.fix_start_date) : null,
                fix_end_date: initialData.fix_end_date ? dayjs(initialData.fix_end_date) : null,
                comments: initialData.comments ?? '',
            });
        }
    }, [initialData, reset]);

    return (
        <Dialog open onClose={onCancel} fullWidth maxWidth="sm">
            <DialogTitle>{initialData ? 'Редактировать дело' : 'Новое дело'}</DialogTitle>
            <DialogContent dividers>
                <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <Controller
                            name="internal_no"
                            control={control}
                            rules={{ required: 'Номер обязателен' }}
                            render={({ field, fieldState }) => (
                                <TextField
                                    {...field}
                                    label="Внутренний номер"
                                    required
                                    fullWidth
                                    error={!!fieldState.error}
                                    helperText={fieldState.error?.message}
                                />
                            )}
                        />
                        <Controller
                            name="unit_id"
                            control={control}
                            render={({ field }) => (
                                <Autocomplete
                                    {...field}
                                    onChange={(_, v) => field.onChange(v?.id ?? null)}
                                    options={units}
                                    getOptionLabel={(o) => o.name || ''}
                                    isOptionEqualToValue={(o, v) => o.id === v.id}
                                    renderInput={(params) => <TextField {...params} label="Объект" />}
                                />
                            )}
                        />
                        <Controller
                            name="stage_id"
                            control={control}
                            render={({ field }) => (
                                <Autocomplete
                                    {...field}
                                    onChange={(_, v) => field.onChange(v?.id ?? null)}
                                    options={stages}
                                    getOptionLabel={(o) => o.name || ''}
                                    isOptionEqualToValue={(o, v) => o.id === v.id}
                                    renderInput={(params) => <TextField {...params} label="Стадия" />}
                                />
                            )}
                        />
                        <Controller
                            name="status"
                            control={control}
                            render={({ field }) => (
                                <Autocomplete
                                    {...field}
                                    onChange={(_, v) => field.onChange(v?.name ?? '')}
                                    options={statuses}
                                    getOptionLabel={(o) => o.name || ''}
                                    isOptionEqualToValue={(o, v) => o.name === v.name}
                                    renderInput={(params) => <TextField {...params} label="Статус" />}
                                />
                            )}
                        />
                        <Controller
                            name="responsible_lawyer_id"
                            control={control}
                            render={({ field }) => (
                                <Autocomplete
                                    {...field}
                                    onChange={(_, v) => field.onChange(v?.id ?? null)}
                                    options={users}
                                    getOptionLabel={(o) => o.name || o.email || ''}
                                    isOptionEqualToValue={(o, v) => o.id === v.id}
                                    renderInput={(params) => <TextField {...params} label="Ответственный юрист" />}
                                />
                            )}
                        />
                        <Controller
                            name="fix_start_date"
                            control={control}
                            render={({ field }) => (
                                <DatePicker
                                    {...field}
                                    label="Дата начала устранения"
                                    format="DD.MM.YYYY"
                                    onChange={(v) => field.onChange(v)}
                                />
                            )}
                        />
                        <Controller
                            name="fix_end_date"
                            control={control}
                            render={({ field }) => (
                                <DatePicker
                                    {...field}
                                    label="Дата завершения устранения"
                                    format="DD.MM.YYYY"
                                    onChange={(v) => field.onChange(v)}
                                />
                            )}
                        />
                        <Controller
                            name="comments"
                            control={control}
                            render={({ field }) => (
                                <TextField {...field} label="Заметки" multiline rows={3} fullWidth />
                            )}
                        />
                    </Stack>
                </LocalizationProvider>
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel}>Отмена</Button>
                <Button variant="contained" onClick={handleSubmit(onSubmit)}>Сохранить</Button>
            </DialogActions>
        </Dialog>
    );
}
