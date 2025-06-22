// src/pages/UnitsPage/LoginPage.js
import React, { useState, useEffect } from "react";
import { supabase } from "@shared/api/supabaseClient";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/shared/store/authStore";
import {
  Paper,
  TextField,
  Button,
  Stack,
  Typography,
  Link,
  CircularProgress,
} from "@mui/material";
import { useSnackbar } from "notistack";

/**
 * Страница входа в систему.
 * Перенаправляет на главную, если пользователь уже авторизован.
 */
export default function LoginPage() {
  const nav = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const profile = useAuthStore((s) => s.profile);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      nav('/', { replace: true });
    }
  }, [profile, nav]);

  const login = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      enqueueSnackbar(error.message, { variant: "error" });
      return;
    }

    enqueueSnackbar("Успешный вход.", { variant: "success" });
    nav("/", { replace: true });
  };

  return (
    <Paper sx={{ p: 4, maxWidth: 380, mx: "auto", mt: 4 }}>
      <form onSubmit={login}>
        <Stack spacing={2}>
          <Typography variant="h5" align="center">
            Вход
          </Typography>

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
            fullWidth
          />

          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={loading && <CircularProgress size={18} />}
            className="bg-[#D24619]"
          >
            Войти
          </Button>

          <Typography align="center" variant="body2">
            Нет аккаунта?{" "}
            <Link component={RouterLink} to="/register">
              Регистрация
            </Link>
          </Typography>
        </Stack>
      </form>
    </Paper>
  );
}
