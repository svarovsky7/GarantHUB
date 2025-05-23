import React from 'react';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useDeleteCourtCase } from '@/entities/courtCase';

export default function CourtCasesTable({ rows, onEdit }) {
    const remove = useDeleteCourtCase();

    const columns = [
        { field: 'id', headerName: 'ID', width: 80 },
        { field: 'internal_no', headerName: 'Номер', flex: 1 },
        { field: 'unit_name', headerName: 'Объект', flex: 1 },
        { field: 'stage_name', headerName: 'Стадия', flex: 1 },
        { field: 'status', headerName: 'Статус', width: 140 },
        {
            field: 'actions',
            type: 'actions',
            width: 100,
            getActions: ({ row }) => [
                <GridActionsCellItem key="edit" icon={<EditIcon />} label="Edit" onClick={() => onEdit(row)} />,
                <GridActionsCellItem
                    key="del"
                    icon={<DeleteIcon color="error" />}
                    label="Delete"
                    onClick={() => {
                        if (!window.confirm('Удалить дело?')) return;
                        remove.mutate(row.id);
                    }}
                />,
            ],
        },
    ];

    return (
        <DataGrid
            autoHeight
            rows={rows}
            columns={columns}
            getRowId={(r) => r.id}
            density="compact"
            hideFooterSelectedRowCount
            disableRowSelectionOnClick
        />
    );
}
