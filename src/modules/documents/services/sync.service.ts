import * as Y from "yjs";
import { prisma } from "../../../core/db/prisma.js";

const snapshotTimers = new Map<string, NodeJS.Timeout>();

export const persistUpdate = async (
  documentId: string,
  userId: string,
  update: Uint8Array,
  stateVector: Uint8Array
): Promise<void> => {
  await prisma.operation.create({
    data: {
      documentId,
      userId,
      update: Buffer.from(update),
      stateVector: Buffer.from(stateVector),
    },
  });
};

export const applyMissingOperations = async (
  ydoc: Y.Doc,
  documentId: string,
  fromDate?: Date | null
): Promise<void> => {
  const operations = await prisma.operation.findMany({
    where: {
      documentId,
      createdAt: { gt: fromDate ?? new Date(0) },
    },
    orderBy: { createdAt: "asc" },
    select: { update: true },
  });

  for (const op of operations) {
    Y.applyUpdate(ydoc, new Uint8Array(op.update));
  }
};

export const registerYDoc = (documentId: string, ydoc: Y.Doc) => {
  const existingTimer = snapshotTimers.get(documentId);
  if (existingTimer) clearTimeout(existingTimer);

  const timer = setTimeout(async () => {
    const snapshot = Y.encodeStateAsUpdate(ydoc);
    const stateVector = Y.encodeStateVector(ydoc);

    await prisma.documentVersion.create({
      data: {
        documentId,
        snapshot: Buffer.from(snapshot),
        stateVector: Buffer.from(stateVector),
      },
    });

    await prisma.operation.deleteMany({
      where: { 
        documentId, 
        createdAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } 
      },
    });

    snapshotTimers.delete(documentId);
  }, 5 * 60 * 1000); 
  
  snapshotTimers.set(documentId, timer);
};