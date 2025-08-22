interface AppConfig {
  API_BASE_URL: string;
}
}

export const configService = {
  get: <K extends keyof AppConfig>(key: K): AppConfig[K] => {
    return config[key];
  },
};
