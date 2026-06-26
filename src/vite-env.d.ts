/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string
  readonly VITE_APP_ENV: string
  readonly VITE_API_HOSTNAME: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_API_TIMEOUT_MS: string
  readonly VITE_STORAGE_SECRET: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
