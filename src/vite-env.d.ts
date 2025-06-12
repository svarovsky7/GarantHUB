/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_ATTACH_BUCKET?: string;
  readonly REACT_APP_SUPABASE_URL?: string;
  readonly REACT_APP_SUPABASE_ANON_KEY?: string;
  readonly REACT_APP_ATTACH_BUCKET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
