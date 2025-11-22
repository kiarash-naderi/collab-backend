# Zero Data-Loss Guarantee

1. Client → Server: Yjs update
2. Server applies to in-memory Y.Doc
3. Server persists update to Postgres (`Operation` table) – synchronously
4. Only after DB commit → broadcast to all other clients
5. If DB write fails → sender receives error + full snapshot (force-sync)
6. Periodic full snapshots (every 100 ops) stored in `DocumentVersion`
7. On crash/restart → latest snapshot + all subsequent ops = 100 % recovery

This persist-before-broadcast model gives the strongest durability possible while keeping latency < 200 ms in the happy path.