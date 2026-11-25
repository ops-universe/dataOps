# Synthetic enterprise acceptance scenarios

All cases are fictional, reproducible tests in tests/enterprise.test.mjs. No customer or production claims.

| Scenario | Stakeholder need | Gate | Expected evidence |
|---|---|---|---|
| Supplier catalog | Merchandising requires unique SKU and price | Required + unique | Two violations in synthetic catalog |
| Training preparation | ML team needs independent splits | Exact identity overlap | One cross-split overlap |
| RAG metadata | Search team requires provenance | Required source and unique doc ID | Missing source violation |
| Evaluation datasets | QA needs version regression gate | Compare same quality contract | New missing expected answer |

Integration: run CLI in local CI, review JSON evidence with data owner, correct upstream source manually, rerun. Do not auto-modify source. Dashboard is a loopback analysis interface, not multi-user authentication. Trusted root required for CLI. Heuristics do not guarantee anonymity or leakage prevention. Actual deployment and customer outcomes unverified.
