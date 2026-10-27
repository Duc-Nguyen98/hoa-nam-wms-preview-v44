# Automated accessibility addendum — HN-NC-UIUX-003

Owner: S00#4. Date: 2026-10-27 (UTC+07). Test environment: LOCAL authenticated Preview mock, not production. Candidate recorded by scanner: `78752811af4b0434c958d604dc52ca445cdbeede`.

## Initial diagnostic verdict: FAIL

axe-core **4.14.0** was installed successfully in an isolated directory `output/hn-nc-003-axe-runtime` with `npm install --prefix output/hn-nc-003-axe-runtime --no-audit --no-fund --ignore-scripts --package-lock=false axe-core`. No repository package.json/lockfile was edited.

The scanner used the actual authenticated S01 app, normal login/confirmation/setup, and opened the shipped Notification modal through the bell. It ran axe's default enabled rules (no disabled rules/tag narrowing) scoped to `dialog[open]`, preserving violations, incomplete, passes and inapplicable records. This is an automated axe scan, not full WCAG certification, manual screen-reader testing or complete accessibility acceptance.

| Profile | Violated rules | Passing rules | Incomplete | Console/request errors |
|---|---|---:|---|---:|
| Desktop1920×1080 DPR1 Light/VI |2 |30 |color-contrast |0/0 |
| Desktop1920×1080 DPR1 Dark/VI |2 |30 |color-contrast |0/0 |
| Tablet800×1280 DPR2 Light/VI |2 |27 |color-contrast |0/0 |
| Tablet800×1280 DPR2 Dark/VI |2 |27 |color-contrast |0/0 |

All four profile tests exited FAIL because the two violations were preserved as assertions; no rule was suppressed. Raw data/screenshots/traces are in `axe/`.

## Confirmed defects

| ID | Priority / axe impact | Owning file | Evidence / cause | Closure requirement |
|---|---|---|---|---|
| FQ-NC-003-A11Y-01 |P1 / serious |`src/toast/GlobalToastProvider.tsx:153` |`aria-prohibited-attr`: `.hn-global-toast-region` is a generic div with an `aria-label` and no valid role. Same violation all4 profiles. |Scoped owner fixes semantic role/name without changing visuals; independent pinned-SHA axe retest |
| FQ-NC-003-A11Y-02 |P2 / moderate |`src/shared/GlobalModal.tsx` modal header |`landmark-banner-is-top-level`: `.hn-global-modal__header` native header is exposed as a nested banner inside dialog. Same violation all4 profiles. |Scoped semantic correction preserving modal title/description and visuals; independent shared-modal impacted retest |

Contrast is **INCOMPLETE / NEEDS_REVIEW**, not PASS and not a measured contrast failure: axe reports `pseudoContent`, unable to determine background because of `.hn-header-wrap` pseudo content. Full details and affected nodes are preserved in raw JSON. Do not hide that pseudo element to force a scan PASS.

## Candidate custody limitation

S00#2 edited only `src/notifications/notifications.css` while these diagnostic scans ran. Therefore the recorded committed SHA does not fully identify the working CSS for every profile. The two semantic findings refer to unchanged shared files, but acceptance requires a new scan on the committed fix SHA with a clean runtime source diff. Initial scans did not capture per-profile working CSS hashes; that missing provenance is explicitly recorded and they cannot serve as final acceptance. The retained suite now captures start/end candidate SHA, runtime source diff, and CSS/shared-file SHA-256 for each profile before future retest.

Post-run diagnostic hashes: notifications.css `6ee06f0d1d1faeb28d8ada2aaedea82091b8f00b050a39b36a60091287f2b228`; GlobalModal.tsx `acbcbe6a90a755b525ef7b330b7c4ac5bcad4ba7551e0a2c5edc1a024b5ff38e`; GlobalToastProvider.tsx `83cf773cdda6015d070e05e3ff72bfd4dd56d86531f87dcc931c0528e5c277f6`.

No runtime/source/baseline/CI edit by S00#4. Defects handed to S00#1 for leased S00#2 implementation. Final accessibility gate is FAIL pending remediation/retest; this supersedes the earlier FUNCTIONAL_QA_REPORT automated-a11y NOT_RUN row while retaining its executed27browser/24Node results.
