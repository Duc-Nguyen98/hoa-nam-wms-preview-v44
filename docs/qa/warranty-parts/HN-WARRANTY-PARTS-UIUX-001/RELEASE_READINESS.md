# Release readiness — HN-WARRANTY-PARTS-UIUX-001

Candidate SHA: `7ac520aecc2f38231e6be9b118105ed8e91ee5b7`  
Branch: `DEV`  
Decision: **BLOCKED — do not deploy or push**

## Required conditions before release

1. Push/open the approved PR for the exact candidate SHA and retain the GitHub Actions run URL and commit check summary.
2. Require `critical` to pass (`npm ci`, `npm run quality:pr`) and replace the workflow's intentional `visual-and-functional` placeholder failure with a real preview/capture harness. The latter must cover visual references, responsive overflow, accessibility, console/page errors, and critical S09/S10 browser flows.
3. Run the browser harness against the deployed preview using the exact SHA. Existing reports document navigation-context destruction and obsolete setup selectors; those failures remain unresolved evidence gaps.
4. Publish `/build-info.json` (or equivalent immutable deployment metadata) containing the exact candidate SHA, release/build ID, mode and asset hashes. Verify the deployed URL returns HTTP 200 and that metadata source SHA equals `7ac520ae...`; record the URL, response time, build ID and verification timestamp.
5. Obtain independent S00#3 visual and S00#4 functional/accessibility/console approvals, including explicit disposition for the open S10 density and fixture-cohort gaps. A clean local build alone is insufficient.

## Current evidence snapshot

Local typecheck, contract validation, production build, focused S09/S10 binding tests and the two public-demo flow tests passed. The Vite build emits a non-blocking large-chunk warning. The canonical public Site responds 200 but advertises source `93371f4...`, release `HN-B17-PUBLIC-CANDIDATE-20261024.2`, build `eef02039...`, `MOCK` mode and `publicDemo: true`; it is not this candidate. No remote CI run or PR status is recorded here.

## Rollback plan

Keep the currently hosted build as the rollback target until a candidate deployment is independently verified. If a verified candidate causes a regression, stop promotion, restore the prior immutable Site artifact identified by its build ID and asset manifest, and re-check `/build-info.json` and the critical smoke flow. Record the rollback time, operator, old/new source SHA and build IDs, failed gate or symptom, affected URL, and follow-up owner. Do not overwrite reference images or mutate customer/production data during rollback. If the prior artifact cannot be restored, take the Site offline or route traffic to the last known-good immutable artifact and escalate to S00#1.

## Approval record

- S00#5 CI/release audit: BLOCKED (this report).
- S00#3 visual: pending exact-SHA hosted capture.
- S00#4 functional: pending fresh browser, accessibility and console run.
- S00#1 integration/release: pending all gates and deployment provenance.

## Updated decision after Preview deployment

The Preview deployment completed successfully as Site version `61` (deployment `appgdep_6ae21fff8aa081918448306a00900581`). `/build-info.json` is tied to local application SHA `73bf351083efb48af360f3ad2512addb8b028560`; the Site checkout snapshot is `63fe0af5acc674de1999e6adc561c111900ba890`.

Release remains **NOT_READY** for production or rollout because hosted CI visual/functional certification is intentionally blocked, REAL_API/RBAC evidence is unavailable, S10 detail density remains P2 open, and the historical fixture contains seven rows versus the nine-row reference density. The public Preview is available for review and rollback to the prior Site version remains possible.
