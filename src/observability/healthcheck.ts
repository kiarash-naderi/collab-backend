import { Router } from 'express';
import { prisma } from '../core/db/prisma.js';
import { documentStore } from '../modules/documents/services/crdt.service.js';

const router = Router();

router.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

router.get('/ready', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    
    const wsCount = (globalThis as any).wss?.clients.size || 0;

    const loadedDocs = documentStore.size;

    res.status(200).json({
      status: 'ready',
      database: 'connected',
      websocket_clients: wsCount,
      loaded_documents: loadedDocs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      error: (error as Error).message,
    });
  }
});

export default router;