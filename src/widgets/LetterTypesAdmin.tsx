import React from 'react';
import { Button, Stack, Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import AdminDataGrid from '@/shared/ui/AdminDataGrid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import {
    useLetterTypes,
    useAddLetterType,
    useUpdateLetterType,
    useDeleteLetterType,
} from '@/entities/letterType';
import LetterTypeForm from '@/features/letterType/LetterTypeForm';

interface LetterTypesAdminProps {
    pageSize?: number;
    rowsPerPageOptions?: number[];
}
export default function LetterTypesAdmin({
    pageSize = 25,
    rowsPerPageOptions = [10, 25, 50, 100],
}: LetterTypesAdminProps) {
    const { data = [], isLoading } = useLetterTypes();
    const add = useAddLetterType();
    const update = useUpdateLetterType();
    const remove = useDeleteLetterType();
    const [open, setOpen] = React.useState(false);
    const [editRow, setEditRow] = React.useState(null);

    const handleAdd = () => { setEditRow(null); setOpen(true); };
    const handleEdit = (row) => { setEditRow(row); setOpen(true); };
    const handleDelete = (id) => { if (window.confirm('Удалить тип?')) remove.mutate(id); };
    const handleSubmit = async (values) => {
        if (editRow) {
            await update.mutateAsync({ id: editRow.id, name: values.name });
        } else {
            await add.mutateAsync(values.name);
        }
        setOpen(false);
    };

    const columns = [
        { field: 'id', headerName: 'ID', width: 80 },
        { field: 'name', headerName: 'Название', flex: 1 },
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
                    <LetterTypeForm
                        initialData={editRow}
                        onSubmit={handleSubmit}
                        onCancel={() => setOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            <AdminDataGrid
                title="Типы писем"
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
