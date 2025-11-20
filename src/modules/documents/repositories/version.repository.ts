import { prisma } from '../../../core/db/prisma';
import type { DocumentVersion } from '@prisma/client';

export const createSnapshot = async (
  docId: string,
  snapshot: Uint8Array,
  stateVector: Uint8Array,
  createdBy?: string,
  label?: string
): Promise<DocumentVersion> => {
  return prisma.documentVersion.create({
    data: {
      documentId: docId,
      snapshot: Buffer.from(snapshot),
      stateVector: Buffer.from(stateVector),
      createdBy,
      label,
    },
  });
};

export const getLatestSnapshot = async (docId: string) => {
  return prisma.documentVersion.findFirst({
    where: { documentId: docId },
    orderBy: { createdAt: 'desc' },
  });
};

export const getVersionById = async (versionId: string) => {
  return prisma.documentVersion.findUnique({ where: { id: versionId } });
};

export const getVersions = async (docId: string) => {
  return prisma.documentVersion.findMany({
    where: { documentId: docId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
};