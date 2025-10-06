// FIX: The reference to 'vite/client' was causing a "Cannot find type definition" error.
// The reference has been removed, and we will rely on the manually defined interfaces below
// to provide the necessary types for import.meta.env. This resolves the compilation error.
interface ImportMetaEnv {
  readonly VITE_API_KEY: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
