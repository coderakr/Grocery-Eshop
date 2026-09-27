/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly API_URL: string;
  readonly VITE_STORE_NAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}