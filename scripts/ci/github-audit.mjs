import {spawnSync} from 'node:child_process';
import fs from 'node:fs/promises';
const r=spawnSync('git',['credential','fill'],{input:'protocol=https\nhost=github.com\nusername=Duc-Nguyen98\n\n',encoding:'utf8',env:{...process.env,GIT_TERMINAL_PROMPT:'0',GCM_INTERACTIVE:'never'}});
if(r.status!==0)throw Error('GitHub credential unavailable');
const c=Object.fromEntries(r.stdout.trim().split(/\r?\n/).map(l=>{const i=l.indexOf('=');return [l.slice(0,i),l.slice(i+1)];}));
const headers={Authorization:'Bearer '+c.password,Accept:'application/vnd.github+json'};
const base='https://api.github.com/repos/Duc-Nguyen98/hoa-nam-wms-preview-v44';
const result={checkedAt:new Date().toISOString(),repository:base,resources:{}};
for(const endpoint of ['', '/branches?per_page=100','/branches/main/protection','/branches/DEV/protection','/rulesets','/pulls?state=open&per_page=100','/actions/workflows','/actions/runs?per_page=6','/actions/runs/40402714433/jobs','/check-runs/121852488876/annotations','/commits/b287d1294f0aa37b1c38c14275ef8c0a279d4fcc/check-runs','/pages','/actions/permissions','/actions/secrets','/environments']){
 const r=await fetch(base+endpoint,{headers,signal:AbortSignal.timeout(20000)});const j=await r.json();
 result.resources[endpoint||'repo']={status:r.status,data:j};
}
await fs.mkdir('output/s00-5',{recursive:true});await fs.writeFile('output/s00-5/github-audit.json',JSON.stringify(result,null,2));
for(const [key,v] of Object.entries(result.resources)){
 let d=v.data;if(key==='repo')d={private:d.private,default_branch:d.default_branch,permissions:d.permissions};
 if(key.includes('runs?'))d=d.workflow_runs?.map(x=>({id:x.id,name:x.name,sha:x.head_sha,branch:x.head_branch,conclusion:x.conclusion,url:x.html_url}));
 if(key.includes('/pulls'))d=d.map?.(x=>({number:x.number,title:x.title,base:x.base.ref,head:x.head.ref,url:x.html_url}));
 if(key.includes('branches?'))d=d.map?.(x=>({name:x.name,sha:x.commit.sha,protected:x.protected}));
 console.log(JSON.stringify({key,status:v.status,data:d}));
}
