/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NOTION_TOKEN: string
  readonly VITE_NOTION_DATABASE_ID: string
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}