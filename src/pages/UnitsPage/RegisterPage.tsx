// src/pages/RegisterPage.js
// -----------------------------------------------------------------------------
// Регистрация: проект обязателен, поле «Фамилия Имя», роль назначается «USER».
// -----------------------------------------------------------------------------

import React, { useState } from "react";
import { supabase } from "@/shared/api/supabaseClient";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Paper,
  TextField,
  Button,
  Stack,
  Typography,
  Link,
  CircularProgress,
  Autocomplete,
  Tooltip,
  Skeleton,
} from "@mui/material";
import { useSnackbar } from "notistack";

import { useProjects } from "@/entities/project";

/**
 * Страница регистрации нового пользователя.
 * Требует выбор проекта и ввод «Фамилия Имя».
 */
export default function RegisterPage() {
  const nav = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState(""); // CHANGE: Фамилия Имя
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(false);

  const { data: projects = [], isLoading: projLoad } = useProjects();

  /** Отправка формы регистрации */
  async function signUp(e) {
    e.preventDefault();

    if (!project) {
      // CHANGE: обязательный проект
      enqueueSnackbar("Выберите проект", { variant: "warning" });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: fullName, // поле остаётся name в metadata
            project_id: project.id,
          },
        },
      });

      if (error) {
        // eslint-disable-next-line no-console
        console.error("[signUp error]", error, JSON.stringify(data, null, 2));
        enqueueSnackbar(error.message, { variant: "error" });
        return;
      }

      enqueueSnackbar("Проверьте e-mail — отправили ссылку подтверждения.", {
        variant: "success",
      });
      setTimeout(() => nav("/login", { replace: true }), 2500);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[signUp unexpected]", err);
      enqueueSnackbar("Неизвестная ошибка регистрации", { variant: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Paper sx={{ p: 4, maxWidth: 440, mx: "auto", mt: 6 }}>
      <form onSubmit={signUp} noValidate>
        <Stack spacing={2}>
          <Typography variant="h5" align="center">
            Регистрация
          </Typography>

          <TextField
            label="Фамилия Имя" /* CHANGE */
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            fullWidth
          />

          <TextField
            label="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
          />

          <TextField
            label="Пароль"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            inputProps={{ minLength: 6 }}
            fullWidth
          />

          {/* Проект ОБЯЗАТЕЛЕН */}
          {projLoad ? (
            <Skeleton variant="rectangular" height={56} />
          ) : (
            <Tooltip title="Без проекта регистрация невозможна">
              <Autocomplete
                options={projects}
                loading={projLoad}
                getOptionLabel={(opt) => opt.name || ""}
                value={project}
                onChange={(_, val) => setProject(val)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Проект"
                    placeholder="Выберите проект"
                    required
                  />
                )}
              />
            </Tooltip>
          )}

          <Button
            variant="contained"
            type="submit"
            disabled={loading}
            startIcon={loading && <CircularProgress size={18} />}
          >
            Создать аккаунт
          </Button>

          <Typography align="center" variant="body2">
            Уже зарегистрированы?{" "}
            <Link component={RouterLink} to="/login">
              Войти
            </Link>
          </Typography>
        </Stack>
      </form>
    </Paper>
  );
}
