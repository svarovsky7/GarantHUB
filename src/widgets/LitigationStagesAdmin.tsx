// src/widgets/LitigationStagesAdmin.tsx

import React, { useState } from 'react';
import { GridActionsCellItem } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import {
    useLitigationStages,
    useAddLitigationStage,
    useUpdateLitigationStage,
    useDeleteLitigationStage,
} from '@/entities/litigationStage';

import LitigationStageForm from '@/features/litigationStage/LitigationStageForm';
import AdminDataGrid from '@/shared/ui/AdminDataGrid';
import { Dialog, DialogTitle, DialogContent } from '@mui/material';
import { useNotify } from '@/shared/hooks/useNotify';

// Интерфейс пропсов для поддержки пагинации
interface LitigationStagesAdminProps {
    pageSize?: number;
    rowsPerPageOptions?: number[];
}

export default function LitigationStagesAdmin({
                                                  pageSize = 25,
                                                  rowsPerPageOptions = [10, 25, 50, 100],
                                              }: LitigationStagesAdminProps) {
    const notify = useNotify();

    /* -------- данные -------- */
    const { data: stages = [], isPending } = useLitigationStages();
    const add = useAddLitigationStage();
    const update = useUpdateLitigationStage();
    const remove = useDeleteLitigationStage();

    const [modal, setModal] = useState<null | { mode: 'add' | 'edit'; data?: any }>(null);

    /* -------- колонки -------- */
    const columns = [
        { field: 'id', headerName: 'ID', width: 80 },
        { field: 'name', headerName: 'Название стадии', flex: 1 },
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
                        if (!window.confirm('Удалить стадию?')) return;
                        remove.mutate(row.id, {
                            onSuccess: () => notify.success('Стадия удалена'),
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
                        {modal.mode === 'add' ? 'Новая стадия' : 'Редактировать стадию'}
                    </DialogTitle>
                    <DialogContent dividers>
                        <LitigationStageForm
                            initialData={modal.mode === 'edit' ? modal.data : undefined}
                            onSubmit={(d) =>
                                (modal.mode === 'add'
                                    ? add.mutate(d, {
                                          onSuccess: () => ok('Стадия создана'),
                                          onError: (e) => notify.error(e.message),
                                      })
                                    : update.mutate(
                                          { id: modal.data.id, updates: d },
                                          {
                                              onSuccess: () => ok('Стадия обновлена'),
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
                title="Стадии судебного дела"
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
