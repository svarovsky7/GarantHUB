import React, { useState } from 'react';
import { GridActionsCellItem } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  useDefectDeadlines,
  useAddDefectDeadline,
  useUpdateDefectDeadline,
  useDeleteDefectDeadline,
} from '@/entities/defectDeadline';
import DefectDeadlineForm from '@/features/defectDeadline/DefectDeadlineForm';
import AdminDataGrid from '@/shared/ui/AdminDataGrid';
import { Dialog, DialogTitle, DialogContent } from '@mui/material';
import { useNotify } from '@/shared/hooks/useNotify';
import { useProjects } from '@/entities/project';
import { useTicketTypes } from '@/entities/ticketType';

/** Props for {@link DefectDeadlinesAdmin} */
interface Props {
  pageSize?: number;
  rowsPerPageOptions?: number[];
}

/**
 * Таблица управления сроками устранения дефектов.
 * Показывает название проекта и тип замечания, используя кэшированные списки.
 */
export default function DefectDeadlinesAdmin({
  pageSize = 25,
  rowsPerPageOptions = [10, 25, 50, 100],
}: Props) {
  const notify = useNotify();
  const { data = [], isPending } = useDefectDeadlines();
  const { data: projects = [] } = useProjects();
  const { data: ticketTypes = [] } = useTicketTypes();
  const add = useAddDefectDeadline();
  const update = useUpdateDefectDeadline();
  const remove = useDeleteDefectDeadline();
  const [modal, setModal] = useState<null | { mode: 'add' | 'edit'; data?: any }>(null);

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    {
      field: 'project',
      headerName: 'Проект',
      valueGetter: ({ row }: any) =>
        row?.project?.name ??
        projects.find((p) => p.id === row?.project_id)?.name ??
        '',
      flex: 1,
    },
    {
      field: 'ticket_type',
      headerName: 'Тип дефекта',
      valueGetter: ({ row }: any) =>
        row?.ticket_type?.name ??
        ticketTypes.find((t) => t.id === row?.ticket_type_id)?.name ??
        '',
      flex: 1,
    },
    { field: 'fix_days', headerName: 'Срок (дн.)', width: 120 },
    {
      field: 'actions',
      type: 'actions',
      width: 100,
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
        <Dialog open onClose={close} maxWidth="sm" fullWidth>
          <DialogTitle>
            {modal.mode === 'add' ? 'Новая запись' : 'Редактировать запись'}
          </DialogTitle>
          <DialogContent dividers>
            <DefectDeadlineForm
              initialData={modal.mode === 'edit' ? modal.data : undefined}
              onSubmit={(d) =>
                modal.mode === 'add'
                  ? add.mutate(d, {
                      onSuccess: () => ok('Запись создана'),
                      onError: (e) => notify.error(e.message),
                    })
                  : update.mutate(
                      { id: modal.data.id, updates: d },
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
        title="Сроки устранения дефектов"
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
