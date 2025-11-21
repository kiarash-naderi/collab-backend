import { documentStore } from "../services/crdt.service.js";
import * as Y from "yjs";
import { applyAwarenessUpdate } from "y-protocols/awareness";
import { persistUpdate } from "../services/sync.service.js";
import { IncomingWSMessage, WSAuthClient } from "../../../websocket/ws.message-types.js";

export const handleDocumentUpdate = async (
  ws: WSAuthClient,
  msg: IncomingWSMessage,
  documentId: string,
  userId: string
): Promise<void> => {
  const instance = documentStore.get(documentId);
  if (!instance) throw new Error("Document not loaded");

  const { doc, awareness } = instance;

  if (msg.type === "update" && Array.isArray(msg.data)) {
    const update = new Uint8Array(msg.data);
    Y.applyUpdate(doc, update);

    const stateVectorAfterUpdate = Y.encodeStateVector(doc);

    await persistUpdate(documentId, userId, update, stateVectorAfterUpdate);

    broadcastMessage(ws, { type: "update", data: msg.data }, documentId);
  }

  if (msg.type === "awareness" && Array.isArray(msg.data)) {
    const update = new Uint8Array(msg.data);
    applyAwarenessUpdate(awareness, update, ws);
    broadcastMessage(ws, { type: "awareness", data: msg.data }, documentId);
  }
};
function broadcastMessage(ws: WSAuthClient, arg1: { type: string; data: number[]; }, documentId: string) {
  throw new Error("Function not implemented.");
}

