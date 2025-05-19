import React, { useState } from 'react';
import { Box, Button, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import FloorCell from '@/entities/floor/FloorCell';
import UnitCell from '@/entities/unit/UnitCell';
import AddIcon from '@mui/icons-material/Add';
import { supabase } from '@/shared/api/supabaseClient';
import { useAuthStore } from '@/shared/store/authStore';

const CELL_SIZE = 56;

export default function StructureGrid({
                                          floors, unitsByFloor, projectId, building, section, setUnits, units
                                      }) {
    // Диалог удаления
    const [confirmDelete, setConfirmDelete] = useState({ open: false, floor: null, unit: null });

    // --- Добавить квартиру по правилам ниже лежащего этажа
    const handleAddUnit = async (floor) => {
        const userId = useAuthStore.getState().profile?.id ?? null;
        let idx = floors.indexOf(floor);
        let belowFloor = idx < floors.length - 1 ? floors[idx + 1] : null;
        let maxName = 0;
        if (belowFloor && unitsByFloor[belowFloor]) {
            const nums = unitsByFloor[belowFloor].map(u => Number(u.name)).filter(v => !isNaN(v));
            if (nums.length > 0) maxName = Math.max(...nums);
        }
        const newName = String(maxName + 1);
        const payload = {
            project_id: projectId,
            building,
            section: section || null,
            floor,
            name: newName,
            person_id: userId,
        };
        const { data, error } = await supabase.from('units').insert([payload]).select('*');
        if (!error) setUnits((prev) => [...prev, data[0]]);
    };

    // --- Добавить этаж
    const handleAddFloor = async () => {
        let candidate = null;
        const numericFloors = floors.filter(f => !isNaN(f));
        if (numericFloors.length === 0) candidate = 1;
        else {
            const min = Math.min(...numericFloors);
            candidate = min - 1;
            if (candidate === 0) candidate = min - 2;
        }
        await handleAddUnit(candidate);
    };

    // --- Удаление квартиры/этажа через диалог
    const handleRequestDeleteFloor = (floor) => setConfirmDelete({ open: true, floor, unit: null });
    const handleRequestDeleteUnit = (unit) => setConfirmDelete({ open: true, floor: null, unit });
    const handleCancelDelete = () => setConfirmDelete({ open: false, floor: null, unit: null });

    const handleConfirmDelete = async () => {
        if (confirmDelete.floor !== null) {
            await supabase.from('units')
                .delete()
                .eq('project_id', projectId)
                .eq('building', building)
                .eq('floor', confirmDelete.floor);
            setUnits(units.filter(u => u.floor !== confirmDelete.floor));
        }
        if (confirmDelete.unit) {
            await supabase.from('units').delete().eq('id', confirmDelete.unit.id);
            setUnits(units.filter(u => u.id !== confirmDelete.unit.id));
        }
        handleCancelDelete();
    };

    return (
        <Box sx={{
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            pl: 0
        }}>
            {floors.map((floor) => (
                <Box key={floor} sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                    <FloorCell
                        floor={floor}
                        onEditSuccess={(oldFloor, newFloor) => {
                            setUnits(units.map(u =>
                                u.floor === oldFloor ? { ...u, floor: newFloor } : u
                            ));
                        }}
                        onRequestDelete={() => handleRequestDeleteFloor(floor)}
                        projectId={projectId}
                        building={building}
                        units={units}
                    />
                    {(unitsByFloor[floor] || []).map(unit => (
                        <UnitCell
                            key={unit.id}
                            unit={unit}
                            onEditSuccess={(val) =>
                                setUnits(units.map(u => u.id === unit.id ? { ...u, name: val } : u))
                            }
                            onRequestDelete={() => handleRequestDeleteUnit(unit)}
                        />
                    ))}
                    <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleAddUnit(floor)}
                        sx={{
                            width: CELL_SIZE, height: CELL_SIZE,
                            margin: 0.5, color: '#888', borderStyle: 'dashed',
                            fontSize: 22, minWidth: 0, padding: 0,
                        }}
                    >
                        +
                    </Button>
                </Box>
            ))}
            {/* Добавить этаж */}
            <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                <Box
                    sx={{
                        width: 72, minWidth: 72, height: CELL_SIZE,
                        display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
                        borderRight: '2.5px solid #1976d2', background: '#f5f7fa'
                    }}
                >
                    <IconButton
                        onClick={handleAddFloor}
                        color="primary"
                        size="small"
                        sx={{ border: '1px dashed #1976d2', width: 32, height: 32, ml: 1 }}
                    >
                        <AddIcon />
                    </IconButton>
                </Box>
            </Box>
            {/* Диалог подтверждения удаления */}
            <Dialog
                open={confirmDelete.open}
                onClose={handleCancelDelete}
            >
                <DialogTitle>
                    {confirmDelete.floor !== null
                        ? `Удалить этаж "${confirmDelete.floor}" со всеми квартирами?`
                        : `Удалить квартиру "${confirmDelete.unit?.name}"?`}
                </DialogTitle>
                <DialogContent>
                    {confirmDelete.floor !== null
                        ? 'Все квартиры на этом этаже будут удалены безвозвратно.'
                        : 'Квартира будет удалена безвозвратно.'}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancelDelete}>Отмена</Button>
                    <Button color="error" variant="contained" onClick={handleConfirmDelete}>
                        Удалить
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
