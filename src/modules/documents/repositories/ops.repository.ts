import { prisma } from "../../../core/db/prisma.js";
import type { Operation } from '@prisma/client';

export const saveOperation = async (
  docId: string,
  userId: string,
  update: Uint8Array,
  stateVector: Uint8Array
): Promise<Operation> => {
  return prisma.operation.create({
    data: {
      documentId: docId,
      userId,
      update: Buffer.from(update),
      stateVector: Buffer.from(stateVector),
    },
  });
};

export const getOperationsAfter = async (
  docId: string,
  afterStateVector?: Uint8Array
): Promise<Operation[]> => {
  if (!afterStateVector) {
    return prisma.operation.findMany({
      where: { documentId: docId },
      orderBy: { createdAt: 'asc' },
    });
  }

  return prisma.operation.findMany({
    where: {
      documentId: docId,
      createdAt: { gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
    orderBy: { createdAt: 'asc' },
  });
};