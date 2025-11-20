import jwt from 'jsonwebtoken';
import { prisma } from '../../../core/db/prisma';
import { JwtPayload } from '../types/auth.types';
import crypto from 'crypto';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const ACCESS_EXPIRES = '15m';
const REFRESH_EXPIRES = '30d';

export const generateTokens = async (userId: string, docPermissions: Record<string, 'OWNER' | 'EDITOR' | 'VIEWER'>) => {
  const payload: Omit<JwtPayload, 'iat' | 'exp' | 'jti'> = {
    userId,
    email: '', 
    docPermissions,
  };

  const accessToken = jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRES,
    jwtid: crypto.randomUUID(),
  });

  const refreshToken = crypto.randomUUID();
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, ACCESS_SECRET) as JwtPayload;
};

export const revokeRefreshToken = async (token: string) => {
  await prisma.refreshToken.deleteMany({ where: { token } });
};