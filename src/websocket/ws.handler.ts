import * as Y from "yjs";
import {
  Awareness,
  encodeAwarenessUpdate,
  applyAwarenessUpdate,
} from "y-protocols/awareness";
import { prisma } from "../core/db/prisma.js";
import { SyncService } from "../modules/documents/services/sync.service.js";
import {
  IncomingWSMessage,
  OutgoingWSMessage,
  WSAuthClient,
  YDocInstance,
} from "./ws.message-types.js";

export const documentStore = new Map<string, YDocInstance>();

const getOrCreateDocument = async (
  documentId: string
): Promise<YDocInstance> => {
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

  await SyncService.applyMissingOperations(
    ydoc,
    documentId,
    latestSnapshot?.createdAt
  );

  const instance: YDocInstance = { doc: ydoc, awareness };
  documentStore.set(documentId, instance);

  SyncService.registerYDoc(documentId, ydoc);

  return instance;
};

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

export const handleWebSocketConnection = async (
  ws: WSAuthClient,
  documentId: string,
  userId: string
): Promise<void> => {
  ws.isAlive = true;
  ws.userId = userId;
  ws.documentId = documentId;

  const { doc, awareness } = await getOrCreateDocument(documentId);

  const initialUpdate = Y.encodeStateAsUpdate(doc);
  const stateVector = Y.encodeStateVector(doc);
  ws.send(
    JSON.stringify({
      type: "init",
      update: Array.from(initialUpdate),
      stateVector: Array.from(stateVector),
    } satisfies OutgoingWSMessage)
  );

  const clientIds = Array.from(awareness.getStates().keys());
  if (clientIds.length > 0) {
    const awarenessUpdate = encodeAwarenessUpdate(awareness, clientIds);
    ws.send(
      JSON.stringify({
        type: "awareness-init",
        data: Array.from(awarenessUpdate),
      })
    );
  }

  ws.on("message", async (data: import("ws").RawData) => {
    try {
      const raw = data.toString("utf-8");
      const msg = JSON.parse(raw) as IncomingWSMessage;

      if (msg.type === "update" && Array.isArray(msg.data)) {
        const update = new Uint8Array(msg.data);
        Y.applyUpdate(doc, update);

        await SyncService.persistUpdate(documentId, userId, update);

        broadcastMessage(ws, { type: "update", data: msg.data }, documentId);
      }

      if (msg.type === "awareness" && Array.isArray(msg.data)) {
        const update = new Uint8Array(msg.data);
        applyAwarenessUpdate(awareness, update, ws);
        broadcastMessage(ws, { type: "awareness", data: msg.data }, documentId);
      }

      if (msg.type === "sync-request" && Array.isArray(msg.stateVector)) {
        const clientStateVector = new Uint8Array(msg.stateVector);
        const diff = Y.encodeStateAsUpdate(doc, clientStateVector);

        if (diff.length > 0) {
          ws.send(
            JSON.stringify({
              type: "sync-response",
              update: Array.from(diff),
            })
          );
        }
      }
    } catch (err) {
      console.error("Invalid WebSocket message:", err);
    }
  });

  ws.on("pong", () => {
    ws.isAlive = true;
  });

  ws.on("close", () => {
    awareness.setLocalState(null);
  });
};
