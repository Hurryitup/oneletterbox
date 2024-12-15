/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // Add other env variables here as needed
}

// This is necessary for Vite
interface ImportMeta {
  readonly env: ImportMetaEnv;
} 