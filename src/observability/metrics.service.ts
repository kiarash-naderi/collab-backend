import { Registry, collectDefaultMetrics, Counter, Gauge, Histogram } from 'prom-client';

export const register = new Registry();
collectDefaultMetrics({ register });

export const yjsUpdatesTotal = new Counter({
  name: 'collab_yjs_updates_total',
  help: 'Total number of Y.js updates received',
  labelNames: ['document_id'],
  registers: [register],
});

export const yjsUpdatesFailed = new Counter({
  name: 'collab_yjs_updates_failed_total',
  help: 'Updates rejected due to persistence failure',
  labelNames: ['document_id'],
  registers: [register],
});

export const persistenceLatency = new Histogram({
  name: 'collab_persistence_latency_seconds',
  help: 'Time to persist Y.js update to database',
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register],
});

export const activeConnections = new Gauge({
  name: 'collab_websocket_connections_active',
  help: 'Number of active WebSocket connections',
  labelNames: ['document_id'],
  registers: [register],
});

export const loadedDocuments = new Gauge({
  name: 'collab_loaded_documents_total',
  help: 'Number of documents currently loaded in memory',
  registers: [register],
});

export const operationBacklog = new Gauge({
  name: 'collab_operation_backlog',
  help: 'Number of pending operations (future use)',
  registers: [register],
});