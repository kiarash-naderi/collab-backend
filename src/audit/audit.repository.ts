import { prisma } from '../core/db/prisma.js';
import type { AuditAction } from '@prisma/client';

interface AuditPayload {
  userId: string;
  documentId?: string;
  action: AuditAction;
  metadata?: Record<string, any>;
}

export const logAudit = async (payload: AuditPayload) => {
  await prisma.auditLog.create({
    data: {
      userId: payload.userId,
      documentId: payload.documentId || null,
      action: payload.action,
      metadata: payload.metadata !== undefined ? payload.metadata : undefined,
    },
  });
};