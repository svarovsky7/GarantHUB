import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, TextField, Autocomplete } from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useLetterTypes } from '@/entities/letterType';

export default function LetterForm({ open, initialData, onSubmit, onCancel }) {
    const { data: types = [] } = useLetterTypes();
    const { control, handleSubmit, reset } = useForm({
        defaultValues: {
            number: '',
            letter_type: '',
            letter_date: null,
            subject: '',
            sender: '',
            receiver: '',
        },
    });

    useEffect(() => {
        if (initialData) {
            reset({
                number: initialData.number ?? '',
                letter_type: initialData.letter_type ?? '',
                letter_date: initialData.letter_date ? dayjs(initialData.letter_date) : null,
                subject: initialData.subject ?? '',
                sender: initialData.sender ?? '',
                receiver: initialData.receiver ?? '',
            });
        } else {
            reset({
                number: '',
                letter_type: '',
                letter_date: null,
                subject: '',
                sender: '',
                receiver: '',
            });
        }
    }, [initialData, reset]);

    return (
        <Dialog open={open} onClose={onCancel} fullWidth maxWidth="sm">
            <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <DialogTitle>{initialData ? 'Редактировать письмо' : 'Новое письмо'}</DialogTitle>
                <DialogContent dividers>
                    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
                        <Stack spacing={2} sx={{ mt: 1 }}>
                            <Controller
                                name="number"
                                control={control}
                                rules={{ required: 'Номер обязателен' }}
                                render={({ field, fieldState }) => (
                                    <TextField
                                        {...field}
                                        label="Номер"
                                        required
                                        fullWidth
                                        error={!!fieldState.error}
                                        helperText={fieldState.error?.message}
                                    />
                                )}
                            />
                            <Controller
                                name="letter_type"
                                control={control}
                                render={({ field }) => (
                                    <Autocomplete
                                        {...field}
                                        onChange={(_, v) => field.onChange(v?.name ?? '')}
                                        options={types}
                                        getOptionLabel={(o) => o.name || ''}
                                        isOptionEqualToValue={(o, v) => o.name === v.name}
                                        renderInput={(params) => <TextField {...params} label="Тип" />}
                                    />
                                )}
                            />
                            <Controller
                                name="letter_date"
                                control={control}
                                render={({ field }) => (
                                    <DatePicker
                                        {...field}
                                        label="Дата"
                                        format="DD.MM.YYYY"
                                        onChange={(v) => field.onChange(v)}
                                    />
                                )}
                            />
                            <Controller
                                name="subject"
                                control={control}
                                render={({ field }) => (
                                    <TextField {...field} label="Тема" fullWidth />
                                )}
                            />
                            <Controller
                                name="sender"
                                control={control}
                                render={({ field }) => (
                                    <TextField {...field} label="От кого" fullWidth />
                                )}
                            />
                            <Controller
                                name="receiver"
                                control={control}
                                render={({ field }) => (
                                    <TextField {...field} label="Кому" fullWidth />
                                )}
                            />
                        </Stack>
                    </LocalizationProvider>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onCancel}>Отмена</Button>
                    <Button type="submit" variant="contained">Сохранить</Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
