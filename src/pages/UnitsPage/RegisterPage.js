import React, { useState } from 'react';
import { supabase } from '@shared/api/supabaseClient';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
    Paper, TextField, Button, Stack, Typography, Link
} from '@mui/material';

const RegisterPage = () => {
    const nav = useNavigate();
    const [email, setEmail]       = useState('');
    const [password, setPassword] = useState('');
    const [name, setName]         = useState('');
    const [msg, setMsg]           = useState('');
    const [err, setErr]           = useState('');

    const signUp = async (e) => {
        e.preventDefault();
        setMsg(''); setErr('');

        /* ---------- регистрация ---------- */
        const { error } = await supabase.auth.signUp({           // CHANGE: полагаемся на триггер
            email,
            password,
            options: { data: { name } }
        });

        if (error) return setErr(error.message);

        setMsg('Подтвердите e-mail и войдите.');
        setTimeout(() => nav('/login', { replace: true }), 3000);
    };

    return (
        <Paper sx={{ p: 4, maxWidth: 380, mx: 'auto', mt: 6 }}>
            <form onSubmit={signUp}>
                <Stack spacing={2}>
                    <Typography variant="h5" align="center">Регистрация</Typography>

                    <TextField
                        label="Имя"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                        fullWidth
                    />
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
                        inputProps={{ minLength: 6 }}
                    />

                    <Button variant="contained" type="submit">Создать аккаунт</Button>

                    {msg && <Typography color="green">{msg}</Typography>}
                    {err && <Typography color="error">{err}</Typography>}

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
