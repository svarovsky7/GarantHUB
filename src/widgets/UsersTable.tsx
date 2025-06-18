import React from "react";
import { GridActionsCellItem } from "@mui/x-data-grid";
import DeleteIcon from "@mui/icons-material/Delete";

import { useUsers, useDeleteUser } from "@/entities/user";
import { useRoles } from "@/entities/role";
import { useProjects } from "@/entities/project";
import AdminDataGrid from "@/shared/ui/AdminDataGrid";
import { useNotify } from "@/shared/hooks/useNotify";
import RoleSelect from "@/features/user/RoleSelect";
import UserProjectsSelect from "@/features/user/UserProjectsSelect";

// Интерфейс для пропсов с пагинацией
interface UsersTableProps {
  pageSize?: number;
  rowsPerPageOptions?: number[];
}

export default function UsersTable({
  pageSize = 25,
  rowsPerPageOptions = [10, 25, 50, 100],
}: UsersTableProps) {
  const notify = useNotify();
  const { data: users = [], isPending: uLoad } = useUsers();
  const { data: roles = [], isPending: rLoad } = useRoles();
  const { data: projects = [], isPending: pLoad } = useProjects();
  const delUser = useDeleteUser();

  // Таблица
  const columns = [
    { field: "id", headerName: "ID", width: 70 },
    { field: "name", headerName: "Имя пользователя", flex: 1 },
    { field: "email", headerName: "E-mail", flex: 1 },
    {
      field: "role",
      headerName: "Роль",
      flex: 0.7,
      renderCell: ({ row }) => (
        <RoleSelect user={row} roles={roles} loading={rLoad} />
      ),
    },
    {
      field: 'project_ids',
      headerName: 'Проекты',
      flex: 1,
      renderCell: ({ row }) => (
        <UserProjectsSelect user={row} projects={projects} loading={pLoad} />
      ),
    },
    {
      field: "actions",
      type: "actions",
      width: 100,
      getActions: ({ row }) => [
        <GridActionsCellItem
          key="del"
          icon={<DeleteIcon color="error" />}
          label="Удалить"
          onClick={() => {
            if (!window.confirm("Удалить пользователя?")) return;
            delUser.mutate(row.id, {
              onSuccess: () => notify.success("Пользователь удалён"),
              onError: (e) => notify.error(e.message),
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
      loading={uLoad || rLoad || pLoad}
      pageSize={pageSize}
      rowsPerPageOptions={rowsPerPageOptions}
    />
  );
}
