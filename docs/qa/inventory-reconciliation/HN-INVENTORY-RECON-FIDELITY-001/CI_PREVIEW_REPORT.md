# CI and preview provenance

Final application commit ecb2bdac211e392bb71d2f885725a6ecca3f3ce8, branch candidate/inventory-recon-fidelity-20261029; local build caea03c77fb6deb73deb274ef3c8e4679e4e269b105705212ff9c18d71988e15. Root push initially failed DNS; bounded retry succeeded and git ls-remote returned this exact SHA. No DEV/main/origin(Sites) push or protected merge occurred.

Build/typecheck PASS (gates/build-final.txt); contract PASS (gates/contract.txt). Existing quality:contract validates13states/26historicalreferences, not this task's32-image visual acceptance. Current local tests are detailed in functional/SOL_FUNCTIONAL_QA_REPORT.md.

Fresh GitHub connector exact-SHA combined-status lookup returned statuses=[] and its PR-triggered workflow lookup workflow_runs=[]. These limited endpoints do not establish all check-run/billing outcomes. HOSTED_CI=NOT_VERIFIED/BLOCKED_CONFIG; current billing=NOT_VERIFIED, not an assumed historical lock. .github/workflows/quality-pr.yml intentionally exits1 in visual-and-functional pending portable harness. No PR-triggered green check is claimed; PR not created at this audit point.

Sites get_site and list_site_versions freshly identify the existing public domain https://hoa-nam-wms-b17-candidate-20261024.wholetide18.chatgpt.site , version63, sourcebfddf139492e4012f369610d2014028c947a8f7c, deploymentappgdep_6ae28cea54a88191b518478ac94bf91a; archiveSHAea1b950f4a1a7932a6c4deef4ee22877977ab3b004f8be7069e1b1d7b3524c8a. It is not this Candidate. No new public version/deployment was requested through failed gates, and no alternate domain was created. Public asset verification on the new candidate is NOT_RUN because it was not deployed.

Verified local candidate URL http://127.0.0.1:5341/?inventoryDesign=20261029#/preview/S16?view=stock uses the built source above and normal QA login. Later source tasks/builds must retain or explicitly supersede this build provenance; an evidence-only Git commit is not a new application build. Rollback is the parent9865a827/source3f8cf44 and retained old Site63, with no production data rollback needed because reads did not mutate production.
