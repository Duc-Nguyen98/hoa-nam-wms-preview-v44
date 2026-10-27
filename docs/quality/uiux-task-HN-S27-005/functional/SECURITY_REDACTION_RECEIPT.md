# Archived script credential redaction

Owner S00#4; source remains ebcf0d360e52bf2036c5a3c531563675ebf3580c. Before Git evidence storage, six archived browser script copies were changed to remove six embedded demo password literals and the corresponding embedded login username. Each now requires S27_DEMO_USER and S27_DEMO_PASSWORD environment variables, with no credential fallback or logging.

Exact path, before/after SHA-256, before/after bytes and occurrence count are recorded in `SECURITY_REDACTION_RECEIPT.json`. That receipt contains no credential values. A filename-only scan of the entire functional evidence tree found zero remaining configured demo password literals after redaction.

These are **post-execution security edits to archived scripts**. They are not byte-identical to the script copies used for the historical test runs. No tests were rerun and no new test PASS is claimed. Historical results describe the executed pre-redaction copies. Original execution hashes remain as historical metadata; current manifests describe current redacted bytes. Redaction does not change runtime source, result JSON, screenshots, assertions or test outcome evidence.

`d80255b/EVIDENCE_MANIFEST.json` was refreshed for the redacted final-browser/contrast script bytes; its earlier execution hash metadata must be read together with the before hashes in this receipt. `FINAL_EVIDENCE_MANIFEST.json` was refreshed for all current owner artifacts. No authentication storage/session trace was added.
