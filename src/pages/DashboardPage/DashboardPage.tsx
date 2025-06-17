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
import { useVisibleProjects } from "../../entities/project";
import { useAuthStore } from "../../shared/store/authStore";

const DashboardPage = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { data: projects = [], isPending, error } = useVisibleProjects();
  const profile = useAuthStore((s) => s.profile);

  useEffect(() => {
    if (error)
      enqueueSnackbar("Ошибка загрузки проектов.", { variant: "error" });
  }, [error, enqueueSnackbar]);

  if (isPending) return <Skeleton variant="rectangular" height={160} />;

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Добро пожаловать, {profile?.name ?? profile?.email ?? "гость"}!
        </Typography>
        <Typography>Всего проектов: {projects.length}</Typography>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Список проектов
        </Typography>
        {projects.length === 0 ? (
          <Typography>Проектов пока нет.</Typography>
        ) : (
          <List dense>
            {projects.map((p) => (
              <ListItemButton
                key={p.id}
                component={RouterLink}
                to={`/units?project=${p.id}`}
              >
                <ListItemText primary={p.name} />
              </ListItemButton>
            ))}
          </List>
        )}
      </Paper>
    </Stack>
  );
};

export default DashboardPage;
