import React from 'react';
import { Paper, Box, Tooltip, IconButton, Typography } from '@mui/material';
import EditOutlined from '@mui/icons-material/EditOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';

const CELL_SIZE = 54;

function getFontSize(text) {
    const len = String(text).length;
    if (len <= 3) return 21;
    if (len === 4) return 17;
    if (len === 5) return 15;
    if (len === 6) return 13;
    return 12;
}

export default function UnitCell({ unit, onEditUnit, onDeleteUnit }) {
    const fontSize = getFontSize(unit.name);
    return (
        <Paper
            sx={{
                width: CELL_SIZE,
                height: CELL_SIZE,
                margin: 0.5,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                justifyContent: 'flex-start',
                border: '1.5px solid #dde2ee',
                background: '#fff',
                position: 'relative',
                borderRadius: '12px',
                boxShadow: '0 1px 6px 0 #E3ECFB',
                px: 0,
                py: 0,
                overflow: 'hidden'
            }}
            elevation={0}
        >
            {/* Номер квартиры по центру, занимает всю ширину и высоту кроме футера */}
            <Box
                sx={{
                    flexGrow: 1,
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Typography
                    sx={{
                        fontWeight: 700,
                        fontSize: fontSize,
                        color: '#202746',
                        letterSpacing: 0.5,
                        textAlign: 'center',
                        width: '100%',
                        wordBreak: 'break-all',
                        lineHeight: 1,
                        userSelect: 'none'
                    }}
                    title={unit.name}
                >
                    {unit.name}
                </Typography>
            </Box>
            {/* Нижняя панель с иконками */}
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    minHeight: 21,
                    borderTop: '1px solid #f0f0f8',
                    background: '#f9fafd'
                }}
            >
                <Tooltip title="Переименовать">
                    <IconButton
                        size="small"
                        sx={{
                            color: '#b0b6be',
                            p: '2px',
                            '&:hover': { color: '#1976d2', background: 'transparent' },
                        }}
                        onClick={onEditUnit}
                    >
                        <EditOutlined fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Удалить">
                    <IconButton
                        size="small"
                        sx={{
                            color: '#b0b6be',
                            p: '2px',
                            '&:hover': { color: '#e53935', background: 'transparent' },
                        }}
                        onClick={onDeleteUnit}
                    >
                        <DeleteOutline fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>
        </Paper>
    );
}
