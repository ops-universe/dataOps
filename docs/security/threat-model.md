# Threat model

Inputs are untrusted. Flat scalar records, strict UTF-8, duplicate-key rejection, finite numbers, 8 MiB dataset limit, 50,000 rows, 256 fields; CLI contracts bounded to 64 KiB. File identity and metadata checks, no-follow, nonblocking read-only opens, traversal denial. Dashboard binds loopback on CLI startup, validates host/origin/token and content type, caps request body at 24 MiB and individual datasets/contracts, limits concurrent analyses, uses CSP, no-store and textContent rendering. No external upload or automated remediation.

Trusted dataset root and parent directories required; no race-free filesystem sandbox. Local dashboard is a trusted local-process interface, not authentication; never expose through a proxy. Malicious local processes, compromised OS, browser extensions and resource exhaustion within bounded inputs are outside isolation guarantees. Raw data, field names, hashes and aggregates can be sensitive. Fingerprints and sensitive-data heuristics do not guarantee anonymity or leakage prevention. No third-party certification, production readiness or public deployment claim.

## Scoped security evidence

Implementation acceptance is tied to main commit ba2db7a451c6d086c08d6da20da04bbf4f051363 and successful post-merge push workflows [45543723849](https://github.com/ops-universe/dataOps/actions/runs/45543723849) and [45543737123](https://github.com/ops-universe/dataOps/actions/runs/45543737123). All six check runs passed; each workflow completed core tests, website build, actual Chromium installation and Playwright execution, and all three dependency audit steps.

Acceptance covers the committed automated regressions; no universal security guarantee.
