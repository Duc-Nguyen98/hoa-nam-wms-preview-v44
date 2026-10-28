import type { BusinessApplyContext, BusinessHandler, BusinessRecord, BusinessSnapshot } from './business-repository';
import { canonicalBusinessJson } from './business-repository';
import type { DependentRecordWrite } from './business-atomic';
import type { OperationalCommand, OperationalCommandName, OperationalMeta, OperationalScope, OperationalSnapshot, OperationalSurface, ScenarioData, StockProfileData, TypedOperationalRecord, ReceiptData, InboundLineData, BoxData, StockEventData, PutawayData } from '../contracts/operational-preview';
import { projectCatalogSnapshot } from './catalog-policy';
import { PreviewHttpError } from './errors';
import { assertInactiveMasterSetupRequest } from './inactive-master-scope';
import { createApprovedTraySeed } from './putaway-approved-seed';
export const OPERATIONAL_ACTOR = 'preview:ducquang';
const approvedTraySetup = createApprovedTraySeed().trays;
export const OPERATIONAL_SURFACES: Readonly<Record<OperationalCommandName, OperationalSurface>> = {
  'qa.product.set-status':'QA', 'qa.sku.set-status':'QA', 'qa.recipient.set-status':'QA',
  'scenario.reset-own':'QA', 'scenario.seed-approved':'QA', 'stock-profiles.create':'WEB', 'inbound.create':'WEB', 'inbound.update-header':'WEB',
  'outbound.create':'APP_P05', 'warranty.intake':'APP_P09', 'warranty.diagnose':'WEB', 'warranty.transition':'WEB',
  'parts.create':'APP_P19','parts.save':'APP_P19','parts.post':'APP_P19',
  'reversal.create':'WEB','reversal.attach-evidence':'WEB','reversal.confirm-return':'WEB','reversal.post':'WEB','reversal.cancel':'WEB',
  'outbound.scan':'APP_P05', 'outbound.submit':'APP_P05', 'outbound.receive':'WEB', 'outbound.post':'WEB',
  'putaway.create':'WEB', 'putaway.confirm':'WEB', 'putaway.cancel':'WEB',
  'inbound.scan':'APP_P04', 'inbound.submit':'APP_P04', 'inbound.post':'WEB',
};
export const opFail = (code: string, status=409): never => { throw new PreviewHttpError(status,code,'Thao tác chưa thể hoàn tất.'); };
export const opObject = (x: unknown): x is Record<string,unknown> => !!x && typeof x==='object' && !Array.isArray(x);
export function opFields(x: unknown, fields: string[], optional: string[]=[]): Record<string,unknown> {
  if(!opObject(x) || Object.keys(x).some(k=>!fields.includes(k)&&!optional.includes(k)) || fields.some(k=>!Object.hasOwn(x,k))) return opFail('VALIDATION_FAILED',422);
  return x;
}
export function opText(x: unknown,min:number,max:number): string {
  if(typeof x!=='string'||/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/u.test(x))return opFail('VALIDATION_FAILED',422);
  const value=x.trim().normalize('NFC');if([...value].length<min||[...value].length>max)return opFail('VALIDATION_FAILED',422);return value;
}
export function opPositive(x:unknown):number {if(!Number.isSafeInteger(x)||Number(x)<1)return opFail('VALIDATION_FAILED',422);return x as number;}
export const opData=<T>(record:BusinessRecord)=>record.data as T;
export function activeScenario(records: readonly BusinessRecord[]): TypedOperationalRecord<ScenarioData>|null {
  const active=records.filter(r=>r.kind==='operational-scenario'&&opData<ScenarioData>(r).ownerActor===OPERATIONAL_ACTOR&&opData<ScenarioData>(r).status==='ACTIVE');
  if(active.length>1)return opFail('MOCK_STATE_INVALID',503);return (active[0] as TypedOperationalRecord<ScenarioData>)??null;
}
export function assertScope(records: readonly BusinessRecord[],scope:OperationalScope):TypedOperationalRecord<ScenarioData> {
  const scenario=activeScenario(records);
  if(!scenario||scenario.id!==scope.scenarioId||scenario.data.generation!==scope.generation)return opFail('STALE_SCENARIO');
  return scenario;
}
export function unpackOperational(input: unknown):{scope:OperationalScope; input:unknown} {
  const p=opFields(input,['scope','input']),s=opFields(p.scope,['scenarioId','generation']);
  if(!(s.scenarioId===null||typeof s.scenarioId==='string')||!Number.isSafeInteger(s.generation)||Number(s.generation)<0)return opFail('VALIDATION_FAILED',422);
  return {scope:s as unknown as OperationalScope,input:p.input};
}
export function opMeta(scope:{scenarioId:string;generation:number},time:string,actor:string):OperationalMeta {
  return {scenarioId:scope.scenarioId,generation:scope.generation,warehouseId:'warehouse-hn-01',createdAt:time,createdBy:actor,updatedAt:time,updatedBy:actor};
}
export function scoped(record:BusinessRecord,scope:OperationalScope):boolean {
  return opObject(record.data)&&record.data.scenarioId===scope.scenarioId&&record.data.generation===scope.generation&&record.data.warehouseId==='warehouse-hn-01';
}
export function selectedSku(records:readonly BusinessRecord[],scenario:TypedOperationalRecord<ScenarioData>,skuId:unknown) {
  if(typeof skuId!=='string'||!scenario.data.selectedSkuIds.includes(skuId))return opFail('SKU_OUTSIDE_SCENARIO');
  const catalog=projectCatalogSnapshot({epoch:'',snapshotRevision:1,records:[...records]});
  const sku=catalog.skus.find(s=>s.id===skuId),product=catalog.products.find(p=>p.id===sku?.productId);
  if(!sku||!product||sku.status!=='active'||product.status!=='active')return opFail('SKU_UNAVAILABLE');return {sku,product};
}
export interface OperationPlan { data: unknown; writes: DependentRecordWrite[] }
export interface OperationContext { records: readonly BusinessRecord[]; entityId:string; committedAt:string; actorKey:string; commandId:string; commitSnapshotId:string; epoch?:string; preparedPrimary?:unknown; committedCommand?: BusinessApplyContext['committedCommand'] }
export type OperationPlanner=(input:unknown,current:Readonly<BusinessRecord>|undefined,context:OperationContext)=>OperationPlan;
/** Policies are evaluated synchronously inside the same canonical persistence transaction. */
export function operationalHandler(operation:'create'|'update',kind:string,prefix:string,plan:OperationPlanner,surface:OperationalSurface):BusinessHandler {
  return {operation,entityKind:kind,idPrefix:prefix,
    apply(input,current,context){if(!context)return opFail('MOCK_COMMAND_FAILED',500);return plan(input,current,{...context,commitSnapshotId:''}).data;},
    dependentWrites(primary,context){
      const current=context.records.find(r=>r.id===primary.id);
      const planned=plan(context.request.payload,current,{...context,epoch:context.request.epoch,entityId:primary.id,commandId:context.request.commandId,preparedPrimary:primary.data});
      if(canonicalBusinessJson(planned.data)!==canonicalBusinessJson(primary.data))return opFail('MOCK_COMMAND_FAILED',500);
      const d=primary.data as OperationalMeta;
      return [...planned.writes,{id:'audit:'+context.request.commandId,kind:'audit-event',expectedVersion:null,data:{...opMeta(d,context.committedAt,context.actorKey),entityId:primary.id,action:context.request.command,previousVersion:current?.version??null,newVersion:primary.version,commandId:context.request.commandId,sourceSurface:surface,actor:context.actorKey,timestamp:context.committedAt,FK:planned.writes.map(w=>w.id),eventIds:planned.writes.filter(w=>w.kind==='stock-event').map(w=>w.id),commitSnapshotId:context.commitSnapshotId}}];
    }};
}
const reset:OperationPlanner=(raw,_current,c)=>{
  const {scope,input}=unpackOperational(raw),p=opFields(input,['confirmed','selectedSkuIds']);
  assertInactiveMasterSetupRequest(c.commandId, scope, p, c.actorKey, c.epoch, c);
  if(p.confirmed!==true||!Array.isArray(p.selectedSkuIds)||!p.selectedSkuIds.length||p.selectedSkuIds.some(x=>typeof x!=='string')||new Set(p.selectedSkuIds).size!==p.selectedSkuIds.length)return opFail('VALIDATION_FAILED',422);
  const old=activeScenario(c.records);
  if(old){assertScope(c.records,scope);}else if(scope.scenarioId!==null||scope.generation!==0)return opFail('STALE_SCENARIO');
  const generation=(old?.data.generation??0)+1;if(!Number.isSafeInteger(generation))return opFail('MOCK_STATE_INVALID',503);
  const catalog=projectCatalogSnapshot({epoch:'',snapshotRevision:1,records:[...c.records]});
  for(const id of p.selectedSkuIds)if(!catalog.skus.some(s=>s.id===id&&s.status==='active'&&catalog.products.some(p=>p.id===s.productId&&p.status==='active')))return opFail('SKU_UNAVAILABLE');
  const data:ScenarioData={...opMeta({scenarioId:c.entityId,generation},c.committedAt,c.actorKey),ownerActor:c.actorKey,status:'ACTIVE',selectedSkuIds:p.selectedSkuIds as string[],setupManifestId:'HN-SIX-FLOWS-v0.1',startedAt:c.committedAt};
  const writes:DependentRecordWrite[]=old?[{id:old.id,kind:old.kind,expectedVersion:old.version,data:{...old.data,status:'ARCHIVED',updatedAt:c.committedAt,updatedBy:c.actorKey}}]:[];
  for(const n of Array.from({ length: 9 }, (_, index) => index + 1))for(const kind of ['location','tray']){
    const id=`operational-setup:${kind}:${n}`;
    const setup={warehouseId:'warehouse-hn-01',active:true,setupManifestId:'HN-SIX-FLOWS-v0.1',code:kind==='tray'?approvedTraySetup[n-1].code:`PREVIEW-${kind.toUpperCase()}-${n}`,...(kind==='tray'?{locationId:`operational-setup:location:${n}`}:{})};
    const existing=c.records.find(r=>r.id===id);
    if(existing){if(existing.kind!=='operational-setup-'+kind||canonicalBusinessJson(existing.data)!==canonicalBusinessJson(setup))return opFail('MOCK_STATE_INVALID',503);}
    else writes.push({id,kind:'operational-setup-'+kind,expectedVersion:null,data:setup});
  }
  return {data,writes};
};
const seedApproved:OperationPlanner=(raw,current,c)=>{
  const {scope,input}=unpackOperational(raw),scenario=assertScope(c.records,scope),p=opFields(input,['confirmed']);
  if(p.confirmed!==true)return opFail('VALIDATION_FAILED',422);
  const manifest=createApprovedTraySeed(c.committedAt),catalog=projectCatalogSnapshot({epoch:'',snapshotRevision:1,records:[...c.records]}),writes:DependentRecordWrite[]=[];
  if(c.records.some(record=>record.id.startsWith('box:approved:')&&scoped(record,scope)))return opFail('APPROVED_SEED_EXISTS',409);
  const approvedSkuIds=[...new Set(manifest.boxes.map(row=>catalog.skus.find(item=>item.code===row.skuCode)?.id).filter((id): id is string=>!!id))];
  if(approvedSkuIds.length!==9)return opFail('SKU_UNAVAILABLE');
  const selectedSkuIds=[...new Set([...scenario.data.selectedSkuIds,...approvedSkuIds])];
  for(const n of Array.from({ length: 9 }, (_, index) => index + 1))for(const kind of ['location','tray']){
    const id=`operational-setup:${kind}:${n}`,setup={warehouseId:'warehouse-hn-01',active:true,setupManifestId:'HN-SIX-FLOWS-v0.1',code:kind==='tray'?approvedTraySetup[n-1].code:`PREVIEW-${kind.toUpperCase()}-${n}`,...(kind==='tray'?{locationId:`operational-setup:location:${n}`}:{})};
    const existing=c.records.find(record=>record.id===id);
    if(existing){if(existing.kind!=='operational-setup-'+kind||canonicalBusinessJson(existing.data)!==canonicalBusinessJson(setup))return opFail('MOCK_STATE_INVALID',503);}
    else writes.push({id,kind:'operational-setup-'+kind,expectedVersion:null,data:setup});
  }
  for(const row of manifest.boxes){
    const sku=catalog.skus.find(item=>item.code===row.skuCode),product=sku&&catalog.products.find(item=>item.id===sku.productId);
    if(!sku||!product||!selectedSkuIds.includes(sku.id))return opFail('SKU_UNAVAILABLE');
    const receiptId=`receipt:approved:${row.receiptCode}`,boxId=`box:approved:${row.code}`,lineId=`inbound-line:approved:${row.code}`,eventId=`stock-event:approved:${row.code}`;
    const meta=opMeta({scenarioId:scenario.id,generation:scenario.data.generation},c.committedAt,c.actorKey),receipt:ReceiptData={...meta,code:row.receiptCode,mode:'COMPONENT',sourceText:'Kho Hoa Nam · dữ liệu duyệt HN_Astra',referenceText:row.receiptCode,status:'POSTED',appSubmissionId:null,submittedVersion:null,submittedHash:null,postedEventIds:[eventId]};
    const line:InboundLineData={...meta,receiptId,skuId:sku.id,tracking:'COMPONENT_BOX',unit:product.unit,quantity:row.quantity,physicalIds:[],boxId,skuVersion:sku.version,productVersion:product.version,profileId:`profile:approved:${row.skuCode}`,profileVersion:1};
    const box:BoxData={...meta,physicalCode:row.code,skuId:sku.id,sourceReceiptId:receiptId,sourceLineId:lineId,unit:product.unit,status:'IN_STOCK',issuedDocumentId:null,posted:true,trayId:row.trayCode?`operational-setup:tray:${Number(row.trayCode.slice(-3))}`:null,contentRevision:2};
    const event:StockEventData={...meta,eventType:'RECEIPT_POST',documentId:receiptId,sourceLineId:lineId,skuId:sku.id,unit:product.unit,signedQuantity:row.quantity,physicalIds:[],boxId,originalEventId:null,commandId:c.commandId,actor:c.actorKey,committedAt:c.committedAt,commitSnapshotId:c.commitSnapshotId};
    writes.push({id:receiptId,kind:'receipt',expectedVersion:null,data:receipt},{id:lineId,kind:'inbound-line',expectedVersion:null,data:line},{id:boxId,kind:'box',expectedVersion:null,data:box},{id:eventId,kind:'stock-event',expectedVersion:null,data:event});
    if(row.status!=='QUEUE'){
      const putawayId=`putaway:approved:${row.code}`,putaway:PutawayData={...meta,boxId,receiptId,capturedBoxVersion:1,capturedContentRevision:2,quantityAtCreate:row.quantity,status:row.status==='CONFIRMED'?'CONFIRMED':'DRAFT',trayId:box.trayId,cancellationReason:null};
      writes.push({id:putawayId,kind:'putaway',expectedVersion:null,data:putaway});
      writes.push({id:`audit:approved:${row.code}`,kind:'audit-event',expectedVersion:null,data:{...meta,entityId:putawayId,action:row.status==='CONFIRMED'?'putaway.confirm':'putaway.create',previousVersion:null,newVersion:1,commandId:c.commandId,sourceSurface:'WEB',actor:c.actorKey,timestamp:c.committedAt,FK:[boxId,receiptId,lineId,eventId],eventIds:[eventId],commitSnapshotId:c.commitSnapshotId}});
    }
  }
  return {data:{...scenario.data,selectedSkuIds,updatedAt:c.committedAt,updatedBy:c.actorKey},writes};
};
const profile:OperationPlanner=(raw,_current,c)=>{
  const {scope,input}=unpackOperational(raw),scenario=assertScope(c.records,scope),p=opFields(input,['skuId','tracking','observedSkuVersion','observedProductVersion']);
  const {sku,product}=selectedSku(c.records,scenario,p.skuId);
  if(!['PRODUCT_SERIAL','COMPONENT_BOX'].includes(String(p.tracking)))return opFail('VALIDATION_FAILED',422);
  if(opPositive(p.observedSkuVersion)!==sku.version||opPositive(p.observedProductVersion)!==product.version)return opFail('STALE_MASTER_VERSION');
  if(c.records.some(r=>r.kind==='sku-operational-profile'&&scoped(r,scope)&&opData<StockProfileData>(r).skuId===sku.id))return opFail('PROFILE_EXISTS');
  return {data:{...opMeta({scenarioId:scenario.id,generation:scenario.data.generation},c.committedAt,c.actorKey),skuId:sku.id,productId:product.id,tracking:p.tracking,unit:product.unit,skuVersion:sku.version,productVersion:product.version},writes:[]};
};
export function foundationHandlers(surface:OperationalSurface):Record<string,BusinessHandler> {
  return surface==='QA'?{'scenario.reset-own':operationalHandler('create','operational-scenario','scenario:',reset,surface),'scenario.seed-approved':operationalHandler('update','operational-scenario','scenario:',seedApproved,surface)}
    :surface==='WEB'?{'stock-profiles.create':operationalHandler('create','sku-operational-profile','profile:',profile,surface)}:{};
}
/** Scope is carried inside the old journal envelope to keep retained pinned readers compatible. */
export function toBusinessOperational(request:OperationalCommand) {
  opFields(request,['commandId','epoch','command','scenarioId','generation','payload'],['entityId','expectedVersion']);
  return {commandId:request.commandId,epoch:request.epoch,command:request.command,...(request.entityId===undefined?{}:{entityId:request.entityId}),...(request.expectedVersion===undefined?{}:{expectedVersion:request.expectedVersion}),payload:{scope:{scenarioId:request.scenarioId,generation:request.generation},input:structuredClone(request.payload)}};
}
export function projectOperational(snapshot:BusinessSnapshot):OperationalSnapshot {
  const scenario=activeScenario(snapshot.records),scope={scenarioId:scenario?.id??null,generation:scenario?.data.generation??0};
  const records=snapshot.records.filter(r=>scoped(r,scope));
  const byKind=(kind:string)=>records.filter(r=>r.kind===kind);
  const events=byKind('stock-event') as OperationalSnapshot['stockEvents'];
  const stock=new Map<string,OperationalSnapshot['stock'][number]>();
  for(const {data:e} of events){
    if(!Number.isSafeInteger(e.signedQuantity))return opFail('MOCK_STATE_INVALID',503);
    const key=canonicalBusinessJson([e.skuId,e.warehouseId,e.unit]);const row=stock.get(key)??{skuId:e.skuId,warehouseId:e.warehouseId,unit:e.unit,quantity:0};
    row.quantity+=e.signedQuantity;if(!Number.isSafeInteger(row.quantity)||row.quantity<0)return opFail('MOCK_STATE_INVALID',503);stock.set(key,row);
  }
  const auditEvents=byKind('audit-event'),snapshotIds=new Set(auditEvents.map(r=>(r.data as {commitSnapshotId:string}).commitSnapshotId));
  const archivedIds=new Set(snapshot.records.filter(r=>r.kind==='operational-scenario'&&opData<ScenarioData>(r).ownerActor===OPERATIONAL_ACTOR&&opData<ScenarioData>(r).status==='ARCHIVED').map(r=>r.id));
  const archivedProofIds=new Set(snapshot.records.filter(r=>r.kind==='audit-event'&&opObject(r.data)&&r.data.actor===OPERATIONAL_ACTOR&&archivedIds.has(String(r.data.scenarioId))).map(r=>(r.data as {commitSnapshotId:string}).commitSnapshotId));
  return {mode:'MOCK',complete:true,actorKey:OPERATIONAL_ACTOR,epoch:snapshot.epoch,snapshotRevision:snapshot.snapshotRevision,token:{epoch:snapshot.epoch,revision:snapshot.snapshotRevision,...scope},scenario,
    profiles:byKind('sku-operational-profile') as OperationalSnapshot['profiles'],receipts:byKind('receipt') as OperationalSnapshot['receipts'],lines:byKind('inbound-line') as OperationalSnapshot['lines'],physical:byKind('physical') as OperationalSnapshot['physical'],boxes:byKind('box') as OperationalSnapshot['boxes'],stockEvents:events,outbounds:byKind('outbound') as OperationalSnapshot['outbounds'],warrantyCases:byKind('warranty-case') as OperationalSnapshot['warrantyCases'],caseEvents:byKind('case-event'),appSubmissions:byKind('app-submission'),scanObservations:byKind('scan-observation'),physicalRegistry:byKind('physical-registry'),partsIssues:byKind('parts-issue') as OperationalSnapshot['partsIssues'],reversals:byKind('reversal') as OperationalSnapshot['reversals'],evidence:byKind('evidence-attachment'),putaways:byKind('putaway') as OperationalSnapshot['putaways'],setupMasters:snapshot.records.filter(r=>['operational-setup-location','operational-setup-tray'].includes(r.kind)),auditEvents,commitSnapshots:snapshot.records.filter(r=>r.kind==='commit-snapshot'&&snapshotIds.has(r.id)),archivedCommitSnapshots:snapshot.records.filter(r=>r.kind==='commit-snapshot'&&archivedProofIds.has(r.id)),stock:[...stock.values()]};
}

