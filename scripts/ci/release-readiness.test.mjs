import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {evaluateReceipt,requiredGates} from './release-readiness.mjs';

const sha = 'a'.repeat(40);
test('synthetic evidence validation and fail-closed controls', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(),'hoa-nam-ci-gate-'));
  try {
    await fs.writeFile(path.join(root,'evidence.txt'),'synthetic QA fixture');
    const artifact = {path:'evidence.txt',sha256:createHash('sha256').update('synthetic QA fixture').digest('hex')};
    const receipt = {commit:sha,designChanged:false,openP0:0,openP1:0,
      gates:Object.fromEntries(requiredGates.map(name=>[name,{status:'PASS',commit:sha,artifacts:[artifact]}])),
      approvals:Object.fromEntries(['S00#1','S00#3','S00#4'].map(owner=>[owner,{status:'APPROVED',commit:sha,reference:'synthetic fixture only'}]))};
    await t.test('complete fixture is structural evidence only', async()=>assert.equal((await evaluateReceipt(receipt,sha,root)).status,'EVIDENCE_STRUCTURALLY_VALID'));
    const cases = {
      'missing receipt':()=>null,
      'missing gate':r=>{delete r.gates.visual;return r;},
      'not run':r=>{r.gates.criticalE2E.status='NOT_RUN';return r;},
      'stale gate':r=>{r.gates.unit.commit='b'.repeat(40);return r;},
      'stale receipt':r=>{r.commit='b'.repeat(40);return r;},
      'open P1':r=>{r.openP1=1;return r;},
      'missing defect count':r=>{delete r.openP0;return r;},
      'missing orchestrator approval':r=>{delete r.approvals['S00#1'];return r;},
      'design requires guardian':r=>{r.designChanged=true;return r;},
      'tampered artifact':r=>{r.gates.build.artifacts[0].sha256='0'.repeat(64);return r;},
      'path traversal':r=>{r.gates.build.artifacts[0].path='../evidence.txt';return r;},
      'absolute path':r=>{r.gates.build.artifacts[0].path='C:/evidence.txt';return r;},
      'empty artifact list':r=>{r.gates.visual.artifacts=[];return r;},
    };
    for (const [name,mutate] of Object.entries(cases)) await t.test(name,async()=>assert.equal((await evaluateReceipt(mutate(structuredClone(receipt)),sha,root)).status,'BLOCKED'));
    await t.test('abbreviated candidate rejected',async()=>assert.equal((await evaluateReceipt(receipt,'aaaaaaa',root)).status,'BLOCKED'));
    await t.test('CLI cannot treat self-supplied approvals as authenticated',async()=>{
      await fs.mkdir(path.join(root,'docs/release-governance'),{recursive:true});
      await fs.writeFile(path.join(root,'docs/release-governance/release-evidence.json'),JSON.stringify(receipt));
      const run=spawnSync(process.execPath,[fileURLToPath(new URL('./release-readiness.mjs',import.meta.url))],{cwd:root,env:{...process.env,CANDIDATE_SHA:sha},encoding:'utf8'});
      assert.equal(run.status,1);
      const report=JSON.parse(await fs.readFile(path.join(root,'output/ci/release-readiness.json'),'utf8'));
      assert.equal(report.structuralStatus,'EVIDENCE_STRUCTURALLY_VALID');
      assert.equal(report.status,'BLOCKED');
    });
  } finally {
    const resolved = path.resolve(root);
    assert.equal(path.dirname(resolved),path.resolve(os.tmpdir()));
    assert.ok(path.basename(resolved).startsWith('hoa-nam-ci-gate-'));
    await fs.rm(resolved,{recursive:true,force:true});
  }
});
