interface AppConfig {
  GEMINI_API_KEY: string;
  API_BASE_URL: string;
}

// Resolve configuration values from environment
const config: AppConfig = {
  // Prefer client-side Vite env for browser, fallback to server env for API routes
  GEMINI_API_KEY:
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_GEMINI_API_KEY) ||
    (typeof process !== 'undefined' && process?.env?.GEMINI_API_KEY) ||
    '',
  // Optional base URL for APIs if ever needed client-side; default to empty (relative requests)
  API_BASE_URL:
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) ||
    (typeof process !== 'undefined' && process?.env?.API_BASE_URL) ||
    '',
};

export const configService = {
  get: <K extends keyof AppConfig>(key: K): AppConfig[K] => {
    return config[key];
  },
};
