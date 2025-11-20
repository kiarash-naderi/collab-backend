import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/prisma';

export const requirePermission = (role: 'OWNER' | 'EDITOR' | 'VIEWER') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user.userId;
    const docId = req.params.id || req.body.documentId;

    const perm = await prisma.documentPermission.findUnique({
      where: { documentId_userId: { documentId: docId, userId } }
    });

    const weights = { OWNER: 3, EDITOR: 2, VIEWER: 1 };
    if (!perm || weights[perm.role] < weights[role]) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    next();
  };
};