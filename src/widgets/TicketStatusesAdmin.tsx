// src/widgets/TicketStatusesAdmin.js
import React from 'react';
import { useTicketStatuses, useAddTicketStatus, useUpdateTicketStatus, useDeleteTicketStatus } from '@/entities/ticketStatus';
import { DataGrid } from '@mui/x-data-grid';
import { Button, Stack, Dialog, DialogTitle, DialogContent, IconButton, Box } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import TicketStatusForm from '@/features/ticketStatus/TicketStatusForm';

export default function TicketStatusesAdmin({ pageSize = 25, rowsPerPageOptions = [10, 25, 50, 100] }) {
    const { data = [], isLoading } = useTicketStatuses();
    const addMutation = useAddTicketStatus();
    const updateMutation = useUpdateTicketStatus();
    const deleteMutation = useDeleteTicketStatus();

    const [open, setOpen] = React.useState(false);
    const [editRow, setEditRow] = React.useState(null);

    const handleAdd = () => { setEditRow(null); setOpen(true); };
    const handleEdit = (row) => { setEditRow(row); setOpen(true); };
    const handleDelete = (id) => { if (window.confirm('Удалить статус?')) deleteMutation.mutate(id); };
    const handleSubmit = async (values) => {
        if (editRow) {
            await updateMutation.mutateAsync({ id: editRow.id, updates: values });
        } else {
            await addMutation.mutateAsync(values);
        }
        setOpen(false);
    };

    return (
        <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
                <span style={{ fontWeight: 600, fontSize: 18 }}>Статусы замечаний</span>
                <Button onClick={handleAdd} variant="contained">Добавить</Button>
            </Stack>
            <div style={{ width: '100%' }}>
                <DataGrid
                    rows={data}
                    columns={[
                        { field: 'id', headerName: 'ID', width: 80 },
                        { field: 'name', headerName: 'Название статуса', flex: 1 },
                        { field: 'description', headerName: 'Описание', flex: 1 },
                        {
                            field: 'color',
                            headerName: 'Цвет',
                            width: 90,
                            renderCell: (params) => (
                                <Box
                                    sx={{
                                        width: 32,
                                        height: 24,
                                        bgcolor: params.value,
                                        border: '1px solid #bbb',
                                        borderRadius: 0.5,
                                    }}
                                />
                            ),
                        },
                        {
                            field: 'actions',
                            headerName: '',
                            width: 100,
                            sortable: false,
                            renderCell: (params) => (
                                <Stack direction="row" spacing={0}>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleEdit(params.row)}
                                        color="primary"
                                    >
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => handleDelete(params.row.id)}
                                    >
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
            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{editRow ? 'Редактировать статус' : 'Добавить статус'}</DialogTitle>
                <DialogContent>
                    <TicketStatusForm
                        initialData={editRow}
                        onSubmit={handleSubmit}
                        onCancel={() => setOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </Stack>
    );
}
