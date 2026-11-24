# Threat model

Untrusted input: invalid UTF-8, oversized files, malformed CSV/JSON, nested payloads, unsafe field names, symlinks and traversal. Reject these; open read-only with no-follow and nonblocking flags; bound reads even when file grows. Root and parent directories must be trusted: concurrent filesystem replacement is not fully isolated. Raw records are sensitive; reports may reveal field names. No upload or automated remediation. No guarantee of anonymization.
