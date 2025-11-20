import * as Y from "yjs";
import { prisma } from "../../../core/db/prisma.js";
import { yjsToPrismaBytes } from "../../../utils/yjs.js";

const documentYDocMap = new Map<string, Y.Doc>();

const SNAPSHOT_INTERVAL_MS = 30_000;
const SNAPSHOT_AFTER_OPS = 100;

const pendingSnapshots = new Map<string, NodeJS.Timeout>();
const opCounters = new Map<string, number>();

export class SyncService {
  static registerYDoc(documentId: string, ydoc: Y.Doc) {
    documentYDocMap.set(documentId, ydoc);
  }

  static async persistUpdate(
    documentId: string,
    userId: string,
    update: Uint8Array
  ): Promise<void> {
    await prisma.operation.create({
      data: {
        documentId,
        userId,
        update: yjsToPrismaBytes(update),
        stateVector: yjsToPrismaBytes(Y.encodeStateVectorFromUpdate(update)),
      },
    });

    const count = (opCounters.get(documentId) || 0) + 1;
    opCounters.set(documentId, count);

    if (count >= SNAPSHOT_AFTER_OPS) {
      this.scheduleSnapshot(documentId);
      opCounters.set(documentId, 0); 
    }
  }

  static scheduleSnapshot(documentId: string): void {
    if (pendingSnapshots.has(documentId)) return;

    const timer = setTimeout(async () => {
      const ydoc = documentYDocMap.get(documentId);
      if (!ydoc) {
        pendingSnapshots.delete(documentId);
        return;
      }

      const snapshot = Y.encodeStateAsUpdate(ydoc);
      const stateVector = Y.encodeStateVector(ydoc);

      await prisma.documentVersion.create({
        data: {
          documentId,
          snapshot: yjsToPrismaBytes(snapshot),
          stateVector: yjsToPrismaBytes(stateVector),
          label: `Auto-snapshot (${new Date().toISOString().split('T')[0]})`,
        },
      });

      console.log(`Snapshot saved for document ${documentId}`);
      pendingSnapshots.delete(documentId);
    }, SNAPSHOT_INTERVAL_MS);

    pendingSnapshots.set(documentId, timer);
  }

  static async applyMissingOperations(
    ydoc: Y.Doc,
    documentId: string,
    fromDate?: Date
  ): Promise<void> {
    const where: any = { documentId };
    if (fromDate) where.createdAt = { gt: fromDate };

    const ops = await prisma.operation.findMany({
      where,
      orderBy: { createdAt: "asc" },
    });

    for (const op of ops) {
      Y.applyUpdate(ydoc, new Uint8Array(op.update));
    }

    console.log(`Applied ${ops.length} missing operations for document ${documentId}`);
  }
}