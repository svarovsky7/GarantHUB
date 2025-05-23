import React from 'react';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useDeleteLetter } from '@/entities/letter';

export default function LettersTable({ rows, onEdit }) {
    const remove = useDeleteLetter();

    const columns = [
        { field: 'number', headerName: 'Номер', width: 120 },
        { field: 'letter_type', headerName: 'Тип', width: 140 },
        { field: 'letter_date', headerName: 'Дата', width: 120 },
        { field: 'subject', headerName: 'Тема', flex: 1 },
        {
            field: 'actions',
            type: 'actions',
            width: 80,
            getActions: ({ row }) => [
                <GridActionsCellItem key="e" icon={<EditIcon />} label="Edit" onClick={() => onEdit(row)} />,
                <GridActionsCellItem
                    key="d"
                    icon={<DeleteIcon color="error" />}
                    label="Delete"
                    onClick={() => {
                        if (!window.confirm('Удалить письмо?')) return;
                        remove.mutate({ id: row.id, case_id: row.case_id });
                    }}
                />,
            ],
        },
    ];

    return (
        <DataGrid
            rows={rows}
            columns={columns}
            autoHeight
            hideFooterSelectedRowCount
            disableRowSelectionOnClick
            getRowId={(r) => r.id}
            density="compact"
        />
    );
}
