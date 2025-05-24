import React from 'react';
import { Paper, Box, Tooltip, IconButton, Typography } from '@mui/material';
import EditOutlined from '@mui/icons-material/EditOutlined';
import DeleteOutline from '@mui/icons-material/DeleteOutline';

const CELL_SIZE = 54;

// Функция для hex → rgba
function getSemiTransparent(color, alpha = 0.30) {
    if (!color) return undefined;
    if (color.startsWith('#') && color.length === 7) {
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${alpha})`;
    }
    return color;
}

export default function UnitCell({
                                     unit,
                                     tickets = [],
                                     onEditUnit,
                                     onDeleteUnit,
                                     onAction,
                                 }) {
    // Берём первый тикет для окраски (или нужную бизнес-логику)
    const ticket = Array.isArray(tickets) && tickets.length > 0 ? tickets[0] : null;
    const bgColor = ticket && ticket.color ? getSemiTransparent(ticket.color) : '#fff';

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
                background: bgColor,
                borderRadius: '12px',
                boxShadow: '0 1px 6px 0 #E3ECFB',
                px: 0,
                py: 0,
                overflow: 'hidden',
                cursor: 'pointer',
                transition: 'box-shadow .15s, border-color .15s, background .15s',
                '&:hover': {
                    boxShadow: '0 4px 16px 0 #b5d2fa',
                    borderColor: '#1976d2',
                    background: ticket && ticket.color ? getSemiTransparent(ticket.color, 0.55) : '#f6faff',
                },
                position: 'relative',
            }}
            elevation={0}
            onClick={(e) => {
                const target = e.target as HTMLElement;
                if (
                    target.closest('.unit-action-icon') ||
                    target.closest('.MuiTooltip-popper')
                ) return;
                onAction?.(unit);
            }}
        >
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
                        fontSize: 18,
                        color: '#202746',
                        textAlign: 'center',
                        width: '100%',
                        wordBreak: 'break-all',
                        lineHeight: 1.05,
                        userSelect: 'none',
                    }}
                    title={unit.name}
                >
                    {unit.name}
                </Typography>
            </Box>
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
                        className="unit-action-icon"
                        sx={{
                            color: '#b0b6be',
                            p: '2px',
                            '&:hover': { color: '#1976d2', background: 'transparent' },
                        }}
                        onClick={e => { e.stopPropagation(); onEditUnit?.(unit); }}
                    >
                        <EditOutlined fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Удалить">
                    <IconButton
                        size="small"
                        className="unit-action-icon"
                        sx={{
                            color: '#b0b6be',
                            p: '2px',
                            '&:hover': { color: '#e53935', background: 'transparent' },
                        }}
                        onClick={e => { e.stopPropagation(); onDeleteUnit?.(unit); }}
                    >
                        <DeleteOutline fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>
        </Paper>
    );
}
