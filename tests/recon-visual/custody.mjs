import fs from 'node:fs/promises';
import crypto from 'node:crypto';
const root='docs/qa/inventory-reconciliation/HN-INVENTORY-RECON-FIDELITY-001';
const old='docs/qa/inventory/HN-INVENTORY-32REF-001';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const custody=JSON.parse(await fs.readFile(`${root}/design/REFERENCE_CUSTODY.json`));
const before=JSON.parse(await fs.readFile(`${root}/functional/before/capture.json`));
const freeze=JSON.parse(await fs.readFile(`${root}/functional/BEFORE_FREEZE.json`));
const records=[];
for(const ref of custody.references){
 const image=await fs.readFile(ref.sourcePath); const name=`${ref.screen}-${ref.device}`;
 const actual=await fs.readFile(`${root}/functional/before/${name}.png`);
 const captured=before.results.filter(x=>x.id===ref.screen&&x.device===ref.device);
 records.push({id:ref.id,sourcePath:ref.sourcePath,referenceSha256:sha(image),expectedReferenceSha256:ref.manifestSha256,referenceMatch:sha(image)===ref.manifestSha256,dimensions:[image.readUInt32BE(16),image.readUInt32BE(20)],dimensionsMatch:image.readUInt32BE(16)===ref.width&&image.readUInt32BE(20)===ref.height,beforePath:`${root}/functional/before/${name}.png`,beforeSha256:sha(actual),beforeCaptureRecords:captured.length});
}
const receipt={task:'HN-INVENTORY-RECON-FIDELITY-001',method:'Rehash original references against custody manifest; record hash of existing separately-owned BEFORE PNGs. Capture manifest did not include image hashes, so this receipt establishes current file hashes only, not proof of capture-time bytes.',beforeCaptureSha256:sha(await fs.readFile(`${root}/functional/before/capture.json`)),beforeFreezeSha256:sha(await fs.readFile(`${root}/functional/BEFORE_FREEZE.json`)),beforeProvenance:before.provenance,beforeFreeze:freeze,records};
await fs.mkdir(`${root}/visual`,{recursive:true});await fs.writeFile(`${root}/visual/BEFORE_REFERENCE_RECEIPT.json`,JSON.stringify(receipt,null,2));
console.log(JSON.stringify({referenceCount:records.length,matching:records.filter(r=>r.referenceMatch&&r.dimensionsMatch).length,beforeMapped:records.filter(r=>r.beforeCaptureRecords===1).length,uniqueBefore:before.results.length}));
if(records.length!==32||records.some(r=>!r.referenceMatch||!r.dimensionsMatch||r.beforeCaptureRecords!==1))process.exitCode=1;
