import type { AxiosInstance } from 'axios';
import { apiClient } from '../data/http/api-client';
import { createCatalogCreateAdapter } from '../data/http/catalog-create-adapter';
import { createOperationalQaAdapter, createOperationalWebAdapter, hasOperationalCommitProof } from '../data/http/operational-preview-adapter';
import { readBrowserPreviewRuntime } from './browser-runtime';
import { CATALOG_COMMANDS, type CatalogDomain, type CatalogPayloads } from '../contracts/catalog-create';
import type { OperationalCommand } from '../contracts/operational-preview';

const codes=['PUBLIC-DEMO-PRODUCT-A','PUBLIC-DEMO-PRODUCT-B','PUBLIC-DEMO-SKU-A','PUBLIC-DEMO-SKU-B','PUBLIC-DEMO-RECIPIENT'];
const fail=()=>{throw new Error('Chưa thể xác minh dữ liệu Demo. Bấm thử lại để tiếp tục từ dữ liệu đã lưu.');};
/** Dedicated public Candidate only. All writes use the existing validated commands.
 * No existing scenario is archived, reset or replaced by this onboarding. */
export function createPublicDemoSetup(client:AxiosInstance=apiClient){
 const qa=createOperationalQaAdapter(client,{available:true,scope:'public-demo-initial-setup'});
 const web=createOperationalWebAdapter(client,{available:true,scope:'public-demo-initial-setup'});
 const app04=readBrowserPreviewRuntime()?.appEventAdapters?.P04;
 const app05=readBrowserPreviewRuntime()?.appEventAdapters?.P05;
 // Keep the operational web preview focused on the receipt worklist. The App
 // event fixture is only needed when an explicit App preview route is opened;
 // running it during S12 onboarding would immediately move the reference
 // receipts out of the draft state shown by the public worklist.
 const appFlowEnabled=typeof window!=='undefined' && /^#\/app\//.test(window.location.hash);
 const catalogReader=createCatalogCreateAdapter('sku',client,{available:true});
 async function ready(){
  const s=await web.read(); if(!s.scenario)return false;
  const c=await catalogReader.readSnapshot();
  const ours=c.skus.filter(k=>['PUBLIC-DEMO-SKU-A','PUBLIC-DEMO-SKU-B'].includes(k.code)&&s.scenario!.data.selectedSkuIds.includes(k.id));
  const receiptsReady=['PN-0012','PN-0011','PN-0010'].every(code=>s.receipts.some(r=>r.data.code===code));
  if(!ours.every(k=>s.profiles.some(p=>p.data.skuId===k.id)) || !receiptsReady)return false;
  return !appFlowEnabled || !app04 || !app05 || (['PN-0012','PN-0011','PN-0010'].every(code=>s.receipts.some(r=>r.data.code===code&&r.data.status==='POSTED')) && s.boxes.some(b=>b.data.physicalCode==='PUBLIC-DEMO-BOX-0010'&&b.data.status==='IN_STOCK') && s.outbounds.some(o=>o.data.status==='POSTED'));
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
 async function operation(adapter:NonNullable<typeof app04>|NonNullable<typeof app05>|typeof web,command:OperationalCommand['command'],payload:OperationalCommand['payload']){
  if(!adapter)return fail();
  const s=await adapter.read();
  const request:OperationalCommand={commandId:crypto.randomUUID(),epoch:s.epoch,scenarioId:s.token.scenarioId,generation:s.token.generation,command,payload};
  const outcome=await adapter.execute(request);
  if(!hasOperationalCommitProof(await adapter.read(),request,outcome))return fail();
  await adapter.recovery.acknowledge(request.commandId);
 }
 async function updateOperation(adapter:NonNullable<typeof app04>|NonNullable<typeof app05>|typeof web,command:OperationalCommand['command'],entityId:string,expectedVersion:number,payload:OperationalCommand['payload']){
  if(!adapter)return fail();
  const s=await adapter.read();
  const request:OperationalCommand={commandId:crypto.randomUUID(),epoch:s.epoch,scenarioId:s.token.scenarioId,generation:s.token.generation,command,entityId,expectedVersion,payload};
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
  s=await web.read();
  const demoReceipts=[
   {previewCode:'PN-0012',mode:'PRODUCT' as const,sourceText:'Nhà cung cấp An Phát',referenceText:'NCC-1025-01'},
   {previewCode:'PN-0011',mode:'PRODUCT' as const,sourceText:'Kho trung chuyển',referenceText:'DC-1025-02'},
   {previewCode:'PN-0010',mode:'COMPONENT' as const,sourceText:'Nhà cung cấp Minh Long',referenceText:'NCC-1025-03'},
  ];
  for(const receipt of demoReceipts){
   s=await web.read();
   if(s.receipts.some(row=>row.data.code===receipt.previewCode))continue;
   await operation(web,'inbound.create',receipt);
  }
  // Optional App-backed flow is isolated to the explicit app-preview fixture.
  if(appFlowEnabled && app04 && app05){
  // Complete the demo inbound flow so S11/S13/S15 can render real boxes and stock.
  const inboundPlans=[
   {code:'PN-0012',skuCode:'PUBLIC-DEMO-SKU-A',physicalCode:'PUBLIC-DEMO-SERIAL-0012'},
   {code:'PN-0011',skuCode:'PUBLIC-DEMO-SKU-A',physicalCode:'PUBLIC-DEMO-SERIAL-0011'},
   {code:'PN-0010',skuCode:'PUBLIC-DEMO-SKU-B',physicalCode:'PUBLIC-DEMO-BOX-0010',quantity:12},
  ] as const;
  for(const plan of inboundPlans){
   s=await web.read();
   const receipt=s.receipts.find(r=>r.data.code===plan.code); if(!receipt)continue;
   const sku=c.skus.find(k=>k.code===plan.skuCode); if(!sku)continue;
   const product=c.products.find(p=>p.id===sku.productId); const profile=s.profiles.find(p=>p.data.skuId===sku.id); if(!product||!profile)continue;
   if(receipt.data.status==='DRAFT')await updateOperation(app04!,'inbound.scan',receipt.id,receipt.version,{receiptId:receipt.id,clientScanId:crypto.randomUUID(),skuId:sku.id,tracking:profile.data.tracking,physicalCode:plan.physicalCode,...('quantity' in plan?{quantity:plan.quantity}:{})});
   s=await web.read();
   const current=s.receipts.find(r=>r.id===receipt.id); if(!current)continue;
   if(current.data.status==='SCANNING')await updateOperation(app04!,'inbound.submit',current.id,current.version,{receiptId:current.id});
   s=await web.read();
   const submitted=s.receipts.find(r=>r.id===receipt.id); if(submitted?.data.status==='SUBMITTED')await updateOperation(web,'inbound.post',submitted.id,submitted.version,{receiptId:submitted.id});
  }
  // Seed one valid outbound request against the serial demo unit for S15/S19.
  s=await web.read();
  const recipient=c.recipients.find(r=>r.code==='PUBLIC-DEMO-RECIPIENT');
  const skuA=c.skus.find(k=>k.code==='PUBLIC-DEMO-SKU-A');
  const productA=skuA&&c.products.find(p=>p.id===skuA.productId);
  let outbound=s.outbounds.find(o=>o.data.requestedLines.some(line=>line.skuId===skuA?.id));
  if(!outbound&&recipient&&skuA&&productA) {
   await operation(app05!,'outbound.create',{recipientId:recipient.id,observedRecipientVersion:recipient.version,requestedLines:[{skuId:skuA.id,quantity:1,observedSkuVersion:skuA.version,observedProductVersion:productA.version}]});
   s=await web.read(); outbound=s.outbounds.find(o=>o.data.requestedLines.some(line=>line.skuId===skuA.id));
  }
  if(outbound){
   if(outbound.data.status==='DRAFT')await updateOperation(app05!,'outbound.scan',outbound.id,outbound.version,{outboundId:outbound.id,clientScanId:crypto.randomUUID(),physicalCode:'PUBLIC-DEMO-SERIAL-0012'});
   s=await web.read(); outbound=s.outbounds.find(o=>o.id===outbound!.id);
   if(outbound?.data.status==='SCANNING')await updateOperation(app05!,'outbound.submit',outbound.id,outbound.version,{outboundId:outbound.id});
   s=await web.read(); outbound=s.outbounds.find(o=>o.id===outbound!.id);
   if(outbound?.data.status==='SUBMITTED')await updateOperation(web,'outbound.receive',outbound.id,outbound.version,{outboundId:outbound.id});
   s=await web.read(); outbound=s.outbounds.find(o=>o.id===outbound!.id);
   if(outbound?.data.status==='READY')await updateOperation(web,'outbound.post',outbound.id,outbound.version,{outboundId:outbound.id});
  }
  }
  if(!await ready())return fail();return web.read();
 }
 return {ready,initialize:()=>typeof navigator!=='undefined'&&navigator.locks?navigator.locks.request('hoa-nam-public-demo-initial-setup',initialize):initialize()};
}
