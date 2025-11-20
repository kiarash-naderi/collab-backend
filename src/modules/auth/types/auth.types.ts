import { PermissionRole } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  email: string;
  docPermissions: Record<string, PermissionRole>; 
  iat: number;
  exp: number;
  jti: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string | null;
  };
}