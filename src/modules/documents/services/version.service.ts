
import { prisma } from "../../../core/db/prisma.js";
import * as Y from "yjs";
import { SyncService } from "./sync.service.js";
import { documentStore } from "../../../websocket/ws.handler.js"; // این خط مهمه!
import type { WSAuthClient } from "../../../websocket/ws.message-types.js";
import { Awareness } from "y-protocols/awareness.js";

export const listVersions = async (documentId: string) => {
  return await prisma.documentVersion.findMany({
    where: { documentId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      label: true,
      createdBy: true,
    },
  });
};

export const revertToVersion = async (
  documentId: string,
  versionId: string,
  userId: string
) => {
  const version = await prisma.documentVersion.findUnique({
    where: { id: versionId },
    select: { snapshot: true, label: true },
  });

  if (!version?.snapshot) {
    throw new Error("Version not found or snapshot is missing");
  }

  const snapshotBytes = new Uint8Array(version.snapshot);

  // 2. پیدا کردن Y.Doc فعلی در مموری
  const instance = documentStore.get(documentId);
  if (!instance) {
    throw new Error("Document is not currently loaded");
  }

  const { doc: ydoc, awareness } = instance;

  Y.applyUpdate(ydoc, snapshotBytes);

  awareness.destroy();
  const newAwareness = new Awareness(ydoc);
  instance.awareness = newAwareness;

  SyncService.registerYDoc(documentId, ydoc);

  const currentStateVector = Y.encodeStateVector(ydoc);
  await prisma.documentVersion.create({
    data: {
      documentId,
      snapshot: version.snapshot,
      stateVector: Buffer.from(currentStateVector),
      label: `Reverted by user ${userId} to "${version.label || "previous version"}"`,
      createdBy: userId,
    },
  });

  SyncService.scheduleSnapshot(documentId);

  const fullUpdate = Y.encodeStateAsUpdate(ydoc);
  const wss = (globalThis as any).wss as import("ws").WebSocketServer | undefined;

  if (wss) {
    for (const client of wss.clients) {
      const c = client as WSAuthClient;
      if (c.readyState === c.OPEN && c.documentId === documentId) {
        c.send(
          JSON.stringify({
            type: "update" as const,
            data: Array.from(fullUpdate),
          })
        );
      }
    }
  }

  return {
    success: true,
    message: "Document reverted successfully and synced to all users",
    revertedTo: versionId,
  };
};