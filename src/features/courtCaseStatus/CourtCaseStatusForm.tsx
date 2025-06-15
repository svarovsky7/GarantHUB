// src/features/courtCaseStatus/CourtCaseStatusForm.tsx
// -----------------------------------------------------------------------------
// Модальная форма добавления / редактирования статуса судебного дела
// -----------------------------------------------------------------------------

import React, { useState } from 'react';
import { Stack, TextField, Button, DialogActions } from '@mui/material';

interface CourtCaseStatusFormProps {
    initialData?: { id?: number; name?: string; color?: string | null };
    onSubmit: (values: { name: string; color: string }) => void;
    onCancel: () => void;
}

export default function CourtCaseStatusForm({ initialData, onSubmit, onCancel }: CourtCaseStatusFormProps) {
    const [name, setName] = useState(initialData?.name ?? '');
    const [color, setColor] = useState(initialData?.color ?? '#1976d2');

    const handleSave = (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSubmit({ name: name.trim(), color });
    };

    return (
        <form onSubmit={handleSave} noValidate>
            <Stack spacing={2} sx={{ minWidth: 320 }}>
                <TextField
                    label="Название"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                    required
                    size="small"
                    fullWidth
                />
                <TextField
                    label="Цвет"
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    required
                    fullWidth
                    inputProps={{ style: { height: 48, padding: 0 } }}
                />
                <DialogActions sx={{ px: 0 }}>
                    <Button onClick={onCancel}>Отмена</Button>
                    <Button type="submit" variant="contained">
                        Сохранить
                    </Button>
                </DialogActions>
            </Stack>
        </form>
    );
}
