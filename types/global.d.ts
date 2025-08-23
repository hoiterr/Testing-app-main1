// Ambient module declarations to satisfy TypeScript where packages ship without types in this project
// Server-only SDK (used under api/):
declare module '@google/genai';

// Browser-safe lib used in src/:
declare module 'pako' {
  export interface InflateOptions {
    to?: 'string';
    windowBits?: number; // allow switching between zlib/gzip/raw
  }
  export function inflate(input: Uint8Array, options?: InflateOptions): Uint8Array | string;
  export function inflateRaw(input: Uint8Array, options?: InflateOptions): Uint8Array | string;
}

// Minimal Node globals to avoid requiring @types/node for serverless-only files
// (Vercel provides process at runtime)
declare var process: any;
