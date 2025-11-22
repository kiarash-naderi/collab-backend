import { documentStore } from "../services/crdt.service.js";
import * as Y from "yjs";
import { applyAwarenessUpdate } from "y-protocols/awareness.js";
import { persistUpdate } from "../services/sync.service.js";
import { IncomingWSMessage, WSAuthClient } from "../../../websocket/ws.message-types.js";

const broadcastMessage = (
  sender: WSAuthClient,
  message: any,
  documentId: string
): void => {
  const wss = sender.server;
  if (!wss) return;

  for (const client of wss.clients) {
    const c = client as WSAuthClient;
    if (
      c.readyState !== c.OPEN ||
      c === sender ||
      c.documentId !== documentId
    )
      continue;

    try {
      c.send(JSON.stringify(message));
    } catch (err) {
      console.error("Failed to send WebSocket message:", err);
    }
  }
};

export const handleDocumentUpdate = async (
  ws: WSAuthClient,
  msg: IncomingWSMessage,
  documentId: string,
  userId: string
): Promise<void> => {
  const instance = documentStore.get(documentId);
  if (!instance) {
    ws.send(JSON.stringify({ type: "error", error: "Document not loaded" }));
    return;
  }

  const { doc, awareness } = instance;

  if (msg.type === "update" && Array.isArray(msg.data)) {
    const update = new Uint8Array(msg.data);

    try {
      Y.applyUpdate(doc, update);

      const stateVectorAfterUpdate = Y.encodeStateVector(doc);

      await persistUpdate(documentId, userId, update, stateVectorAfterUpdate);

      broadcastMessage(ws, { type: "update", data: msg.data }, documentId);

      console.log(`Update persisted & broadcasted for doc ${documentId}`);
    } catch (error) {
      console.error("Persistence failed! Update rejected:", error);

      ws.send(JSON.stringify({
        type: "sync-error",
        error: "Update rejected due to persistence failure. Reloading document...",
        code: "PERSISTENCE_FAILED"
      }));

    }
  }

  if (msg.type === "awareness" && Array.isArray(msg.data)) {
    const update = new Uint8Array(msg.data);
    applyAwarenessUpdate(awareness, update, ws);
    broadcastMessage(ws, { type: "awareness", data: msg.data }, documentId);
  }
};