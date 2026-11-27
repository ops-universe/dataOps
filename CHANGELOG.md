# Changelog

## Unreleased
- PRs #1–#5: foundation, bounded ingestion, profiling, quality rules, split governance, version comparison and regression CLI.
- PR #6: local dashboard and synthetic enterprise scenarios.
- PR #7: locked Chromium runner, actual browser interactions, hostile markup and invalid-import tests, HTTP and input-limit regressions, stricter governance split typing and security hardening.
- Reconcile scoped engineering acceptance with actual post-merge CI. No public release.
- Wave 1: reverify current main with authenticated core/browser/website CI, audit logs and existing static documentation-route checks; no runtime change.

Implementation acceptance is tied to main commit ba2db7a451c6d086c08d6da20da04bbf4f051363 and successful post-merge push workflows [45543723849](https://github.com/ops-universe/dataOps/actions/runs/45543723849) and [45543737123](https://github.com/ops-universe/dataOps/actions/runs/45543737123). All six check runs passed; each workflow completed core tests, website build, actual Chromium installation and Playwright execution, and all three dependency audit steps.

## Wave 1 evidence

Wave 1 final re-verification (2026-11-27): exact main `d1f123be7f7213c355373ad1ee5d37cdcb9d08c8` passed [Core CI 45663672422](https://github.com/ops-universe/dataOps/actions/runs/45663672422) (test, browser-acceptance and website-build successful; 30 core tests passed, 0 failed/skipped; 2 Chromium scenarios passed; all three npm audits reported zero vulnerabilities). [Pages 45663672373](https://github.com/ops-universe/dataOps/actions/runs/45663672373) passed build, deploy and live-smoke (three static documentation routes). The original implementation checkpoint `ba2db7a451c6d086c08d6da20da04bbf4f051363` remains the historical implementation anchor: the authenticated comparison to current main lists only documentation and static website infrastructure changes, not runtime or core/browser tests. Static documentation hosting does not deploy the local runtime. No release or Developer Preview authorized.
