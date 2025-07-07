// src/widgets/DefectTypesAdmin.tsx
import React from 'react';
import {
    useDefectTypes,
    useAddDefectType,
    useUpdateDefectType,
    useDeleteDefectType,
} from '@/entities/defectType';
import { Button, Stack, Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import AdminDataGrid from '@/shared/ui/AdminDataGrid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DefectTypeForm from '@/features/defectType/DefectTypeForm';

interface DefectTypesAdminProps {
    pageSize?: number;
    rowsPerPageOptions?: number[];
}
export default function DefectTypesAdmin({
    pageSize = 25,
    rowsPerPageOptions = [10, 25, 50, 100],
}: DefectTypesAdminProps) {
    const { data = [], isLoading } = useDefectTypes();
    const addMutation = useAddDefectType();
    const updateMutation = useUpdateDefectType();
    const deleteMutation = useDeleteDefectType();

    const [open, setOpen] = React.useState(false);
    const [editRow, setEditRow] = React.useState(null);

    const handleAdd = () => {
        setEditRow(null);
        setOpen(true);
    };

    const handleEdit = (row) => {
        setEditRow(row);
        setOpen(true);
    };

    const handleDelete = (id) => {
        if (window.confirm('Удалить тип замечания?')) {
            deleteMutation.mutate(id);
        }
    };

    const handleSubmit = async (values) => {
        if (editRow) {
            await (updateMutation.mutateAsync as any)({ id: editRow.id, name: values.name });
        } else {
            await (addMutation.mutateAsync as any)(values.name);
        }
        setOpen(false);
    };

    const columns = [
        { field: 'id', headerName: 'ID', width: 80 },
        { field: 'name', headerName: 'Название типа', flex: 1 },
        {
            field: 'actions',
            headerName: '',
            width: 100,
            sortable: false,
            renderCell: (params) => (
                <Stack direction="row" spacing={0}>
                    <IconButton size="small" onClick={() => handleEdit(params.row)} color="primary">
                        <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(params.row.id)}>
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Stack>
            ),
        },
    ];

    return (
        <>
            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>{editRow ? 'Редактировать тип' : 'Добавить тип'}</DialogTitle>
                <DialogContent>
                    <DefectTypeForm
                        initialData={editRow}
                        onSubmit={(values) => handleSubmit(values)}
                        onCancel={() => setOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            <AdminDataGrid
                title="Типы дефектов"
                rows={data}
                columns={columns}
                loading={isLoading}
                onAdd={handleAdd}
                pageSize={pageSize}
                rowsPerPageOptions={rowsPerPageOptions}
            />
        </>
    );
}
