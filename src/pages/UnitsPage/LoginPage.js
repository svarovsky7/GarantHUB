import React, { useState } from 'react';
import { supabase } from '@shared/api/supabaseClient';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
    Paper, TextField, Button, Stack,
    Typography, Link, CircularProgress,
} from '@mui/material';
import { useSnackbar } from 'notistack';

const LoginPage = () => {
    const nav                 = useNavigate();
    const { enqueueSnackbar } = useSnackbar();

    const [email,    setEmail]    = useState('');
    const [password, setPassword] = useState('');
    const [loading,  setLoading]  = useState(false);

    const login = async (e) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase.auth
            .signInWithPassword({ email, password });

        setLoading(false);

        if (error) {
            enqueueSnackbar(error.message, { variant: 'error' });
            return;
        }

        enqueueSnackbar('Успешный вход.', { variant: 'success' });
        nav('/', { replace: true });
    };

    const magic = async () => {
        setLoading(true);
        const { error } = await supabase.auth.signInWithOtp({ email });
        setLoading(false);

        enqueueSnackbar(
            error ? error.message : 'Magic-link отправлена на почту.',
            { variant: error ? 'error' : 'success' },
        );
    };

    return (
        <Paper sx={{ p: 4, maxWidth: 380, mx: 'auto', mt: 6 }}>
            <form onSubmit={login}>
                <Stack spacing={2}>
                    <Typography variant="h5" align="center">Вход</Typography>

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

                    <Stack direction="row" spacing={1}>
                        <Button
                            type="submit"
                            variant="contained"
                            disabled={loading}
                            startIcon={loading && <CircularProgress size={18} />}
                        >
                            Войти
                        </Button>
                        <Button
                            variant="outlined"
                            disabled={loading}
                            onClick={magic}
                        >
                            Magic-link
                        </Button>
                    </Stack>

                    <Typography align="center" variant="body2">
                        Нет аккаунта?{' '}
                        <Link component={RouterLink} to="/register">Регистрация</Link>
                    </Typography>
                </Stack>
            </form>
        </Paper>
    );
};

export default LoginPage;
