import React, { useEffect, useState } from 'react';
import { GridActionsCellItem } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useBrigades, useDeleteBrigade } from '@/entities/brigade';
import BrigadeForm from '@/features/brigade/BrigadeForm';
import AdminDataGrid from '@/shared/ui/AdminDataGrid';
import { useNotify } from '@/shared/hooks/useNotify';
import { Dialog, DialogTitle, DialogContent } from '@mui/material';

interface Props {
  pageSize?: number;
  rowsPerPageOptions?: number[];
}

export default function BrigadesAdmin({
  pageSize = 25,
  rowsPerPageOptions = [10, 25, 50, 100],
}: Props) {
  const notify = useNotify();
  const { data: brigades = [], isPending, error } = useBrigades();
  const remove = useDeleteBrigade();
  const [modal, setModal] = useState<null | { mode: 'add' | 'edit'; data?: any }>(null);

  useEffect(() => {
    if (error) {
      console.error('[BrigadesAdmin] load error:', error);
      notify.error(`Ошибка загрузки бригад: ${error.message}`);
    } else if (!isPending && brigades.length === 0) {
      notify.info('Записей не найдено');
    }
  }, [error, isPending, brigades, notify]);

  const columns = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'name', headerName: 'Название', flex: 1 },
    {
      field: 'actions',
      type: 'actions',
      width: 110,
      getActions: ({ row }: any) => [
        <GridActionsCellItem
          key="edit"
          icon={<EditIcon />}
          label="Редактировать"
          onClick={() => setModal({ mode: 'edit', data: row })}
        />,
        <GridActionsCellItem
          key="del"
          icon={<DeleteIcon color="error" />}
          label="Удалить"
          onClick={() => {
            if (!window.confirm('Удалить бригаду?')) return;
            remove.mutate(row.id, {
              onSuccess: () => notify.success('Бригада удалена'),
              onError: (e) => notify.error(e.message),
            });
          }}
        />,
      ],
    },
  ];

  const close = () => setModal(null);
  const ok = (msg: string) => {
    close();
    notify.success(msg);
  };

  return (
    <>
      {modal && (
        <Dialog open onClose={close} maxWidth="sm" fullWidth>
          <DialogTitle>
            {modal.mode === 'add' ? 'Новая бригада' : 'Редактировать бригаду'}
          </DialogTitle>
          <DialogContent>
            <BrigadeForm
              initialData={modal.mode === 'edit' ? modal.data : undefined}
              onSuccess={() =>
                ok(modal.mode === 'add' ? 'Бригада создана' : 'Бригада обновлена')
              }
              onCancel={close}
            />
          </DialogContent>
        </Dialog>
      )}

      <AdminDataGrid
        title="Бригады"
        rows={brigades}
        columns={columns}
        loading={isPending}
        onAdd={() => setModal({ mode: 'add' })}
        pageSize={pageSize}
        rowsPerPageOptions={rowsPerPageOptions}
      />
    </>
  );
}
