// Ambient module declarations to satisfy TypeScript where packages ship without types in this project
// Server-only SDK (used under api/):
declare module '@google/genai';
declare module '@vercel/node' {
  export interface VercelRequest {
    method?: string;
    headers: Record<string, string | string | undefined>;
    query: Record<string, string | string[] | undefined>;
    body?: any;
    cookies?: Record<string, string>;
  }
  export interface VercelResponse {
    status(code: number): VercelResponse;
    json(data: any): void;
    setHeader(name: string, value: string | string[]): void;
    end(data?: any): void;
  }
}

// Browser-safe lib used in src/:
declare module 'pako' {
  export function inflate(input: Uint8Array): Uint8Array;
}

// Minimal Node globals to avoid requiring @types/node for serverless-only files
// (Vercel provides process at runtime)
declare var process: any;
