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
          <Button
            color="inherit"
            component={RouterLink}
            to="/structure"
            sx={{ whiteSpace: "normal" }}
          >
            Структура проекта
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/tickets"
            sx={{ whiteSpace: "normal" }}
          >
            Замечания
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/defects"
            sx={{ whiteSpace: "normal" }}
          >
            Дефекты
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/court-cases"
            sx={{ whiteSpace: "normal" }}
          >
            Судебные дела
          </Button>
          <Button
            color="inherit"
            component={RouterLink}
            to="/correspondence"
            sx={{ whiteSpace: "normal" }}
          >
            Письма
          </Button>
          {profile?.role === "ADMIN" && (
            <Button
              color="inherit"
              component={RouterLink}
              to="/admin"
              sx={{ whiteSpace: "normal" }}
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
