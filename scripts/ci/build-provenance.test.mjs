import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createProvenance} from './build-provenance.mjs';
const sha='a'.repeat(40),tree='b'.repeat(40);
test('artifact provenance binds actual checkout and bytes without claiming approval',async t=>{
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'hoa-nam-provenance-'));
  const options={artifactDir:root,candidate:sha,observedSha:sha,sourceTree:tree,dirty:false};
  try {
    await fs.writeFile(path.join(root,'index.html'),'built fixture');
    const original=await createProvenance(options);
    await t.test('local provenance is explicitly unattested',()=>{
      assert.equal(original.sourceCommit,sha);assert.equal(original.sourceTree,tree);
      assert.equal(original.trust,'UNATTESTED_LOCAL');assert.equal(original.assets.length,1);
    });
    await t.test('workflow metadata is not an authenticated attestation',async()=>{
      assert.equal((await createProvenance({...options,workflow:{runId:'fixture'}})).trust,'UNATTESTED_WORKFLOW_METADATA');
    });
    await t.test('stale candidate fails',()=>assert.rejects(()=>createProvenance({...options,candidate:'c'.repeat(40)})));
    await t.test('short candidate fails',()=>assert.rejects(()=>createProvenance({...options,candidate:'aaaaaaa'})));
    await t.test('dirty source fails',()=>assert.rejects(()=>createProvenance({...options,dirty:true})));
    await t.test('unknown cleanliness fails',()=>assert.rejects(()=>createProvenance({...options,dirty:undefined})));
    await t.test('missing tree identity fails',()=>assert.rejects(()=>createProvenance({...options,sourceTree:null})));
    await t.test('changed artifact changes inventory digest',async()=>{
      await fs.writeFile(path.join(root,'index.html'),'changed built fixture');
      assert.notEqual((await createProvenance(options)).inventorySha256,original.inventorySha256);
    });
    await t.test('missing built entry fails',async()=>{
      await fs.rename(path.join(root,'index.html'),path.join(root,'other.html'));
      await assert.rejects(()=>createProvenance(options));
    });
  } finally {
    assert.equal(path.dirname(path.resolve(root)),path.resolve(os.tmpdir()));
    assert.ok(path.basename(root).startsWith('hoa-nam-provenance-'));
    await fs.rm(root,{recursive:true,force:true});
  }
});
