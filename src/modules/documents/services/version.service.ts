import * as Y from "yjs";
import { prisma } from "../../../core/db/prisma.js";
import { getOrCreateYDoc } from "./crdt.service.js";
import type {
  WSAuthClient,
  OutgoingWSMessage,
} from "../../../websocket/ws.message-types.js";
import { Awareness } from "y-protocols/awareness.js";
import { logAudit } from "../../../audit/audit.repository.js";
import { AuditAction } from "@prisma/client";

const broadcastMessage = (
  sender: WSAuthClient,
  message: OutgoingWSMessage,
  documentId: string
): void => {
  const wss = sender.server;
  if (!wss) return;

  for (const client of wss.clients) {
    const c = client as WSAuthClient;
    if (c.readyState !== c.OPEN || c === sender || c.documentId !== documentId)
      continue;

    try {
      c.send(JSON.stringify(message));
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  }
};

export const revertToVersion = async (
  documentId: string,
  versionId: string,
  userId: string
): Promise<void> => {
  const perm = await prisma.documentPermission.findUnique({
    where: { documentId_userId: { documentId, userId } },
  });
  if (!perm || (perm.role !== "OWNER" && perm.role !== "EDITOR")) {
    throw new Error("Permission denied");
  }

  const version = await prisma.documentVersion.findUnique({
    where: { id: versionId },
    select: { snapshot: true },
  });

  if (!version) throw new Error("Version not found");

  const { doc, awareness } = await getOrCreateYDoc(documentId);

  Y.applyUpdate(doc, new Uint8Array(version.snapshot));

  awareness.destroy();
  const newAwareness = new Awareness(doc);

  const newSnapshot = Y.encodeStateAsUpdate(doc);
  const newStateVector = Y.encodeStateVector(doc);

  await prisma.documentVersion.create({
    data: {
      documentId,
      snapshot: Buffer.from(newSnapshot),
      stateVector: Buffer.from(newStateVector),
    },
  });

  await logAudit({
    userId,
    documentId,
    action: AuditAction.VERSION_REVERT,
    metadata: { revertedFrom: versionId },
  });

  const fullUpdate = Y.encodeStateAsUpdate(doc);
  broadcastMessage(
    { server: (globalThis as any).wss } as WSAuthClient,
    { type: "update", data: Array.from(fullUpdate) },
    documentId
  );
};

export const getVersions = async (documentId: string): Promise<any[]> => {
  return prisma.documentVersion.findMany({
    where: { documentId },
    orderBy: { createdAt: "desc" },
    select: { id: true, createdAt: true },
  });
};
