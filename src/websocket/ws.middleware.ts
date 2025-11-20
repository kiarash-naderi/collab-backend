import type { IncomingMessage } from 'http';
import { verifyAccessToken } from '../modules/auth/services/jwt.service.js';
import { JwtPayload } from '../modules/auth/types/auth.types.js';
import { parse } from 'path';

const extractToken = (req: IncomingMessage): string | null => {
  const url = new URL(req.url!, `http://${req.headers.host}`);
  const fromQuery = url.searchParams.get('token');
  if (fromQuery) return fromQuery;

  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;

  const cookies = parse(cookieHeader) as unknown as Record<string, string>;
  return cookies.access_token ?? null;
};

export const authenticateWebSocket = (req: IncomingMessage): JwtPayload => {
  const token = extractToken(req);
  if (!token) throw new Error('Token missing');

  return verifyAccessToken(token); 
};