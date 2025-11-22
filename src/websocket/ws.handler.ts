import * as Y from "yjs";
import {
  Awareness,
  encodeAwarenessUpdate,
  applyAwarenessUpdate,
} from "y-protocols/awareness";
import { prisma } from "../core/db/prisma.js";
import { persistUpdate } from "../modules/documents/services/sync.service.js";
import {
  getOrCreateYDoc,
  applyUpdate as applyCrdtUpdate,
  documentStore,
} from "../modules/documents/services/crdt.service.js";
import {
  IncomingWSMessage,
  OutgoingWSMessage,
  WSAuthClient,
  YDocInstance,
} from "./ws.message-types.js";

import {
  yjsUpdatesTotal,
  yjsUpdatesFailed,
  persistenceLatency,
  activeConnections,
  loadedDocuments,
} from "../observability/metrics.service.js";

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

  const { doc, awareness } = await getOrCreateYDoc(documentId);

  activeConnections.inc({ document_id: documentId });
  loadedDocuments.set(documentStore.size);

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

        try {
          applyCrdtUpdate(doc, update);

          const stateVectorAfterUpdate = Y.encodeStateVector(doc);

          const endTimer = persistenceLatency.startTimer();
          await persistUpdate(
            documentId,
            userId,
            update,
            stateVectorAfterUpdate
          );
          endTimer();

          yjsUpdatesTotal.inc({ document_id: documentId });

          broadcastMessage(ws, { type: "update", data: msg.data }, documentId);

          console.log(
            `Update persisted & broadcasted for doc ${documentId} by user ${userId}`
          );
        } catch (persistError) {
          console.error("PERSISTENCE FAILED — Update rejected:", persistError);

          yjsUpdatesFailed.inc({ document_id: documentId });

          ws.send(
            JSON.stringify({
              type: "error",
              code: "PERSISTENCE_FAILED",
              message: "تغییرات ذخیره نشد. لطفاً صفحه را رفرش کنید.",
            })
          );

          const fullUpdate = Y.encodeStateAsUpdate(doc);
          ws.send(
            JSON.stringify({
              type: "force-sync",
              update: Array.from(fullUpdate),
            })
          );
        }
      } else if (msg.type === "awareness" && Array.isArray(msg.data)) {
        const update = new Uint8Array(msg.data);
        applyAwarenessUpdate(awareness, update, ws);
        broadcastMessage(ws, { type: "awareness", data: msg.data }, documentId);
      } else if (
        msg.type === "sync-request" &&
        Array.isArray(msg.stateVector)
      ) {
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

  ws.on("close", () => {
    activeConnections.dec({ document_id: documentId });
    loadedDocuments.set(documentStore.size);
  });
};
