import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Autocomplete } from '@mui/material';
import { useProjectDefects } from '@/entities/defect';

export default function CaseDefectForm({ open, initialData, onSubmit, onCancel }) {
    const { data: defects = [] } = useProjectDefects();
    const { control, handleSubmit, reset } = useForm({
        defaultValues: { defect_id: null },
    });

    useEffect(() => {
        if (initialData) {
            reset({ defect_id: initialData.id });
        } else {
            reset({ defect_id: null });
        }
    }, [initialData, reset]);

    return (
        <Dialog open={open} onClose={onCancel} fullWidth maxWidth="sm">
            <form onSubmit={handleSubmit((vals) => onSubmit(vals.defect_id))} noValidate>
                <DialogTitle>Добавить недостаток</DialogTitle>
                <DialogContent dividers>
                    <Controller
                        name="defect_id"
                        control={control}
                        rules={{ required: 'Недостаток обязателен' }}
                        render={({ field, fieldState }) => (
                            <Autocomplete
                                options={defects}
                                value={defects.find((d) => d.id === field.value) || null}
                                onChange={(_, v) => field.onChange(v?.id ?? null)}
                                getOptionLabel={(o) => o.description || ''}
                                isOptionEqualToValue={(o, v) => o.id === v.id}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Недостаток"
                                        required
                                        error={!!fieldState.error}
                                        helperText={fieldState.error?.message}
                                    />
                                )}
                            />
                        )}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={onCancel}>Отмена</Button>
                    <Button type="submit" variant="contained">Сохранить</Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
