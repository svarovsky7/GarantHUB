// src/widgets/LitigationStagesAdmin.js
// -------------------------------------------------------------
// CRUD-таблица стадий судебного дела
// -------------------------------------------------------------
import React, { useState } from 'react';
import { GridActionsCellItem } from '@mui/x-data-grid';
import EditIcon   from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import {
    useLitigationStages,
    useAddLitigationStage,
    useUpdateLitigationStage,
    useDeleteLitigationStage,
} from '@/entities/litigationStage';

import LitigationStageForm from '@/features/litigationStage/LitigationStageForm';
import AdminDataGrid       from '@/shared/ui/AdminDataGrid';
import { useNotify }       from '@/shared/hooks/useNotify';

export default function LitigationStagesAdmin() {
    const notify = useNotify();

    /* -------- данные -------- */
    const { data: stages = [], isPending } = useLitigationStages();
    const add    = useAddLitigationStage();
    const update = useUpdateLitigationStage();
    const remove = useDeleteLitigationStage();

    const [modal, setModal] = useState(null); // {mode:'add'|'edit', data?}

    /* -------- колонки -------- */
    const columns = [
        { field: 'id',   headerName: 'ID',   width: 80 },
        { field: 'name', headerName: 'Название стадии', flex: 1 },
        {
            field : 'actions',
            type  : 'actions',
            width : 110,
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
                            onError  : (e) => notify.error(e.message),
                        });
                    }}
                />,
            ],
        },
    ];

    /* -------- helpers -------- */
    const close = () => setModal(null);
    const ok    = (msg) => { close(); notify.success(msg); };

    /* -------- UI -------- */
    return (
        <>
            {modal?.mode === 'add' && (
                <LitigationStageForm
                    onSubmit={(d) =>
                        add.mutate(d, {
                            onSuccess: () => ok('Стадия создана'),
                            onError  : (e) => notify.error(e.message),
                        })}
                    onCancel={close}
                />
            )}

            {modal?.mode === 'edit' && (
                <LitigationStageForm
                    initialData={modal.data}
                    onSubmit={(d) =>
                        update.mutate(
                            { id: modal.data.id, updates: d },
                            {
                                onSuccess: () => ok('Стадия обновлена'),
                                onError  : (e) => notify.error(e.message),
                            },
                        )}
                    onCancel={close}
                />
            )}

            <AdminDataGrid
                title="Стадии судебного дела"
                rows={stages}
                columns={columns}
                loading={isPending}
                onAdd={() => setModal({ mode: 'add' })}
            />
        </>
    );
}
