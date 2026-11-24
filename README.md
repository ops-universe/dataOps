# dataOps

Better data. More reliable AI.

Developer Preview under development. Node.js 22+. Run `npm ci`, `npm test`, `npm run demo`. Demo uses synthetic catalog data and reports an intentional null-price violation. CSV values remain strings; JSON/JSONL accept flat finite scalar records. Input limit 8 MiB, 50,000 rows, 256 fields per row. Local read-only ingestion; no network or original-data modifications. Use a trusted dataset root not writable by adversaries; filesystem race isolation is not guaranteed. No production readiness claim.
