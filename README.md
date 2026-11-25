# dataOps

Better data. More reliable AI.

Node.js 22+. Local read-only dataset analysis. Run npm ci && npm test. Run node src/dashboard-server.mjs and open the printed loopback URL. Import CSV, JSON or JSONL, optional same-format baseline and quality contract. CLI: node src/cli.mjs profile fixtures catalog.json. See docs/architecture/regression.md. Input limit 8 MiB, 50,000 rows, 256 fields. CSV values remain strings. Use a trusted root for CLI; filesystem race isolation not guaranteed. Dashboard sends data only to the local process; do not expose it through a proxy. No external AI or original-data changes. Release deferred.
