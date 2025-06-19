import React from 'react';
import {
  useClaimStatuses,
  useAddClaimStatus,
  useUpdateClaimStatus,
  useDeleteClaimStatus,
} from '@/entities/claimStatus';
import { Button, Stack, Dialog, DialogTitle, DialogContent, IconButton, Box } from '@mui/material';
import AdminDataGrid from '@/shared/ui/AdminDataGrid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ClaimStatusForm from '@/features/claimStatus/ClaimStatusForm';

interface Props {
  pageSize?: number;
  rowsPerPageOptions?: number[];
}

export default function ClaimStatusesAdmin({ pageSize = 25, rowsPerPageOptions = [10, 25, 50, 100] }: Props) {
  const { data = [], isLoading } = useClaimStatuses();
  const addMutation = useAddClaimStatus();
  const updateMutation = useUpdateClaimStatus();
  const deleteMutation = useDeleteClaimStatus();

  const [open, setOpen] = React.useState(false);
  const [editRow, setEditRow] = React.useState<any>(null);

  const handleAdd = () => { setEditRow(null); setOpen(true); };
  const handleEdit = (row: any) => { setEditRow(row); setOpen(true); };
  const handleDelete = (id: number) => {
    if (window.confirm('Удалить статус претензии?')) deleteMutation.mutate(id);
  };

  const handleSubmit = async (values: { name: string; color: string }) => {
    if (editRow) {
      await (updateMutation.mutateAsync as any)({ id: editRow.id, updates: values });
    } else {
      await (addMutation.mutateAsync as any)(values);
    }
    setOpen(false);
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'name', headerName: 'Название статуса', flex: 1 },
    {
      field: 'color',
      headerName: 'Цвет',
      width: 90,
      renderCell: (params: any) => (
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
      renderCell: (params: any) => (
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
        <DialogTitle>{editRow ? 'Редактировать статус' : 'Добавить статус'}</DialogTitle>
        <DialogContent>
          <ClaimStatusForm
            initialData={editRow}
            onSubmit={handleSubmit}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
      <AdminDataGrid
        title="Статусы претензий"
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
