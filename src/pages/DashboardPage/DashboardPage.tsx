import React, { useEffect } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Paper,
  Typography,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Skeleton,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { useProjects } from "../../entities/project";
import { useAuthStore } from "../../shared/store/authStore";

const DashboardPage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { data: projects = [], isPending, error } = useProjects();
  const profile = useAuthStore((s) => s.profile);

  useEffect(() => {
    if (error)
      enqueueSnackbar("Ошибка загрузки проектов.", { variant: "error" });
  }, [error, enqueueSnackbar]);

  if (isPending)
    return <Skeleton variant="rectangular" height={160} data-oid="x--n:zh" />;

  return (
    <Stack spacing={3} data-oid="-8-e.v9">
      <Paper sx={{ p: 3 }} data-oid="rftx3eb">
        <Typography variant="h5" gutterBottom data-oid="sxr9ms6">
          Добро пожаловать, {profile?.name ?? profile?.email ?? "гость"}!
        </Typography>
        <Typography data-oid="6-bfgrr">
          Всего проектов: {projects.length}
        </Typography>
      </Paper>

      <Paper sx={{ p: 3 }} data-oid="rjosfxf">
        <Typography variant="h6" gutterBottom data-oid="kgr-2il">
          Список проектов
        </Typography>
        {projects.length === 0 ? (
          <Typography data-oid=".kpnhu9">Проектов пока нет.</Typography>
        ) : (
          <List dense data-oid="eqse0r4">
            {projects.map((p) => (
              <ListItemButton
                key={p.id}
                component={RouterLink}
                to={`/units?project=${p.id}`}
                data-oid="473.7k6"
              >
                <ListItemText primary={p.name} data-oid="qmji_.a" />
              </ListItemButton>
            ))}
          </List>
        )}
      </Paper>
    </Stack>
  );
};

export default DashboardPage;
