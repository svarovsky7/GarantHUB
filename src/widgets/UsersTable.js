import React from 'react';
import { GridActionsCellItem } from '@mui/x-data-grid';
import DeleteIcon from '@mui/icons-material/Delete';

import { useUsers, useDeleteUser } from '@/entities/user';
import { useRoles } from '@/entities/role';

import RoleSelect    from '@/features/user/RoleSelect';
import AdminDataGrid from '@/shared/ui/AdminDataGrid';
import { useNotify } from '@/shared/hooks/useNotify';

export default function UsersTable() {
    const notify                                    = useNotify();
    const { data: users = [],  isPending: uLoad }   = useUsers();      // ← теперь все пользователи без фильтра
    const { data: roles = [],  isPending: rLoad }   = useRoles();
    const delUser                                   = useDeleteUser();

    const columns = [
        { field: 'id',   headerName: 'ID',               width: 70 },
        { field: 'name', headerName: 'Имя пользователя', flex:  1 },
        { field: 'email',headerName: 'E-mail',           flex:  1 },
        {
            field     : 'role',
            headerName: 'Роль',
            flex      : 0.7,
            renderCell: ({ row }) => (
                <RoleSelect user={row} roles={roles} disabled={rLoad} />
            ),
        },
        {
            field : 'actions',
            type  : 'actions',
            width : 100,
            getActions: ({ row }) => [
                <GridActionsCellItem
                    key="del"
                    icon={<DeleteIcon color="error" />}
                    label="Удалить"
                    onClick={() => {
                        if (!window.confirm('Удалить пользователя?')) return;
                        delUser.mutate(row.id, {
                            onSuccess: () => notify.success('Пользователь удалён'),
                            onError  : (e) => notify.error(e.message),
                        });
                    }}
                />,
            ],
        },
    ];

    return (
        <AdminDataGrid
            title="Пользователи"
            rows={users}
            columns={columns}
            loading={uLoad || rLoad}
        />
    );
}
