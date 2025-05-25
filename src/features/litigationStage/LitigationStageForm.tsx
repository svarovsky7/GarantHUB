// src/features/litigationStage/LitigationStageForm.js
// -----------------------------------------------------------------------------
// Модальная форма добавления / редактирования стадии судебного дела
// -----------------------------------------------------------------------------

import React, { useState } from 'react';
import { Stack, TextField, Button, DialogActions } from '@mui/material';

interface LitigationStageFormProps {
    initialData?: { id?: number; name?: string };
    onSubmit: (values: { name: string }) => void;
    onCancel: () => void;
}

export default function LitigationStageForm({ initialData, onSubmit, onCancel }: LitigationStageFormProps) {
    const [name, setName] = useState(initialData?.name ?? '');

    const handleSave = (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSubmit({ name: name.trim() });
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
