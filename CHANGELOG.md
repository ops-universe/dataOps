# Changelog

## Unreleased
- PRs #1–#5: foundation, bounded ingestion, profiling, quality rules, split governance, version comparison and regression CLI.
- PR #6: local dashboard and synthetic enterprise scenarios.
- PR #7: locked Chromium runner, actual browser interactions, hostile markup and invalid-import tests, HTTP and input-limit regressions, stricter governance split typing and security hardening.
- Reconcile scoped engineering acceptance with actual post-merge CI. No public release.

Implementation acceptance is tied to main commit ba2db7a451c6d086c08d6da20da04bbf4f051363 and successful post-merge push workflows [45543723849](https://github.com/ops-universe/dataOps/actions/runs/45543723849) and [45543737123](https://github.com/ops-universe/dataOps/actions/runs/45543737123). All six check runs passed; each workflow completed core tests, website build, actual Chromium installation and Playwright execution, and all three dependency audit steps.
