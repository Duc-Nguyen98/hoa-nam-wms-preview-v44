# S27 repair round 2

Owner S00#2. Base `cc030be40552845881d0a234a26e1e783f5e6e4f`, DEV. Coordinator explicitly released serialized source lease after FQA closed clean base contexts. Actual model telemetry UNVERIFIED. Status: **READY_FOR_INDEPENDENT_QA**; source frozen for coordinator integration. No commit/push performed by this owner.

## Scope / repair

Round2 changes `src/features/S27/system-audit.css`, `OperationalAudit.tsx`, `audit-ui-copy.ts` and new `tests/s27/copy-border-cascade.mjs`. Coordinator extended the lease for independently confirmed V08/V09 before final integration. No business binding, schema, fixture, shared stylesheet or reference changes.

**V04:** Actual main app imports the S27 stylesheet through App before importing shared unified.css. The shared ghost selector and old S27 copy selector both have class specificity 0,3,0, allowing the later transparent shared border to win. Replace the existing tablet rule selector with `.hn-global-modal.s27-detail-modal .s27-detail-trace__value > .s27-detail-copy` (0,4,0); declarations remain identical. This is an owning selector correction, not an appended global override.

**V07:** Read S00#3's section measurements in `VISUAL_DEFECT_REGISTER.md` and implemented the authorized section-specific proposal. Desktop content gaps 20→16, trace row gaps 10→4, footer block padding 20→16. Tablet header block padding 18→13, identity metadata top margin 8→4 and row gap 6→4, noninteractive source badge block padding 6→3, information row gap 24→18, content gaps 24→22, trace row gap 16→14. Tablet footer and related panel spacing retain their prior owning values. All numeric changes are PROVISIONAL observations, not approved tokens. Full source IDs, text wrapping and 44 CSS pixel controls remain preserved.

**V08:** Remove the reload button's `leadingIcon` prop to match references9/10, preserving the existing loading state/spinner and handler. Remove the ineffective direct-SVG hiding selector that missed the Button icon wrapper.

**V09:** Header description uses scoped desktop/tablet spans switched at the existing1120px S27 container breakpoint. Desktop retains its original long scope/timezone description; tablet uses the exact short reference copy “Theo dõi thao tác và truy vết sự kiện.” with local EN/ZH translations. The separately displayed scope explanation and date timezone label remain source-backed. No shared component change.

## Actual app regression and attempts

New browser script uses the normal application route and its real stylesheet order, real public demo initialization, a read-only source lookup to choose the existing audit date, the actual DatePicker, the actual search input and an exact visible event opener. Its four original trace values are checked against the actual source. No response injection, fixture editing, source clock replacement, embedded login values or serialized session is used. Login is supplied only through child process environment. Browser profiles are width1672/992/800, DPR1, explicitly diagnostic; independent VQA owns canonical profile comparison.

| Evidence directory | Result |
|---|---|
|`red-cc030be/`|FAIL as expected: both tablet widths computed four transparent copy borders. Stable base CSS, no page errors. Desktop827h, tablet native1196h, tablet8001220h.|
|`green-worktree/`|Initial FAIL retained: 992px capture sampled shared border-color transition at intermediate alpha0.467; 800px had already settled to the correct opaque token. Runtime dimensions were correct.|
|`green-settled-worktree/`|PASS, three profiles. Test now polls the computed border until the shared transition settles before measuring. All tablet copy borders equal resolved border token, all controls >=44px, four raw source IDs unchanged, no horizontal overflow, footer reachable, no page/console errors. CSS/head custody stable.|
|`green-final-worktree/`|PASS, three profiles after V08/V09. The actual app also asserts no reload leading icon at all profiles and exact visible short tablet/original long desktop description. Geometry, borders,44px controls, raw IDs, overflow, footer and console checks remain PASS.|

The first green test timing failure required only test synchronization; no additional runtime repair was made. Every attempt is retained rather than overwritten.

## Measured sections (actual normal app, CSS pixels)

| Profile / section | cc030be | Round2 |
|---|---:|---:|
|Desktop native modal|827|789|
|Desktop header|82|82|
|Desktop identity|87|87|
|Desktop information|137|137|
|Desktop trace section|248|230|
|Desktop footer|85|77|
|Tablet native modal|1196|1156|
|Tablet header|107|97|
|Tablet identity|117|105|
|Tablet information|221|215|
|Tablet native trace|320|314|
|Tablet footer|85|85|
|Tablet800 modal|1220|1180|
|Tablet800 trace (wrapped IDs)|344|338|

These measurements support a bounded improvement. Native desktop still has approximately29px positive height residual against raster reference760; source DPR and numeric design token gaps remain open. Tablet near-reference outer height does not imply exact geometry or data fidelity PASS. Independent VQA must verify all sections and scenarios on the integrated SHA.

## Local checks

- `npm run typecheck`: PASS.
- `node --import ./tests/s27/css-hook.mjs --import tsx --test tests/s27-audit-integrity.test.ts tests/s27-audit-state.test.ts tests/s27-audit-presentation.test.ts`: PASS18/18.
- `node tests/s27/copy-border-cascade.mjs` with environment-supplied local login and `S27_CASCADE_OUT` pointing to `green-final-worktree`: PASS3 profiles, including V08/V09 assertions.
- `git diff --check`: PASS.

`source-hashes.json` records exact CSS/test hashes; `runtime.patch` records the runtime repair. Results concern this uncommitted worktree over cc030be. Integrated candidate SHA and independent QA remain coordinator-owned gates. Hosted CI, build and deployed SHA were not rerun by this owner in this round.
