import React from 'react';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useDeleteLetter } from '@/entities/letter';

export default function LettersTable({ rows, onEdit }) {
    const remove = useDeleteLetter();

    const columns = [
        { field: 'id', headerName: 'ID', width: 80 },
        { field: 'number', headerName: 'Номер', flex: 1 },
        { field: 'letter_date', headerName: 'Дата', width: 120 },
        { field: 'letter_type', headerName: 'Тип', width: 140 },
        { field: 'subject', headerName: 'Тема', flex: 1 },
        {
            field: 'actions',
            type: 'actions',
            width: 80,
            getActions: ({ row }) => [
                <GridActionsCellItem key="edit" icon={<EditIcon />} label="Edit" onClick={() => onEdit(row)} />,
                <GridActionsCellItem
                    key="del"
                    icon={<DeleteIcon color="error" />}
                    label="Delete"
                    onClick={() => {
                        if (window.confirm('Удалить письмо?')) {
                            remove.mutate({ id: row.id, case_id: row.case_id });
                        }
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
