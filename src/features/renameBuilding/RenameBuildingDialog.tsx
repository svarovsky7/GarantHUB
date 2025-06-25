import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
} from '@mui/material';
import { useRenameBuilding } from '@/entities/unit';
import type { BuildingRename } from '@/shared/types/buildingRename';

interface RenameBuildingDialogProps {
    open: boolean;
    onClose: () => void;
    projectId: string | number;
    currentName: string;
    onSuccess?: (name: string) => void;
}

/**
 * Диалог переименования корпуса.
 */
export default function RenameBuildingDialog({
    open,
    onClose,
    projectId,
    currentName,
    onSuccess,
}: RenameBuildingDialogProps) {
    const [value, setValue] = useState(currentName);
    const rename = useRenameBuilding();

    useEffect(() => setValue(currentName), [currentName]);

    const handleConfirm = async () => {
        const name = value.trim();
        if (!name || name === currentName) {
            onClose();
            return;
        }
        const payload: BuildingRename = {
            project_id: projectId,
            old_name: currentName,
            new_name: name,
        };
        await rename.mutateAsync(payload);
        onSuccess?.(name);
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Переименовать корпус</DialogTitle>
            <DialogContent>
                <TextField
                    autoFocus
                    fullWidth
                    label="Новое название корпуса"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    sx={{ mt: 1 }}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Отмена</Button>
                <Button
                    onClick={handleConfirm}
                    variant="contained"
                    disabled={!value.trim() || rename.isPending}
                >
                    Сохранить
                </Button>
            </DialogActions>
        </Dialog>
    );
}
