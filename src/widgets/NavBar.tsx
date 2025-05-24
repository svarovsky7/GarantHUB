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
    <AppBar position="fixed" data-oid="cqdp.ks">
      {" "}
      {/* Исправлено: fixed вместо static */}
      <Toolbar sx={{ gap: 2 }} data-oid="p6h3yh0">
        {/* --- логотип --- */}
        <Typography
          variant="h6"
          component={RouterLink}
          to="/"
          color="inherit"
          sx={{ textDecoration: "none" }}
          data-oid="5v9ja8b"
        >
          Garantie&nbsp;Hub
        </Typography>

        {/* --- навигация --- */}
        <Button
          color="inherit"
          component={RouterLink}
          to="/structure"
          data-oid="pdv31:4"
        >
          Структура&nbsp;проекта
        </Button>
        <Button
          color="inherit"
          component={RouterLink}
          to="/stats"
          data-oid="8_9qx-u"
        >
          Статистика
        </Button>
        <Button
          color="inherit"
          component={RouterLink}
          to="/tickets/new"
          data-oid="db7j852"
        >
          Добавить&nbsp;замечание
        </Button>
        <Button
          color="inherit"
          component={RouterLink}
          to="/tickets"
          data-oid="h2_lls3"
        >
          Таблица&nbsp;замечаний
        </Button>
        <Button
          color="inherit"
          component={RouterLink}
          to="/court-cases"
          data-oid="pr504.h"
        >
          Судебные&nbsp;дела
        </Button>
        {profile?.role === "ADMIN" && (
          <Button
            color="inherit"
            component={RouterLink}
            to="/admin"
            data-oid="o:lfrz_"
          >
            Администрирование
          </Button>
        )}

        {/* гибкий отступ – прижимаем профиль к правому краю */}
        <span style={{ flexGrow: 1 }} data-oid="wq38-h6" />

        {/* --- профиль + выбор проекта + выход --- */}
        {profile && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              mr: 2,
            }}
            data-oid="7td:8ey"
          >
            <Typography variant="body2" data-oid="ykbw4t4">
              {profile.name ?? profile.email}
            </Typography>

            {/* выпадающий список проектов */}
            {isPending ? (
              <CircularProgress size={14} sx={{ mt: 0.5 }} data-oid="buplsqg" />
            ) : (
              <FormControl variant="standard" size="small" data-oid="_7zzzyl">
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
                  data-oid="ff3xvar"
                >
                  {projects.map((p) => (
                    <MenuItem key={p.id} value={p.id} data-oid="xcs8-y6">
                      {p.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        )}

        {profile && (
          <Button
            color="inherit"
            startIcon={<LogoutIcon data-oid="qcc94tc" />}
            onClick={logout}
            data-oid="ez22td."
          >
            Выйти
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default NavBar;
