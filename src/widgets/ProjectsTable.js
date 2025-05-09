import React, { useState } from 'react';
import { GridActionsCellItem } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useProjects, useAddProject, useUpdateProject, useDeleteProject } from '@/entities/project';
import ProjectForm from '@/features/project/ProjectForm';
import AdminDataGrid from '@/shared/ui/AdminDataGrid';
import { useNotify } from '@/shared/hooks/useNotify';
import { Skeleton } from '@mui/material';

export default function ProjectsTable() {
    const notify = useNotify();
    const { data: projects = [], isPending } = useProjects();
    const add = useAddProject();
    const update = useUpdateProject();
    const remove = useDeleteProject();
    const [modal, setModal] = useState(null); // {mode:'add'|'edit', data?}

    const columns = [
        { field: 'id', headerName: 'ID', width: 80 },
        { field: 'name', headerName: 'Название', flex: 1 },
        {
            field: 'actions',
            type: 'actions',
            width: 90,
            getActions: ({ row }) => [
                <GridActionsCellItem
                    key="edit"
                    icon={<EditIcon />}
                    label="Редактировать"
                    onClick={() => setModal({ mode: 'edit', data: row })}
                    showInMenu={false} // Enables tooltip
                />,
                <GridActionsCellItem
                    key="del"
                    icon={<DeleteIcon color="error" />}
                    label="Удалить"
                    onClick={() => {
                        if (!window.confirm('Удалить проект?')) return;
                        remove.mutate(row.id, {
                            onSuccess: () => notify.success('Проект удалён'),
                            onError: (e) => notify.error(e.message),
                        });
                    }}
                    showInMenu={false} // Enables tooltip
                />,
            ],
        },
    ];

    const close = () => setModal(null);
    const ok = (msg) => { close(); notify.success(msg); };

    if (isPending) {
        return <Skeleton variant="rectangular" width="100%" height={400} />;
    }

    return (
        <>
            {modal?.mode === 'add' && (
                <ProjectForm
                    onSubmit={(d) =>
                        add.mutate(d, {
                            onSuccess: () => ok('Проект создан'),
                            onError: (e) => notify.error(e.message),
                        })}
                    onCancel={close}
                />
            )}
            {modal?.mode === 'edit' && (
                <ProjectForm
                    initialData={modal.data}
                    onSubmit={(d) =>
                        update.mutate(
                            { id: modal.data.id, updates: d },
                            {
                                onSuccess: () => ok('Проект обновлён'),
                                onError: (e) => notify.error(e.message),
                            },
                        )}
                    onCancel={close}
                />
            )}
            <AdminDataGrid
                title="Проекты"
                rows={projects}
                columns={columns}
                loading={isPending}
                onAdd={() => setModal({ mode: 'add' })}
            />
        </>
    );
}