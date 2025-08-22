
import { logService } from './logService';

// This function is now the CLIENT-SIDE entrypoint to our proxy.
// It calls our own backend (/api/proxy) which then performs the actual fetch.
export const fetchProxied = async (url: string): Promise<Response> => {
    const proxyUrl = `/api/proxy?targetUrl=${encodeURIComponent(url)}`;
    const maxAttempts = 3;
    const baseDelayMs = 300;
    const timeoutMs = 15_000;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        logService.debug(`[Client] Fetching via Vercel proxy (attempt ${attempt}/${maxAttempts}): ${url}`);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);
        try {
            const response = await fetch(proxyUrl, { signal: controller.signal });
            clearTimeout(timeout);

            if (!response.ok) {
                const responseBody = await response.text().catch(() => '<unreadable body>');
                logService.error(`[Client] Non-OK response from Vercel proxy for ${url}`, { status: response.status, body: responseBody });
                // For 5xx errors, consider retrying. For 4xx, fail fast.
                if (response.status >= 500 && attempt < maxAttempts) {
                    const delay = baseDelayMs * Math.pow(2, attempt - 1);
                    await new Promise(r => setTimeout(r, delay));
                    continue;
                }
                throw new Error(`Proxy request failed with status ${response.status}.`);
            }

            logService.debug(`[Client] Successfully fetched via Vercel proxy: ${url}`);
            return response;

        } catch (error) {
            clearTimeout(timeout);
            const isAbort = (error as any)?.name === 'AbortError';
            logService.error(`[Client] ${isAbort ? 'Timeout' : 'Network error'} calling Vercel proxy for ${url}`, {
                error: error instanceof Error ? { name: error.name, message: error.message, stack: error.stack } : String(error),
            });
            if (attempt < maxAttempts) {
                const delay = baseDelayMs * Math.pow(2, attempt - 1);
                await new Promise(r => setTimeout(r, delay));
                continue;
            }
            throw new Error(`A network error occurred while communicating with our backend proxy.${isAbort ? ' (timed out)' : ''}`);
        }
    }

    throw new Error('Unexpected error: retries exhausted.');
};