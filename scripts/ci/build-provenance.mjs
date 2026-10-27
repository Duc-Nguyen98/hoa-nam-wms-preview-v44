import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';

export async function collectAssets(directory) {
  const assets=[];
  async function walk(dir,relative='') {
    if ((await fs.lstat(dir)).isSymbolicLink()) throw Error('Artifact symlinks are not accepted');
    for (const entry of await fs.readdir(dir,{withFileTypes:true})) {
      const absolute=path.join(dir,entry.name);
      const name=relative ? `${relative}/${entry.name}` : entry.name;
      if(entry.isSymbolicLink()) throw Error('Artifact symlinks are not accepted');
      if(entry.isDirectory()) await walk(absolute,name);
      else if(entry.isFile()) {
        const data=await fs.readFile(absolute);
        assets.push({path:name,sha256:createHash('sha256').update(data).digest('hex'),bytes:data.length});
      } else throw Error('Unsupported artifact entry');
    }
  }
  await walk(directory);
  return assets.sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0);
}

export async function createProvenance({artifactDir,candidate,observedSha,sourceTree,dirty,workflow=null}) {
  if(!/^[a-f0-9]{40}$/.test(candidate??'')||candidate!==observedSha) throw Error('Candidate SHA does not match checkout');
  if(!/^[a-f0-9]{40}$/.test(sourceTree??'')) throw Error('Git source tree identity missing');
  if(dirty!==false) throw Error('Source worktree is dirty or cleanliness is unverified');
  const assets=await collectAssets(artifactDir);
  if(!assets.some(a=>a.path==='index.html')) throw Error('Built entry point missing');
  return {schemaVersion:1,sourceCommit:observedSha,sourceTree,sourceWorktreeClean:true,
    trust:workflow?'UNATTESTED_WORKFLOW_METADATA':'UNATTESTED_LOCAL',workflow,
    inventorySha256:createHash('sha256').update(JSON.stringify(assets)).digest('hex'),assets};
}

async function main() {
  const git=(args)=>{
    const r=spawnSync('git',args,{encoding:'utf8'});
    if(r.status!==0) throw Error('Git identity/cleanliness verification failed');
    return r.stdout.trim();
  };
  const workflow=process.env.GITHUB_ACTIONS==='true'?{
    repository:process.env.GITHUB_REPOSITORY,runId:process.env.GITHUB_RUN_ID,
    attempt:process.env.GITHUB_RUN_ATTEMPT,runnerOS:process.env.RUNNER_OS,
    url:`${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`,
  }:null;
  const result=await createProvenance({artifactDir:path.resolve('dist'),candidate:process.env.CANDIDATE_SHA,
    observedSha:git(['rev-parse','HEAD']),sourceTree:git(['rev-parse','HEAD^{tree}']),
    dirty:git(['status','--porcelain','--untracked-files=normal']).length>0,workflow});
  result.createdAt=new Date().toISOString();
  await fs.mkdir('output/ci',{recursive:true});
  await fs.writeFile('output/ci/build-provenance.json',JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify({sourceCommit:result.sourceCommit,sourceTree:result.sourceTree,trust:result.trust,inventorySha256:result.inventorySha256,assets:result.assets.length}));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href) await main();
