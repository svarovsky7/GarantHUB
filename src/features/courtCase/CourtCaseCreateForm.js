import React from 'react';
import { Grid, TextField, Button, Paper, MenuItem, InputLabel, FormControl, Select } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';

const statusesRu = [
    { value: 'active', label: 'В процессе' },
    { value: 'won', label: 'Выиграно' },
    { value: 'lost', label: 'Проиграно' },
    { value: 'settled', label: 'Урегулировано' },
];

export default function CourtCaseCreateForm({ onSubmit, statuses }) {
    const { handleSubmit, control, reset } = useForm({
        defaultValues: {
            number: '',
            date: '',
            projectObject: '',
            plaintiff: '',
            defendant: '',
            responsibleLawyer: '',
            court: '',
            status: 'active',
            claimAmount: '',
            remediationStartDate: '',
            remediationEndDate: '',
            description: '',
        },
    });

    const handleFormSubmit = (values) => {
        onSubmit(values);
        reset();
    };

    return (
        <Paper elevation={3} sx={{ p: 4, borderRadius: 3, mb: 6 }}>
            <h2 className="text-2xl font-bold mb-8 text-gray-800 border-b pb-3">Добавить новое судебное дело</h2>
            <form onSubmit={handleSubmit(handleFormSubmit)} autoComplete="off">
                <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                        <Controller
                            name="number"
                            control={control}
                            rules={{ required: 'Номер дела обязателен' }}
                            render={({ field, fieldState }) => (
                                <TextField {...field} label="Номер дела*" required fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} />
                            )}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Controller
                            name="date"
                            control={control}
                            rules={{ required: 'Дата открытия обязательна' }}
                            render={({ field, fieldState }) => (
                                <TextField {...field} type="date" label="Дата открытия*" required fullWidth InputLabelProps={{ shrink: true }} error={!!fieldState.error} helperText={fieldState.error?.message} />
                            )}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Controller
                            name="projectObject"
                            control={control}
                            rules={{ required: 'Объект обязателен' }}
                            render={({ field, fieldState }) => (
                                <TextField {...field} label="Объект*" required fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} />
                            )}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Controller
                            name="plaintiff"
                            control={control}
                            rules={{ required: 'Истец обязателен' }}
                            render={({ field, fieldState }) => (
                                <TextField {...field} label="Истец*" required fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} />
                            )}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Controller
                            name="defendant"
                            control={control}
                            rules={{ required: 'Ответчик обязателен' }}
                            render={({ field, fieldState }) => (
                                <TextField {...field} label="Ответчик*" required fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} />
                            )}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Controller
                            name="responsibleLawyer"
                            control={control}
                            rules={{ required: 'Ответственный юрист обязателен' }}
                            render={({ field, fieldState }) => (
                                <TextField {...field} label="Ответственный юрист*" required fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} />
                            )}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Controller
                            name="court"
                            control={control}
                            rules={{ required: 'Наименование суда обязательно' }}
                            render={({ field, fieldState }) => (
                                <TextField {...field} label="Наименование суда*" required fullWidth error={!!fieldState.error} helperText={fieldState.error?.message} />
                            )}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Controller
                            name="status"
                            control={control}
                            render={({ field }) => (
                                <FormControl fullWidth>
                                    <InputLabel>Статус дела*</InputLabel>
                                    <Select {...field} label="Статус дела*" required>
                                        {statusesRu.map((s) => (
                                            <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Controller
                            name="claimAmount"
                            control={control}
                            render={({ field }) => (
                                <TextField {...field} label="Сумма иска (руб.)" type="number" fullWidth />
                            )}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Controller
                            name="remediationStartDate"
                            control={control}
                            render={({ field }) => (
                                <TextField {...field} type="date" label="Дата начала устранения" InputLabelProps={{ shrink: true }} fullWidth />
                            )}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Controller
                            name="remediationEndDate"
                            control={control}
                            render={({ field }) => (
                                <TextField {...field} type="date" label="Дата завершения устранения" InputLabelProps={{ shrink: true }} fullWidth />
                            )}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <Controller
                            name="description"
                            control={control}
                            render={({ field }) => (
                                <TextField {...field} label="Описание дела" multiline rows={2} fullWidth />
                            )}
                        />
                    </Grid>
                </Grid>
                <div className="flex justify-end mt-10">
                    <Button type="submit" variant="contained" color="primary" sx={{ px: 6, py: 2, fontWeight: 600, borderRadius: 2, fontSize: 16 }}>
                        ДОБАВИТЬ ДЕЛО
                    </Button>
                </div>
            </form>
        </Paper>
    );
}
