import * as Y from 'yjs';
import { Awareness, encodeAwarenessUpdate, applyAwarenessUpdate } from 'y-protocols/awareness';
import { prisma } from '../core/db/prisma.js';
import { IncomingWSMessage, OutgoingWSMessage, WSAuthClient, YDocInstance } from './ws.message-types.js';

const documentStore = new Map<string, YDocInstance>();

const getOrCreateDocument = async (documentId: string): Promise<YDocInstance> => {
  const cached = documentStore.get(documentId);
  if (cached) return cached;

  const ydoc = new Y.Doc();
  const awareness = new Awareness(ydoc);

  const latestSnapshot = await prisma.documentVersion.findFirst({
    where: { documentId },
    orderBy: { createdAt: 'desc' },
    select: { snapshot: true },
  });

  if (latestSnapshot?.snapshot) {
    Y.applyUpdate(ydoc, new Uint8Array(latestSnapshot.snapshot));
    console.log(`Snapshot loaded for document ${documentId}`);
  }

  const instance: YDocInstance = { doc: ydoc, awareness };
  documentStore.set(documentId, instance);
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
    if (
      client.readyState !== client.OPEN ||
      client === sender ||
      !(client as WSAuthClient).documentId ||
      (client as WSAuthClient).documentId !== documentId
    ) {
      continue;
    }

    try {
      client.send(JSON.stringify(message));
    } catch (err) {
      console.error('Failed to send message to client:', err);
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

  ws.send(JSON.stringify({
    type: 'init',
    update: Array.from(initialUpdate),
    stateVector: Array.from(stateVector),
  } satisfies OutgoingWSMessage));

  const clientIds = Array.from(awareness.getStates().keys());
  if (clientIds.length > 0) {
    const awarenessUpdate = encodeAwarenessUpdate(awareness, clientIds);
    ws.send(JSON.stringify({
      type: 'awareness-init',
      data: Array.from(awarenessUpdate),
    } satisfies OutgoingWSMessage));
  }

  ws.on('message', (data: import('ws').RawData) => {
    try {
      const raw = data.toString('utf-8');
      const msg = JSON.parse(raw) as IncomingWSMessage;

      if (msg.type === 'update' && Array.isArray(msg.data)) {
        const update = new Uint8Array(msg.data);
        Y.applyUpdate(doc, update);

        broadcastMessage(ws, { type: 'update', data: msg.data }, documentId);
      }

      if (msg.type === 'awareness' && Array.isArray(msg.data)) {
        const update = new Uint8Array(msg.data);
        applyAwarenessUpdate(awareness, update, ws);

        broadcastMessage(ws, { type: 'awareness', data: msg.data }, documentId);
      }
    } catch (err) {
      console.error('Invalid WebSocket message:', err);
    }
  });

  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('close', () => {
    awareness.setLocalState(null);
  });
};