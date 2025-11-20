import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../../../core/db/prisma.js';
import type { JwtPayload } from '../types/auth.types.js';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;

export const generateTokens = async (
  userId: string,
  docPermissions: Record<string, 'OWNER' | 'EDITOR' | 'VIEWER'>
) => {
  const accessToken = jwt.sign(
    { userId, email: '', docPermissions },
    ACCESS_SECRET,
    { expiresIn: '15m', jwtid: crypto.randomUUID() }
  );

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