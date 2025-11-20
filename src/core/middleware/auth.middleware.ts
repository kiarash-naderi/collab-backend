import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../../modules/auth/services/jwt.service';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });

  try {
    const payload = verifyAccessToken(auth.split(' ')[1]);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};