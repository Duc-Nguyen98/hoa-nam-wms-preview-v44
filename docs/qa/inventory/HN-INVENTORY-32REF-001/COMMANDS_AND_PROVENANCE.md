# Commands and reproducibility

Workspace: `E:\WMS_HoaNam\Scanner_CMS\sites\hoa-nam-wms-tray-approved-20261026`. Final source3f8cf44. Temporary/cache files use E:; no writes to retired W:.

| Executed command / tool | Result / receipt |
|---|---|
| Git status/branch/rev-parse/diff/remote inspection; read AGENTS/design/quality contracts and supplied prompt/index/manifest |Base and scope in task packet/design reports |
| Native delegation and handoffs |Real agent artifacts and trace in AGENT_EXECUTION_TRACE.md; requested Terra High/Medium and Sol High selection recorded without unsupported actual-runtime claims |
| npm run typecheck; npm run build |PASS; final build log and identity in gates/ |
| npm run quality:contract |PASS in legacy contract-policy scope; not inventory visual approval |
| node --import tsx --test tests/inventory-fidelity/fixture-contract.test.ts tests/warranty-parts/s16-operational-binding.test.ts tests/warranty-parts/s21-operational-binding.test.ts tests/putaway-approved/history-api.test.ts |18PASS, unit-regression-final.tap |
| node --import tsx --test tests/putaway-approved/operational-seed.test.ts |1PASS, operational-seed-final.tap |
| node --import tsx --test tests/putaway-approved/seed.test.ts |1PASS, tray-seed-final.tap |
| node tests/inventory-visual/build-provenance.mjs |4PASS, build-provenance-latest.json; final build info restored after negative controls |
| npm run dev -- --host 127.0.0.1 --port 5340 |Source-only injected component/adapter harness. Intermediate HTML artifact writes caused HMR reload/resource failures; invalid runs retained and excluded |
| npm run preview -- --host 127.0.0.1 --port 5341 |Static final build; no HMR; build source3f8cf44/ec7027a6 |
| node tests/inventory-visual/capture.mjs |32 final normal-auth browser captures; INVENTORY_BASE points5341, INVENTORY_VISUAL_OUT points visual/final-build-3f8cf44; DOM writes.txt |
| node tests/inventory-visual/compare.mjs |32 reference/actual/overlay/diff sets; INVENTORY_VISUAL_STAGE=final-build-3f8cf44. No missing/clipped bottom rows in checked diagnostic registration |
| Independent browser/baseline/edge/injected scripts under tests/inventory-fidelity/ |Functional report lists exact batches, environments, raw results, invalid attempts and reused receipts |
| git diff --check 57b9f399a55d41d43ecad7a31e1b279da2cda717 HEAD; scoped diff src/shared src/toast |Clean whitespace; shared shell/Toast source unchanged |
| git push github HEAD:refs/heads/candidate/inventory-32ref-20261029; git ls-remote |Candidate branch published for review; no protected DEV/origin push |
| GitHub/Sites connector read-only release checks |ExistingSite63/oldsource; no verified candidate hosted CI/deploy; current billing not established |

Normal QA login uses HN_QA_USERNAME / HN_QA_PASSWORD process variables, never values embedded in scripts or saved session state. Final evidence contains fixture data only; neither production permissions nor production data was modified. Browser/context details and source hashes are recorded in each capture/test receipt. Actual browser zoom, full assistive-technology review, production RBAC and live integration remain unclaimed.

