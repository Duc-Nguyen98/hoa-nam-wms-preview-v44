import type { BusinessHandler, BusinessRecord } from './business-repository';
import { canonicalBusinessJson } from './business-repository';
import type { DependentRecordWrite } from './business-atomic';
import type { OperationalScope, OperationalSurface, OutboundData, PhysicalData, StockEventData, StockProfileData } from '../contracts/operational-preview';
import { assertScope, opData, opFail, opFields, opMeta, opText, operationalHandler, scoped, selectedSku, unpackOperational, type OperationContext, type OperationPlanner } from './operational-policy';
import { projectCatalogSnapshot } from './catalog-policy';
import { sha256Text } from './operational-hash';

function document(current:Readonly<BusinessRecord>|undefined,scope:OperationalScope):OutboundData {
  if(!current||current.kind!=='outbound'||!scoped(current,scope))return opFail('OUTBOUND_NOT_FOUND',404);return opData<OutboundData>(current);
}
function masters(c:OperationContext,d:OutboundData){
  const scenario=assertScope(c.records,d),catalog=projectCatalogSnapshot({epoch:'',snapshotRevision:1,records:[...c.records]});
  const recipient=catalog.recipients.find(r=>r.id===d.recipientId&&r.status==='active');
  if(!recipient||recipient.version!==d.recipientVersion)return opFail('STALE_MASTER_VERSION');
  for(const line of d.requestedLines){const {sku,product}=selectedSku(c.records,scenario,line.skuId);
    if(sku.version!==line.skuVersion||product.version!==line.productVersion)return opFail('STALE_MASTER_VERSION');
  }return recipient;
}
function item(c:OperationContext,id:string,d:OutboundData){
  const record=c.records.find(r=>r.id===id&&r.kind==='physical'&&scoped(r,d));
  if(!record)return opFail('PHYSICAL_UNAVAILABLE');const p=opData<PhysicalData>(record);
  if(p.status!=='IN_STOCK'||p.issuedDocumentId!==null)return opFail('PHYSICAL_UNAVAILABLE');
  const profile=c.records.find(r=>r.kind==='sku-operational-profile'&&scoped(r,d)&&opData<StockProfileData>(r).skuId===p.skuId);
  if(!profile||opData<StockProfileData>(profile).tracking!=='PRODUCT_SERIAL'||!d.requestedLines.some(l=>l.skuId===p.skuId))return opFail('TRACKING_MISMATCH');
  const pd=opData<StockProfileData>(profile),line=d.requestedLines.find(l=>l.skuId===p.skuId)!;
  if(pd.unit!==p.unit||pd.skuVersion!==line.skuVersion||pd.productVersion!==line.productVersion)return opFail('STALE_MASTER_VERSION');
  return record;
}
const scan:OperationPlanner=(raw,current,c)=>{
  const {scope,input}=unpackOperational(raw);assertScope(c.records,scope);const p=opFields(input,['outboundId','clientScanId','physicalCode']),d=document(current,scope);
  if(p.outboundId!==current!.id||!['DRAFT','SCANNING'].includes(d.status))return opFail('OUTBOUND_NOT_SCANNABLE');masters(c,d);
  if(typeof p.clientScanId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(p.clientScanId))return opFail('VALIDATION_FAILED',422);
  if(c.records.some(r=>r.kind==='scan-observation'&&opData<{clientScanId:string}>(r).clientScanId===p.clientScanId))return opFail('SCAN_ID_REUSED');
  const code=opText(p.physicalCode,1,200),registry=c.records.find(r=>r.kind==='physical-registry'&&scoped(r,scope)&&opData<{physicalCode:string}>(r).physicalCode===code);
  if(!registry)return opFail('PHYSICAL_UNAVAILABLE');const physical=item(c,opData<{physicalId:string}>(registry).physicalId,d),pd=opData<PhysicalData>(physical);
  if(d.allocatedPhysicalIds.includes(physical.id))return opFail('PHYSICAL_ALREADY_SELECTED');
  const quantity=d.allocatedPhysicalIds.map(id=>item(c,id,d)).filter(r=>opData<PhysicalData>(r).skuId===pd.skuId).length;
  if(quantity>=d.requestedLines.find(l=>l.skuId===pd.skuId)!.quantity)return opFail('REQUESTED_QUANTITY_EXCEEDED');
  return{data:{...d,status:'SCANNING',allocatedPhysicalIds:[...d.allocatedPhysicalIds,physical.id],updatedAt:c.committedAt,updatedBy:c.actorKey},writes:[{
    id:'scan-observation:'+c.commandId,kind:'scan-observation',expectedVersion:null,data:{...opMeta(d,c.committedAt,c.actorKey),outboundId:current!.id,scanSessionId:current!.id,clientScanId:p.clientScanId,enteredCode:p.physicalCode,canonicalCode:code,resolvedSkuId:pd.skuId,physicalId:physical.id,boxId:null,recordedAt:c.committedAt,inputMethod:'MANUAL_PREVIEW',commandId:c.commandId,observedPhysicalVersion:physical.version},
  }]};
};
function proof(c:OperationContext,current:Readonly<BusinessRecord>){
  const d=opData<OutboundData>(current),recipient=masters(c,d),physical=d.allocatedPhysicalIds.map(id=>item(c,id,d));
  if(new Set(d.allocatedPhysicalIds).size!==physical.length)return opFail('DUPLICATE_PHYSICAL');
  for(const line of d.requestedLines)if(physical.filter(r=>opData<PhysicalData>(r).skuId===line.skuId).length!==line.quantity)return opFail('INCOMPLETE_OUTBOUND');
  for(const r of physical){const observation=c.records.find(x=>x.kind==='scan-observation'&&scoped(x,d)&&opData<{outboundId:string;physicalId:string}>(x).outboundId===current.id&&opData<{physicalId:string}>(x).physicalId===r.id);
    if(!observation||opData<{observedPhysicalVersion:number}>(observation).observedPhysicalVersion!==r.version)return opFail('STALE_DEPENDENT_VERSION');}
  return{outboundId:current.id,scenarioId:d.scenarioId,generation:d.generation,warehouseId:d.warehouseId,recipient,requestedLines:d.requestedLines,physical:physical.sort((a,b)=>a.id.localeCompare(b.id))};
}
const submit:OperationPlanner=(raw,current,c)=>{
  const {scope,input}=unpackOperational(raw);assertScope(c.records,scope);const p=opFields(input,['outboundId']),d=document(current,scope);
  if(p.outboundId!==current!.id||d.status!=='SCANNING')return opFail('OUTBOUND_NOT_SUBMITTABLE');
  const frozen=proof(c,current!),digest=sha256Text(canonicalBusinessJson(frozen)),id='app-submission:'+c.commandId;
  return{data:{...d,status:'SUBMITTED',recipientSnapshot:frozen.recipient,submissionId:id,submittedHash:digest,submittedVersion:current!.version+1,updatedAt:c.committedAt,updatedBy:c.actorKey},writes:[{id,kind:'app-submission',expectedVersion:null,data:{...opMeta(d,c.committedAt,c.actorKey),outboundId:current!.id,sourceSurface:'APP_P05',frozen,sha256:digest,submittedVersion:current!.version+1,commandId:c.commandId}}]};
};
function checkSubmission(c:OperationContext,current:Readonly<BusinessRecord>,d:OutboundData){
  const submission=c.records.find(r=>r.id===d.submissionId&&r.kind==='app-submission'&&scoped(r,d));if(!submission)return opFail('APP_SUBMISSION_REQUIRED');
  const s=opData<{outboundId:string;sourceSurface:string;sha256:string;submittedVersion:number;frozen:ReturnType<typeof proof>}>(submission),fresh=proof(c,current);
  if(s.outboundId!==current.id||s.sourceSurface!=='APP_P05'||s.submittedVersion!==d.submittedVersion||s.sha256!==d.submittedHash||sha256Text(canonicalBusinessJson(s.frozen))!==d.submittedHash||canonicalBusinessJson(fresh)!==canonicalBusinessJson(s.frozen)||canonicalBusinessJson(d.recipientSnapshot)!==canonicalBusinessJson(s.frozen.recipient))return opFail('SUBMISSION_CHANGED');return fresh;
}
const receive:OperationPlanner=(raw,current,c)=>{
  const {scope,input}=unpackOperational(raw);assertScope(c.records,scope);const p=opFields(input,['outboundId']),d=document(current,scope);
  if(p.outboundId!==current!.id||d.status!=='SUBMITTED'||current!.version!==d.submittedVersion)return opFail('OUTBOUND_NOT_RECEIVABLE');checkSubmission(c,current!,d);
  return{data:{...d,status:'READY',updatedAt:c.committedAt,updatedBy:c.actorKey},writes:[]};
};
const post:OperationPlanner=(raw,current,c)=>{
  const {scope,input}=unpackOperational(raw);assertScope(c.records,scope);const p=opFields(input,['outboundId']),d=document(current,scope);
  if(p.outboundId!==current!.id||d.status!=='READY'||current!.version!==Number(d.submittedVersion)+1)return opFail('OUTBOUND_NOT_POSTABLE');
  const frozen=checkSubmission(c,current!,d),writes:DependentRecordWrite[]=[],eventIds:string[]=[];
  for(const line of d.requestedLines){
    const physical=frozen.physical.filter(r=>opData<PhysicalData>(r).skuId===line.skuId),unit=opData<PhysicalData>(physical[0]).unit;
    if(physical.some(r=>opData<PhysicalData>(r).unit!==unit))return opFail('UNIT_MISMATCH');
    const balance=c.records.filter(r=>r.kind==='stock-event'&&scoped(r,d)&&opData<StockEventData>(r).skuId===line.skuId&&opData<StockEventData>(r).unit===unit).reduce((sum,r)=>{const n=sum+opData<StockEventData>(r).signedQuantity;if(!Number.isSafeInteger(n))return opFail('QUANTITY_OVERFLOW');return n;},0);
    if(balance<line.quantity)return opFail('INSUFFICIENT_STOCK');
    const id=(c.preparedPrimary as OutboundData|undefined)?.postedEventIds[eventIds.length]??'stock-event:'+crypto.randomUUID();eventIds.push(id);
    const event:StockEventData={...opMeta(d,c.committedAt,c.actorKey),eventType:'OUTBOUND_POST',documentId:current!.id,sourceLineId:line.id,skuId:line.skuId,unit,signedQuantity:-line.quantity,physicalIds:physical.map(r=>r.id),boxId:null,originalEventId:null,commandId:c.commandId,actor:c.actorKey,committedAt:c.committedAt,commitSnapshotId:c.commitSnapshotId};
    writes.push({id,kind:'stock-event',expectedVersion:null,data:event});
    for(const record of physical)writes.push({id:record.id,kind:record.kind,expectedVersion:record.version,data:{...opData<PhysicalData>(record),status:'ISSUED',issuedDocumentId:current!.id,updatedAt:c.committedAt,updatedBy:c.actorKey}});
  }
  return{data:{...d,status:'POSTED',postedEventIds:eventIds,updatedAt:c.committedAt,updatedBy:c.actorKey},writes};
};
export function outboundHandlers(surface:OperationalSurface):Record<string,BusinessHandler>{
  if(surface==='APP_P05')return{'outbound.scan':operationalHandler('update','outbound','outbound:',scan,surface),'outbound.submit':operationalHandler('update','outbound','outbound:',submit,surface)};
  if(surface==='WEB')return{'outbound.receive':operationalHandler('update','outbound','outbound:',receive,surface),'outbound.post':operationalHandler('update','outbound','outbound:',post,surface)};return{};
}
