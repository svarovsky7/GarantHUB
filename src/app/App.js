import React, { useEffect, useCallback } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, CssBaseline, createTheme } from '@mui/material';

import { supabase }     from '@shared/api/supabaseClient';
import { queryClient }  from '@shared/config/queryClient';
import { useAuthStore } from '@shared/store/authStore';

import AppRouter from './Router';

const theme = createTheme({ palette: { mode: 'light' } });
const log   = (...a) => console.log('%c[App]', 'color:teal', ...a);

/* ------------------------------------------------------------------ */

const App = () => {
    const setProfile = useAuthStore((s) => s.setProfile);

    /* ---------- профиль ---------- */
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
                    role:  'USER',
                },
            );
        },
        [setProfile],
    );

    /* ---------- инициализация, подписка на авторизацию ---------- */
    useEffect(() => {
        setProfile(null);
        log('mount → auth init');

        (async () => {
            const { data, error } = await supabase.auth.getSession();
            log('getSession', { data, error });
            if (error || !data.session?.user) return;
            loadProfile(data.session.user, 'init');
        })();

        const { data: { subscription } = {} } =
            supabase.auth.onAuthStateChange((event, session) => {
                log('auth event', event, session);
                if (!session?.user) return setProfile(null);
                loadProfile(session.user, `event:${event}`);
            });

        return () => subscription?.unsubscribe?.();
    }, [setProfile, loadProfile]);

    /* ---------- UI ---------- */
    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                <AppRouter />
            </ThemeProvider>
        </QueryClientProvider>
    );
};

export default App;
