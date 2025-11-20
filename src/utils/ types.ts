import { JwtPayload } from '../modules/auth/types/auth.types.js';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}