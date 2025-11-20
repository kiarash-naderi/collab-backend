import { prisma } from '../../../core/db/prisma';
import type { DocumentVersion } from '@prisma/client';

export const saveSnapshot = async (docId: string, snapshot: Buffer): Promise<DocumentVersion> => {
  return prisma.documentVersion.create({
    data: {
      docId,
      snapshotBinary: new Uint8Array(snapshot),
    },
  });
};


export const getLatestSnapshot = async (docId: string): Promise<DocumentVersion | null> => {
  return prisma.documentVersion.findFirst({
    where: { docId },
    orderBy: { createdAt: 'desc' },
  });
};

export const getVersionById = async (id: string): Promise<DocumentVersion | null> => {
  return prisma.documentVersion.findUnique({ where: { id } });
};