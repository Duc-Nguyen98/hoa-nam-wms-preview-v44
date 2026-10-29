import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const base='docs/qa/reversal/HN-REVERSAL-FIDELITY-001/functional/';
const tag=process.env.FIDELITY_TAG,source=process.env.FIDELITY_SOURCE,build=process.env.FIDELITY_BUILD;
const expectedBrowserCases=Number(process.env.FIDELITY_EXPECTED_CASES??22);
if(!tag||!source||!build||!/^[a-zA-Z0-9_-]+$/.test(tag))throw Error('Explicit frozen tag/source/build required');
const digest=s=>createHash('sha256').update(s).digest('hex');
const bText=await fs.readFile(base+tag+'/browser/results.json','utf8'),browser=JSON.parse(bText);
const mText=await fs.readFile(base+tag+'/model/results.json','utf8'),model=JSON.parse(mText);
assert.equal(browser.build.sourceCommit,source);assert.equal(browser.build.buildId,build);
assert.equal(browser.sourceUnchanged,true);assert.equal(model.sourceUnchanged,true);
assert.equal(browser.checks.length,expectedBrowserCases);
assert.equal(browser.checks.every(c=>c.status==='PASS'&&c.canonicalUnchanged),true);
assert.deepEqual(browser.errors,[]);assert.equal(model.checks.length,28);
assert.equal(model.checks.every(c=>c.status==='PASS'),true);
for(const[path,hash]of Object.entries(model.before))assert.equal(browser.beforeSource[path],hash);
const baseline=JSON.parse(await fs.readFile(base+'BASELINE_FREEZE.json','utf8')),historical=[];
for(const r of baseline.receipts){const actual=digest(await fs.readFile(base+r.path));assert.equal(actual,r.sha256);historical.push({path:r.path,sha256:actual,unchanged:true})}
const result={
 task:'HN-REVERSAL-FIDELITY-001',sourceCommit:source,buildId:build,mode:'MOCK',
 independentModelPass:28,uniqueBrowserCasePass:expectedBrowserCases,
 coreBrowserCasePass:browser.checks.filter(c=>!c.name.startsWith('B23 ')).length,
 supplementalBrowserCasePass:browser.checks.filter(c=>c.name.startsWith('B23 ')).length,
 aggregateAcrossRuns:false,singleCleanFullRunPass:true,consolePageErrors:0,
 sourceUnchangedEveryRun:true,canonicalUnchangedEveryCompletedCase:true,
 model:{receipt:tag+'/model/results.json',sha256:digest(mText),sourceMatchesBrowserCustody:true},
 browser:{receipt:tag+'/browser/results.json',sha256:digest(bText),caseCount:expectedBrowserCases,passCount:expectedBrowserCases,errorCount:0},
 historicalBaselineReceipts:historical,latestCases:browser.checks,
 previousCandidate:'All earlier source-specific clean/cumulative receipts, raw failures, screenshots and baseline proofs remain separately preserved; none is relabelled as this run.',
 limits:browser.limits,blocked:browser.blocked,
};
assert.equal(result.coreBrowserCasePass,22);
await fs.writeFile(base+tag+'/FINAL_ACCEPTANCE.json',JSON.stringify(result,null,2));
const previous=base+'a98b035-FINAL_ACCEPTANCE.json';
try{await fs.access(previous)}catch{await fs.copyFile(base+'FINAL_ACCEPTANCE.json',previous)}
await fs.writeFile(base+'FINAL_ACCEPTANCE.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({source,build,model:28,browser:expectedBrowserCases,singleCleanFullRunPass:true,sourceUnchanged:true,canonicalUnchanged:true}));
