# Architecture

Local file -> bounded byte reader -> format parser -> versioned scalar records and SHA-256 identity -> deterministic schema validation. No provider or network integration. Raw records stay local; violation reports contain row indices and field names, not values. Future profiling, rules and regression consume this contract.
