# Resume

Last independently verified implementation main: ba2db7a451c6d086c08d6da20da04bbf4f051363. Implementation acceptance is tied to main commit ba2db7a451c6d086c08d6da20da04bbf4f051363 and successful post-merge push workflows [45543723849](https://github.com/ops-universe/dataOps/actions/runs/45543723849) and [45543737123](https://github.com/ops-universe/dataOps/actions/runs/45543737123). All six check runs passed; each workflow completed core tests, website build, actual Chromium installation and Playwright execution, and all three dependency audit steps.

Scoped functional phases 1–8 accepted. Documentation reconciliation is on docs/final-engineering-evidence; verify its exact-head CI, reviews and protections before squash merge. Verify resulting main and its CI. No new implementation unless a concrete regression or acceptance gap is identified. Developer Preview/public release deferred.

Reproduce from repository root:

```sh
npm ci
npm audit --audit-level=high
npm test
(cd website-react && npm ci && npm audit --audit-level=high && npm run build)
(cd browser-runner && npm ci && npm audit --audit-level=high && npx --no-install playwright install --with-deps chromium && npx --no-install playwright test)
node src/dashboard-server.mjs
```

Trusted dataset root and parent directories required; no race-free filesystem sandbox. Local dashboard is a trusted local-process interface, not authentication; never expose through a proxy. Malicious local processes, compromised OS, browser extensions and resource exhaustion within bounded inputs are outside isolation guarantees. Raw data, field names, hashes and aggregates can be sensitive. Fingerprints and sensitive-data heuristics do not guarantee anonymity or leakage prevention. No third-party certification, production readiness or public deployment claim.
