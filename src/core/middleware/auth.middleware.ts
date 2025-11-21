import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../../modules/auth/services/jwt.service.js';

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.access_token || req.headers.authorization?.split(' ')?.[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = payload; 
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};