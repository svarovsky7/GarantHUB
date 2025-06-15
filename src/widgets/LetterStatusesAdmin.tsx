import React from 'react';
import { Button, Stack, Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import AdminDataGrid from '@/shared/ui/AdminDataGrid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  useLetterStatuses,
  useAddLetterStatus,
  useUpdateLetterStatus,
  useDeleteLetterStatus,
} from '@/entities/letterStatus';
import LetterStatusForm from '@/features/letterStatus/LetterStatusForm';
import { useNotify } from '@/shared/hooks/useNotify';

interface LetterStatusesAdminProps {
  pageSize?: number;
  rowsPerPageOptions?: number[];
}

export default function LetterStatusesAdmin({
  pageSize = 25,
  rowsPerPageOptions = [10, 25, 50, 100],
}: LetterStatusesAdminProps) {
  const { data = [], isLoading } = useLetterStatuses();
  const add = useAddLetterStatus();
  const update = useUpdateLetterStatus();
  const remove = useDeleteLetterStatus();
  const notify = useNotify();

  const [open, setOpen] = React.useState(false);
  const [editRow, setEditRow] = React.useState<any>(null);

  const handleAdd = () => { setEditRow(null); setOpen(true); };
  const handleEdit = (row: any) => { setEditRow(row); setOpen(true); };
  const handleDelete = (id: number) => {
    if (!window.confirm('Удалить статус?')) return;
    remove.mutate(id, {
      onSuccess: () => notify.success('Статус удалён'),
      onError: (e) => notify.error(e.message),
    });
  };
  const handleSubmit = async (values: { name: string; color: string }) => {
    try {
      if (editRow) {
        await update.mutateAsync({ id: editRow.id, updates: values });
        notify.success('Статус обновлён');
      } else {
        await add.mutateAsync(values);
        notify.success('Статус создан');
      }
      setOpen(false);
    } catch (e: any) {
      notify.error(e.message);
    }
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'name', headerName: 'Название статуса', flex: 1 },
    {
      field: 'color',
      headerName: 'Цвет',
      width: 90,
      renderCell: (params: any) => (
        <div style={{ width: 32, height: 24, background: params.value, border: '1px solid #bbb', borderRadius: 4 }} />
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
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editRow ? 'Редактировать статус' : 'Добавить статус'}</DialogTitle>
        <DialogContent>
          <LetterStatusForm
            initialData={editRow}
            onSubmit={handleSubmit}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <AdminDataGrid
        title="Статусы писем"
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
