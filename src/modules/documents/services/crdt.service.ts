import * as Y from "yjs";
import { Awareness } from "y-protocols/awareness";
import { prisma } from "../../../core/db/prisma.js";
import { applyMissingOperations, registerYDoc } from "./sync.service.js";
import type { YDocInstance } from "../../../websocket/ws.message-types.js";

export const documentStore = new Map<string, YDocInstance>();

export const getOrCreateYDoc = async (documentId: string): Promise<YDocInstance> => {
  const cached = documentStore.get(documentId);
  if (cached) return cached;

  const ydoc = new Y.Doc();
  const awareness = new Awareness(ydoc);

  const latestSnapshot = await prisma.documentVersion.findFirst({
    where: { documentId },
    orderBy: { createdAt: "desc" },
    select: { snapshot: true, createdAt: true },
  });

  if (latestSnapshot?.snapshot) {
    Y.applyUpdate(ydoc, new Uint8Array(latestSnapshot.snapshot));
    console.log(`Snapshot loaded for document ${documentId}`);
  }

  await applyMissingOperations(
    ydoc,
    documentId,
    latestSnapshot?.createdAt
  );

  const instance: YDocInstance = { doc: ydoc, awareness };
  documentStore.set(documentId, instance);

  registerYDoc(documentId, ydoc);

  return instance;
};

export const applyUpdate = (ydoc: Y.Doc, update: Uint8Array) => {
  Y.applyUpdate(ydoc, update);
};