
import { logService } from './logService';

// This function is now the CLIENT-SIDE entrypoint to our proxy.
// It calls our own backend (/api/proxy) which then performs the actual fetch.
export const fetchProxied = async (url: string, poeCookie?: string): Promise<Response> => {
    // The Vercel function lives at /api/proxy.
    // We pass the URL we want to fetch as a query parameter.
    const proxyUrl = `/api/proxy?targetUrl=${encodeURIComponent(url)}`;
    
    logService.debug(`[Client] Fetching via Vercel proxy: ${url}`);

    try {
        const response = await fetch(proxyUrl, {
            headers: poeCookie ? { 'x-poe-cookie': poeCookie } : undefined,
        });

        if (!response.ok) {
            const responseBody = await response.text();
            logService.error(`[Client] Non-OK response from Vercel proxy for ${url}`, { status: response.status, body: responseBody });
            throw new Error(`Proxy request failed with status ${response.status}. This could be an issue with the Path of Exile servers or our proxy.`);
        }
        
        logService.debug(`[Client] Successfully fetched via Vercel proxy: ${url}`);
        return response;

    } catch (error) {
        logService.error(`[Client] Network error calling Vercel proxy for ${url}`, { 
            error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error) 
        });
        throw new Error(`A network error occurred while communicating with our backend proxy.`);
    }
};