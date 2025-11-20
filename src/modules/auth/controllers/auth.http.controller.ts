import { Request, Response } from 'express';
import { prisma } from '../../../core/db/prisma';
import { AuthService } from '../services/auth.service';
import { generateTokens } from '../services/jwt.service';
import { PermissionRole } from '@prisma/client';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as { email: string; password: string };
    const result = await AuthService.login(email, password);
    res.json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message || 'Invalid credentials' });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body as {
      email: string;
      password: string;
      name?: string;
    };

    const user = await AuthService.register(email, password, name);
    res.status(201).json({
      message: 'User created successfully',
      userId: user.id,
      email: user.email,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Registration failed' });
  }
};

export const refresh = async (req: Request, res: Response) => {
  const { refreshToken } = req.body as { refreshToken?: string };

  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token required' });
  }

  try {
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: {
        user: {
          include: {
            permissions: {
              select: { documentId: true, role: true },
            },
          },
        },
      },
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const docPermissions = tokenRecord.user.permissions.reduce(
      (acc, p) => {
        acc[p.documentId] = p.role as PermissionRole;
        return acc;
      },
      {} as Record<string, PermissionRole>
    );

    const { accessToken, refreshToken: newRefreshToken } = await generateTokens(
      tokenRecord.userId,
      docPermissions
    );

    await prisma.refreshToken.delete({ where: { id: tokenRecord.id } });

    res.json({
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

export const logout = async (req: Request, res: Response) => {
  const { refreshToken } = req.body as { refreshToken?: string };

  if (refreshToken) {
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
  }

  res.json({ message: 'Logged out successfully' });
};