// src/widgets/TicketStatusesAdmin.js
// -------------------------------------------------------------
// CRUD-таблица статусов замечаний
// -------------------------------------------------------------
import React, { useState } from 'react';
import { GridActionsCellItem } from '@mui/x-data-grid';
import EditIcon   from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import {
    useTicketStatuses,
    useAddTicketStatus,
    useUpdateTicketStatus,
    useDeleteTicketStatus,
} from '@/entities/ticketStatus';

import TicketStatusForm from '@/features/ticketStatus/TicketStatusForm';
import AdminDataGrid    from '@/shared/ui/AdminDataGrid';
import { useNotify }    from '@/shared/hooks/useNotify';

/** Админ-виджет статусов */
export default function TicketStatusesAdmin() {
    const notify = useNotify();

    /* -------- данные -------- */
    const { data: statuses = [], isPending } = useTicketStatuses();
    const add    = useAddTicketStatus();
    const update = useUpdateTicketStatus();
    const remove = useDeleteTicketStatus();

    const [modal, setModal] = useState(null); // {mode:'add'|'edit', data?}

    /* -------- колонки -------- */
    const columns = [
        { field: 'id',   headerName: 'ID',   width: 80 },
        { field: 'name', headerName: 'Название', flex: 1 },
        {
            field     : 'description',
            headerName: 'Описание',
            flex      : 2,
            renderCell: ({ value }) => value ?? '—',
        },
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
                        if (!window.confirm('Удалить статус?')) return;
                        remove.mutate(row.id, {
                            onSuccess: () => notify.success('Статус удалён'),
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
                <TicketStatusForm
                    onSubmit={(d) =>
                        add.mutate(d, {
                            onSuccess: () => ok('Статус создан'),
                            onError  : (e) => notify.error(e.message),
                        })}
                    onCancel={close}
                />
            )}

            {modal?.mode === 'edit' && (
                <TicketStatusForm
                    initialData={modal.data}
                    onSubmit={(d) =>
                        update.mutate(
                            { id: modal.data.id, updates: d },
                            {
                                onSuccess: () => ok('Статус обновлён'),
                                onError  : (e) => notify.error(e.message),
                            },
                        )}
                    onCancel={close}
                />
            )}

            <AdminDataGrid
                title="Статусы замечаний"
                rows={statuses}
                columns={columns}
                loading={isPending}
                onAdd={() => setModal({ mode: 'add' })}
            />
        </>
    );
}
