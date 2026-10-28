# Task Packet — HN-WARRANTY-PARTS-UIUX-001

Project: S00_Hoa_Nam_Web
Scope: S09 Warranty Cases and S10 Parts Issue Slips
Branch: DEV
Candidate source commit at registration: 93371f4da9b6659d320a7c66d9b0862f89744a0d
Preview: https://hoa-nam-wms-b17-candidate-20261024.wholetide18.chatgpt.site
References: docs/qa/warranty-parts/HN-WARRANTY-PARTS-UIUX-001/references/bh-01.png..bh-14.png

Owners:
- S00#1 Orchestrator: integration, task packet, quality gate, deployment evidence.
- S00#6 Design Guardian: reference custody, route/component mapping, design authority.
- S00#3 Visual QA: browser captures, geometry, visual diffs and visual defects.
- S00#4 Functional QA: state transitions, data integrity, RBAC and regression.
- S00#2 CRUD Lead: only confirmed scoped source fixes in S09/S10.
- S00#5 Release: branch, commit, build, preview provenance and release evidence.

Rules:
- Use DEV only; no protected or production merge.
- Preserve GlobalShell, shared contracts and fixture provenance.
- Do not replace reference images or create production constants from image data.
- No mutation of production data; preview/mock evidence must be labelled.
- A test without evidence remains NOT_RUN/BLOCKED.
- Fix -> independent visual/functional retest -> build -> deploy.

Required evidence:
- 14 immutable reference hashes and mapping.
- Before/after/diff captures for runnable states.
- Visual and functional reports with PASS/FAIL/BLOCKED/NOT_RUN.
- Defect register with owner, severity, root cause, fix and retest.
- Git/CI/preview report with local source SHA and deployed build metadata.
- Final verdict: VISUAL / FUNCTIONAL / RELEASE.

