import React, { useState } from 'react';
import { GridActionsCellItem } from '@mui/x-data-grid';
import EditIcon   from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

import { usePersons, useDeletePerson } from '@/entities/person';
import { useProjects }                from '@/entities/project';

import PersonForm    from '@/features/person/PersonForm';
import AdminDataGrid from '@/shared/ui/AdminDataGrid';
import { useNotify } from '@/shared/hooks/useNotify';

export default function PersonsAdmin() {
    const notify = useNotify();

    /* --- данные --- */
    const { data: persons = [], isPending } = usePersons(); // ← фильтрация по проекту
    const { data: projects = [] }           = useProjects();

    const remove = useDeletePerson();

    const [form, setForm] = useState(null);
    const nameById = (id) => projects.find((p) => p.id === id)?.name ?? '—';

    const columns = [
        { field: 'id', headerName: 'ID', width: 80 },
        {
            field: 'project_name',
            headerName: 'Проект',
            flex: 1,
            renderCell: ({ row }) =>
                row?.project?.name
                ?? (Array.isArray(row.project) ? row.project[0]?.name : null)
                ?? nameById(row.project_id),
            sortable: false,
            filterable: false,
        },
        { field: 'full_name', headerName: 'ФИО', flex: 1 },
        { field: 'phone',     headerName: 'Телефон', width: 160 },
        { field: 'email',     headerName: 'E-mail',  flex: 1 },
        {
            field: 'actions',
            type: 'actions',
            width: 110,
            getActions: ({ row }) => [
                <GridActionsCellItem
                    key="edit"
                    icon={<EditIcon />}
                    label="Редактировать"
                    onClick={() => setForm({ initialData: row })}
                />,
                <GridActionsCellItem
                    key="delete"
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

    const closeForm = () => setForm(null);
    const ok        = (msg) => { closeForm(); notify.success(msg); };

    return (
        <>
            {form && (
                <PersonForm
                    initialData={form.initialData}
                    onSuccess={() =>
                        ok(form.initialData ? 'Запись обновлена' : 'Запись создана')
                    }
                    onCancel={closeForm}
                />
            )}

            <AdminDataGrid
                title="Физлица"
                rows={persons}
                columns={columns}
                loading={isPending}
                onAdd={() => setForm({})}
            />
        </>
    );
}
