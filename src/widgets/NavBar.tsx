// src/widgets/NavBar.tsx
import React from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  FormControl,
  Select,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";

import { supabase } from "@/shared/api/supabaseClient";
import { useAuthStore } from "@/shared/store/authStore";
import { useVisibleProjects } from "@/entities/project";
import { useRolePermission } from "@/entities/rolePermission";
import { Skeleton } from "antd";

/**
 * Навигационная панель приложения.
 * Отображает ссылки по ролям, профиль пользователя и выбор проекта.
 */
const NavBar: React.FC = () => {
  const profile = useAuthStore((s) => s.profile);
  const projectId = useAuthStore((s) => s.projectId);
  const setProfile = useAuthStore((s) => s.setProfile);
  const setProjectId = useAuthStore((s) => s.setProjectId);

  const { data: projects = [], isPending } = useVisibleProjects();
  const { data: perm } = useRolePermission(profile?.role as any);

  const logout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <AppBar position="fixed">
      {" "}
      {/* Исправлено: fixed вместо static */}
      <Toolbar sx={{ gap: 2, flexWrap: "wrap" }}>
        {/* --- логотип --- */}
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          color="inherit"
          sx={{ textDecoration: "none" }}
        >
          Garantie Hub
        </Typography>

        {/* --- навигация --- */}
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          {perm?.pages.includes('structure') && (
            <Button
              color="inherit"
              component={RouterLink}
              to="/structure"
              sx={{ whiteSpace: 'normal' }}
            >
              Структура проекта
            </Button>
          )}
          {perm?.pages.includes('defects') && (
            <Button
              color="inherit"
              component={RouterLink}
              to="/defects"
              sx={{ whiteSpace: 'normal' }}
            >
              Дефекты
            </Button>
          )}
          {perm?.pages.includes('claims') && (
            <Button
              color="inherit"
              component={RouterLink}
              to="/claims"
              sx={{ whiteSpace: 'normal' }}
            >
              Претензии
            </Button>
          )}
          {perm?.pages.includes('court-cases') && (
            <Button
              color="inherit"
              component={RouterLink}
              to="/court-cases"
              sx={{ whiteSpace: 'normal' }}
            >
              Судебные дела
            </Button>
          )}
          {perm?.pages.includes('correspondence') && (
            <Button
              color="inherit"
              component={RouterLink}
              to="/correspondence"
              sx={{ whiteSpace: 'normal' }}
            >
              Письма
            </Button>
          )}
          {perm?.pages.includes('admin') && (
            <Button
              color="inherit"
              component={RouterLink}
              to="/admin"
              sx={{ whiteSpace: 'normal' }}
            >
              Администрирование
            </Button>
          )}
        </Box>

        {/* гибкий отступ – прижимаем профиль к правому краю */}
        <span style={{ flexGrow: 1 }} />

        {/* --- профиль + выбор проекта + выход --- */}
        {profile && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              mr: 2,
            }}
          >
            <Typography variant="body2">
              {profile.name
                ? `${profile.name} (${profile.email})`
                : profile.email}
            </Typography>

            {perm?.only_assigned_project && (
              isPending ? (
                <Skeleton active title={false} paragraph={false} style={{ width: 120, marginTop: 2 }} />
              ) : (
                <Typography variant="caption" sx={{ color: "inherit", opacity: 0.8 }}>
                  {projects.map((p) => p.name).join("; ") || "—"}
                </Typography>
              )
            )}

            {/* выпадающий список проектов только для администратора */}
            {profile.role === 'ADMIN' &&
              (isPending ? (
                <CircularProgress size={14} sx={{ mt: 0.5 }} />
              ) : (
                <FormControl variant="standard" size="small">
                  <Select
                    value={projectId ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setProjectId(val === '' ? null : Number(val));
                    }}
                    displayEmpty
                    disabled={perm?.only_assigned_project}
                    sx={{
                      color: "inherit",
                      fontSize: 12,
                      "& .MuiSelect-icon": { color: "inherit" },
                      "&:before, &:after": {
                        borderBottomColor: "rgba(255,255,255,0.5)",
                      },
                    }}
                  >
                    {projects.map((p) => (
                      <MenuItem key={p.id} value={p.id}>
                        {p.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ))}
          </Box>
        )}

        {profile && (
          <Button color="inherit" startIcon={<LogoutIcon />} onClick={logout}>
            Выйти
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;
