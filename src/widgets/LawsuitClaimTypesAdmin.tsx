import React, { useState } from 'react';
import { GridActionsCellItem } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AdminDataGrid from '@/shared/ui/AdminDataGrid';
import {
  useLawsuitClaimTypes,
  useAddLawsuitClaimType,
  useUpdateLawsuitClaimType,
  useDeleteLawsuitClaimType,
} from '@/entities/lawsuitClaimType';
import LawsuitClaimTypeForm from '@/features/lawsuitClaimType/LawsuitClaimTypeForm';
import { Dialog, DialogTitle, DialogContent } from '@mui/material';
import { useNotify } from '@/shared/hooks/useNotify';

interface LawsuitClaimTypesAdminProps {
  pageSize?: number;
  rowsPerPageOptions?: number[];
}

export default function LawsuitClaimTypesAdmin({
  pageSize = 25,
  rowsPerPageOptions = [10, 25, 50, 100],
}: LawsuitClaimTypesAdminProps) {
  const notify = useNotify();
  const { data = [], isPending } = useLawsuitClaimTypes();
  const add = useAddLawsuitClaimType();
  const update = useUpdateLawsuitClaimType();
  const remove = useDeleteLawsuitClaimType();

  const [modal, setModal] = useState<null | { mode: 'add' | 'edit'; data?: any }>(null);

  const columns = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'name', headerName: 'Название требования', flex: 1 },
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
            if (!window.confirm('Удалить запись?')) return;
            remove.mutate(row.id, {
              onSuccess: () => notify.success('Запись удалена'),
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
        <Dialog open onClose={close} maxWidth="xs" fullWidth>
          <DialogTitle>
            {modal.mode === 'add' ? 'Новый вид требования' : 'Редактировать вид требования'}
          </DialogTitle>
          <DialogContent dividers>
            <LawsuitClaimTypeForm
              initialData={modal.mode === 'edit' ? modal.data : undefined}
              onSubmit={(d) =>
                modal.mode === 'add'
                  ? add.mutate(d.name, {
                      onSuccess: () => ok('Запись создана'),
                      onError: (e) => notify.error(e.message),
                    })
                  : update.mutate(
                      { id: modal.data.id, name: d.name },
                      {
                        onSuccess: () => ok('Запись обновлена'),
                        onError: (e) => notify.error(e.message),
                      },
                    )
              }
              onCancel={close}
            />
          </DialogContent>
        </Dialog>
      )}

      <AdminDataGrid
        title="Виды исковых требований"
        rows={data}
        columns={columns}
        loading={isPending}
        onAdd={() => setModal({ mode: 'add' })}
        pageSize={pageSize}
        rowsPerPageOptions={rowsPerPageOptions}
      />
    </>
  );
}
