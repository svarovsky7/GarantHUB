import React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Button, Stack, Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import {
    useCourtCaseStatuses,
    useAddCourtCaseStatus,
    useUpdateCourtCaseStatus,
    useDeleteCourtCaseStatus,
} from '@/entities/courtCaseStatus';
import CourtCaseStatusForm from '@/features/courtCaseStatus/CourtCaseStatusForm';

export default function CourtCaseStatusesAdmin({ pageSize = 25, rowsPerPageOptions = [10, 25, 50, 100] }) {
    const { data = [], isLoading } = useCourtCaseStatuses();
    const add = useAddCourtCaseStatus();
    const update = useUpdateCourtCaseStatus();
    const remove = useDeleteCourtCaseStatus();
    const [open, setOpen] = React.useState(false);
    const [editRow, setEditRow] = React.useState(null);

    const handleAdd = () => { setEditRow(null); setOpen(true); };
    const handleEdit = (row) => { setEditRow(row); setOpen(true); };
    const handleDelete = (id) => { if (window.confirm('Удалить статус?')) remove.mutate(id); };
    const handleSubmit = async (values) => {
        if (editRow) {
            await update.mutateAsync({ id: editRow.id, name: values.name });
        } else {
            await add.mutateAsync(values.name);
        }
        setOpen(false);
    };

    return (
        <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
                <span style={{ fontWeight: 600, fontSize: 18 }}>Статусы дел</span>
                <Button onClick={handleAdd} variant="contained">Добавить</Button>
            </Stack>
            <div style={{ width: '100%' }}>
                <DataGrid
                    rows={data}
                    columns={[
                        { field: 'id', headerName: 'ID', width: 80 },
                        { field: 'name', headerName: 'Название статуса', flex: 1 },
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
                    ]}
                    pageSize={pageSize}
                    rowsPerPageOptions={rowsPerPageOptions}
                    autoHeight
                    loading={isLoading}
                    disableSelectionOnClick
                />
            </div>
            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>{editRow ? 'Редактировать статус' : 'Добавить статус'}</DialogTitle>
                <DialogContent>
                    <CourtCaseStatusForm
                        initialData={editRow}
                        onSubmit={handleSubmit}
                        onCancel={() => setOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </Stack>
    );
}
