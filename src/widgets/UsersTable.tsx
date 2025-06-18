import React from "react";
import { GridActionsCellItem } from "@mui/x-data-grid";
import DeleteIcon from "@mui/icons-material/Delete";
import { MenuItem, Select, CircularProgress } from "@mui/material";

import { useUsers, useDeleteUser } from "@/entities/user";
import { useRoles } from "@/entities/role";
import { useProjects } from "@/entities/project";
import AdminDataGrid from "@/shared/ui/AdminDataGrid";
import { useNotify } from "@/shared/hooks/useNotify";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/shared/api/supabaseClient";
import RoleSelect from "@/features/user/RoleSelect";

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

  const qc = useQueryClient();

  // Мутация для обновления проектов пользователя
  const updateProjects = useMutation({
    mutationFn: async ({ id, project_ids }: any) => {
      const { data, error } = await supabase
        .from("profiles")
        .update({
          project_ids,
          project_id: project_ids.length ? project_ids[0] : null,
        })
        .eq("id", id)
        .select("id, name, email, role, project_id, project_ids")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users", "all"] });
      notify.success("Проекты пользователя обновлены");
    },
    onError: (e) => notify.error(e.message),
  });

  // Таблица
  const columns = [
    { field: "id", headerName: "ID", width: 70 },
    { field: "name", headerName: "Имя пользователя", flex: 1 },
    { field: "email", headerName: "E-mail", flex: 1 },
    {
      field: "role",
      headerName: "Роль",
      flex: 0.7,
      renderCell: ({ row }) => <RoleSelect user={row} roles={roles} />,
    },
    {
      field: "project_ids",
      headerName: "Проекты",
      flex: 1,
      renderCell: ({ row }) => {
        if (pLoad) return <CircularProgress size={18} />;
        return (
          <Select
            size="small"
            variant="standard"
            multiple
            value={row.project_ids || []}
            onChange={(e) =>
              updateProjects.mutate({
                id: row.id,
                project_ids: e.target.value as number[],
              })
            }
            sx={{ minWidth: 160 }}
            renderValue={(selected) =>
              (selected as number[])
                .map((id) => projects.find((p) => p.id === id)?.name)
                .filter(Boolean)
                .join(', ')
            }
          >
            {projects.map((proj) => (
              <MenuItem key={proj.id} value={proj.id}>
                {proj.name}
              </MenuItem>
            ))}
          </Select>
        );
      },
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
