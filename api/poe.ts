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
  // Prefer secure HTTP-only cookie set by /api/poe-session; allow explicit header as fallback for advanced tooling
  const cookieFromHeader = req.headers['x-poe-cookie'] as string | undefined;
  const sessionCookie = (req as any).cookies?.POESESSID as string | undefined; // @vercel/node exposes cookies on req
  const poeCookie = sessionCookie ? `POESESSID=${decodeURIComponent(sessionCookie)}` : (cookieFromHeader || '');

  if (!handle) return res.status(400).json({ error: 'Missing handle param (e.g., Hettii#6037)' });

  try {
    const headers: Record<string, string> = { ...DEFAULT_HEADERS };
    if (poeCookie) headers['Cookie'] = poeCookie;

    // 1) Try character-window JSON endpoint first
    const jsonUrl = `https://www.pathofexile.com/character-window/get-characters?accountName=${encodeURIComponent(handle)}&realm=${encodeURIComponent(realm)}`;
    const jsonResp = await fetch(jsonUrl, { headers });
    const contentType = jsonResp.headers.get('content-type') || '';
    const text = await jsonResp.text();
    if (jsonResp.ok && contentType.includes('application/json')) {
      const data = JSON.parse(text);
      if (Array.isArray(data)) {
        return res.status(200).json({ source: 'json', characters: data });
      }
    }

    // 2) Fallback: fetch public profile HTML and parse names
    const profileUrl = `https://www.pathofexile.com/account/view-profile/${encodeURIComponent(handle)}/characters?realm=${encodeURIComponent(realm)}`;
    const profileResp = await fetch(profileUrl, { headers });
    const profileHtml = await profileResp.text();
    const names = parseCharacterNamesFromHtml(profileHtml);
    if (names.length > 0) {
      return res.status(200).json({ source: 'html', characters: names.map(n => ({ name: n, class: 'Unknown', level: 0 })) });
    }

    return res.status(502).json({ error: 'Unable to read character list from PoE (JSON and HTML parse failed).' });
  } catch (err: any) {
    return res.status(500).json({ error: `Proxy error: ${err.message}` });
  }
}


