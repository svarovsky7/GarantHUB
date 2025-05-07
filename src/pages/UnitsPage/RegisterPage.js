import React, { useState } from 'react';
import { supabase } from '@shared/api/supabaseClient';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
    Paper, TextField, Button, Stack,
    Typography, Link, CircularProgress,
} from '@mui/material';
import { useSnackbar } from 'notistack';

const RegisterPage = () => {
    const nav                = useNavigate();
    const { enqueueSnackbar } = useSnackbar();

    const [email,    setEmail]    = useState('');
    const [password, setPassword] = useState('');
    const [name,     setName]     = useState('');
    const [loading,  setLoading]  = useState(false);

    const signUp = async (e) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { name } },
        });

        setLoading(false);

        if (error) {
            enqueueSnackbar(error.message, { variant: 'error' });
            return;
        }

        enqueueSnackbar('Подтвердите e-mail и войдите.', { variant: 'success' });
        setTimeout(() => nav('/login', { replace: true }), 2500);
    };

    return (
        <Paper sx={{ p: 4, maxWidth: 380, mx: 'auto', mt: 6 }}>
            <form onSubmit={signUp}>
                <Stack spacing={2}>
                    <Typography variant="h5" align="center">Регистрация</Typography>

                    <TextField
                        label="Имя"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
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
                        fullWidth
                        inputProps={{ minLength: 6 }}
                    />

                    <Button
                        variant="contained"
                        type="submit"
                        disabled={loading}
                        startIcon={loading && <CircularProgress size={18} />}
                    >
                        Создать аккаунт
                    </Button>

                    <Typography align="center" variant="body2">
                        Уже зарегистрированы?{' '}
                        <Link component={RouterLink} to="/login">Войти</Link>
                    </Typography>
                </Stack>
            </form>
        </Paper>
    );
};

export default RegisterPage;
