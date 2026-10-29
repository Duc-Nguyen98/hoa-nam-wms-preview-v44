// Diagnostic registration only. Reference PNGs have no certified viewport/DPR.
// Independent geometry and manual review decide fidelity, never a score threshold.
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {chromium} from '@playwright/test';
const stage=process.env.INVENTORY_VISUAL_STAGE??'after';
const root='docs/qa/inventory-reconciliation/HN-INVENTORY-RECON-FIDELITY-001';
const refRoot='docs/qa/inventory/HN-INVENTORY-32REF-001';
const capture=JSON.parse(await fs.readFile(`${root}/visual/${stage}/capture.json`));
const out=`${root}/visual/${stage}/comparison`;await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});const page=await browser.newPage();const results=[];
try{for(const c of capture.results.filter(c=>c.device!=='Mobile400')){
 const name=(await fs.readdir(`${refRoot}/design/references/${c.device}`)).find(n=>n.startsWith(c.id+'_'));
 const ref=await fs.readFile(`${refRoot}/design/references/${c.device}/${name}`);const full=`${root}/visual/${stage}/${c.id}-${c.device}-full.png`;const actual=await fs.readFile(await fs.access(full).then(()=>full).catch(()=>`${root}/visual/${stage}/${c.id}-${c.device}.png`));
 const rendered=await page.evaluate(async({ref,actual,c})=>{
  const load=src=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src='data:image/png;base64,'+src});
  const [r,a]=await Promise.all([load(ref),load(actual)]),desktop=c.device==='Desktop';const width=desktop?1000:650;
  const referenceCrop={x:desktop?Math.round(r.width*.142):0,y:desktop?60:Math.round(r.height*.05),w:desktop?Math.round(r.width*.858):r.width};
  const actualCrop={x:Math.round(c.geometry.root.x*c.geometry.viewport.dpr),y:Math.round(c.geometry.root.y*c.geometry.viewport.dpr),w:Math.round(c.geometry.root.width*c.geometry.viewport.dpr)};
  const height=Math.ceil(Math.max((r.height-referenceCrop.y)*width/referenceCrop.w,(a.height-actualCrop.y)*width/actualCrop.w));
  const draw=(img,crop)=>{const el=document.createElement('canvas');el.width=width;el.height=height;const g=el.getContext('2d');g.fillStyle='#edf2f7';g.fillRect(0,0,width,height);const scale=width/crop.w;g.drawImage(img,crop.x,crop.y,crop.w,img.height-crop.y,0,0,width,(img.height-crop.y)*scale);return el};
  const rc=draw(r,referenceCrop),ac=draw(a,actualCrop),overlay=document.createElement('canvas'),diff=document.createElement('canvas');overlay.width=diff.width=width;overlay.height=diff.height=height;
  const og=overlay.getContext('2d');og.drawImage(rc,0,0);og.globalAlpha=.5;og.drawImage(ac,0,0);
  const rd=rc.getContext('2d').getImageData(0,0,width,height),ad=ac.getContext('2d').getImageData(0,0,width,height),dg=diff.getContext('2d'),d=dg.createImageData(width,height);let total=0;
  for(let i=0;i<d.data.length;i+=4){for(let j=0;j<3;j++){d.data[i+j]=Math.abs(rd.data[i+j]-ad.data[i+j]);total+=d.data[i+j]}d.data[i+3]=255;}dg.putImageData(d,0,0);
  return {reference:rc.toDataURL(),actual:ac.toDataURL(),overlay:overlay.toDataURL(),diff:diff.toDataURL(),referenceCrop,actualCrop,diagnosticMeanAbsoluteRGB:total/(width*height*3),width,height};
 },{ref:ref.toString('base64'),actual:actual.toString('base64'),c});
 for(const kind of ['reference','actual','overlay','diff'])await fs.writeFile(`${out}/${c.id}-${c.device}-${kind}.png`,Buffer.from(rendered[kind].split(',')[1],'base64'));
 const {reference,actual:aa,overlay,diff,...metadata}=rendered;results.push({id:c.id,device:c.device,originalReference:name,referenceSha256:crypto.createHash('sha256').update(ref).digest('hex'),actualSha256:crypto.createHash('sha256').update(actual).digest('hex'),...metadata});
 console.log(`${c.id}-${c.device}: diagnostic overlay/diff written`);
}await fs.writeFile(out+'/registration.json',JSON.stringify({stage,method:'Content-origin alignment, proportional width normalization; canvas height includes full reference and full-page actual content with no bottom clipping. Fixed-viewport original remains separately available. Locked shell excluded, no data masking, no pixel PASS threshold. Raster profile unverified; diagnostic comparison is not certified pixel equality.',provenance:capture.provenance,results},null,2));}finally{await browser.close();}
