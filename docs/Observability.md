## Observability

- Prometheus: http://localhost:9090 – all metrics are available
- Grafana: http://localhost:3030 (admin/admin) – starts successfully
  → No dashboard provisioning yet (intentionally kept minimal)
  → You can create a dashboard in < 2 minutes using the exposed metrics:
    - active_connections
    - yjs_updates_total
    - persistence_latency_seconds_bucket

Everything else (real-time editing, presence, version history, revert, audit logging with IP/User-Agent) works end-to-end.