import type { AxiosInstance } from 'axios';
import { apiClient } from '../data/http/api-client';
import { createCatalogCreateAdapter } from '../data/http/catalog-create-adapter';
import { createOperationalQaAdapter, createOperationalWebAdapter, hasOperationalCommitProof } from '../data/http/operational-preview-adapter';
import { CATALOG_COMMANDS, type CatalogDomain, type CatalogPayloads } from '../contracts/catalog-create';
import type { OperationalCommand } from '../contracts/operational-preview';

const codes=['PUBLIC-DEMO-PRODUCT-A','PUBLIC-DEMO-PRODUCT-B','PUBLIC-DEMO-SKU-A','PUBLIC-DEMO-SKU-B','PUBLIC-DEMO-RECIPIENT'];
const fail=()=>{throw new Error('Chưa thể xác minh dữ liệu Demo. Bấm thử lại để tiếp tục từ dữ liệu đã lưu.');};
/** Dedicated public Candidate only. All writes use the existing validated commands.
 * No existing scenario is archived, reset or replaced by this onboarding. */
export function createPublicDemoSetup(client:AxiosInstance=apiClient){
 const qa=createOperationalQaAdapter(client,{available:true,scope:'public-demo-initial-setup'});
 const web=createOperationalWebAdapter(client,{available:true,scope:'public-demo-initial-setup'});
 const catalogReader=createCatalogCreateAdapter('sku',client,{available:true});
 async function ready(){
  const s=await web.read(); if(!s.scenario)return false;
  const c=await catalogReader.readSnapshot();
  const ours=c.skus.filter(k=>['PUBLIC-DEMO-SKU-A','PUBLIC-DEMO-SKU-B'].includes(k.code)&&s.scenario!.data.selectedSkuIds.includes(k.id));
  return ours.every(k=>s.profiles.some(p=>p.data.skuId===k.id));
 }
 async function ensureCatalog<D extends CatalogDomain>(domain:D,payload:CatalogPayloads[D]){
  const adapter=createCatalogCreateAdapter(domain,client,{available:true});
  let recovered=await adapter.recovery.restore();
  if(recovered.kind==='blocked')return fail();
  if(recovered.kind==='pending'||recovered.kind==='committed'){
   if(!codes.includes(recovered.request.payload.code))return fail();
   if(recovered.kind==='pending')recovered=await adapter.recovery.retry();
   if(recovered.kind!=='committed')return fail();
   const committed=recovered;
   const c=await adapter.readSnapshot(), rows=[...c.products,...c.skus,...c.recipients];
   if(!rows.some(r=>r.id===committed.outcome.receipt.entityId&&r.code===committed.request.payload.code))return fail();
   await adapter.recovery.acknowledge(recovered.request.commandId);
  }
  let c=await adapter.readSnapshot();
  const rows=domain==='product'?c.products:domain==='sku'?c.skus:c.recipients;
  const found=rows.find(r=>r.code===payload.code); if(found)return found.id;
  const request={commandId:crypto.randomUUID(),epoch:c.epoch,command:CATALOG_COMMANDS[domain],payload};
  const outcome=await adapter.execute(request); c=await adapter.readSnapshot();
  const row=[...c.products,...c.skus,...c.recipients].find(r=>r.id===outcome.receipt.entityId&&r.code===payload.code);
  if(!row)return fail();await adapter.recovery.acknowledge(request.commandId);return row.id;
 }
 async function recover(adapter:typeof web){
  let r=await adapter.recovery.restore();if(r.kind==='empty')return;
  if(r.kind==='pending')r=await adapter.recovery.retry();
  if(r.kind!=='committed')return fail();
  if(!hasOperationalCommitProof(await adapter.read(),r.request,r.outcome))return fail();
  await adapter.recovery.acknowledge(r.request.commandId);
 }
 async function operation(adapter:typeof web,command:OperationalCommand['command'],payload:OperationalCommand['payload']){
  const s=await adapter.read();
  const request:OperationalCommand={commandId:crypto.randomUUID(),epoch:s.epoch,scenarioId:s.token.scenarioId,generation:s.token.generation,command,payload};
  const outcome=await adapter.execute(request);
  if(!hasOperationalCommitProof(await adapter.read(),request,outcome))return fail();
  await adapter.recovery.acknowledge(request.commandId);
 }
 async function initialize(){
  await recover(qa);await recover(web);
  let s=await web.read();
  if(!s.scenario){
   for(const suffix of ['A','B']){
    const productId=await ensureCatalog('product',{code:`PUBLIC-DEMO-PRODUCT-${suffix}`,name:suffix==='A'?'Thiết bị Demo':'Linh kiện Demo',group:suffix==='A'?'Phụ kiện':'Linh kiện điện',unit:'Cái',status:'active'});
    const c=await catalogReader.readSnapshot(),product=c.products.find(p=>p.id===productId)!;
    await ensureCatalog('sku',{code:`PUBLIC-DEMO-SKU-${suffix}`,productId,observedProductVersion:product.version,barcode:null,status:'active'});
   }
   await ensureCatalog('recipient',{code:'PUBLIC-DEMO-RECIPIENT',name:'Nơi nhận Demo',type:'Khách lẻ',market:'Miền Nam',area:'Khu vực Demo',address:'Địa chỉ thử nghiệm',contact:'Liên hệ Demo',phone:'',status:'active'});
   const c=await catalogReader.readSnapshot();
   // Re-read immediately before the first-only scenario command. Existing runs survive.
   s=await web.read();
   if(!s.scenario)await operation(qa,'scenario.reset-own',{confirmed:true,selectedSkuIds:c.skus.filter(k=>['PUBLIC-DEMO-SKU-A','PUBLIC-DEMO-SKU-B'].includes(k.code)).map(k=>k.id)});
  }
  s=await web.read();const c=await catalogReader.readSnapshot();
  for(const k of c.skus.filter(k=>['PUBLIC-DEMO-SKU-A','PUBLIC-DEMO-SKU-B'].includes(k.code)&&s.scenario?.data.selectedSkuIds.includes(k.id))){
   s=await web.read();if(s.profiles.some(p=>p.data.skuId===k.id))continue;
   await operation(web,'stock-profiles.create',{skuId:k.id,tracking:k.code.endsWith('-A')?'PRODUCT_SERIAL':'COMPONENT_BOX',observedSkuVersion:k.version,observedProductVersion:c.products.find(p=>p.id===k.productId)!.version});
  }
  if(!await ready())return fail();return web.read();
 }
 return {ready,initialize:()=>typeof navigator!=='undefined'&&navigator.locks?navigator.locks.request('hoa-nam-public-demo-initial-setup',initialize):initialize()};
}
