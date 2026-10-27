import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root='docs/quality/uiux-task-HN-NC-003',dir=`${root}/functional`,run=`${dir}/tablet-delta-final`,base='76059cce616543356c623ec248c6350ddd07cdf5',sha='830f83d48eac84c3e2467de7f41c388439cc7eb2',tree='65ac25d235682469452f60d50664b3e6acb3a753';
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim(),read=async f=>(await fs.readFile(f,'utf8')).replace(/^\uFEFF/,'');
if(git('rev-parse','HEAD')!==sha||git('rev-parse','HEAD:src')!==tree||git('diff','HEAD','--','src'))throw Error('Final delta source custody changed');
const changed=git('diff','--name-only',base,sha,'--','src').split('\n');if(changed.length!==1||changed[0]!=='src/notifications/notifications.css')throw Error('Runtime delta exceeds reviewed CSS-only scope');
const cases=[];function walk(suites,evidence){for(const suite of suites??[]){for(const spec of suite.specs??[])for(const t of spec.tests??[])cases.push({title:spec.title,status:t.results.at(-1).status,durationMs:t.results.at(-1).duration,evidence,errors:t.results.at(-1).errors??[]});walk(suite.suites,evidence);}}for(const folder of [run,`${dir}/tablet-delta-retest`])walk(JSON.parse(await read(`${folder}/browser-results.json`)).suites,`${folder}/browser-results.json`);if(cases.length!==5||cases.filter(c=>c.status==='passed').length!==4||cases.filter(c=>c.status!=='passed').length!==1||!cases.find(c=>c.status!=='passed').title.includes('801-zh-CN'))throw Error('Unexpected delta execution ledger');
const profiles=[];for(const name of ['992-vi-light','992-vi-dark','900-en-light','801-zh-CN-light']){const folder=name==='801-zh-CN-light'?'tablet-delta-retest':'tablet-delta-final',r=JSON.parse(await read(`${dir}/${folder}/${name}.json`));if(r.start.sha!==sha||r.start.tree!==tree||r.start.diff||JSON.stringify(r.start)!==JSON.stringify(r.end)||r.errors.length)throw Error(`Bad delta custody ${name}`);const a=r.measurements.find(m=>m.state==='initial-list-2-unread'),b=r.measurements.find(m=>m.state==='selection-only-back-no-mutation');let maxSlotDelta=0;for(const old of a.rows){const current=b.rows.find(x=>x.id===old.id);for(const key of ['x','y','width','height'])maxSlotDelta=Math.max(maxSlotDelta,Math.abs(current.row[key]-old.row[key]));}if(maxSlotDelta>1)throw Error(`Selection row movement ${name}`);profiles.push({name,profile:r.profile,modal:a.modal,maxSlotDelta,states:r.measurements.map(m=>m.state),errors:r.errors,evidence:`${folder}/${name}.json`});}
async function archive(source,destination){try{await fs.copyFile(source,destination,fs.constants.COPYFILE_EXCL);}catch(e){if(e.code!=='EEXIST')throw e;}}
await archive(`${root}/FUNCTIONAL_QA_REPORT.md`,`${dir}/FUNCTIONAL_QA_REPORT.76059cc.md`);await archive(`${dir}/EVIDENCE_MANIFEST.json`,`${dir}/EVIDENCE_MANIFEST.76059cc.json`);
const stamp=new Date().toISOString(),diff=git('diff',base,sha,'--','src');await fs.writeFile(`${run}/source-delta.diff`,diff+'\n');const provenance={task:'HN-NC-UIUX-003',generatedAt:stamp,baselineSha:base,candidateSha:sha,sourceTree:tree,branch:git('branch','--show-current'),workingSourceDiff:git('diff','HEAD','--','src'),changedSourceFiles:changed,profiles,cases};await fs.writeFile(`${dir}/execution-delta-index.json`,JSON.stringify(provenance,null,2)+'\n');await fs.writeFile(`${run}/source-provenance.json`,JSON.stringify(provenance,null,2)+'\n');
const report=`# Final source impact retest — HN-NC-UIUX-003

Owner: S00#4 independent QA. Current candidate \`${sha}\`; runtime source tree \`${tree}\`; DEV. Generated ${stamp}.

## Result

**All4 actual application portrait profiles have PASS executions on the exact current SHA:3 initial PASS +1 retest PASS after correcting a QA-only setup selector.** Initial fourth attempt FAIL is preserved. Successful profile executions have console/pageerror/requestfailed0. Fresh browser contexts and normal S07 login→S08 confirmation→setup→S01→bell, safe local Preview mock. No runtime edit, production mutation, commit/push/deploy by QA.

This is an additional CSS-only impact run after the full matrix baseline at \`${base}\` (36 distinct browser cases successful,24 Node cases, typecheck; one preserved network failure recovered in an unchanged retry). The full36/24 suite was **not** rerun on the new SHA. Source diff proves only Notification CSS changed, confined to801..1100portrait layout rules. Shared semantics/focus, notification data/business code, colors/fonts and other source modules remain identical. New run receipts bind actual impacted behavior to the new SHA; baseline results are retained with their original SHA.

|Profile|Modal x/y/width/height CSS px|Maximum selection-only row-box delta|Result|
|---|---|---:|---|
${profiles.map(p=>`|${p.name} (${p.profile.width}×${p.profile.height})|${[p.modal.x,p.modal.y,p.modal.width,p.modal.height].map(x=>Number(x.toFixed(4))).join(' / ')}|${p.maxSlotDelta}|PASS|`).join('\n')}

Executed at each profile: initial six-item list/two unread; detail CTA reachable through its own scroll pane; selecting an unread notification without mutation then Back; every row's position/size remains stable; read/unread count2→1→2; search real reference; no-results state; unread filter2→read→1 and automatic list/focus restoration; All→mark-all→0; disabled mark-all; normal Escape→bell and focused toast dismissal→visible main fallback. No page/dialog horizontal overflow; modal retains the existing24px viewport guard; inspected close/search/tab/mark-all controls remain>=44px; row title/time and child bounds do not overlap or clip within their own rows.

The1CSSpx stability probe is an engineering invariant for selection-only reflow/rounding, not an approved screenshot-diff tolerance. Actual measured maximum row-box delta is shown above. No pixel threshold or baseline was changed.

The initial801ZH attempt stopped before NC at the setup button: QA expected Vietnamese “Tiếp tục” while the actual localized accessible name was “继续”. Screenshot/DOM/trace prove this QA selector error; it is not a reproduced NC defect. The setup selector alone was corrected for ZH; all NC assertions/timeouts/source stayed unchanged. Its isolated retest passed; original failed execution remains in tablet-delta-final/ and the successful record is in tablet-delta-retest/. This is not a clean first-pass4/4 run.

Original full-matrix artifacts, initial semantic/focus/contrast FAILs and recovered network failure remain byte-preserved. See \`source-delta.diff\`, \`source-provenance.json\`, four successful raw profile records,16successful screenshots plus the failed screenshot/trace, browser-results.json and command logs. S00#3 independently owns reference geometry/visual residual verdict. P3 optical/reference uncertainty is not closed by these functional passes.

Release verdict remains **PARTIAL / external release gates unresolved** pending Visual QA and CI/deployed-SHA authority. REAL_API/server RBAC/realtime, full WCAG/screen-reader/non-text contrast, three clean stability runs and unrelated historical regression remain NOT_RUN or under their existing blockers. The baseline axe color-contrast INCOMPLETE remains recorded; no axe rule was suppressed. Current CSS delta does not alter its contrast colors.

## Executed command

\`\`\`powershell
$env:QA_EXPECTED_SHA='${sha}'
$env:QA_TABLET_EVIDENCE_DIR='${run}'
npx playwright test -c ${dir}/tablet-delta.config.ts
$env:QA_TABLET_EVIDENCE_DIR='${dir}/tablet-delta-retest'
npx playwright test -c ${dir}/tablet-delta.config.ts --grep F-NC-003-DELTA-801-zh-CN-light
\`\`\`
`;
await fs.writeFile(`${dir}/FINAL_SOURCE_DELTA_RETEST.md`,report);
const baselineReport=await read(`${dir}/FUNCTIONAL_QA_REPORT.76059cc.md`);await fs.writeFile(`${root}/FUNCTIONAL_QA_REPORT.md`,report+'\n---\n\n# Retained full matrix report — verified baseline76059cc\n\nAll final-SHA references in this historical section refer to76059cc, not the later portrait-only candidate.\n\n'+baselineReport);
let commands=await read(`${dir}/COMMANDS.md`);commands=commands.replace('Prepared configuration: `functional/tablet-delta.config.ts`. Execution/result and exact new source SHA are recorded in `FINAL_SOURCE_DELTA_RETEST.md` once run. Preparation is not a test PASS.',`Four profiles passed (3 initial +1 QA-selector-corrected retest) on ${sha}; complete command, profile/source receipts and limitations are in FINAL_SOURCE_DELTA_RETEST.md. The full matrix remains associated with76059cce.`);await fs.writeFile(`${dir}/COMMANDS.md`,commands);
const files=[];async function scan(folder){for(const entry of await fs.readdir(folder,{withFileTypes:true})){const p=path.join(folder,entry.name);if(entry.isDirectory())await scan(p);else if(entry.name!=='EVIDENCE_MANIFEST.json'){const b=await fs.readFile(p);files.push({path:p.replaceAll('\\','/'),bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')});}}}await scan(dir);const b=await fs.readFile(`${root}/FUNCTIONAL_QA_REPORT.md`);files.push({path:`${root}/FUNCTIONAL_QA_REPORT.md`,bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')});await fs.writeFile(`${dir}/EVIDENCE_MANIFEST.json`,JSON.stringify({task:'HN-NC-UIUX-003',generatedAt:stamp,candidateSha:sha,sourceTree:tree,fullMatrixBaselineSha:base,files},null,2)+'\n');console.log(JSON.stringify({candidateSha:sha,deltaPassed:4,deltaExecutions:5,preservedQaSelectorFailures:1,fullMatrixBaselineSha:base,manifestFiles:files.length,selectionMax:profiles.map(p=>({name:p.name,delta:p.maxSlotDelta}))}));
