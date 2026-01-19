/// <reference types="vite/client" />

declare global {
  interface ImportMetaEnv {
    readonly VITE_CHATKIT_API_URL?: string;
    readonly VITE_CHATKIT_API_DOMAIN_KEY?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

export {};
