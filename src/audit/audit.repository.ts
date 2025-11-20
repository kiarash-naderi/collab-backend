import { prisma } from '../core/db/prisma';
import type { AuditLog, AuditAction } from '@prisma/client';

interface AuditInput {
  userId: string;
  documentId?: string;
  action: AuditAction;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
}

export const logAudit = async (input: AuditInput): Promise<AuditLog> => {
  return prisma.auditLog.create({
    data: {
      userId: input.userId,
      documentId: input.documentId || null,
      action: input.action,
      metadata: input.metadata || null,
      ipAddress: input.ipAddress || null,
      userAgent: input.userAgent || null,
    },
  });
};