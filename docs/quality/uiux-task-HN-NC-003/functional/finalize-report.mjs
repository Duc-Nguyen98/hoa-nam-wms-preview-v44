import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root='docs/quality/uiux-task-HN-NC-003',dir=`${root}/functional`;
const sha='76059cce616543356c623ec248c6350ddd07cdf5',tree='d3cbc007a42abb996b74d8c537220fb202e8bb18';
const read=async f=>(await fs.readFile(f,'utf8')).replace(/^\uFEFF/,'');
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();
if(git('rev-parse','HEAD')!==sha||git('rev-parse','HEAD:src')!==tree||git('diff','HEAD','--','src'))throw Error('Final runtime source custody changed');
for(const file of ['sha-start.txt','sha-browser-start.txt','sha-end.txt','sha-nodes-end.txt'])if((await read(`${dir}/run-final/${file}`)).trim()!==sha)throw Error(`Bad SHA receipt ${file}`);
for(const file of ['source-tree-start.txt','source-tree-browser-start.txt','source-tree-end.txt'])if((await read(`${dir}/run-final/${file}`)).trim()!==tree)throw Error(`Bad tree receipt ${file}`);
for(const file of ['working-source-start.diff','working-source-end.diff'])if((await read(`${dir}/run-final/${file}`)).trim())throw Error(`Dirty runtime receipt ${file}`);
if((await read(`${dir}/run-final/browser-exit-code.txt`)).trim()!=='0')throw Error('Final browser gate not successful');
const exits=JSON.parse(await read(`${dir}/run-final/node-exit-codes.json`));if(Object.values(exits).some(x=>x!==0))throw Error('Node/typecheck gate failed');
const records=[];
function walk(suites,evidence,scope){for(const suite of suites??[]){for(const spec of suite.specs??[])for(const item of spec.tests??[]){const r=item.results.at(-1);records.push({title:spec.title,result:r.status==='passed'?'PASS':'FAIL',rawStatus:r.status,durationMs:r.duration,commit:sha,scope,evidence,errors:r.errors??[]});}walk(suite.suites,evidence,scope);}}
for(const [run,scope]of [['run-final','critical-functional'],['axe-final','automated-accessibility'],['focus-final','focused-regression'],['shared-final','shared-modal-toast-contrast'],['shared-final-retry','shared-modal-toast-contrast-recovery']]){const file=`${dir}/${run}/browser-results.json`;walk(JSON.parse(await read(file)).suites,file,scope);}
const currentBrowser=records.filter(r=>r.result==='PASS'),environmentFailures=records.filter(r=>r.result!=='PASS');
if(currentBrowser.length!==36||environmentFailures.length!==1||!environmentFailures[0].title.includes('SHARED-800-dark'))throw Error('Unexpected browser execution ledger; investigate without relabeling');
for(const file of ['notification.tap','session-concurrency.tap']){const p=`${dir}/run-final/${file}`,tap=await read(p);if(!/^# fail 0\s*$/m.test(tap)||!/^# skipped 0\s*$/m.test(tap))throw Error(`Bad TAP ${file}`);for(const m of tap.matchAll(/^(ok|not ok) (\d+) - (.+)$/gm))records.push({title:m[3],result:m[1]==='ok'?'PASS':'FAIL',commit:sha,scope:'node-fixtures',evidence:`${p} #${m[2]}`});}
if(records.filter(r=>r.scope==='node-fixtures').length!==24)throw Error('Unexpected Node count');
const axeProfiles=[],sharedProfiles=[];
for(const name of ['1920-light','1920-dark','800-light','800-dark']){
 const a=JSON.parse(await read(`${dir}/axe-final/${name}.json`));if(a.candidateSha!==sha||a.sourceStart.candidateSha!==sha||JSON.stringify(a.sourceStart)!==JSON.stringify(a.sourceEnd)||a.sourceEnd.workingSourceDiff||a.errors.length||a.requests.length||a.result.violations.length)throw Error(`Bad axe profile ${name}`);
 axeProfiles.push({name,passes:a.result.passes.length,violations:a.result.violations.length,incomplete:a.result.incomplete.map(x=>x.id),evidence:`axe-final/${name}.json`});
 const run=name==='800-dark'?'shared-final-retry':'shared-final',s=JSON.parse(await read(`${dir}/${run}/${name}.json`));if(s.sha!==sha||s.tree!==tree||s.sourceEnd.sha!==sha||s.sourceEnd.tree!==tree||s.sourceEnd.diff||s.errors.length||s.contrast.some(x=>x.status!=='PASS')||s.beforeClose.collisions.length)throw Error(`Bad shared profile ${name}`);
 sharedProfiles.push({name,evidence:`${run}/${name}.json`,samples:s.contrast.length,queued:s.beforeClose.queued,visibleToasts:s.beforeClose.visibleToasts,otherConsumer:s.otherGlobalModalConsumer,colors:s.contrast.filter(x=>x.selector==='.hn-notification-business-status'||x.pseudo==='::placeholder')});
}
const focus=JSON.parse(await read(`${dir}/focus-final/focus-repro.json`));if(focus.start.sha!==sha||JSON.stringify(focus.start)!==JSON.stringify(focus.end)||focus.after.active.id!=='main-content')throw Error('Focused regression custody/result mismatch');
const stamp=new Date().toISOString();
await fs.writeFile(`${dir}/execution-final-index.json`,JSON.stringify({task:'HN-NC-UIUX-003',generatedAt:stamp,candidateSha:sha,sourceTree:tree,environment:'LOCAL_PREVIEW_MOCK / ISOLATED_FIXTURE',requestedModel:'gpt-6.1-sol',requestedReasoning:'high',actualModel:'UNVERIFIED',actualReasoning:'UNVERIFIED',browserDistinctCasesPassed:36,browserExecutions:37,initialEnvironmentFailures:environmentFailures.length,nodeCasesPassed:24,axeProfiles,sharedProfiles,records},null,2)+'\n');
async function archive(source,destination){try{await fs.copyFile(source,destination,fs.constants.COPYFILE_EXCL);}catch(error){if(error.code!=='EEXIST')throw error;}}
await archive(`${root}/FUNCTIONAL_QA_REPORT.md`,`${dir}/FUNCTIONAL_QA_REPORT.before-finalization.md`);
await archive(`${dir}/EVIDENCE_MANIFEST.json`,`${dir}/EVIDENCE_MANIFEST.before-finalization.json`);
await archive(`${dir}/AXE_REPORT.md`,`${dir}/AXE_REPORT.before-finalization.md`);
const contrastTable=sharedProfiles.map(p=>`|${p.name}|${p.samples}|0|0|${p.evidence}|`).join('\n');
await fs.writeFile(`${dir}/CONTRAST_REVIEW.md`,`# Notification text contrast review — HN-NC-UIUX-003

Owner: S00#4. Final runtime: \`${sha}\`; source tree \`${tree}\`. LOCAL authenticated Preview mock; no production mutation.

## Method and authority

The probe reads browser-computed foreground, opacity, font size/weight and actual ancestor backgrounds, composites alpha, calculates relative luminance, and retains background layers, uncertainties and screenshots. It samples the actual child status span, not only its parent dd. Desktop and Tablet each open four real notification details, including the reachable inbound success status. Tablet Back/detail behavior is exercised.

For these normal-size text samples the threshold is4.5:1; qualifying large text uses3:1. Placeholder text is included. This follows [W3C WCAG2.2 SC1.4.3 guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), verified2026-10-27. Comparisons use unrounded ratios. No approved pixel-baseline tolerance was invented.

## Before findings retained

Diagnostic on clean \`e57f6aed038e81d8b6a3b4f0eeccbb4c853012dc\`: actual DesktopLight placeholder14px/400, foreground rgb83,103,122 at opacity.75 on white composites to126,141,155.25: **3.402425:1 FAIL**. Actual warning status14px/400, #c66a00 on #fff0d8: **3.424567:1 FAIL**. Raw source hashes/layers and screenshots are in \`shared-final-diagnostic/\`. This failure was sent to S00#1 before any color remedy.

FQ-NC-003-A11Y-04: P2 placeholder contrast. FQ-NC-003-A11Y-05: P2 warning-status contrast. Design Guardian allowed a minimal Light-only NC correction in the provisional palette; its scope preserves fills, icons, Dark and shared global tokens. Success variant was included in the scoped companion remedy and independently measured afterward; an initial actual-success measurement was not captured, so it is not claimed as another separately reproduced before defect.

## Final actual measurements

|Text|Final Light colors|Ratio|Size/weight|Result|
|---|---|---:|---|---|
|Search placeholder|rgb83,103,122 opacity1 / white|5.851331|Desktop14px400; Tablet18px400|PASS|
|Warning status span|#835811 / #fff0d8|5.552797|14px400 both viewports|PASS|
|Inbound success span “Đã hoàn tất”|#286645 / #def7e6|6.030105|14px400 both viewports|PASS|

Dark remains unchanged: placeholder5.627029, warning7.267853, success6.747007. All are measured from rendered app elements.

|Profile|Repeated computed samples|FAIL|INCOMPLETE within probe|Raw evidence|
|---|---:|---:|---:|---|
${contrastTable}

Total640 repeated samples across states; these are not640 independent tests or distinct elements. Shared suite first run3PASS/1environmentFAIL (main.tsx net::ERR_NETWORK_CHANGED before login), unchanged TabletDark targeted retry1PASS. Original failure and trace remain.

## Limits

This is a scoped solid-background text review. It is not exhaustive WCAG, screen-reader, all non-text contrast, every gradient/pseudo element, or pixel-fidelity certification. The default axe scan still records color-contrast INCOMPLETE because of the separately locked shell pseudo content; it was neither hidden nor ignored. These spot checks resolve the measured NC text cases without relabeling axe's incomplete result.
`);
const oldAxe=await read(`${dir}/AXE_REPORT.before-finalization.md`);
await fs.writeFile(`${dir}/AXE_REPORT.md`,`# Final automated accessibility retest — HN-NC-UIUX-003

Owner: S00#4. Final candidate \`${sha}\`, runtime tree \`${tree}\`.

**Default enabled axe4.14.0 rules:4/4 profile tests PASS, zero violations.** No disabled rules, tag exclusions or baseline/source modifications by this reviewer. Every profile asserts start/end SHA, source-tree identity, empty working source diff and hashes of Notification CSS/GlobalModal/GlobalToastProvider. Console/pageerror0 and requestfailed0 for all four completed scans.

|Profile|Passing rules|Violations|Incomplete|
|---|---:|---:|---|
${axeProfiles.map(p=>`|${p.name}|${p.passes}|${p.violations}|${p.incomplete.join(',')}|`).join('\n')}

FQ-NC-003-A11Y-01 (P1 aria-prohibited-attr) and -02 (P2 nested banner) are **FIXED + independently RETESTED**. The original diagnostic FAIL evidence below and \`axe/\` remain. Default rule applicability changes when invalid semantics are corrected; passing-rule counts are not a count of test cases.

Color-contrast remains **INCOMPLETE**, not comprehensive PASS. See [CONTRAST_REVIEW.md](CONTRAST_REVIEW.md) for actual NC text computed measurements and before/fix/retest evidence. Full screen-reader/WCAG certification is NOT_RUN.

Shared regression also exercised named feedback grouping, live status aria-atomic, toast collision safety, keyboard focus restoration and the existing non-NC S01 AcceptedRowDetail consumer at both viewports/themes. First TabletDark shared attempt had a preserved environment network failure; its unchanged targeted retry passed. That event does not change the4/4 completed axe result.

---

${oldAxe}`);
let focusReport=await read(`${dir}/FOCUS_DEFECT.md`);focusReport=focusReport.replace('Status: **CONFIRMED FAIL, awaiting targeted owner fix/retest**.','Status: **FIXED + independent RETEST PASS**.');if(!focusReport.includes('## Independent final retest'))focusReport+=`\n## Independent final retest\n\nThe unchanged focused test executed on \`${sha}\` and PASS in31.3s. The original mark-all origin still correctly records connected=true/rects0 after dialog closure, but keyboard Enter on focused toast close now returns to **MAIN#main-content**, not BODY. Start/end source custody is identical and clean; errors0. See \`focus-final/focus-repro.json\`, screenshots, browser-results.json and command log. Shared Desktop/Tablet Light/Dark tests also exercise this path; the first TabletDark environment network failure and unchanged retry are retained separately. Owner fix is commit8e40b6a; S00#4 changed no runtime source.\n`;await fs.writeFile(`${dir}/FOCUS_DEFECT.md`,focusReport);
const ledger='|Test|Result|Evidence|\n|---|---|---|\n'+records.map(r=>`|${r.title.replaceAll('|','\\|')}|${r.result}${r.rawStatus==='timedOut'?' (environment, recovered in separate run)':''}|${r.evidence}|`).join('\n');
await fs.writeFile(`${root}/FUNCTIONAL_QA_REPORT.md`,`# Independent Functional QA — HN-NC-UIUX-003

Owner: S00#4 native subagent. Packet: docs/agent-handoffs/HN-NC-UIUX-003.md. Branch DEV. Final candidate \`${sha}\`, runtime source tree \`${tree}\`. Generated ${stamp}.

## Verdict

**Executed local feature checks PASS; overall release remains PARTIAL pending independent Visual QA and CI/deployment authority.** No source/business logic, locked design/baseline, package/lockfile or CI file was edited by this reviewer. No commit/push/deploy performed.

- Critical functional browser: **27/27 PASS** on final SHA.
- Notification/badge/target/session/concurrency Node tests: **24/24 PASS**, skipped0.
- Automated default axe4.14.0: **4/4 PASS**, violated rules0; color-contrast remains INCOMPLETE.
- Focused actual-toast unchanged before→after regression: **1/1 PASS** on final SHA; earlier verified FAIL preserved.
- Shared modal/toast/S01/contrast: first run **3PASS/1environmentFAIL**, then unchanged TabletDark **1PASS**. Four distinct profiles have successful results; this is not a clean first-pass4/4 run.
- Thus36 distinct browser cases have successful final-SHA executions, with37 executions including the preserved environment failure.24 Node cases are separate. Typecheck: **PASS**. Build: NOT_RUN by S00#4; parent owns build evidence.
- Requested GPT-6.1 Sol/high; ACTUAL_MODEL/ACTUAL_REASONING **UNVERIFIED** (no authoritative runtime telemetry).

## Actual environment and coverage

LOCAL_PREVIEW_MOCK / ISOLATED_FIXTURE; Chromium, own Vite server127.0.0.1:5254. Each test uses a fresh browser context and configured test demo credentials. Auth tests execute real S07→S08→setup→S01, then open the actual modal through the bell. Production APIs/data were never used or mutated.

Screen discovery: \`#/preview/S01\` shell bell \`src/shared/ShellHeader.tsx\` → \`src/notifications/PreviewNotificationCenter.tsx\` using shared GlobalModal and GlobalToastProvider. Notification targets remain exact-document routes S09/S11/S12/S15/S16/S23, checked by Node tests and actual navigation.

|Scope|Executed result and limits|
|---|---|
|Lifecycle|Read/unread, selection without mutation, search/no-results/filter, previous/next, mark-all, reload persistence, verified deep link PASS|
|Count|0/1/9/10/99/100/999,99+ cap/full accessible count and count2→1→0 PASS|
|States/recovery|Loading/empty/error/stale/unverified/many, offline disabled mutation, failed storage preserving state and retry PASS in mock/fixture|
|Session/data|Ordinary auth/setup/logout no prior-data exposure PASS; anonymous/unconfirmed/expired actor reject mock read+mutation before persistence; replay/concurrent distinct commands and stale actor response tests PASS|
|Locales/themes|VI/EN/ZH × Light/Dark × Desktop1920×1080/Tablet800×1280 smoke12PASS; no obvious translation-key/undefined leaks or horizontal overflow. This does not approve missing pixel references|
|Keyboard/geometry|Focus trap both directions, Escape/opener return, tab arrows, Tablet>=44px controls and detail reachability PASS|
|Shared impacts|Actual mark-all live feedback group/status/dismiss; Desktop toast outside modal without controls overlap; Tablet queue then admission after close; hidden-origin safe focus fallback PASS. Non-NC actual S01 AcceptedRowDetail heading/no-banner/Tab/Shift+Tab/Escape/exact opener PASS at4profiles|
|Text contrast|640 repeated scoped computed text samples PASS across4profiles/details, including actual warning and success child spans. Not640testcases; full axe contrast remains INCOMPLETE|

## Defects and recovery

|ID|Severity|Verified before|Final executed status|
|---|---|---|---|
|FQ-NC-003-A11Y-01|P1|Generic toast div aria-label violates aria-prohibited-attr in4diagnostic scans|FIXED, axe4profiles RETEST PASS|
|FQ-NC-003-A11Y-02|P2|Nested native modal header exposed as banner in4diagnostic scans|FIXED, axe+shared/S01 RETEST PASS|
|FQ-NC-003-A11Y-03|P2|Actual keyboard toast dismiss leaves BODY focused on exact interim e5ba486|FIXED, unchanged focused final test and shared RETEST PASS|
|FQ-NC-003-A11Y-04|P2|Actual Light placeholder contrast3.402425:1 on e57f6ae|FIXED, final actual ratio5.851331 both viewports|
|FQ-NC-003-A11Y-05|P2|Actual Light warning status span contrast3.424567:1 on e57f6ae|FIXED, final actual ratio5.552797; companion success variant actual6.030105|

Five independent QA findings (P1×1,P2×4) closed for their executed scope. Initial success variant was not separately captured before correction and is not claimed as a sixth reproduced before defect. The new accessibility findings were routed to S00#1 and the leased owner before remediation; S00#4 did not repair source.

TabletDark shared first attempt timed out before login because its actual main.tsx request failed **net::ERR_NETWORK_CHANGED**. Original screenshot is blank, trace/console/network summary retained in shared-final/. Fresh-server unchanged targeted retry PASS54.8s, errors0. No timeout/test was weakened, no snapshot updated. This is recovered environment evidence, not a production bug fix or proof of three clean stability runs.

## Custody and retained history

Final source receipts in run-final/ bind Node/typecheck/main browser to final SHA/tree; each axe/shared/focused record carries its own source custody. working src diff stayed empty in acceptance runs. Evidence SHA256 manifest covers this report, tests, raw JSON/TAP/logs/screenshots/traces. Execution ledger: functional/execution-final-index.json.

Historical evidence remains: initial27browser+24Node at7875281 (source e1d3c3c); original axe4FAIL diagnostic with explicitly imperfect CSS custody in axe/; actual focus1FAIL atclean e5ba486; initial actual contrast1FAIL and27browser24Node PASS ate57f6ae. No earlier result was relabeled. The original functional report is archived as functional/FUNCTIONAL_QA_REPORT.before-finalization.md.

## NOT_RUN / unresolved authority

- REAL_API/STAGING, server RBAC/HTTP401/403/404/500, true realtime arrival, transport timeout/retry, multi-session cross-tab integration: **NOT_RUN / NOT_CONNECTED**. Mock PASS is not integration certification.
- Full WCAG/screen-reader and all non-text/gradient/pseudo contrast: **NOT_RUN**; axe color-contrast remains **INCOMPLETE**. Keyboard and solid-background NC text checks are the executed scope.
- Three clean repeated full configurations: **NOT_RUN**; one actual network failure/recovery is recorded.
- Broad unrelated regression: **NOT_RUN**. Three historical seed failures remain open; this scope does not close them or call them new regressions.
- Full approved-reference visual fidelity and other reference viewports: S00#3 owns. Hosted CI, PR/protection, deployed exact SHA, target public URL and release approval: S00#5/S00#1 own; **not certified by local tests**.

## Commands and evidence

Commands used final run: Playwright with functional/playwright.config.ts (QA_EVIDENCE_DIR=run-final); axe.config.ts (QA_AXE_EVIDENCE_DIR=axe-final); shared-regression.config.ts (QA_SHARED_EVIDENCE_DIR=shared-final then shared-final-retry with --grep F-NC-003-SHARED-800-dark); same config with QA_SHARED_SPEC=focus-repro.spec.ts and evidence focus-final; Node --test badge-contract/notification-center/notification-state/notification-target plus session-concurrency.test.ts; npm run typecheck. Full stdout/TAP and exit receipts remain alongside each run. No source edits or test exclusions were used to make a gate pass.

## Final execution ledger

${ledger}
`);
const files=[];async function scan(folder){for(const entry of await fs.readdir(folder,{withFileTypes:true})){const p=path.join(folder,entry.name);if(entry.isDirectory())await scan(p);else if(entry.name!=='EVIDENCE_MANIFEST.json'){const bytes=await fs.readFile(p);files.push({path:p.replaceAll('\\','/'),bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});}}}
await scan(dir);const report=await fs.readFile(`${root}/FUNCTIONAL_QA_REPORT.md`);files.push({path:`${root}/FUNCTIONAL_QA_REPORT.md`,bytes:report.length,sha256:createHash('sha256').update(report).digest('hex')});await fs.writeFile(`${dir}/EVIDENCE_MANIFEST.json`,JSON.stringify({task:'HN-NC-UIUX-003',generatedAt:stamp,candidateSha:sha,sourceTree:tree,files},null,2)+'\n');
console.log(JSON.stringify({candidateSha:sha,browserDistinctCasesPassed:36,preservedEnvironmentFailures:1,nodeCasesPassed:24,axeProfiles:4,contrastSamples:sharedProfiles.reduce((n,p)=>n+p.samples,0),manifestFiles:files.length}));
