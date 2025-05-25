// src/widgets/NavBar.js
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
import { useProjects } from "@/entities/project";

const NavBar = () => {
  const profile = useAuthStore((s) => s.profile);
  const setProfile = useAuthStore((s) => s.setProfile);
  const setProjectId = useAuthStore((s) => s.setProjectId);

  const { data: projects = [], isPending } = useProjects();

  const logout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <AppBar position="fixed">
      {" "}
      {/* Исправлено: fixed вместо static */}
      <Toolbar sx={{ gap: 2 }}>
        {/* --- логотип --- */}
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          color="inherit"
          sx={{ textDecoration: "none" }}
        >
          Garantie&nbsp;Hub
        </Typography>

        {/* --- навигация --- */}
        <Button color="inherit" component={RouterLink} to="/structure">
          Структура&nbsp;проекта
        </Button>
        <Button color="inherit" component={RouterLink} to="/stats">
          Статистика
        </Button>
        <Button color="inherit" component={RouterLink} to="/tickets/new">
          Добавить&nbsp;замечание
        </Button>
        <Button color="inherit" component={RouterLink} to="/tickets">
          Таблица&nbsp;замечаний
        </Button>
        <Button color="inherit" component={RouterLink} to="/court-cases">
          Судебные&nbsp;дела
        </Button>
        {profile?.role === "ADMIN" && (
          <Button color="inherit" component={RouterLink} to="/admin">
            Администрирование
          </Button>
        )}

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
              {profile.name ?? profile.email}
            </Typography>

            {/* выпадающий список проектов */}
            {isPending ? (
              <CircularProgress size={14} sx={{ mt: 0.5 }} />
            ) : (
              <FormControl variant="standard" size="small">
                <Select
                  value={profile.project_id ?? ""}
                  onChange={(e) => setProjectId(e.target.value)}
                  displayEmpty
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
            )}
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
