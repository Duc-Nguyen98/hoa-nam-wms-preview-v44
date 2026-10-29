import {spawnSync,execFileSync} from 'node:child_process';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const run=extra=>spawnSync(process.execPath,['scripts/write-build-info.mjs'],{encoding:'utf8',env:{...process.env,HN_BUILD_SOURCE_SHA:'',...extra}});
const read=()=>JSON.parse(fs.readFileSync('dist/build-info.json','utf8'));
const results=[];
try{
 let r=run({HN_BUILD_SOURCE_SHA:'not-a-sha'});assert.notEqual(r.status,0);assert.match(r.stderr,/full commit SHA/);results.push('invalid explicit source rejected');
 r=run({PATH:'',Path:''});assert.equal(r.status,0,r.stderr);assert.equal(read().sourceCommit,null);assert.equal(read().sourceCommitEvidence,'unverified');results.push('archive without Git or source identity remains unverified');
 r=run({HN_BUILD_SOURCE_SHA:sha});assert.equal(r.status,0,r.stderr);assert.equal(read().sourceCommit,sha);assert.equal(read().sourceCommitEvidence,'build-environment');results.push('explicit archive source identity honored');
 r=run({});assert.equal(r.status,0,r.stderr);assert.equal(read().sourceCommit,sha);assert.equal(read().sourceCommitEvidence,'git-head');assert.notEqual(read().importedSourceCommit,sha);results.push('Git build identity separated from historical import');
 console.log(JSON.stringify({candidate:sha,pass:results.length,fail:0,results},null,2));
}finally{const r=run({});if(r.status!==0)throw Error(r.stderr);}
