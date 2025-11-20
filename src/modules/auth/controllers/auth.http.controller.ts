import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service.js';
import { generateTokens } from '../services/jwt.service.js';
import { prisma } from '../../../core/db/prisma.js';

const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
  const isProd = process.env.NODE_ENV === 'production';

  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000,
  });

  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password);

    setAuthCookies(res, result.accessToken, result.refreshToken);

    res.json({ user: result.user });
  } catch (err: any) {
    res.status(401).json({ error: 'Invalid credentials' });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    const user = await AuthService.register(email, password, name);

    res.status(201).json({
      message: 'User created successfully',
      userId: user.id,
      email: user.email,
    });
  } catch (err: any) {
    res.status(400).json({ error: 'Registration failed' });
  }
};

export const refresh = async (req: Request, res: Response) => {
  const oldRefreshToken = req.cookies?.refresh_token as string | undefined;

  if (!oldRefreshToken) {
    return res.status(401).json({ error: 'Refresh token required' });
  }

  try {
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: oldRefreshToken },
      include: {
        user: { include: { permissions: { select: { documentId: true, role: true } } } },
      },
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const docPermissions = tokenRecord.user.permissions.reduce(
      (acc, p) => ({ ...acc, [p.documentId]: p.role }),
      {} as Record<string, 'OWNER' | 'EDITOR' | 'VIEWER'>
    );

    const { accessToken, refreshToken: newRefreshToken } = await generateTokens(
      tokenRecord.userId,
      docPermissions
    );

    await prisma.refreshToken.delete({ where: { id: tokenRecord.id } });
    setAuthCookies(res, accessToken, newRefreshToken);

    res.json({ message: 'Token refreshed' });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

export const logout = async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refresh_token as string | undefined;

  if (refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  }

  res.clearCookie('access_token');
  res.clearCookie('refresh_token');

  res.json({ message: 'Logged out successfully' });
};