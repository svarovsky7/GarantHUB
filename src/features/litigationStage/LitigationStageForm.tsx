// src/features/litigationStage/LitigationStageForm.js
// -----------------------------------------------------------------------------
// Модальная форма добавления / редактирования стадии судебного дела
// -----------------------------------------------------------------------------

import React, { useState }    from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, Stack,
} from '@mui/material';

/**
 * @typedef {Object} LitigationStageFormProps
 * @property {Object}  [initialData]
 * @property {function(Object):void} onSubmit
 * @property {function():void} onCancel
 */

/** @param {LitigationStageFormProps} props */
export default function LitigationStageForm({ initialData = {}, onSubmit, onCancel }) {
    const [name, setName] = useState(initialData.name ?? '');

    const handleSave = (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSubmit({ name: name.trim() });
    };

    return (
        <Dialog open onClose={onCancel} fullWidth maxWidth="xs">
            <form onSubmit={handleSave}>
                <DialogTitle>
                    {initialData.id ? 'Редактировать стадию' : 'Новая стадия'}
                </DialogTitle>

                <DialogContent dividers>
                    <Stack spacing={2}>
                        <TextField
                            label="Название"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoFocus
                            required
                            size="small"
                            fullWidth
                        />
                    </Stack>
                </DialogContent>

                <DialogActions>
                    <Button onClick={onCancel}>Отмена</Button>
                    <Button type="submit" variant="contained">Сохранить</Button>
                </DialogActions>
            </form>
        </Dialog>
    );
}
