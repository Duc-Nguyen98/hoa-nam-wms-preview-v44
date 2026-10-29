# Startup harness correction

The first frozen-build browser attempt completed normal login but stopped before any B-case because QA's canonical-store lookup required an exact namespace. The normal application uses `hoa-nam-wms-preview-business-v1:s27-design-v1`, as declared in `src/preview-mock/browser-runtime.ts`. The error was `Canonical business store missing` in the QA reader. The zero-case receipt is preserved as `startup-harness-results.json`; it is neither a product failure nor a browser PASS.

The QA lookup was corrected to the configured business namespace prefix, matching the earlier baseline reader. Application source and assertions were unchanged. The browser was closed in finally before restarting on the same frozen source/build. The actual complete-run outcome is recorded separately in `results.json`.
