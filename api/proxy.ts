// Vercel Serverless Function: /api/proxy.ts
// This is our backend. It runs on Vercel's servers.
import { logService } from '../src/services/logService';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Buffer } from 'buffer';

export default async function handler(request: VercelRequest, response: VercelResponse) {
    const { targetUrl } = request.query;

    if (!targetUrl || typeof targetUrl !== 'string') {
        return response.status(400).json({ error: 'targetUrl query parameter is required' });
    }

    try {
        // Optional cookie pass-through: client may send x-poe-cookie with POESESSID=...
        const poeCookie = request.headers['x-poe-cookie'] as string | undefined;

        const fetchResponse = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                ...(poeCookie ? { 'Cookie': poeCookie } : {}),
            },
        });

        // Forward headers and status from the target response (including content-encoding!)
        fetchResponse.headers.forEach((value, key) => {
            response.setHeader(key, value);
        });
        
        // Set CORS headers
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

        // Pipe the body through
        response.status(fetchResponse.status);
        // Stream raw body through (browser will handle decompression when header is present)
        const body = await fetchResponse.arrayBuffer();
        response.send(Buffer.from(body));

    } catch (error: any) {
        logService.error(`[Vercel Proxy] Failed to fetch target URL: ${targetUrl}`, { error });
        response.status(500).json({ error: `Server-side proxy failed: ${error.message}` });
    }
}
