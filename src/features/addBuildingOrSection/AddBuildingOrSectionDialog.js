import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from '@mui/material';
import { supabase } from '@/shared/api/supabaseClient';

export default function AddBuildingOrSectionDialog({ open, type, onClose, projectId, building, afterAdd }) {
    const [value, setValue] = useState('');
    const handleConfirm = async () => {
        if (!value.trim()) return;
        if (type === 'building') {
            await supabase.from('units').insert([{
                project_id: projectId, building: value.trim(), section: null, floor: 1, name: '1'
            }]);
        }
        if (type === 'section') {
            await supabase.from('units').insert([{
                project_id: projectId, building, section: value.trim(), floor: 1, name: '1'
            }]);
        }
        onClose();
        afterAdd && afterAdd();
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>
                {type === 'building' ? 'Добавить корпус' : 'Добавить секцию'}
            </DialogTitle>
            <DialogContent>
                <TextField
                    autoFocus
                    fullWidth
                    label={type === 'building' ? 'Название корпуса' : 'Название секции'}
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    sx={{ mt: 1 }}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Отмена</Button>
                <Button onClick={handleConfirm} variant="contained" disabled={!value.trim()}>Добавить</Button>
            </DialogActions>
        </Dialog>
    );
}
