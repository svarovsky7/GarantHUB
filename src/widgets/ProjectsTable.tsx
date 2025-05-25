import React, { useState } from 'react';
import { GridActionsCellItem } from '@mui/x-data-grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useProjects, useAddProject, useUpdateProject, useDeleteProject } from '@/entities/project';
import ProjectForm from '@/features/project/ProjectForm';
import AdminDataGrid from '@/shared/ui/AdminDataGrid';
import { useNotify } from '@/shared/hooks/useNotify';
import { Skeleton, Dialog, DialogTitle, DialogContent } from '@mui/material';

// Описываем типы пропсов для поддержки pageSize и rowsPerPageOptions
interface ProjectsTableProps {
    pageSize?: number;
    rowsPerPageOptions?: number[];
}

export default function ProjectsTable({
                                          pageSize = 25,
                                          rowsPerPageOptions = [10, 25, 50, 100],
                                      }: ProjectsTableProps) {
    const notify = useNotify();
    const { data: projects = [], isPending } = useProjects();
    const add = useAddProject();
    const update = useUpdateProject();
    const remove = useDeleteProject();
    const [modal, setModal] = useState<null | { mode: 'add' | 'edit'; data?: any }>(null);

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
                    showInMenu={false}
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
                    showInMenu={false}
                />,
            ],
        },
    ];

    const close = () => setModal(null);
    const ok = (msg: string) => { close(); notify.success(msg); };

    if (isPending) {
        return <Skeleton variant="rectangular" width="100%" height={400} />;
    }

    return (
        <>
            {modal && (
                <Dialog open onClose={close} maxWidth="xs" fullWidth>
                    <DialogTitle>
                        {modal.mode === 'add' ? 'Новый проект' : 'Редактировать проект'}
                    </DialogTitle>
                    <DialogContent>
                        <ProjectForm
                            initialData={modal.mode === 'edit' ? modal.data : undefined}
                            onSubmit={(d) =>
                                (modal.mode === 'add'
                                    ? add.mutate(d, {
                                          onSuccess: () => ok('Проект создан'),
                                          onError: (e) => notify.error(e.message),
                                      })
                                    : update.mutate(
                                          { id: modal.data.id, updates: d },
                                          {
                                              onSuccess: () => ok('Проект обновлён'),
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
                title="Проекты"
                rows={projects}
                columns={columns}
                loading={isPending}
                onAdd={() => setModal({ mode: 'add' })}
                pageSize={pageSize}
                rowsPerPageOptions={rowsPerPageOptions}
            />
        </>
    );
}
