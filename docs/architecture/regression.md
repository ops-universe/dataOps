# Regression and CLI

Comparison uses canonical row multisets (duplicate multiplicity retained) and SHA-256 fingerprints, plus total variation distance over exact scalar distributions including missing and null. Empty distributions yield null. Quality comparison uses one contract for both versions; increases count violations by rule, not individual record attribution. CLI emits versioned JSON to stdout, exit 0 success, 1 failed quality/governance gate, 2 invalid input. Profile category values and governance label values are omitted by default in CLI output; field names and aggregates can still be sensitive. Contract files must be within a trusted root; bounded to 64 KiB. No source modification, no network.

Commands: node src/cli.mjs profile fixtures catalog.json; node src/cli.mjs quality fixtures catalog.json catalog.quality.json; node src/cli.mjs governance fixtures training.json id; node src/cli.mjs compare fixtures catalog.json catalog.json.
