// src/shared/api/supabaseClient.js
import { createClient } from '@supabase/supabase-js';
import { useAuthStore } from '@shared/store/authStore';

const {
    REACT_APP_SUPABASE_URL:      SUPABASE_URL,
    REACT_APP_SUPABASE_ANON_KEY: SUPABASE_ANON_KEY,
} = process.env;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
        '[supabaseClient] Задайте REACT_APP_SUPABASE_URL и REACT_APP_SUPABASE_ANON_KEY в .env',
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