// src/widgets/CourtCaseStatusesAdmin.tsx

import React, { useState } from 'react';
import { GridActionsCellItem } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import {
    useCourtCaseStatuses,
    useAddCourtCaseStatus,
    useUpdateCourtCaseStatus,
    useDeleteCourtCaseStatus,
} from '@/entities/courtCaseStatus';

import CourtCaseStatusForm from '@/features/courtCaseStatus/CourtCaseStatusForm';
import AdminDataGrid from '@/shared/ui/AdminDataGrid';
import { Dialog, DialogTitle, DialogContent } from '@mui/material';
import { useNotify } from '@/shared/hooks/useNotify';

// Интерфейс пропсов для поддержки пагинации
interface CourtCaseStatusesAdminProps {
    pageSize?: number;
    rowsPerPageOptions?: number[];
}

export default function CourtCaseStatusesAdmin({
                                                  pageSize = 25,
                                                  rowsPerPageOptions = [10, 25, 50, 100],
                                              }: CourtCaseStatusesAdminProps) {
    const notify = useNotify();

    /* -------- данные -------- */
    const { data: stages = [], isPending } = useCourtCaseStatuses();
    const add = useAddCourtCaseStatus();
    const update = useUpdateCourtCaseStatus();
    const remove = useDeleteCourtCaseStatus();

    const [modal, setModal] = useState<null | { mode: 'add' | 'edit'; data?: any }>(null);

    /* -------- колонки -------- */
    const columns = [
        { field: 'id', headerName: 'ID', width: 80 },
        { field: 'name', headerName: 'Название статуса', flex: 1 },
        {
            field: 'actions',
            type: 'actions',
            width: 110,
            getActions: ({ row }) => [
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
                        if (!window.confirm('Удалить статус?')) return;
                        remove.mutate(row.id, {
                            onSuccess: () => notify.success('Статус удалён'),
                            onError: (e) => notify.error(e.message),
                        });
                    }}
                />,
            ],
        },
    ];

    /* -------- helpers -------- */
    const close = () => setModal(null);
    const ok = (msg: string) => { close(); notify.success(msg); };

    /* -------- UI -------- */
    return (
        <>
            {modal && (
                <Dialog open onClose={close} maxWidth="xs" fullWidth>
                    <DialogTitle>
                        {modal.mode === 'add' ? 'Новый статус' : 'Редактировать статус'}
                    </DialogTitle>
                    <DialogContent dividers>
                        <CourtCaseStatusForm
                            initialData={modal.mode === 'edit' ? modal.data : undefined}
                            onSubmit={(d) =>
                                (modal.mode === 'add'
                                    ? add.mutate(d, {
                                          onSuccess: () => ok('Статус создан'),
                                          onError: (e) => notify.error(e.message),
                                      })
                                    : update.mutate(
                                          { id: modal.data.id, updates: d },
                                          {
                                              onSuccess: () => ok('Статус обновлён'),
                                              onError: (e) => notify.error(e.message),
                                          },
                                      ))
                            }
                            onCancel={close}
                        />
                    </DialogContent>
                </Dialog>
            )}

            <AdminDataGrid
                title="Статусы судебного дела"
                rows={stages}
                columns={columns}
                loading={isPending}
                onAdd={() => setModal({ mode: 'add' })}
                pageSize={pageSize}
                rowsPerPageOptions={rowsPerPageOptions}
            />
        </>
    );
}
