# Roadmap

- [x] Phase 1 foundation
- [x] Phase 2 ingestion (trusted-root limitation retained)
- [x] Phase 3 profiling
- [x] Phase 4 quality
- [x] Phase 5 governance and version comparison
- [x] Phase 6 regression and local CLI
- [x] Phase 7 local dashboard and actual Chromium acceptance
- [x] Phase 8 synthetic enterprise scenarios
- [x] Scoped engineering and security acceptance (within documented threat model)
- [ ] Phase 9 Developer Preview and public release — deferred by owner

Implementation acceptance is tied to main commit ba2db7a451c6d086c08d6da20da04bbf4f051363 and successful post-merge push workflows [45543723849](https://github.com/ops-universe/dataOps/actions/runs/45543723849) and [45543737123](https://github.com/ops-universe/dataOps/actions/runs/45543737123). All six check runs passed; each workflow completed core tests, website build, actual Chromium installation and Playwright execution, and all three dependency audit steps.

Trusted dataset root and parent directories required; no race-free filesystem sandbox. Local dashboard is a trusted local-process interface, not authentication; never expose through a proxy. Malicious local processes, compromised OS, browser extensions and resource exhaustion within bounded inputs are outside isolation guarantees. Raw data, field names, hashes and aggregates can be sensitive. Fingerprints and sensitive-data heuristics do not guarantee anonymity or leakage prevention. No third-party certification, production readiness or public deployment claim.
