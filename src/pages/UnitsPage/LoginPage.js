import React, { useState } from 'react';
import { supabase } from '@shared/api/supabaseClient';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
    Paper, TextField, Button, Stack,
    Typography, Link, CircularProgress
} from '@mui/material';

const LoginPage = () => {
    const nav = useNavigate();

    const [email, setEmail]       = useState('');
    const [password, setPassword] = useState('');
    const [msg, setMsg]           = useState('');
    const [loading, setLoading]   = useState(false);

    /* ---------- helper ---------- */
    const log = (...a) => console.log('%c[LoginPage]', 'color:mediumvioletred', ...a); // CHANGE

    const login = async (e) => {
        e.preventDefault();
        setMsg('');
        setLoading(true);

        log('submit', { email });

        /* ---------- network call ---------- */
        try {
            const { data, error } = await supabase.auth
                .signInWithPassword({ email, password });

            log('signInWithPassword →', { data, error });

            if (error) {
                setMsg(error.message);
            } else {
                /* ---------- EXPECT: onAuthStateChange через пару мс ---------- */
                nav('/', { replace: true });
            }
        } catch (ex) {
            log('unexpected exception', ex);
            setMsg(ex.message);
        } finally {
            setLoading(false);
        }
    };

    const magic = async () => {
        setMsg('');
        setLoading(true);
        log('magic-link request', email);

        const { error } = await supabase.auth.signInWithOtp({ email });
        setLoading(false);
        setMsg(error ? error.message : 'Magic-link отправлена на почту.');
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
                        onChange={e => setEmail(e.target.value)}
                        required
                        fullWidth
                    />
                    <TextField
                        label="Пароль"
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
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

                    {msg && <Typography color="error">{msg}</Typography>}

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
