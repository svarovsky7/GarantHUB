import React from 'react';
import { DataGrid, GridActionsCellItem, GridColDef } from '@mui/x-data-grid';
import DeleteIcon from '@mui/icons-material/Delete';
import { useDeleteCaseDefect } from '@/entities/caseDefect';

export default function CaseDefectsTable({ rows }) {
    const remove = useDeleteCaseDefect();

    const columns: GridColDef[] = [
        { field: 'id', headerName: 'ID', width: 80 },
        { field: 'description', headerName: 'Недостаток', flex: 1 },
        { field: 'fix_cost', headerName: 'Стоимость устранения', width: 160 },
        {
            field: 'actions',
            type: 'actions',
            width: 80,
            getActions: ({ row }) => [
                <GridActionsCellItem
                    key="del"
                    icon={<DeleteIcon color="error" />}
                    label="Delete"
                    onClick={() => {
                        if (window.confirm('Удалить недостаток из дела?')) {
                            remove.mutate({ case_id: row.case_id, defect_id: row.id });
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
