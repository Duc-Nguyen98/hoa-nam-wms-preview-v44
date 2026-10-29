import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const root='docs/qa/reversal/HN-REVERSAL-FIDELITY-001';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const source='e7b145feb3d8ec4b42bb2ba8fa66bfb5b3d9bf2f';
const functional=JSON.parse(await fs.readFile(root+'/functional/e7b145f-final/FINAL_ACCEPTANCE.json'));
const capture=JSON.parse(await fs.readFile(root+'/visual/after-e7b145f/capture.json'));
const stability=JSON.parse(await fs.readFile(root+'/visual/after-e7b145f/stability.json'));
const build=JSON.parse(await fs.readFile('dist/build-info.json'));
assert.equal(functional.sourceCommit,source);assert.equal(capture.source.head,source);
assert.equal(build.sourceCommit,source);assert.equal(build.buildId,functional.buildId);
assert.equal(stability.stable,true);assert.equal(capture.results.length,36);
assert.equal(capture.results.some(x=>x.failure),false);
for(const [file,expected] of Object.entries(capture.source.files))assert.equal(hash(await fs.readFile(file)),expected,file);
const required=['TASK_SUMMARY','REFERENCE_MANIFEST','DESIGN_AUTHORITY_REPORT','ROUTE_COMPONENT_API_MAPPING','BUSINESS_RULE_MATRIX','SCREEN_STATE_MATRIX','VISUAL_DEFECT_REGISTER','FUNCTIONAL_QA_REPORT','TRANSACTION_INTEGRITY_REPORT','IDEMPOTENCY_CONCURRENCY_REPORT','RBAC_AUDIT_REPORT','GLOBAL_STATE_MIGRATION_REPORT','REGRESSION_REPORT','AGENT_EXECUTION_TRACE','CI_PREVIEW_REPORT','FINAL_GO_NO_GO'];
for(const file of required)assert.ok((await fs.stat(root+'/'+file+'.md')).size>100,file);
const exclusions=new Set(['ARTIFACT_MANIFEST.json','ARTIFACT_INTEGRITY.json']);
async function walk(dir){let all=[];for(const item of await fs.readdir(dir,{withFileTypes:true})){const file=path.join(dir,item.name);all=all.concat(item.isDirectory()?await walk(file):[file])}return all}
const entries=[];
for(const file of (await walk(root)).sort()){
 const relative=path.relative(root,file).split(path.sep).join('/');
 if(exclusions.has(relative))continue;
 const bytes=await fs.readFile(file);entries.push({path:relative,bytes:bytes.length,sha256:hash(bytes)});
}
const manifest={task:'HN-REVERSAL-FIDELITY-001',sourceCommit:source,buildId:build.buildId,selfExcluded:[...exclusions],files:entries};
await fs.writeFile(root+'/ARTIFACT_MANIFEST.json',JSON.stringify(manifest,null,2));
let verified=0;for(const entry of entries){const bytes=await fs.readFile(root+'/'+entry.path);assert.equal(bytes.length,entry.bytes);assert.equal(hash(bytes),entry.sha256);verified++}
const status=execFileSync('git',['diff','--name-only','71cfa02f96c51a17c188ac8a90fca558941d8638','--','src/shared','src/preview-mock','src/data'],{encoding:'utf8'}).trim();
assert.equal(status,'','Protected shared/backend business source changed');
const receipt={checkedAt:new Date().toISOString(),sourceCommit:source,buildId:build.buildId,manifestSha256:hash(await fs.readFile(root+'/ARTIFACT_MANIFEST.json')),verifiedFiles:verified,totalBytes:entries.reduce((n,e)=>n+e.bytes,0),requiredReports:required.length,actualBeforeCases:36,actualAfterCases:capture.results.length,independentModelPass:functional.independentModelPass,independentBrowserPass:functional.uniqueBrowserCasePass,sourceHashesMatch:true,protectedSharedBusinessDiffEmpty:true,selfExcluded:[...exclusions]};
await fs.writeFile(root+'/ARTIFACT_INTEGRITY.json',JSON.stringify(receipt,null,2));
console.log(JSON.stringify(receipt));
