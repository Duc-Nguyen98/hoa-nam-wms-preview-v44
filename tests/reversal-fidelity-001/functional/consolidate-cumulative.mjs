import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const base='docs/qa/reversal/HN-REVERSAL-FIDELITY-001/functional/';
const tag=process.env.FIDELITY_TAG,source=process.env.FIDELITY_SOURCE,build=process.env.FIDELITY_BUILD;
if(!tag||!source||!build||!/^[a-zA-Z0-9_-]+$/.test(tag))throw Error('Explicit frozen tag/source/build required');
const digest=s=>createHash('sha256').update(s).digest('hex'),latest=new Map(),runs=[];let first;
for(const part of['browser','readstates']){
 const path=tag+'/'+part+'/results.json',raw=await fs.readFile(base+path,'utf8'),r=JSON.parse(raw);
 assert.equal(r.build.sourceCommit,source);assert.equal(r.build.buildId,build);assert.equal(r.sourceUnchanged,true);
 if(first)assert.deepEqual(r.beforeSource,first.beforeSource);else first=r;
 for(const c of r.checks){assert.equal(c.canonicalUnchanged,true);latest.set(c.name,{...c,receipt:path})}
 if(part==='readstates'){assert.equal(r.checks.length,1);assert.equal(r.checks[0].name.startsWith('B16 '),true);assert.equal(r.checks[0].status,'PASS');assert.deepEqual(r.errors,[])}
 else{assert.equal(r.checks.length,23);assert.equal(r.checks.filter(c=>c.status==='FAIL').length,1);assert.equal(r.checks.find(c=>c.status==='FAIL').name.startsWith('B16 '),true);assert.equal(r.errors.every(e=>e.includes('ERR_INSUFFICIENT_RESOURCES')),true)}
 runs.push({receipt:path,sha256:digest(raw),cases:r.checks.length,passed:r.checks.filter(c=>c.status==='PASS').length,failed:r.checks.filter(c=>c.status==='FAIL'),errors:r.errors});
}
assert.equal(latest.size,23);assert.equal([...latest.values()].every(c=>c.status==='PASS'),true);
const mText=await fs.readFile(base+tag+'/model/results.json','utf8'),model=JSON.parse(mText);
assert.equal(model.sourceUnchanged,true);assert.equal(model.checks.length,28);assert.equal(model.checks.every(c=>c.status==='PASS'),true);
for(const[path,hash]of Object.entries(model.before))assert.equal(first.beforeSource[path],hash);
const baseline=JSON.parse(await fs.readFile(base+'BASELINE_FREEZE.json','utf8')),historical=[];
for(const r of baseline.receipts){const actual=digest(await fs.readFile(base+r.path));assert.equal(actual,r.sha256);historical.push({path:r.path,sha256:actual,unchanged:true})}
const result={task:'HN-REVERSAL-FIDELITY-001',sourceCommit:source,buildId:build,mode:'MOCK',independentModelPass:28,uniqueBrowserCasePass:23,coreBrowserCasePass:22,supplementalBrowserCasePass:1,aggregateAcrossRuns:true,singleCleanFullRunPass:false,runs,model:{receipt:tag+'/model/results.json',sha256:digest(mText),sourceMatchesBrowserCustody:true},sourceUnchangedEveryRun:true,canonicalUnchangedEveryCompletedCase:true,historicalBaselineReceipts:historical,latestCases:[...latest.values()],limits:['Full attempt had one development-module ERR_INSUFFICIENT_RESOURCES before B16 rendered; fresh bounded B16 retest passed with zero errors. No single clean full-run claim.','Chromium browser only; Edge-specific execution not certified.','All real generic partial API/backend atomicity/receipt/RBAC boundaries remain blocked.'],blocked:first.blocked};
await fs.writeFile(base+tag+'/FINAL_ACCEPTANCE.json',JSON.stringify(result,null,2));await fs.writeFile(base+'FINAL_ACCEPTANCE.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({source,build,model:28,core:22,supplement:1,aggregateAcrossRuns:true,singleCleanFullRunPass:false,sourceUnchanged:true,canonicalUnchanged:true}));
