import type { AxiosInstance } from 'axios';
import { apiClient } from '../data/http/api-client';
import { createCatalogCreateAdapter } from '../data/http/catalog-create-adapter';
import { createOperationalQaAdapter, createOperationalWebAdapter, hasOperationalCommitProof } from '../data/http/operational-preview-adapter';
import { readBrowserPreviewRuntime } from './browser-runtime';
import type { PreviewMockRuntime } from './index';
import { createBusinessHttpAdapters } from '../data/http/business-adapters';
import { DEFAULT_DEFECTS_QUERY } from '../contracts/defects';
import { CATALOG_COMMANDS, type CatalogDomain, type CatalogPayloads } from '../contracts/catalog-create';
import type { OperationalCommand, OperationalSnapshot } from '../contracts/operational-preview';

const codes=['PUBLIC-DEMO-PRODUCT-A','PUBLIC-DEMO-PRODUCT-B','PUBLIC-DEMO-SKU-A','PUBLIC-DEMO-SKU-B','PUBLIC-DEMO-RECIPIENT'];
const fail=()=>{throw new Error('Chưa thể xác minh dữ liệu Demo. Bấm thử lại để tiếp tục từ dữ liệu đã lưu.');};
const warrantyMarker='Demo bảo hành: thiết bị không lên nguồn · PUBLIC-DEMO-WARRANTY-0012';
const demoCase=(s:OperationalSnapshot)=>s.warrantyCases.find(row=>row.data.customerReportedIssue===warrantyMarker);
const returnCaseMarker='Demo hoàn trả: kiểm tra với linh kiện dự phòng · PUBLIC-DEMO-RETURN-CASE-0010';
const returnMarker='Demo hoàn trả: nhận lại đủ 2 linh kiện chưa sử dụng · PUBLIC-DEMO-RETURN-0010';
const demoReturnCase=(s:OperationalSnapshot)=>s.warrantyCases.find(row=>row.data.customerReportedIssue===returnCaseMarker);
const demoReturn=(s:OperationalSnapshot)=>{const cas=demoReturnCase(s),issue=cas&&s.partsIssues.find(row=>row.data.caseId===cas.id);return issue&&s.reversals.find(row=>row.data.originalIssueId===issue.id&&row.data.reasonText===returnMarker&&row.data.status!=='CANCELLED');};
/** Dedicated public Candidate only. All writes use the existing validated commands.
 * No existing scenario is archived, reset or replaced by this onboarding. */
