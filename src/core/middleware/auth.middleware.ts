import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../../modules/auth/services/jwt.service.js';
import type { JwtPayload } from '../../modules/auth/types/auth.types.js';

export const authenticateFromCookie = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies?.access_token as string | undefined;

  if (!token) {
    return res.status(401).json({ error: 'Access denied' });
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = payload as JwtPayload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};