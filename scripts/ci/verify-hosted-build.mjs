import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
const outputDirectory=process.argv[2]??'output/s00-5';
const hosts = [
  ['pages','https://duc-nguyen98.github.io/hoa-nam-wms-preview-v44/'],
  ['site','https://hoa-nam-wms-b17-candidate-20261024.wholetide18.chatgpt.site/'],
];
const results=[];
for (const [name,base] of hosts) {
  const record={name,base,checkedAt:new Date().toISOString(),assets:[]};
  try {
    const response=await fetch(new URL('build-info.json',base),{signal:AbortSignal.timeout(30000)});
    if(!response.ok) throw Error(`build-info HTTP ${response.status}`);
    const info=await response.json();
    Object.assign(record,{sourceCommit:info.sourceCommit,buildId:info.buildId,release:info.release});
    const pending=[...info.assets];
    await Promise.all(Array.from({length:4},async()=>{
      while(pending.length){
        const asset=pending.shift();
        const result={path:asset.path,expected:asset.sha256};
        try {
          if(typeof asset.path!=='string'||asset.path.split('/').includes('..')||/[:\\?#]/.test(asset.path)||asset.path.startsWith('/')) throw Error('unsafe manifest path');
          const r=await fetch(new URL(asset.path,base),{signal:AbortSignal.timeout(30000)});
          result.httpStatus=r.status;
          if(!r.ok) throw Error(`HTTP ${r.status}`);
          const data=Buffer.from(await r.arrayBuffer());
          result.actual=createHash('sha256').update(data).digest('hex');
          result.bytes=data.length;
          result.status=result.actual===asset.sha256&&data.length===asset.bytes?'MATCH':'MISMATCH';
        }catch(error){result.status='BLOCKED';result.error=error.message;}
        record.assets.push(result);
      }
    }));
    record.assets.sort((a,b)=>a.path.localeCompare(b.path));
    record.status=record.assets.length>0&&record.assets.every(a=>a.status==='MATCH')?'MANIFEST_MATCH':'BLOCKED';
  }catch(error){record.status='BLOCKED';record.error=error.message;}
  results.push(record);
}
await fs.mkdir(outputDirectory,{recursive:true});
await fs.writeFile(path.join(outputDirectory,'hosted-build-verification.json'),JSON.stringify(results,null,2));
console.log(JSON.stringify(results.map(({assets,...r})=>({...r,assetCount:assets.length,mismatches:assets.filter(a=>a.status!=='MATCH')})),null,2));
