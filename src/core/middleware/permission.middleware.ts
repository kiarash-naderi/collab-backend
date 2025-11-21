import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../core/db/prisma.js';
import { PermissionRole } from '@prisma/client';

const roleWeight: Record<PermissionRole, number> = {
  VIEWER: 1,
  EDITOR: 2,
  OWNER: 3,
};

export const requireDocumentPermission = (minimumRole: PermissionRole) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user?.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const documentId = req.params.id || req.body.documentId || req.query.documentId;
      if (!documentId) {
        return res.status(400).json({ error: 'Document ID is required' });
      }

      const permission = await prisma.documentPermission.findUnique({
        where: {
          documentId_userId: {
            documentId: documentId as string,
            userId: req.user.userId,
          },
        },
      });

      if (!permission) {
        const doc = await prisma.document.findUnique({
          where: { id: documentId as string },
          select: { ownerId: true },
        });

        if (doc?.ownerId === req.user.userId) {
          return next(); 
        }

        return res.status(403).json({ error: 'Forbidden: No permission' });
      }

      if (roleWeight[permission.role] < roleWeight[minimumRole]) {
        return res.status(403).json({ error: `Requires ${minimumRole} role` });
      }

      next();
    } catch (err) {
      console.error('Permission check failed:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};