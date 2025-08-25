// Vercel Serverless Function: /api/poe-session
// Manages a secure HTTP-only cookie that stores the user's POESESSID.
// POST   -> set cookie (7-day TTL)
// DELETE -> clear cookie

import type { VercelRequest, VercelResponse } from '@vercel/node';

const COOKIE_NAME = 'POESESSID';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days in seconds

function serializeCookie(name: string, value: string, opts: { maxAge?: number; delete?: boolean } = {}): string {
  const parts = [
    `${name}=${value}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Secure',
  ];
  if (opts.delete) {
    parts.push('Max-Age=0');
  } else if (typeof opts.maxAge === 'number') {
    parts.push(`Max-Age=${opts.maxAge}`);
  }
  return parts.join('; ');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    try {
      const poesessid = (req.body?.poesessid as string | undefined) || (req.headers['x-poe-sessid'] as string | undefined);
      if (!poesessid || typeof poesessid !== 'string') {
        return res.status(400).json({ error: 'Missing poesessid in body or x-poe-sessid header' });
      }
      // Basic validation: POESESSID is typically a long hex string, but we avoid strict regex to not break edge cases.
      if (poesessid.length < 20) {
        return res.status(400).json({ error: 'Provided POESESSID looks invalid (too short).' });
      }

      res.setHeader('Set-Cookie', serializeCookie(COOKIE_NAME, encodeURIComponent(poesessid), { maxAge: COOKIE_MAX_AGE }));
      return res.status(204).end();
    } catch (err: any) {
      return res.status(500).json({ error: `Failed to set session cookie: ${err.message}` });
    }
  }

  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', serializeCookie(COOKIE_NAME, '', { delete: true }));
    return res.status(204).end();
  }

  res.setHeader('Allow', 'POST, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}
