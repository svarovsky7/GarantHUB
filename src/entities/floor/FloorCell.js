import React from 'react';
import { Box, Tooltip, IconButton } from '@mui/material';
import UnitCell from '@/entities/unit/UnitCell';
import EditOutlined from '@mui/icons-material/EditOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';

const CELL_SIZE = 54;
const FLOOR_COLOR = "#1976d2";

export default function FloorCell({
                                      floor,
                                      units,
                                      onAddUnit,
                                      onEditFloor,
                                      onDeleteFloor,
                                      onEditUnit,
                                      onDeleteUnit,
                                  }) {
    return (
        <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', mb: 1 }}>
            <Box
                sx={{
                    width: 80, minWidth: 80, height: CELL_SIZE,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    borderRight: '2.5px solid #1976d2',
                    borderRadius: '12px 0 0 12px',
                    background: '#fff',
                    fontWeight: 600, fontSize: 20, position: 'relative',
                    color: FLOOR_COLOR, px: 2, boxShadow: '0 1px 6px 0 #E3ECFB',
                    mr: 1,
                }}
            >
                <span>{floor}</span>
                <Box sx={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', position: 'absolute', right: 8, top: 6, zIndex: 2
                }}>
                    <Tooltip title="Переименовать этаж">
                        <IconButton
                            size="small"
                            sx={{
                                color: '#b0b6be', opacity: 0.8, mb: 0.2, background: '#F8FAFF',
                                '&:hover': { color: FLOOR_COLOR, background: '#e3ecfb' }
                            }}
                            onClick={() => onEditFloor?.(floor)}
                        >
                            <EditOutlined fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Удалить этаж">
                        <IconButton
                            size="small"
                            sx={{
                                color: '#b0b6be', opacity: 0.8, mt: 0.2, background: '#F8FAFF',
                                '&:hover': { color: '#e53935', background: '#fdeaea' }
                            }}
                            onClick={() => onDeleteFloor?.(floor)}
                        >
                            <DeleteOutline fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>
            {units.map(unit => (
                <UnitCell
                    key={unit.id}
                    unit={unit}
                    onEditUnit={() => onEditUnit?.(unit)}
                    onDeleteUnit={() => onDeleteUnit?.(unit)}
                />
            ))}
            <Box
                sx={{
                    width: CELL_SIZE, height: CELL_SIZE, ml: 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1.5px dashed #1976d2',
                    borderRadius: '12px',
                    bgcolor: '#F3F7FF',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    '&:hover': { bgcolor: '#e3ecfb' }
                }}
                onClick={onAddUnit}
            >
                <AddIcon fontSize="medium" sx={{ color: FLOOR_COLOR }} />
            </Box>
        </Box>
    );
}
