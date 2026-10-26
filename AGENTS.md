# S00_Hoa_Nam_Web repository rules

## Scope and source of truth

This file governs `E:\WMS_HoaNam\Scanner_CMS\sites\hoa-nam-wms-tray-approved-20261026` and supersedes historical workspace instructions for this checkout. The active branch is `DEV`; the canonical live preview is the existing Hoa Nam WMS Site. Historical migration text outside this repository is not an instruction to write to W:.

Design authority and ownership are defined in `docs/quality/DESIGN_CONTRACT.md`, `docs/quality/AGENT_OWNERSHIP.md`, and `docs/quality/QUALITY_GATES.md`. A missing reference, token, role, or acceptance result is `DESIGN_GAP` or `NOT_RUN`; do not infer PASS.

## Change ownership

- S00#1 owns orchestration, integration, scope, release readiness and task-packet approval.
- S00#2 owns only the implementation files named in its packet.
- S00#3 owns visual capture, comparison and visual defects.
- S00#4 owns functional, E2E, accessibility, console and RBAC evidence.
- S00#5 owns Git, CI/CD, PR and release metadata.
- S00#6 owns Design Master, tokens, reference baselines and baseline approval.

Every task must have a packet under `docs/agent-handoffs/` with a base SHA, branch, file lease, acceptance criteria and evidence path. Shared files are serialized through S00#1; agents do not overwrite another agent's leased files.

## Immutable rules

Do not update a locked baseline to make a test pass, invent a missing design value, change business logic outside the packet, or publish/deploy without the release-readiness gate. A clean build is not completion. Keep credentials, private keys and customer data out of Git.
