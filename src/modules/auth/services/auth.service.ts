
import bcrypt from 'bcryptjs';
import { PermissionRole } from '@prisma/client';
import { prisma } from '../../../core/db/prisma.js';
import { generateTokens } from './jwt.service.js';

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
}

export class AuthService {
  static async login(email: string, password: string): Promise<LoginResult> {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        permissions: {
          select: {
            documentId: true,
            role: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    const docPermissions: Record<string, PermissionRole> = {};
    for (const perm of user.permissions) {
      docPermissions[perm.documentId] = perm.role;
    }

    const { accessToken, refreshToken } = await generateTokens(user.id, docPermissions);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  static async register(email: string, password: string, name?: string) {
    const hashed = await bcrypt.hash(password, 12);

    return prisma.user.create({
      data: {
        email,
        passwordHash: hashed,
        name,
      },
    });
  }

  static async createTestUser() {
    return this.register('test@example.com', '123456', 'Test User');
  }
}