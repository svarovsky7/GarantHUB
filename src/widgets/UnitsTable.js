import React, { useState } from 'react';
import { GridActionsCellItem } from '@mui/x-data-grid';
import EditIcon   from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import UnitForm            from '@/features/unit/UnitForm';
import { useUnits, useDeleteUnit } from '@/entities/unit';
import AdminDataGrid       from '@/shared/ui/AdminDataGrid';
import { useNotify }       from '@/shared/hooks/useNotify';

export default function UnitsTable() {
    const notify                          = useNotify();
    const { data: units = [], isLoading } = useUnits();
    const delUnit                         = useDeleteUnit();

    const [dialog, setDialog] = useState(null); // {mode:'edit', unit}

    const columns = [
        { field: 'id',   headerName: 'ID',      width: 70 },
        {
            field      : 'project',
            headerName : 'Проект',
            flex       : 1,
            /* CHANGE: опциональные цепочки на каждом уровне */
            valueGetter: (p) => p?.row?.project?.name ?? '—',
        },
        { field: 'name', headerName: 'Квартира', width: 130 },
        {
            field      : 'person',
            headerName : 'Физлицо',
            flex       : 1.5,
            valueGetter: (p) => p?.row?.persons?.[0]?.full_name ?? '—',  // CHANGE
        },
        {
            field : 'actions',
            type  : 'actions',
            width : 90,
            getActions: ({ row }) => [
                <GridActionsCellItem
                    key="edit"
                    icon={<EditIcon />}
                    label="Редактировать"
                    onClick={() => setDialog({ mode: 'edit', unit: row })}
                />,
                <GridActionsCellItem
                    key="del"
                    icon={<DeleteIcon color="error" />}
                    label="Удалить"
                    onClick={() => {
                        if (!window.confirm('Удалить объект?')) return;
                        delUnit.mutate(row.id, { onSuccess: () => notify.success('Объект удалён') });
                    }}
                />,
            ],
        },
    ];

    return (
        <>
            {dialog?.mode === 'edit' && (
                <UnitForm
                    initialData={dialog.unit}
                    onCancel={() => setDialog(null)}
                    onSuccess={() => setDialog(null)}
                />
            )}

            <AdminDataGrid
                title="Объекты"
                rows={units}
                columns={columns}
                loading={isLoading}
                onAdd={() => setDialog({ mode: 'edit', unit: null })}
            />
        </>
    );
}
