import { prisma } from '../../../core/db/prisma';
import type { DocumentOp } from '@prisma/client';

export const saveOp = async (docId: string, update: Buffer): Promise<DocumentOp> => {
  return prisma.documentOp.create({
    data: {
      docId,
      updateBinary: new Uint8Array(update), 
    },
  });
};


export const getOpsSince = async (docId: string, since: Date): Promise<DocumentOp[]> => {
  return prisma.documentOp.findMany({
    where: {
      docId,
      createdAt: { gt: since },
    },
    orderBy: { createdAt: 'asc' },
  });
};