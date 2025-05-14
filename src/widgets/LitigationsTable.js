// src/widgets/LitigationsTable.js
// -----------------------------------------------------------------------------
// Таблица судебных дел на базе MUI DataGrid (robust valueGetters)
// -----------------------------------------------------------------------------

import React, { useMemo } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Box } from '@mui/material';

/**
 * @param {{data:Array, loading:boolean}} props
 */
export default function LitigationsTable({ data, loading }) {
    /* --------------------- Колонки --------------------- */
    const columns = useMemo(
        () => [
            { field: 'court_number', headerName: '№ дела', flex: 1 },
            { field: 'court_name',   headerName: 'Суд',     flex: 1.5 },
            {
                field: 'stage',
                headerName: 'Стадия',
                flex: 1,
                valueGetter: (p) => p?.row?.stage?.name ?? '',
            },
            {
                field: 'claimant',
                headerName: 'Истец',
                flex: 1.5,
                valueGetter: (p) => p?.row?.claimant?.full_name ?? '',
            },
            {
                field: 'defendant',
                headerName: 'Ответчик',
                flex: 1.5,
                valueGetter: (p) => p?.row?.defendant?.name ?? '',
            },
            {
                field: 'main_amount',
                headerName: 'Сумма, ₽',
                type: 'number',
                flex: 1,
                valueFormatter: (p) =>
                    Number(p?.value ?? 0).toLocaleString('ru-RU'),
            },
            {
                field: 'lawsuit_date',
                headerName: 'Дата иска',
                flex: 1,
                valueFormatter: (p) =>
                    p?.value ? new Date(p.value).toLocaleDateString('ru-RU') : '—',
            },
            {
                field: 'decision_date',
                headerName: 'Дата решения',
                flex: 1,
                valueFormatter: (p) =>
                    p?.value ? new Date(p.value).toLocaleDateString('ru-RU') : '—',
            },
        ],
        [],
    );

    /* -------------------- UI рендер -------------------- */
    return (
        <Box sx={{ height: 540, width: '100%' }}>
            <DataGrid
                rows={data}
                columns={columns}
                loading={loading}
                density="compact"
                disableRowSelectionOnClick
                getRowId={(row) => row.id}
                pageSizeOptions={[10, 25, 50]}
                initialState={{
                    pagination: { paginationModel: { pageSize: 25 } },
                }}
            />
        </Box>
    );
}
