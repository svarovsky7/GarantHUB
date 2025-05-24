// src/shared/api/supabaseClient.js
import { createClient } from '@supabase/supabase-js';
import { useAuthStore } from '@shared/store/authStore';

// Vite использует переменные с префиксом `VITE_`, в то время как в
// приложениях CRA применялся префикс `REACT_APP_`.  Для совместимости
// проверяем оба варианта из `import.meta.env` и `process.env`.
const SUPABASE_URL =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
    process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY =
    (typeof import.meta !== 'undefined' &&
        import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
    process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
        '[supabaseClient] Задайте VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY (или их REACT_APP_ аналоги) в .env',
    );
}

async function debugFetch(resource, init) {
    const res = await fetch(resource, init);

    if (!res.ok) {
        const h          = res.headers;
        const requestId  = h.get('x-request-id') ?? '<нет>';
        const contentTp  = h.get('content-type')  ?? '';
        const rawBody    = await res.clone().text();
        let   parsedBody = rawBody;

        if (contentTp.includes('json')) {
            try {
                parsedBody = JSON.parse(rawBody);
            } catch {}
        }

        console.error(
            '[Supabase HTTP-error]',
            res.status,
            resource,
            '\n↳ request-id:',
            requestId,
            '\n↳ response body:',
            typeof parsedBody === 'string'
                ? parsedBody
                : JSON.stringify(parsedBody, null, 2),
        );
    }

    return res;
}

export const supabase = createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
        global: { fetch: debugFetch },
        auth:   {
            persistSession:   true,
            autoRefreshToken: true,
        },
    },
);

supabase.auth.onAuthStateChange((_event, session) => {
    useAuthStore.getState().setProfile(session?.user ?? null);
});