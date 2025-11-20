
import { prisma } from '../core/db/prisma';
import { Prisma } from '@prisma/client';
import type { AuditLog } from '@prisma/client';

export const logAudit = async (
  log: Omit<AuditLog, 'id' | 'timestamp'>
): Promise<AuditLog> => {
  return prisma.auditLog.create({
    data: {
      ...log,
      payload:
        log.payload === null ? Prisma.DbNull : log.payload, 
    },
  });
};


export const getAuditLogsForDoc = async (docId: string): Promise<AuditLog[]> => {
  return prisma.auditLog.findMany({ where: { docId } });
};