export function createPublicDemoSetup(client:AxiosInstance=apiClient,getRuntime:()=>PreviewMockRuntime|undefined=readBrowserPreviewRuntime){
 const qa=createOperationalQaAdapter(client,{available:true,scope:'public-demo-initial-setup'});
 const web=createOperationalWebAdapter(client,{available:true,scope:'public-demo-initial-setup'});
 let app04=getRuntime()?.appEventAdapters?.P04;
 let app05=getRuntime()?.appEventAdapters?.P05;
 let app09=getRuntime()?.appEventAdapters?.P09;
 let app19=getRuntime()?.appEventAdapters?.P19;
 const refreshAppAdapters=()=>{const adapters=getRuntime()?.appEventAdapters;app04=adapters?.P04;app05=adapters?.P05;app09=adapters?.P09;app19=adapters?.P19;};
 const catalogReader=createCatalogCreateAdapter('sku',client,{available:true});
 async function ready(){
  refreshAppAdapters();
  const s=await web.read(); if(!s.scenario)return false;
  // A final post may have committed before its response was lost. Keep the
  // setup gate open until its own journal has verified and acknowledged it.
  if((await web.recovery.restore()).kind!=='empty')return false;
  const c=await catalogReader.readSnapshot();
  const ours=c.skus.filter(k=>['PUBLIC-DEMO-SKU-A','PUBLIC-DEMO-SKU-B'].includes(k.code)&&s.scenario!.data.selectedSkuIds.includes(k.id));
  const receiptsReady=['PN-0012','PN-0011','PN-0010'].every(code=>s.receipts.some(r=>r.data.code===code));
  if(ours.length!==2 || !ours.every(k=>s.profiles.some(p=>p.data.skuId===k.id)) || !receiptsReady)return false;
  if(!app04 || !app05 || !app09 || !app19)return false;
  const warranty=demoCase(s);
  const returned=demoReturn(s);
  return ['PN-0012','PN-0011','PN-0010','PN-0009'].every(code=>s.receipts.some(r=>r.data.code===code&&r.data.status==='POSTED')) && s.boxes.some(b=>b.data.physicalCode==='PUBLIC-DEMO-BOX-0010'&&b.data.status==='IN_STOCK'&&b.data.trayId!==null) && s.boxes.some(b=>b.data.physicalCode==='PUBLIC-DEMO-BOX-0009'&&b.data.status==='IN_STOCK'&&b.data.trayId===null) && s.outbounds.some(o=>o.data.status==='POSTED') && s.putaways.some(p=>p.data.status==='CONFIRMED') && warranty?.data.state==='RETURNED' && s.partsIssues.some(issue=>issue.data.caseId===warranty.id&&issue.data.status==='POSTED') && returned?.data.status==='POSTED' && returned.data.physicalReturn==='CONFIRMED' && returned.data.evidenceRefs.length>0;
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
 async function recover(adapter:NonNullable<typeof app04>|NonNullable<typeof app05>|typeof web){
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
  refreshAppAdapters();
  if(app04)await recover(app04);
  if(app05)await recover(app05);
  if(app09)await recover(app09);
  if(app19)await recover(app19);
  if(!app04||!app05||!app09||!app19)return fail();
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
   {previewCode:'PN-0009',mode:'COMPONENT' as const,sourceText:'Nhà cung cấp Minh Long',referenceText:'NCC-1025-04'},
  ];
  for(const receipt of demoReceipts){
   s=await web.read();
   if(s.receipts.some(row=>row.data.code===receipt.previewCode))continue;
   await operation(web,'inbound.create',receipt);
  }
  {
  // Complete the demo inbound flow so S11/S13/S15 can render real boxes and stock.
  const inboundPlans=[
   {code:'PN-0012',skuCode:'PUBLIC-DEMO-SKU-A',physicalCode:'PUBLIC-DEMO-SERIAL-0012'},
   {code:'PN-0011',skuCode:'PUBLIC-DEMO-SKU-A',physicalCode:'PUBLIC-DEMO-SERIAL-0011'},
   {code:'PN-0010',skuCode:'PUBLIC-DEMO-SKU-B',physicalCode:'PUBLIC-DEMO-BOX-0010',quantity:12},
   {code:'PN-0009',skuCode:'PUBLIC-DEMO-SKU-B',physicalCode:'PUBLIC-DEMO-BOX-0009',quantity:6},
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
  // Put the received BOX into the first demo tray so S11 and S14 share one live record.
  s=await web.read();
  const box=s.boxes.find(b=>b.data.physicalCode==='PUBLIC-DEMO-BOX-0010');
  let putaway=box&&s.putaways.find(p=>p.data.boxId===box.id);
  if(!putaway&&box){
   await operation(web,'putaway.create',{boxId:box.id,observedBoxVersion:box.version});
   s=await web.read(); putaway=s.putaways.find(p=>p.data.boxId===box.id);
  }
  if(putaway?.data.status==='DRAFT')await updateOperation(web,'putaway.confirm',putaway.id,putaway.version,{trayId:'operational-setup:tray:1'});
  }
  // Add this release's warranty example to fresh and existing public sessions.
  // Resume only its marked case; every step is a normal journaled command.
  s=await web.read();
  let warranty=demoCase(s);
  if(!warranty){
   const physical=s.physical.find(row=>row.data.physicalCode==='PUBLIC-DEMO-SERIAL-0012');
   if(!physical||physical.data.status!=='ISSUED')return fail();
   await operation(app09,'warranty.intake',{identityMode:'SERIAL',skuId:physical.data.skuId,physicalId:physical.id,customerReportedIssue:warrantyMarker});
   s=await web.read();warranty=demoCase(s);
  }
  if(!warranty)return fail();
  if(warranty.data.state==='RECEIVED'){
   const defects=await createBusinessHttpAdapters(client).S02.read({...DEFAULT_DEFECTS_QUERY,search:'DF-POWER-01',status:'active'});
   if(defects.kind!=='ready')return fail();
   const row=defects.model.rows.find(item=>item.code==='DF-POWER-01');
   const target=row&&defects.model.commandContext?.records[row.key];
   if(!target)return fail();
   const expectedFinishDate=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(warranty.data.receivedAt));
   await updateOperation(web,'warranty.diagnose',warranty.id,warranty.version,{defectIds:[target.entityId],technicianDiagnosis:'Demo: kiểm tra nguồn, thay 2 linh kiện và chạy thử trước khi trả khách.',expectedFinishDate});
   s=await web.read();warranty=demoCase(s)!;
  }
  if(warranty.data.state==='CHECKING'){
   await updateOperation(web,'warranty.transition',warranty.id,warranty.version,{state:'REPAIRING'});
   s=await web.read();warranty=demoCase(s)!;
  }
  if(warranty.data.state==='REPAIRING'){
   let issue=s.partsIssues.find(row=>row.data.caseId===warranty!.id);
   if(!issue){
    await operation(app19,'parts.create',{caseId:warranty.id,observedCaseVersion:warranty.version});
    s=await web.read();issue=s.partsIssues.find(row=>row.data.caseId===warranty!.id);
   }
   if(!issue)return fail();
   if(issue.data.status==='DRAFT'){
    const box=s.boxes.find(row=>row.data.physicalCode==='PUBLIC-DEMO-BOX-0010');
    if(!box)return fail();
    await updateOperation(app19,'parts.save',issue.id,issue.version,{lines:[{physicalCode:box.data.physicalCode,observedVersion:box.version,quantity:2}]});
    s=await web.read();issue=s.partsIssues.find(row=>row.id===issue!.id)!;
   }
   if(issue.data.status==='SCANNING'){
    await updateOperation(app19,'parts.post',issue.id,issue.version,{issueId:issue.id});
    s=await web.read();issue=s.partsIssues.find(row=>row.id===issue!.id)!;
   }
   if(issue.data.status!=='POSTED')return fail();
   warranty=demoCase(s)!;
   await updateOperation(web,'warranty.transition',warranty.id,warranty.version,{state:'REPAIRED'});
   s=await web.read();warranty=demoCase(s)!;
  }
  if(warranty.data.state==='REPAIRED')await updateOperation(web,'warranty.transition',warranty.id,warranty.version,{state:'RETURNED'});
  // The completed repair used its parts. Use a separate case for unused spares
  // so its return never rewrites the v46 case, issue, or original stock events.
  s=await web.read();let returnCase=demoReturnCase(s);
  if(!returnCase){
   const sku=c.skus.find(row=>row.code==='PUBLIC-DEMO-SKU-A');if(!sku)return fail();
   await operation(app09,'warranty.intake',{identityMode:'TEMP_ONLY',skuId:sku.id,physicalId:null,customerReportedIssue:returnCaseMarker});
   s=await web.read();returnCase=demoReturnCase(s);
  }
  if(!returnCase)return fail();
  if(returnCase.data.state==='RECEIVED'){
   await updateOperation(web,'warranty.diagnose',returnCase.id,returnCase.version,{defectIds:[],technicianDiagnosis:'Demo: cấp 2 linh kiện dự phòng để kiểm tra, chưa sử dụng và hoàn lại đầy đủ.',expectedFinishDate:null});
   s=await web.read();returnCase=demoReturnCase(s)!;
  }
  let returnIssue=s.partsIssues.find(row=>row.data.caseId===returnCase!.id);
  if(!returnIssue){
   await operation(app19,'parts.create',{caseId:returnCase.id,observedCaseVersion:returnCase.version});
   s=await web.read();returnIssue=s.partsIssues.find(row=>row.data.caseId===returnCase!.id);
  }
  if(!returnIssue)return fail();
  if(returnIssue.data.status==='DRAFT'){
   const box=s.boxes.find(row=>row.data.physicalCode==='PUBLIC-DEMO-BOX-0010');if(!box)return fail();
   await updateOperation(app19,'parts.save',returnIssue.id,returnIssue.version,{lines:[{physicalCode:box.data.physicalCode,observedVersion:box.version,quantity:2}]});
   s=await web.read();returnIssue=s.partsIssues.find(row=>row.id===returnIssue!.id)!;
  }
  if(returnIssue.data.status==='SCANNING'){
   await updateOperation(app19,'parts.post',returnIssue.id,returnIssue.version,{issueId:returnIssue.id});
   s=await web.read();returnIssue=s.partsIssues.find(row=>row.id===returnIssue!.id)!;
  }
  if(returnIssue.data.status!=='POSTED')return fail();
  let returned=demoReturn(s);
  if(!returned){
   await operation(web,'reversal.create',{originalIssueId:returnIssue.id,observedIssueVersion:returnIssue.version,returnedUnused:true,reasonText:returnMarker});
   s=await web.read();returned=demoReturn(s);
  }
  if(!returned)return fail();
  if(returned.data.status==='DRAFT'){
   if(!returned.data.evidenceRefs.length){
    const evidence=`BIEN BAN HOAN TRA DEMO\nPhieu cap: ${returnIssue.data.code}\nBOX: PUBLIC-DEMO-BOX-0010\nSo luong: 2 Cai\nXac nhan: nhan lai du 2 linh kien du phong chua su dung.\nDu lieu mo phong trong trinh duyet.`;
    await updateOperation(web,'reversal.attach-evidence',returned.id,returned.version,{label:'bien-ban-hoan-linh-kien-demo.txt',mediaType:'text/plain',bytes:[...new TextEncoder().encode(evidence)]});
    s=await web.read();returned=demoReturn(s)!;
   }
   if(returned.data.physicalReturn==='PENDING'){
    await updateOperation(web,'reversal.confirm-return',returned.id,returned.version,{confirmed:true});
    s=await web.read();returned=demoReturn(s)!;
   }
   await updateOperation(web,'reversal.post',returned.id,returned.version,{reversalId:returned.id});
  }
  if(!await ready())return fail();return web.read();
 }
 return {ready,initialize:()=>typeof navigator!=='undefined'&&navigator.locks?navigator.locks.request('hoa-nam-public-demo-initial-setup',initialize):initialize()};
}
