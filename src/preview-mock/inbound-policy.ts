import type { BusinessHandler, BusinessRecord } from './business-repository';
import { canonicalBusinessJson } from './business-repository';
import type { DependentRecordWrite } from './business-atomic';
import type { BoxData, InboundLineData, OperationalScope, OperationalSurface, PhysicalData, ReceiptData, StockEventData, StockProfileData } from '../contracts/operational-preview';
import { assertScope, opData, opFail, opFields, opMeta, opPositive, opText, operationalHandler, scoped, selectedSku, unpackOperational, type OperationContext, type OperationPlanner } from './operational-policy';
import { sha256Text } from './operational-hash';
import source13 from '../data/fixtures/S13.seed.json';
import source14 from '../data/fixtures/S14.seed.json';
import source26 from '../data/fixtures/S26.seed.json';
import source22 from '../data/fixtures/S22.desktop.json';
/** Literal visible source identities only; no inferred missing historical population. */
export const SOURCE_RESERVED_PHYSICAL_CODES = new Set<string>([
  ...source13.fixture.visibleRows.map(r=>String(r[0])),...source14.fixture.visibleRows.map(r=>String(r[1])),
  ...source26.rows.map(r=>r.serial),...source22.rows.map(r=>r.serial),
]);
function receipt(current:Readonly<BusinessRecord>|undefined,scope:OperationalScope):ReceiptData {
  if(!current||current.kind!=='receipt'||!scoped(current,scope))return opFail('RECEIPT_NOT_FOUND',404);return opData<ReceiptData>(current);
}
function header(input:unknown){const p=opFields(input,['mode','sourceText','referenceText'],['previewCode']);if(!['PRODUCT','COMPONENT'].includes(String(p.mode)))return opFail('VALIDATION_FAILED',422);return{mode:p.mode as 'PRODUCT'|'COMPONENT',sourceText:opText(p.sourceText,1,200),referenceText:opText(p.referenceText,0,200),...(p.previewCode===undefined?{}:{previewCode:opText(p.previewCode,1,40)})};}
const create:OperationPlanner=(raw,_current,c)=>{const {scope,input}=unpackOperational(raw),s=assertScope(c.records,scope),h=header(input);return{data:{...opMeta({scenarioId:s.id,generation:s.data.generation},c.committedAt,c.actorKey),mode:h.mode,sourceText:h.sourceText,referenceText:h.referenceText,code:h.previewCode??'PV-PN-'+c.entityId.slice('receipt:'.length),status:'DRAFT',appSubmissionId:null,submittedVersion:null,submittedHash:null,postedEventIds:[]},writes:[]};};
const update:OperationPlanner=(raw,current,c)=>{const {scope,input}=unpackOperational(raw);assertScope(c.records,scope);const r=receipt(current,scope);if(r.status!=='DRAFT'||c.records.some(x=>x.kind==='inbound-line'&&opData<InboundLineData>(x).receiptId===current!.id))return opFail('RECEIPT_HEADER_LOCKED');return{data:{...r,...header(input),updatedAt:c.committedAt,updatedBy:c.actorKey},writes:[]};};
function linesFor(c:OperationContext,id:string,scope:OperationalScope){return c.records.filter(r=>r.kind==='inbound-line'&&scoped(r,scope)&&opData<InboundLineData>(r).receiptId===id);}
function validateLine(c:OperationContext,line:BusinessRecord,scope:OperationalScope){
  const d=opData<InboundLineData>(line),scenario=assertScope(c.records,scope),{sku,product}=selectedSku(c.records,scenario,d.skuId);
  const profile=c.records.find(r=>r.id===d.profileId&&r.kind==='sku-operational-profile'&&scoped(r,scope));
  if(!profile||profile.version!==d.profileVersion||sku.version!==d.skuVersion||product.version!==d.productVersion||opData<StockProfileData>(profile).tracking!==d.tracking||product.unit!==d.unit)return opFail('STALE_MASTER_VERSION');
  opPositive(d.quantity);
  const ids=d.tracking==='PRODUCT_SERIAL'?d.physicalIds:d.boxId?[d.boxId]:[];
  if(ids.length!==1||d.tracking==='PRODUCT_SERIAL'&&d.quantity!==1)return opFail('INVALID_LINE');
  const item=c.records.find(r=>r.id===ids[0]&&r.kind===(d.tracking==='PRODUCT_SERIAL'?'physical':'box')&&scoped(r,scope));
  if(!item)return opFail('PHYSICAL_UNAVAILABLE');const p=opData<PhysicalData>(item);
  if(p.skuId!==d.skuId||p.sourceReceiptId!==d.receiptId||p.sourceLineId!==line.id||p.status!=='PENDING_RECEIPT'||p.unit!==d.unit)return opFail('PHYSICAL_UNAVAILABLE');
  return item;
}
const scan:OperationPlanner=(raw,current,c)=>{
  const {scope,input}=unpackOperational(raw),scenario=assertScope(c.records,scope),p=opFields(input,['receiptId','clientScanId','skuId','tracking','physicalCode'],['quantity']),r=receipt(current,scope);
  if(p.receiptId!==current!.id||!['DRAFT','SCANNING'].includes(r.status))return opFail('RECEIPT_NOT_SCANNABLE');
  if(typeof p.clientScanId!=='string'||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(p.clientScanId))return opFail('VALIDATION_FAILED',422);
  const {sku,product}=selectedSku(c.records,scenario,p.skuId);
  const profile=c.records.find(x=>x.kind==='sku-operational-profile'&&scoped(x,scope)&&opData<StockProfileData>(x).skuId===sku.id);
  if(!profile)return opFail('PROFILE_REQUIRED');const pd=opData<StockProfileData>(profile);
  if(pd.tracking!==p.tracking||pd.tracking!==(r.mode==='PRODUCT'?'PRODUCT_SERIAL':'COMPONENT_BOX'))return opFail('TRACKING_MISMATCH');
  if(pd.skuVersion!==sku.version||pd.productVersion!==product.version||pd.unit!==product.unit)return opFail('STALE_MASTER_VERSION');
  if(pd.tracking==='PRODUCT_SERIAL'&&Object.hasOwn(p,'quantity'))return opFail('VALIDATION_FAILED',422);
  const quantity=pd.tracking==='PRODUCT_SERIAL'?1:opPositive(p.quantity),code=opText(p.physicalCode,1,200);
  if(SOURCE_RESERVED_PHYSICAL_CODES.has(code)||c.records.some(x=>['physical','box','physical-registry'].includes(x.kind)&&opData<{physicalCode:string}>(x).physicalCode===code))return opFail('PHYSICAL_CODE_EXISTS');
  if(c.records.some(x=>x.kind==='scan-observation'&&opData<{clientScanId:string}>(x).clientScanId===p.clientScanId))return opFail('SCAN_ID_REUSED');
  const meta=opMeta({scenarioId:scenario.id,generation:scenario.data.generation},c.committedAt,c.actorKey),itemId=(pd.tracking==='PRODUCT_SERIAL'?'physical:':'box:')+c.commandId,lineId='inbound-line:'+c.commandId;
  const data:PhysicalData={...meta,physicalCode:code,skuId:sku.id,sourceReceiptId:current!.id,sourceLineId:lineId,unit:product.unit,status:'PENDING_RECEIPT',issuedDocumentId:null};
  const line:InboundLineData={...meta,receiptId:current!.id,skuId:sku.id,tracking:pd.tracking,unit:product.unit,quantity,physicalIds:pd.tracking==='PRODUCT_SERIAL'?[itemId]:[],boxId:pd.tracking==='COMPONENT_BOX'?itemId:null,skuVersion:sku.version,productVersion:product.version,profileId:profile.id,profileVersion:profile.version};
  const writes:DependentRecordWrite[]=[
    {id:itemId,kind:pd.tracking==='PRODUCT_SERIAL'?'physical':'box',expectedVersion:null,data:pd.tracking==='PRODUCT_SERIAL'?data:{...data,posted:false,trayId:null,contentRevision:1}},
    {id:lineId,kind:'inbound-line',expectedVersion:null,data:line},
    {id:'physical-registry:'+c.commandId,kind:'physical-registry',expectedVersion:null,data:{...meta,physicalCode:code,physicalId:itemId,skuId:sku.id,sourceReceiptId:current!.id}},
    {id:'scan-observation:'+c.commandId,kind:'scan-observation',expectedVersion:null,data:{...meta,receiptId:current!.id,scanSessionId:current!.id,clientScanId:p.clientScanId,enteredCode:p.physicalCode,canonicalCode:code,resolvedSkuId:sku.id,physicalId:pd.tracking==='PRODUCT_SERIAL'?itemId:null,boxId:line.boxId,recordedAt:c.committedAt,inputMethod:'MANUAL_PREVIEW',commandId:c.commandId}},
  ];
  return{data:{...r,status:'SCANNING',updatedAt:c.committedAt,updatedBy:c.actorKey},writes};
};
function submissionProof(c:OperationContext,current:Readonly<BusinessRecord>,lines:BusinessRecord[]){
  const r=opData<ReceiptData>(current);
  return {receiptId:current.id,scenarioId:r.scenarioId,generation:r.generation,warehouseId:r.warehouseId,mode:r.mode,sourceText:r.sourceText,referenceText:r.referenceText,
    lines:lines.map(line=>({id:line.id,version:line.version,data:line.data,physical:validateLine(c,line,r)})).sort((a,b)=>a.id.localeCompare(b.id))};
}
const submit:OperationPlanner=(raw,current,c)=>{
  const {scope,input}=unpackOperational(raw);assertScope(c.records,scope);const p=opFields(input,['receiptId']),r=receipt(current,scope);
  if(p.receiptId!==current!.id||r.status!=='SCANNING')return opFail('RECEIPT_NOT_SUBMITTABLE');
  const lines=linesFor(c,current!.id,scope);if(!lines.length)return opFail('EMPTY_RECEIPT');
  const frozen=submissionProof(c,current!,lines),digest=sha256Text(canonicalBusinessJson(frozen)),id='app-submission:'+c.commandId;
  return{data:{...r,status:'SUBMITTED',appSubmissionId:id,submittedVersion:current!.version+1,submittedHash:digest,updatedAt:c.committedAt,updatedBy:c.actorKey},writes:[{id,kind:'app-submission',expectedVersion:null,data:{...opMeta(r,c.committedAt,c.actorKey),receiptId:current!.id,sourceSurface:'APP_P04',frozen,sha256:digest,submittedVersion:current!.version+1,commandId:c.commandId}}]};
};
const post:OperationPlanner=(raw,current,c)=>{
  const {scope,input}=unpackOperational(raw);assertScope(c.records,scope);const p=opFields(input,['receiptId']),r=receipt(current,scope);
  if(p.receiptId!==current!.id||r.status!=='SUBMITTED'||r.submittedVersion!==current!.version)return opFail('RECEIPT_NOT_POSTABLE');
  const submission=c.records.find(x=>x.id===r.appSubmissionId&&x.kind==='app-submission'&&scoped(x,scope));
  if(!submission)return opFail('APP_SUBMISSION_REQUIRED');
  const sd=opData<{receiptId:string;sourceSurface:string;frozen:unknown;sha256:string;submittedVersion:number}>(submission),lines=linesFor(c,current!.id,scope);
  if(!lines.length||sd.receiptId!==current!.id||sd.sourceSurface!=='APP_P04'||sd.submittedVersion!==r.submittedVersion||sd.sha256!==r.submittedHash||sha256Text(canonicalBusinessJson(sd.frozen))!==r.submittedHash||canonicalBusinessJson(submissionProof(c,current!,lines))!==canonicalBusinessJson(sd.frozen))return opFail('SUBMISSION_CHANGED');
  const writes:DependentRecordWrite[]=[],events:string[]=[],totals=new Map<string,number>();
  for(const record of c.records.filter(x=>x.kind==='stock-event'&&scoped(x,scope))){const e=opData<StockEventData>(record),key=canonicalBusinessJson([e.skuId,e.unit]);const total=(totals.get(key)??0)+e.signedQuantity;if(!Number.isSafeInteger(total)||total<0)return opFail('MOCK_STATE_INVALID',503);totals.set(key,total);}
  for(const line of lines){
    const d=opData<InboundLineData>(line),item=validateLine(c,line,scope),itemData=opData<PhysicalData|BoxData>(item),key=canonicalBusinessJson([d.skuId,d.unit]),quantity=(totals.get(key)??0)+d.quantity;
    if(!Number.isSafeInteger(quantity))return opFail('QUANTITY_OVERFLOW');totals.set(key,quantity);
    const eventId='stock-event:'+line.id.slice('inbound-line:'.length);events.push(eventId);
    writes.push({id:item.id,kind:item.kind,expectedVersion:item.version,data:{...itemData,status:'IN_STOCK',updatedAt:c.committedAt,updatedBy:c.actorKey,...(item.kind==='box'?{posted:true,contentRevision:(itemData as BoxData).contentRevision+1}:{})}});
    const event:StockEventData={...opMeta(r,c.committedAt,c.actorKey),eventType:'RECEIPT_POST',documentId:current!.id,sourceLineId:line.id,skuId:d.skuId,unit:d.unit,signedQuantity:d.quantity,physicalIds:d.physicalIds,boxId:d.boxId,originalEventId:null,commandId:c.commandId,actor:c.actorKey,committedAt:c.committedAt,commitSnapshotId:c.commitSnapshotId};
    writes.push({id:eventId,kind:'stock-event',expectedVersion:null,data:event});
  }
  return{data:{...r,status:'POSTED',postedEventIds:events,updatedAt:c.committedAt,updatedBy:c.actorKey},writes};
};
export function inboundHandlers(surface:OperationalSurface):Record<string,BusinessHandler>{
  if(surface==='WEB')return{'inbound.create':operationalHandler('create','receipt','receipt:',create,surface),'inbound.update-header':operationalHandler('update','receipt','receipt:',update,surface),'inbound.post':operationalHandler('update','receipt','receipt:',post,surface)};
  if(surface==='APP_P04')return{'inbound.scan':operationalHandler('update','receipt','receipt:',scan,surface),'inbound.submit':operationalHandler('update','receipt','receipt:',submit,surface)};
  return{};
}
