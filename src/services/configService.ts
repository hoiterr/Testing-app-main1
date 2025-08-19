interface AppConfig {
  GEMINI_API_KEY: string;
  // Add other environment variables here as needed
}

const config: AppConfig = {
  GEMINI_API_KEY: process.env.API_KEY || '', // Assuming API_KEY is set as GEMINI_API_KEY for clarity
};

// Basic validation to ensure critical environment variables are set
if (!config.GEMINI_API_KEY) {
  console.error("Environment variable GEMINI_API_KEY (or process.env.API_KEY) is not set.");
  // In a real application, you might throw an error or handle this more gracefully.
  // For Vercel, this is usually managed via Vercel Project Settings -> Environment Variables.
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
