// src/widgets/PersonsAdmin.js
// -------------------------------------------------------------
// CRUD-таблица физлиц
// -------------------------------------------------------------
import React, { useState } from 'react';
import { GridActionsCellItem } from '@mui/x-data-grid';
import EditIcon   from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import {
    usePersons,
    useDeletePerson,
} from '@/entities/person';
import { useProjects } from '@/entities/project';

import PersonForm    from '@/features/person/PersonForm';
import AdminDataGrid from '@/shared/ui/AdminDataGrid';
import { useNotify } from '@/shared/hooks/useNotify';

export default function PersonsAdmin() {
    const notify = useNotify();

    /* --- данные --- */
    const { data: persons  = [], isPending } = usePersons();
    const { data: projects = [] }            = useProjects();

    const remove = useDeletePerson();

    const [modal, setModal] = useState(null); // { mode:'add'|'edit', data }

    /* быстрый поиск имени проекта */
    const nameById = (id) =>
        projects.find((p) => p.id === id)?.name ?? '—';

    /* ---- колонки ---- */
    const columns = [
        { field: 'id', headerName: 'ID', width: 80 },
        {
            field     : 'project_name',
            headerName: 'Проект',
            flex      : 1,
            renderCell: ({ row }) =>
                row?.project?.name
                ?? (Array.isArray(row.project) ? row.project[0]?.name : null)
                ?? nameById(row.project_id),
            sortable  : false,
            filterable: false,
        },
        { field: 'full_name', headerName: 'ФИО', flex: 1 },
        { field: 'phone',     headerName: 'Телефон', width: 160 },
        { field: 'email',     headerName: 'E-mail',  flex: 1 },
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

    /* ---- helpers ---- */
    const close = () => setModal(null);
    const ok    = (msg) => { close(); notify.success(msg); };

    /* ---- UI ---- */
    return (
        <>
            {modal?.mode === 'add' && (
                <PersonForm onSuccess={() => ok('Запись создана')} onCancel={close} />
            )}

            {modal?.mode === 'edit' && (
                <PersonForm
                    initialData={modal.data}
                    onSuccess={() => ok('Запись обновлена')}
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