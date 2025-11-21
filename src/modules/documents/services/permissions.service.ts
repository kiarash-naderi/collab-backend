import { prisma } from '../../../core/db/prisma.js';
import { PermissionRole } from '@prisma/client';
import { AppError } from '../../../utils/errors.js';

export const requireDocumentRole = async (
  documentId: string,
  userId: string,
  minimumRole: 'VIEWER' | 'EDITOR' | 'OWNER'
) => {
  const permission = await prisma.documentPermission.findUnique({
    where: {
      documentId_userId: { documentId, userId },
    },
  });

  if (!permission) {
    const doc = await prisma.document.findUnique({
      where: { id: documentId },
      select: { ownerId: true },
    });
    if (doc?.ownerId === userId) {
      return; 
    }
    throw new AppError('Forbidden: No permission', 403);
  }

  const roleOrder: Record<PermissionRole, number> = {
    VIEWER: 1,
    EDITOR: 2,
    OWNER: 3,
  };

  if (roleOrder[permission.role] < roleOrder[minimumRole as PermissionRole]) {
    throw new AppError(`Requires ${minimumRole} role`, 403);
  }
};