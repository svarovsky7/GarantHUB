/**
 * Унифицированный клиент Supabase для CRA-проекта.
 * Используем переменные окружения REACT_APP_*,
 * потому что Create React App автоматически проксирует только такой префикс.
 */
import { createClient } from '@supabase/supabase-js';
import { useAuthStore } from '@shared/store/authStore';

const {                                             // CHANGE: переместили выше
    REACT_APP_SUPABASE_URL:      SUPABASE_URL,
    REACT_APP_SUPABASE_ANON_KEY: SUPABASE_ANON_KEY,
} = process.env;

/* ---------- валидация ---------- */
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
        '[supabaseClient] env-переменные REACT_APP_SUPABASE_URL ' +
        'и/или REACT_APP_SUPABASE_ANON_KEY не заданы.',
    );
}

/* ---------- клиент ---------- */
export const supabase = createClient(               // CHANGE: объявляем до использования
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
        },
    },
);

/* ---------- подписка на auth ---------- */
supabase.auth.onAuthStateChange((_event, session) => { // CHANGE: теперь supabase уже объявлен
    useAuthStore.getState().setProfile(session?.user ?? null);
});
