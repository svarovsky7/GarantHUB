// src/widgets/NavBar.js
import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';

import { supabase }     from '@shared/api/supabaseClient';
import { useAuthStore } from '@shared/store/authStore';

const NavBar = () => {
    const profile    = useAuthStore((s) => s.profile);
    const setProfile = useAuthStore((s) => s.setProfile);
    const isAdmin    = profile?.role === 'ADMIN';

    const logout = async () => {
        await supabase.auth.signOut();
        setProfile(null);
    };

    return (
        <AppBar position="static">
            <Toolbar sx={{ gap: 2 }}>
                {/* Логотип / переход на главную */}
                <Typography
                    variant="h6"
                    component={RouterLink}
                    to="/"
                    color="inherit"
                    sx={{ textDecoration: 'none' }}
                >
                    Garantie&nbsp;Hub
                </Typography>

                {/* Основная навигация */}
                <Button color="inherit" component={RouterLink} to="/units">
                    Объекты
                </Button>

                <Button color="inherit" component={RouterLink} to="/tickets">
                    Замечания
                </Button>

                {/* CHANGE: прямая ссылка на новую страницу перечня */}
                <Button
                    color="inherit"
                    component={RouterLink}
                    to="/tickets/list"
                >
                    Перечень&nbsp;замечаний
                </Button>

                <Button
                    color="inherit"
                    component={RouterLink}
                    to="/tickets/new"
                >
                    Новое&nbsp;замечание
                </Button>

                {isAdmin && (
                    <Button
                        color="inherit"
                        component={RouterLink}
                        to="/admin"
                    >
                        Администрирование
                    </Button>
                )}

                {/* гибкий отступ, чтобы кнопки справа «прилипли» к краю */}
                <span style={{ flexGrow: 1 }} />

                {profile && (
                    <>
                        <Typography variant="body2" sx={{ mr: 2 }}>
                            {profile.name ?? profile.email}
                        </Typography>
                        <Button
                            color="inherit"
                            startIcon={<LogoutIcon />}
                            onClick={logout}
                        >
                            Выйти
                        </Button>
                    </>
                )}
            </Toolbar>
        </AppBar>
    );
};

export default NavBar;
