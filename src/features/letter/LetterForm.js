import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Stack,
    TextField,
    Button,
    Autocomplete,
    CircularProgress,
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { useLetterTypes } from '@/entities/letterType';

export default function LetterForm({ open, initialData, onSubmit, onCancel }) {
    const { data: types = [] } = useLetterTypes();
    const { control, handleSubmit, reset, formState: { isSubmitting } } = useForm({
        defaultValues: {
            number: '',
            letter_type: null,
            letter_date: dayjs(),
            subject: '',
            sender: '',
            receiver: '',
        },
    });

    useEffect(() => {
        if (initialData) {
            reset({
                number: initialData.number,
                letter_type: initialData.letter_type,
                letter_date: initialData.letter_date ? dayjs(initialData.letter_date) : dayjs(),
                subject: initialData.subject ?? '',
                sender: initialData.sender ?? '',
                receiver: initialData.receiver ?? '',
            });
        } else {
            reset({
                number: '',
                letter_type: null,
                letter_date: dayjs(),
                subject: '',
                sender: '',
                receiver: '',
            });
        }
    }, [initialData, reset]);

    const handle = async (data) => {
        const values = {
            ...data,
            letter_type: typeof data.letter_type === 'string' ? data.letter_type : data.letter_type?.name,
        };
        await onSubmit(values);
    };

    return (
        <Dialog open={open} onClose={onCancel} fullWidth maxWidth="sm">
            <DialogTitle>{initialData ? 'Редактировать письмо' : 'Добавить письмо'}</DialogTitle>
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
                                    onChange={(_, v) => field.onChange(v?.name ?? null)}
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
                                <TextField {...field} label="Отправитель" fullWidth />
                            )}
                        />
                        <Controller
                            name="receiver"
                            control={control}
                            render={({ field }) => (
                                <TextField {...field} label="Получатель" fullWidth />
                            )}
                        />
                    </Stack>
                </LocalizationProvider>
            </DialogContent>
            <DialogActions>
                <Button onClick={onCancel}>Отмена</Button>
                <Button onClick={handleSubmit(handle)} variant="contained" disabled={isSubmitting} startIcon={isSubmitting && <CircularProgress size={18} color="inherit" />}>
                    Сохранить
                </Button>
            </DialogActions>
        </Dialog>
    );
}
