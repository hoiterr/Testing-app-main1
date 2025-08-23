// Minimal logger for API layer to avoid importing from src/
export const logService = {
  info: (msg: string, meta?: unknown) => console.info(`[INFO] ${msg}`, meta ?? ''),
  error: (msg: string, meta?: unknown) => console.error(`[ERROR] ${msg}`, meta ?? ''),
  debug: (msg: string, meta?: unknown) => console.debug(`[DEBUG] ${msg}`, meta ?? ''),
};
