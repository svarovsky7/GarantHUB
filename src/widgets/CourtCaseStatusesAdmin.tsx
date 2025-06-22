// src/widgets/CourtCaseStatusesAdmin.tsx

import React, { useState } from 'react';
import { GridActionsCellItem } from '@mui/x-data-grid';
import { Edit2, Trash2 } from 'lucide-react';

import {
    useCourtCaseStatuses,
    useAddCourtCaseStatus,
    useUpdateCourtCaseStatus,
    useDeleteCourtCaseStatus,
} from '@/entities/courtCaseStatus';

import CourtCaseStatusForm from '@/features/courtCaseStatus/CourtCaseStatusForm';
import AdminDataGrid from '@/shared/ui/AdminDataGrid';
import { Modal } from 'antd';
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
        { field: 'name', headerName: 'Название стадии', flex: 1 },
        {
            field: 'color',
            headerName: 'Цвет',
            width: 90,
            renderCell: (params: any) => (
                <div
                    style={{
                        width: 32,
                        height: 24,
                        background: params.value,
                        border: '1px solid #bbb',
                        borderRadius: 4,
                    }}
                />
            ),
        },
        {
            field: 'actions',
            type: 'actions',
            width: 110,
            getActions: ({ row }) => [
                <GridActionsCellItem
                    key="edit"
                    icon={<Edit2 size={16} />}
                    label="Редактировать"
                    onClick={() => setModal({ mode: 'edit', data: row })}
                />,
                <GridActionsCellItem
                    key="del"
                    icon={<Trash2 color="red" size={16} />}
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
                <Modal
                    open
                    onCancel={close}
                    title={modal.mode === 'add' ? 'Новая стадия' : 'Редактировать стадию'}
                    footer={null}
                    destroyOnHidden
                >
                    <CourtCaseStatusForm
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
                </Modal>
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
