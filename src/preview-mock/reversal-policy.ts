import type { BusinessHandler, BusinessRecord } from './business-repository';
import type { DependentRecordWrite } from './business-atomic';
import type { BoxData, OperationalScope, OperationalSurface, PartsIssueData, PhysicalData, ReversalData, StockEventData } from '../contracts/operational-preview';
import { assertScope, opData, opFail, opFields, opMeta, opPositive, opText, operationalHandler, scoped, unpackOperational, type OperationContext, type OperationPlanner } from './operational-policy';
import { partsIssue, stockQuantity } from './parts-policy';
import { sha256Bytes } from './operational-hash';
export const EVIDENCE_MAX_BYTES=1048576;
export const EVIDENCE_MEDIA_TYPES=['image/png','image/jpeg','application/pdf','text/plain'] as const;
function original(c:OperationContext,id:unknown,scope:OperationalScope,exceptId?:string){
  const record=c.records.find(r=>r.id===id&&r.kind==='parts-issue'&&scoped(r,scope)),data=partsIssue(record,scope);
  if(data.status!=='POSTED'||data.purpose!=='WARRANTY'||!data.lines.length||data.postedEventIds.length!==data.lines.length)return opFail('REVERSAL_TYPE_NOT_ALLOWED');
  if(c.records.some(r=>r.kind==='reversal'&&r.id!==exceptId&&scoped(r,scope)&&opData<ReversalData>(r).originalIssueId===id&&opData<ReversalData>(r).status!=='CANCELLED'))return opFail('REVERSAL_ALREADY_EXISTS');
  const events=data.postedEventIds.map(id=>{const r=c.records.find(r=>r.id===id&&r.kind==='stock-event'&&scoped(r,scope));if(!r)return opFail('ORIGINAL_EVENT_REQUIRED');const e=opData<StockEventData>(r),line=data.lines.find(l=>l.id===e.sourceLineId);if(!line||e.eventType!=='PARTS_ISSUE_POST'||e.documentId!==record!.id||e.signedQuantity!==-line.quantity||e.skuId!==line.skuId||e.unit!==line.unit||e.boxId!==line.boxId||JSON.stringify(e.physicalIds)!==JSON.stringify(line.physicalIds)||e.originalEventId!==null)return opFail('ORIGINAL_EVENT_CHANGED');return r;});
  for(const line of data.lines){const id=line.boxId??line.physicalIds[0],r=c.records.find(r=>r.id===id&&scoped(r,scope)&&r.kind===(line.boxId?'box':'physical'));if(!r)return opFail('PHYSICAL_UNAVAILABLE');const p=opData<PhysicalData|BoxData>(r);
    if(line.boxId){if(!(p as BoxData).posted||p.status!=='IN_STOCK'||(p as BoxData).contentRevision!==Number(line.contentRevision)+1)return opFail('INTERVENING_CONSUMPTION');}
    else if(p.status!=='ISSUED'||p.issuedDocumentId!==record!.id||r.version!==line.observedVersion+1)return opFail('INTERVENING_CONSUMPTION');
    if(p.skuId!==line.skuId||p.unit!==line.unit)return opFail('ORIGINAL_EVENT_CHANGED');
  }return{record:record!,data,events};
}
const create:OperationPlanner=(raw,_current,c)=>{
  const{scope,input}=unpackOperational(raw);assertScope(c.records,scope);const p=opFields(input,['originalIssueId','observedIssueVersion','returnedUnused','reasonText']);
  if(p.returnedUnused!==true)return opFail('UNUSED_RETURN_REQUIRED');const issue=original(c,p.originalIssueId,scope);if(issue.record.version!==opPositive(p.observedIssueVersion))return opFail('STALE_ISSUE_VERSION');
  const data:ReversalData={...opMeta(issue.data,c.committedAt,c.actorKey),code:'PV-REV-'+c.entityId.slice('reversal:'.length),originalIssueId:issue.record.id,originalIssueVersion:issue.record.version,originalEventIds:issue.data.postedEventIds,originalLineIds:issue.data.lines.map(l=>l.id),status:'DRAFT',physicalReturn:'PENDING',returnedUnused:true,evidenceRefs:[],reasonText:opText(p.reasonText,1,500),postedCompensationEventIds:[],cancelReason:null};return{data,writes:[]};
};
function reversal(current:Readonly<BusinessRecord>|undefined,scope:OperationalScope){if(!current||current.kind!=='reversal'||!scoped(current,scope))return opFail('REVERSAL_NOT_FOUND',404);const d=opData<ReversalData>(current);if(d.status!=='DRAFT')return opFail('REVERSAL_IMMUTABLE');return d;}
function validateEvidence(c:OperationContext,d:ReversalData,id:string){
  const r=c.records.find(r=>r.id===id&&r.kind==='evidence-attachment'&&scoped(r,d));if(!r)return opFail('EVIDENCE_REQUIRED');
  const e=opData<{reversalId:string;bytes:number[];byteLength:number;sha256:string;attachmentRef:string;mediaType:string;label:string}>(r);
  if(e.reversalId!==c.entityId||e.attachmentRef!==r.id||!Array.isArray(e.bytes)||e.bytes.length!==e.byteLength||!e.byteLength||e.byteLength>EVIDENCE_MAX_BYTES||e.bytes.some(b=>!Number.isInteger(b)||b<0||b>255)||sha256Bytes(Uint8Array.from(e.bytes))!==e.sha256)return opFail('EVIDENCE_INVALID');
}
const attach:OperationPlanner=(raw,current,c)=>{
  const{scope,input}=unpackOperational(raw);assertScope(c.records,scope);const p=opFields(input,['label','mediaType','bytes']),d=reversal(current,scope);
  if(!EVIDENCE_MEDIA_TYPES.includes(p.mediaType as any)||!Array.isArray(p.bytes)||!p.bytes.length||p.bytes.length>EVIDENCE_MAX_BYTES||p.bytes.some(b=>!Number.isInteger(b)||b<0||b>255))return opFail('EVIDENCE_INVALID',422);
  const bytes=p.bytes as number[],sha256=sha256Bytes(Uint8Array.from(bytes)),id='evidence:'+c.commandId,label=opText(p.label,1,200);
  if(d.evidenceRefs.some(ref=>opData<{sha256:string}>(c.records.find(r=>r.id===ref)!).sha256===sha256))return opFail('EVIDENCE_ALREADY_ATTACHED');
  return{data:{...d,evidenceRefs:[...d.evidenceRefs,id],updatedAt:c.committedAt,updatedBy:c.actorKey},writes:[{id,kind:'evidence-attachment',expectedVersion:null,data:{...opMeta(d,c.committedAt,c.actorKey),reversalId:current!.id,label,sha256,mediaType:p.mediaType,byteLength:bytes.length,attachmentRef:id,bytes}}]};
};
const confirm:OperationPlanner=(raw,current,c)=>{
  const{scope,input}=unpackOperational(raw);assertScope(c.records,scope);const p=opFields(input,['confirmed']),d=reversal(current,scope);if(p.confirmed!==true)return opFail('RETURN_CONFIRMATION_REQUIRED');if(d.physicalReturn!=='PENDING')return opFail('RETURN_ALREADY_CONFIRMED');
  original(c,d.originalIssueId,scope,current!.id);if(!d.evidenceRefs.length)return opFail('EVIDENCE_REQUIRED');d.evidenceRefs.forEach(id=>validateEvidence(c,d,id));
  return{data:{...d,physicalReturn:'CONFIRMED',updatedAt:c.committedAt,updatedBy:c.actorKey},writes:[]};
};
const cancel:OperationPlanner=(raw,current,c)=>{const{scope,input}=unpackOperational(raw);assertScope(c.records,scope);const p=opFields(input,['reason']),d=reversal(current,scope);return{data:{...d,status:'CANCELLED',cancelReason:opText(p.reason,1,500),updatedAt:c.committedAt,updatedBy:c.actorKey},writes:[]};};
const post:OperationPlanner=(raw,current,c)=>{
  const{scope,input}=unpackOperational(raw);assertScope(c.records,scope);const p=opFields(input,['reversalId']),d=reversal(current,scope);if(p.reversalId!==current!.id||d.returnedUnused!==true||d.physicalReturn!=='CONFIRMED')return opFail('PHYSICAL_RETURN_REQUIRED');
  if(!d.evidenceRefs.length)return opFail('EVIDENCE_REQUIRED');d.evidenceRefs.forEach(id=>validateEvidence(c,d,id));const issue=original(c,d.originalIssueId,scope,current!.id);
  if(issue.record.version!==d.originalIssueVersion||JSON.stringify(issue.data.postedEventIds)!==JSON.stringify(d.originalEventIds)||JSON.stringify(issue.data.lines.map(l=>l.id))!==JSON.stringify(d.originalLineIds))return opFail('ORIGINAL_EVENT_CHANGED');
  const writes:DependentRecordWrite[]=[],ids:string[]=[],totals=new Map<string,number>();
  for(const originalEvent of issue.events){const e=opData<StockEventData>(originalEvent),line=issue.data.lines.find(l=>l.id===e.sourceLineId)!,physical=c.records.find(r=>r.id===(line.boxId??line.physicalIds[0]))!,pd=opData<PhysicalData|BoxData>(physical);
    const key=JSON.stringify([e.skuId,e.unit]),quantity=(totals.get(key)??stockQuantity(c,d,x=>x.skuId===e.skuId&&x.unit===e.unit))+line.quantity;if(!Number.isSafeInteger(quantity))return opFail('QUANTITY_OVERFLOW');totals.set(key,quantity);
    if(line.boxId&&(!Number.isSafeInteger((pd as BoxData).contentRevision+1)||!Number.isSafeInteger(stockQuantity(c,d,x=>x.boxId===line.boxId)+line.quantity)))return opFail('QUANTITY_OVERFLOW');
    writes.push({id:physical.id,kind:physical.kind,expectedVersion:physical.version,data:{...pd,...(line.boxId?{contentRevision:(pd as BoxData).contentRevision+1}:{status:'IN_STOCK',issuedDocumentId:null}),updatedAt:c.committedAt,updatedBy:c.actorKey}});
    const id=(c.preparedPrimary as ReversalData|undefined)?.postedCompensationEventIds[ids.length]??'stock-event:'+crypto.randomUUID();ids.push(id);const event:StockEventData={...opMeta(d,c.committedAt,c.actorKey),eventType:'REVERSAL_POST',documentId:current!.id,sourceLineId:line.id,skuId:line.skuId,unit:line.unit,signedQuantity:line.quantity,physicalIds:line.physicalIds,boxId:line.boxId,originalEventId:originalEvent.id,commandId:c.commandId,actor:c.actorKey,committedAt:c.committedAt,commitSnapshotId:c.commitSnapshotId};writes.push({id,kind:'stock-event',expectedVersion:null,data:event});
  }return{data:{...d,status:'POSTED',postedCompensationEventIds:ids,updatedAt:c.committedAt,updatedBy:c.actorKey},writes};
};
export function reversalHandlers(surface:OperationalSurface):Record<string,BusinessHandler>{return surface==='WEB'?{
  'reversal.create':operationalHandler('create','reversal','reversal:',create,surface),'reversal.attach-evidence':operationalHandler('update','reversal','reversal:',attach,surface),'reversal.confirm-return':operationalHandler('update','reversal','reversal:',confirm,surface),'reversal.cancel':operationalHandler('update','reversal','reversal:',cancel,surface),'reversal.post':operationalHandler('update','reversal','reversal:',post,surface),
}:{};}
