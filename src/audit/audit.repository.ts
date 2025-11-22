import { prisma } from '../core/db/prisma.js';
import { Prisma, type AuditAction } from '@prisma/client';
import type { IncomingMessage } from 'http';
import type { WSAuthClient } from '../websocket/ws.message-types.js';

interface AuditPayload {
  userId: string;
  documentId?: string;
  action: AuditAction;
  metadata?: Record<string, any>;
  request?: IncomingMessage;  
  ws?: WSAuthClient;        
}

export const logAudit = async (payload: AuditPayload) => {
  const ipAddress = 
    payload.request?.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
    payload.request?.headers['x-real-ip']?.toString() ||
    payload.request?.socket.remoteAddress ||
    payload.ws?.upgradeReq?.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
    payload.ws?.upgradeReq?.headers['x-real-ip']?.toString() ||
    payload.ws?.upgradeReq?.socket.remoteAddress ||
    'unknown';

  const userAgent = 
    payload.request?.headers['user-agent'] ||
    payload.ws?.upgradeReq?.headers['user-agent'] ||
    'unknown';

  await prisma.auditLog.create({
    data: {
      userId: payload.userId,
      documentId: payload.documentId || null,
      action: payload.action,
      metadata: payload.metadata ?? undefined,
      ipAddress,
      userAgent,
    },
  });
};