import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
const root='docs/qa/inventory/HN-INVENTORY-32REF-001', files=[], missing=[];
async function walk(dir){for(const e of await fs.readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())await walk(p);else if(e.name!=='ARTIFACT_MANIFEST.json'){
 const buffer=await fs.readFile(p);files.push({path:path.relative(root,p).split(path.sep).join('/'),bytes:buffer.length,sha256:crypto.createHash('sha256').update(buffer).digest('hex')});
 if(e.name.endsWith('.md'))for(const m of buffer.toString('utf8').matchAll(/\]\(([^)]+)\)/g)){let ref=m[1];if(/^(https?:|[A-Z]:|#)/i.test(ref))continue;ref=ref.split('#')[0];if(!ref)continue;await fs.access(path.resolve(path.dirname(p),decodeURI(ref))).catch(()=>missing.push({file:p,ref}));}
}}}
await walk(root);files.sort((a,b)=>a.path.localeCompare(b.path));
const capture=JSON.parse(await fs.readFile(root+'/visual/final-build-3f8cf44/capture.json'));
await fs.writeFile(root+'/ARTIFACT_MANIFEST.json',JSON.stringify({task:'HN-INVENTORY-32REF-001',testedSource:capture.provenance.baseSha,authoritativeCapture:'visual/final-build-3f8cf44',files,missingLocalMarkdownLinks:missing},null,2));
console.log(JSON.stringify({files:files.length,bytes:files.reduce((n,f)=>n+f.bytes,0),missingLocalMarkdownLinks:missing},null,2));
if(missing.length)process.exitCode=1;
