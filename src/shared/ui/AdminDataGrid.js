/**
 * Универсальный блок: Заголовок + кнопка «Добавить» + DataGrid
 * ------------------------------------------------------------------
 * Использовать так:
 * <AdminDataGrid
 *    title="Проекты"
 *    rows={rows}
 *    columns={columns}
 *    loading={isLoading}
 *    onAdd={() => setModal({mode:'add'})}
 * />
 */
import React from 'react';
import {
    Paper, Box, Typography, Button,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon      from '@mui/icons-material/Add';

export default function AdminDataGrid({
                                          title,
                                          rows,
                                          columns,
                                          loading = false,
                                          onAdd   = null,
                                          pageSize = 100,
                                          ...rest
                                      }) {
    return (
        <Paper elevation={1} sx={{ p: 1.5, mb: 3 }}>
            {/* ───── Заголовок + кнопка ─────────────────────────────── */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                    {title}
                </Typography>

                {onAdd && (
                    <Button
                        variant="contained"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={onAdd}
                    >
                        Добавить
                    </Button>
                )}
            </Box>

            {/* ───── Таблица ───────────────────────────────────────── */}
            <DataGrid
                autoHeight
                rows={rows}
                columns={columns}
                getRowId={(r) => r.id}
                density="compact"
                disableRowSelectionOnClick
                loading={loading}
                hideFooterSelectedRowCount
                pageSizeOptions={[pageSize]}
                initialState={{
                    pagination: { paginationModel: { pageSize } },
                }}
                {...rest}
            />
        </Paper>
    );
}
