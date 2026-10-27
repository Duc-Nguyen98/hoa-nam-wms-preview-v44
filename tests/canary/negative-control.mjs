import fs from 'node:fs';
import path from 'node:path';
import {spawnSync,execFileSync} from 'node:child_process';
const evidence=path.resolve('docs/quality/canary/HN-AUTO-NC-BADGE-001/negative-control');fs.mkdirSync(evidence,{recursive:true});
const fixture=path.resolve('tests/canary/.negative-fixture.test.ts');
if(fs.existsSync(fixture))throw Error('Refusing to replace an existing fixture');
const source=(expected)=>`import test from 'node:test';import assert from 'node:assert/strict';import {notificationBadge} from '../../src/notifications/notification-badge';test('negative control 100 cap',()=>assert.equal(notificationBadge(100),${JSON.stringify(expected)}));`;
const runs=[];
try{
 for(const [phase,expected] of [['negative','100'],['restored','99+']]){
  fs.writeFileSync(fixture,source(expected));const r=spawnSync(process.execPath,['--import','tsx','--test',fixture],{encoding:'utf8'});fs.writeFileSync(path.join(evidence,`${phase}.tap`),r.stdout+r.stderr);runs.push({phase,expected,exitCode:r.status,signal:r.signal});
 }
}finally{fs.rmSync(fixture,{force:true});}
const result={taskId:'HN-AUTO-NC-BADGE-001',runtimeSha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),runs,fixtureRemoved:!fs.existsSync(fixture),pass:runs[0]?.exitCode!==0&&runs[0]?.exitCode!==null&&runs[1]?.exitCode===0};
fs.writeFileSync(path.join(evidence,'result.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));process.exitCode=result.pass?0:1;
