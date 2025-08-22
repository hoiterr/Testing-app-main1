interface AppConfig {
  GEMINI_API_KEY: string;
  API_BASE_URL: string;
}

const isBrowser = typeof window !== 'undefined';

const readEnv = (key: string): string => {
  try {
    if (isBrowser) {
      // Vite injects client envs on build under import.meta.env
      return ((import.meta as any).env?.[key]) ?? '';
    }
    return process.env[key] ?? '';
  } catch {
    return '';
  }
};

const config: AppConfig = {
  // Server: GEMINI_API_KEY or API_KEY; Client: VITE_GEMINI_API_KEY
  GEMINI_API_KEY: isBrowser
    ? readEnv('VITE_GEMINI_API_KEY')
    : (process.env.GEMINI_API_KEY || process.env.API_KEY || ''),
  // Optional base URL if needed in future; prefer VITE_ on client
  API_BASE_URL: isBrowser
    ? readEnv('VITE_API_BASE_URL') || 'http://localhost:3000'
    : (process.env.API_BASE_URL || process.env.VITE_API_BASE_URL || 'http://localhost:3000'),
};

if (!config.GEMINI_API_KEY) {
  console.warn("GEMINI_API_KEY is not configured for this runtime. Server uses process.env.GEMINI_API_KEY; client uses VITE_GEMINI_API_KEY.");
}

export const configService = {
  get: <K extends keyof AppConfig>(key: K): AppConfig[K] => {
    return config[key];
  },
};
