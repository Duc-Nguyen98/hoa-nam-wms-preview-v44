# Reproduction and review — HN-NC-UIUX-003

Working directory: `E:\WMS_HoaNam\Scanner_CMS\sites\hoa-nam-wms-tray-approved-20261026`. Branch DEV. Final runtime source candidate `830f83d48eac84c3e2467de7f41c388439cc7eb2`, source tree `65ac25d235682469452f60d50664b3e6acb3a753`. Subsequent evidence-only commits must preserve this src tree.

## Commands

The following are reproduction commands, not independent declarations of PASS. Executed results, exit codes, profiles and source custody are in the owners' reports and raw JSON.

- `npm run quality:pr` — parent final receipt `local-quality-pr-830f83d.json`, full output log alongside it. Covers typecheck, tracked contract/reference integrity, build and four putaway tests.
- `node --import ./tests/s27/css-hook.mjs --import tsx --test tests/canary/badge-contract.test.ts tests/notification-center.test.ts tests/notification-state.test.ts tests/actions/notification-target.test.ts` — focused20Node tests. Additional four independent session/concurrency probes reside under functional/.
- `npx playwright test --config docs/quality/uiux-task-HN-NC-003/functional/playwright.config.ts` — full functional matrix; set QA_EVIDENCE_DIR to a fresh namespace, never overwrite before or failed evidence.
- `npx playwright test --config docs/quality/uiux-task-HN-NC-003/functional/axe.config.ts` — actual authenticated modal automated accessibility; QA_AXE_EVIDENCE_DIR controls evidence namespace.
- `npx playwright test --config tests/functional/shared-semantics.config.ts` — durable shared semantic/live-feedback/focus regression. The spec requires a scanner and fails rather than silently skipping if missing.
- Scanner prerequisite for a fresh checkout: `npm install --prefix output/hn-nc-003-axe-runtime --no-audit --no-fund --ignore-scripts --package-lock=false axe-core@4.14.0`. Installed outside tracked application dependencies. QA_AXE_SCRIPT may name a provisioned axe.min.js for the durable semantic spec. CI does not yet provision this prerequisite.
- Visual owner uses `visual/capture-after.mjs` with VQ_EXPECTED_SHA and a new VQ_OUT directory, against local Vite on127.0.0.1:5233; comparison uses `visual/compare-after.py` with Pillow. Exact native profiles, DPR2 canonical Tablet, crop rectangles and amplification are preserved in capture/comparison JSON.

## Source review

Parent reviewed `git diff 7875281..830f83d` for owning source and durable tests: three runtime files plus two regression files,106 insertions/11 deletions. GlobalModal changes only header container semantics with the same classes/title linkage. Toast adds a valid named group and rejects hidden/disabled/inert origins before the existing fallback. Notification CSS changes remain scoped geometry/text contrast. No dependency, backend, notification persistence, permission, sample-data, shell/header/sidebar or original baseline changes.

Status inline decorative icons inherit the corrected label text color; list icons and status fills retain their prior colors. Exact new text values are reused implementation-derived accessibility candidates approved for this scoped repair by Design Guardian, not newly recovered locked tokens.

## Data and limitations

Actual app discovery: authenticated S15 or S01 → header bell → Notification Center dialog. Isolated fixtures supplement real app tests. All mutations use local Preview MOCK/test namespaces. No REAL_API, production RBAC or realtime certification. Full unprovided-state visual baselines and pixel tolerance remain missing. Local build-ID metadata contains historical SOURCE_PROVENANCE sourceCommit; do not infer deployed SHA from it.

Initial axe FAIL, focus FAIL and contrast FAIL evidence remain available. Original reference hashes and before captures remain immutable. Hosted CI and exact deployed-candidate provenance are separate release gates owned by S00#5; local PASS does not bypass them.


Final visual recovery must use process-only TEMP/TMP beneath ignored `output/hn-nc-003-visual-temp-830` on E. Final accepted captures: `visual/after-830f83d-recovery-ignored-temp`. Interrupted ENOSPC namespaces and ignored aborted browser scratch are not accepted artifacts; no global temp configuration or cleanup bypass is authorized. Local review Vite5233 was left running on source830f83d. The full36/24 functional baseline remains76059cc; see REGRESSION_REPORT.md for exact final impact runs.

QA-only .gitattributes disables EOL conversion in this task directory so manifest hashes preserve exact raw bytes in GitHub and fresh checkouts. It does not change global Git configuration or application sources. Raw log whitespace and failure contexts are preserved; evidence-wide diff --check whitespace findings are not hidden by normalizing captured data.
