import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Stack, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions, Autocomplete } from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { useUnitsByProject } from '@/entities/unit';
import { useLitigationStages } from '@/entities/litigationStage';
import { useCourtCaseStatuses } from '@/entities/courtCaseStatus';
import { useUsers } from '@/entities/user';
import { useProjectId } from '@/shared/hooks/useProjectId';
import {
    useCaseLetters,
    useAddLetter,
    useUpdateLetter,
} from '@/entities/letter';
import {
    useCaseDefects,
    useAddCaseDefect,
} from '@/entities/caseDefect';
import LetterForm from '@/features/letter/LetterForm';
import CaseDefectForm from '@/features/caseDefect/CaseDefectForm';
import CaseDefectsTable from '@/widgets/CaseDefectsTable';
import LettersTable from '@/widgets/LettersTable';

interface FormValues {
    internal_no: string;
    project_id: number | null;
    unit_id: number | null;
    stage_id: number | null;
    status: string;
    responsible_lawyer_id: number | null;
    fix_start_date: Dayjs | null;
    fix_end_date: Dayjs | null;
    comments: string;
}

export default function CourtCaseForm({ initialData, onSubmit, onCancel }) {
    const projectId = useProjectId();
    const { data: stages = [] } = useLitigationStages();
    const { data: statuses = [] } = useCourtCaseStatuses();
    const { data: users = [] } = useUsers();
    const { data: units = [] } = useUnitsByProject(projectId);

    const { data: letters = [] } = useCaseLetters(initialData?.id);
    const addLetter = useAddLetter();
    const updateLetter = useUpdateLetter();
    const [letterModal, setLetterModal] = useState(null); // {mode, data}

    const { data: caseDefects = [] } = useCaseDefects(initialData?.id);
    const addCaseDefect = useAddCaseDefect();
    const [defectModal, setDefectModal] = useState(false);

    const { control, handleSubmit, reset, setValue } = useForm<FormValues>({
        defaultValues: {
            internal_no: '',
            project_id: projectId,
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
        } else {
            setValue('internal_no', `CC-${Date.now()}`);
        }
    }, [initialData, reset, setValue]);

    useEffect(() => {
        setValue('project_id', projectId);
    }, [projectId, setValue]);

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
                                    options={units}
                                    value={units.find((u) => u.id === field.value) || null}
                                    onChange={(_, v) => field.onChange(v?.id ?? null)}
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
                                    options={stages}
                                    value={stages.find((s) => s.id === field.value) || null}
                                    onChange={(_, v) => field.onChange(v?.id ?? null)}
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
                                    options={statuses}
                                    value={statuses.find((s) => s.name === field.value) || null}
                                    onChange={(_, v) => field.onChange(v?.name ?? '')}
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
                                    options={users}
                                    value={users.find((u) => u.id === field.value) || null}
                                    onChange={(_, v) => field.onChange(v?.id ?? null)}
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
                {initialData && (
                    <Stack spacing={2} sx={{ mt: 3 }}>
                        <Button variant="outlined" onClick={() => setDefectModal(true)}>
                            Добавить недостаток
                        </Button>
                        <CaseDefectsTable rows={caseDefects} />
                    </Stack>
                )}
                {initialData && (
                    <Stack spacing={2} sx={{ mt: 3 }}>
                        <Button variant="outlined" onClick={() => setLetterModal({ mode: 'add', data: null })}>
                            Добавить письмо
                        </Button>
                        <LettersTable
                            rows={letters}
                            onEdit={(row) => setLetterModal({ mode: 'edit', data: row })}
                        />
                    </Stack>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel}>Отмена</Button>
                <Button variant="contained" onClick={handleSubmit(onSubmit)}>Сохранить</Button>
            </DialogActions>
            {letterModal && initialData && (
                <LetterForm
                    open
                    initialData={letterModal.data}
                    onCancel={() => setLetterModal(null)}
                    onSubmit={async (vals) => {
                        if (letterModal.mode === 'add') {
                            await addLetter.mutateAsync({ ...vals, case_id: initialData.id });
                        } else if (letterModal.mode === 'edit' && letterModal.data) {
                            await updateLetter.mutateAsync({ id: letterModal.data.id, case_id: initialData.id, updates: vals });
                        }
                        setLetterModal(null);
                    }}
                />
            )}
            {defectModal && initialData && (
                <CaseDefectForm
                    open
                    initialData={null}
                    onCancel={() => setDefectModal(false)}
                    onSubmit={async (defect_id) => {
                        await addCaseDefect.mutateAsync({
                            case_id: initialData.id,
                            defect_id,
                        });
                        setDefectModal(false);
                    }}
                />
            )}
        </Dialog>
    );
}
