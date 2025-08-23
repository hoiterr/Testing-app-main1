// Vercel Serverless Function: /api/poe
import type { VercelRequest, VercelResponse } from '@vercel/node';

const DEFAULT_HEADERS: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36',
  'Accept': 'application/json, text/html, */*; q=0.9',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
  'Referer': 'https://www.pathofexile.com/account/view-profile',
  'Origin': 'https://www.pathofexile.com',
};

// Simple in-memory cache for recent lookups to reduce repeated PoE hits
type CacheVal = { ts: number; data: any };
const CACHE = new Map<string, CacheVal>();
const CACHE_TTL_MS = 60_000; // 60s

function getCache(key: string): any | undefined {
  const v = CACHE.get(key);
  if (!v) return undefined;
  if (Date.now() - v.ts > CACHE_TTL_MS) { CACHE.delete(key); return undefined; }
  return v.data;
}
function setCache(key: string, data: any) {
  CACHE.set(key, { ts: Date.now(), data });
}

async function fetchWithRetry(url: string, headers: Record<string, string>, attempts = 3, timeoutMs = 12_000): Promise<Response> {
  let lastErr: any;
  for (let i = 1; i <= attempts; i++) {
    const controller = new AbortController();
    const to = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const resp = await fetch(url, { headers, signal: controller.signal });
      clearTimeout(to);
      if (resp.status === 429) {
        lastErr = new Error('Rate limited by Path of Exile (HTTP 429). Please wait a moment and try again.');
      } else if (resp.status === 403) {
        lastErr = new Error('Access forbidden (HTTP 403). Ensure the profile and character tabs are public.');
      } else if (!resp.ok) {
        lastErr = new Error(`Upstream returned status ${resp.status}`);
      } else {
        return resp;
      }
    } catch (e: any) {
      clearTimeout(to);
      lastErr = e?.name === 'AbortError' ? new Error('Request to Path of Exile timed out.') : e;
    }
    if (i < attempts) {
      const backoff = 300 * Math.pow(2, i - 1);
      await new Promise(r => setTimeout(r, backoff));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
}

function parseCharacterNamesFromHtml(html: string): string[] {
  const names: string[] = [];
  const nameRegex = /class=\"name\"[^>]*>([^<]+)/g;
  let m: RegExpExecArray | null;
  while ((m = nameRegex.exec(html)) !== null) {
    names.push(m[1]);
  }
  if (names.length === 0) {
    // Alternative older markup
    const alt = /<span[^>]*class=\"character\-name\"[^>]*>([^<]+)/g;
    while ((m = alt.exec(html)) !== null) {
      names.push(m[1]);
    }
  }
  return names;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const handle = req.query.handle as string | undefined;
  const realm = (req.query.realm as string | undefined) || 'pc';
  const poeCookie = (req.headers['x-poe-cookie'] as string | undefined) || '';

  if (!handle) return res.status(400).json({ error: 'Missing handle param (e.g., Hettii#6037)' });

  try {
    const headers: Record<string, string> = { ...DEFAULT_HEADERS };
    if (poeCookie) headers['Cookie'] = poeCookie;

    const cacheKey = `${handle}|${realm}`;
    const cached = getCache(cacheKey);
    if (cached) {
      return res.status(200).json(cached);
    }

    // 1) Try character-window JSON endpoint first (public for public profiles)
    const jsonUrl = `https://www.pathofexile.com/character-window/get-characters?accountName=${encodeURIComponent(handle)}&realm=${encodeURIComponent(realm)}`;
    const jsonResp = await fetchWithRetry(jsonUrl, headers);
    const contentType = jsonResp.headers.get('content-type') || '';
    const text = await jsonResp.text();
    if (jsonResp.ok && contentType.includes('application/json')) {
      try {
        const data = JSON.parse(text);
        if (Array.isArray(data)) {
          const payload = { source: 'json', characters: data };
          setCache(cacheKey, payload);
          return res.status(200).json(payload);
        }
      } catch {
        // fall through to HTML
      }
    }

    // Check for known rate-limit or forbidden HTML indicators
    const lower = text.toLowerCase();
    if (lower.includes('rate limit') || lower.includes('too many requests')) {
      return res.status(429).json({ error: 'Path of Exile rate limited this request. Please wait a moment and try again.' });
    }
    if (jsonResp.status === 403 || lower.includes('forbidden')) {
      // Try HTML fallback next, but inform if that also fails
    }

    // 2) Fallback: fetch public profile HTML and parse names
    const profileUrl = `https://www.pathofexile.com/account/view-profile/${encodeURIComponent(handle)}/characters?realm=${encodeURIComponent(realm)}`;
    const profileResp = await fetchWithRetry(profileUrl, headers);
    const profileHtml = await profileResp.text();
    const names = parseCharacterNamesFromHtml(profileHtml);
    if (names.length > 0) {
      const payload = { source: 'html', characters: names.map(n => ({ name: n, class: 'Unknown', level: 0 })) };
      setCache(cacheKey, payload);
      return res.status(200).json(payload);
    }

    return res.status(502).json({ error: 'Unable to read character list from PoE (JSON and HTML parse failed).' });
  } catch (err: any) {
    return res.status(500).json({ error: `Proxy error: ${err.message}` });
  }
}


