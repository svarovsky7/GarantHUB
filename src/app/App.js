// src/app/App.js
import React, { useEffect, useCallback } from 'react';
import { Container, Box } from '@mui/material';

import { supabase }     from '@shared/api/supabaseClient';
import { useAuthStore } from '@shared/store/authStore';

import NavBar    from '@/widgets/NavBar';
import AppRouter from './Router';

/* короткий лог-хелпер */
const log = (...a) => console.log('%c[App]', 'color:teal', ...a);

const App = () => {
    const setProfile = useAuthStore((s) => s.setProfile);

    /* ---------- загрузка профиля ---------- */
    const loadProfile = useCallback(
        /** @param {import('@supabase/supabase-js').User} user */
        async (user, tag = '') => {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            log(`loadProfile[${tag}]`, { data, error });

            setProfile(
                data ?? {
                    id:    user.id,
                    email: user.email,
                    name:  user.user_metadata?.name ?? null,
                    role:  'USER'
                }
            );
        },
        [setProfile]
    );

    /* ---------- подписка на изменения сессии ---------- */
    useEffect(() => {
        setProfile(null);
        log('mount → auth init');

        /* проверяем текущую сессию */
        (async () => {
            const { data, error } = await supabase.auth.getSession();
            log('getSession', { data, error });
            if (error || !data.session?.user) return;
            loadProfile(data.session.user, 'init');
        })();

        /* подписка на события входа/выхода */
        const {
            data: { subscription } = {}
        } = supabase.auth.onAuthStateChange((event, session) => {
            log('auth event', event, session);
            if (!session?.user) return setProfile(null);
            loadProfile(session.user, `event:${event}`);
        });

        return () => subscription?.unsubscribe?.();
    }, [loadProfile, setProfile]);

    /* ---------- UI ---------- */
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            {/* шапка */}
            <NavBar />

            {/* основной контент */}
            <Container maxWidth="lg" sx={{ flexGrow: 1, py: 3 }}>
                <AppRouter />
            </Container>
        </Box>
    );
};

export default App;
