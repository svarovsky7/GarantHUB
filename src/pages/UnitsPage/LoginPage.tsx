// src/pages/UnitsPage/LoginPage.js
import React, { useState } from "react";
import { supabase } from "@shared/api/supabaseClient";
import { Link as RouterLink, useNavigate } from "react-router-dom";
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

export default function LoginPage() {
  const nav = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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
    <Paper sx={{ p: 4, maxWidth: 380, mx: "auto", mt: 6 }} data-oid=".e6l:g5">
      <form onSubmit={login} data-oid="orajb4f">
        <Stack spacing={2} data-oid="297r_01">
          <Typography variant="h5" align="center" data-oid="dcq:o1t">
            Вход
          </Typography>

          <TextField
            label="E-mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
            data-oid="uxbgsei"
          />

          <TextField
            label="Пароль"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            data-oid="ozxu8wc"
          />

          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            startIcon={
              loading && <CircularProgress size={18} data-oid="v4f97m:" />
            }
            data-oid="ctjdw.1"
            className="bg-[#D24619]"
          >
            Войти
          </Button>

          <Typography align="center" variant="body2" data-oid="bho8l_i">
            Нет аккаунта?{" "}
            <Link component={RouterLink} to="/register" data-oid="9swgyha">
              Регистрация
            </Link>
          </Typography>
        </Stack>
      </form>
    </Paper>
  );
}
