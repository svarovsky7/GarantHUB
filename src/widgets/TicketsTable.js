import React, { useState } from 'react';
import { GridActionsCellItem } from '@mui/x-data-grid';
import EditIcon   from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import {
    usePersons,
    useAddPerson,
    useUpdatePerson,
    useDeletePerson,
} from '../entities/person';

import PersonForm     from '../features/person/PersonForm';
import AdminDataGrid  from '../shared/ui/AdminDataGrid';
import { useNotify }  from '../shared/hooks/useNotify';

export default function PersonsAdmin() {
    const notify                              = useNotify();
    const { data: persons = [], isPending }   = usePersons();

    const add    = useAddPerson();
    const update = useUpdatePerson();
    const remove = useDeletePerson();

    const [modal, setModal] = useState(null);       // {mode:'add'|'edit', data?}

    /* ───── columns ─────────────────────────────────────────── */
    const columns = [
        { field: 'id',        headerName: 'ID',    width: 80 },
        { field: 'full_name', headerName: 'ФИО',   flex : 1 },
        {
            field      : 'phone',
            headerName : 'Телефон',
            width      : 160,
            valueGetter: (p) => p?.row?.phone || '—',
        },
        {
            field      : 'email',
            headerName : 'E-mail',
            flex       : 1,
            valueGetter: (p) => p?.row?.email || '—',
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
                        if (!window.confirm('Удалить запись?')) return;
                        remove.mutate(row.id, {
                            onSuccess: () => notify.success('Физлицо удалено'),
                            onError  : (e) => notify.error(e.message),
                        });
                    }}
                />,
            ],
        },
    ];

    /* ───── helpers ─────────────────────────────────────────── */
    const close = () => setModal(null);
    const ok    = (msg) => { close(); notify.success(msg); };

    return (
        <>
            {modal?.mode === 'add' && (
                <PersonForm
                    onSubmit={(d) => add.mutate(d, { onSuccess: () => ok('Запись создана') })}
                    onCancel={close}
                />
            )}

            {modal?.mode === 'edit' && (
                <PersonForm
                    initialData={modal.data}
                    onSubmit={(d) =>
                        update.mutate({ id: modal.data.id, updates: d },
                            { onSuccess: () => ok('Запись обновлена') })}
                    onCancel={close}
                />
            )}

            <AdminDataGrid
                title="Физлица"
                rows={persons}
                columns={columns}
                loading={isPending}
                onAdd={() => setModal({ mode: 'add' })}
            />
        </>
    );
}
