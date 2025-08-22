interface AppConfig {
  API_BASE_URL: string;
  // Add other environment variables here as needed
}

// CLIENT-SAFE: Only read from import.meta.env.VITE_*
const viteEnv = (import.meta as any)?.env || {};
const config: AppConfig = {
  API_BASE_URL: viteEnv.VITE_API_BASE_URL || 'http://localhost:3000',
};

// Basic validation to ensure critical environment variables are set
// Add validation for API_BASE_URL if it's crucial for the app to function
if (!config.API_BASE_URL) {
  console.warn("Environment variable API_BASE_URL (or VITE_API_BASE_URL) is not set. Defaulting to localhost.");
}

export const configService = {
  get: <K extends keyof AppConfig>(key: K): AppConfig[K] => {
    if (!config[key]) {
      // This check is a safeguard; primary validation is above.
      throw new Error(`Configuration key ${String(key)} is not set.`);
    }
    return config[key];
  },
  // Potentially add a method to check if running in development/production
  // isDevelopment: process.env.NODE_ENV === 'development',
};
