import type { BusinessHandler, BusinessRecord } from './business-repository';
import type { OperationalScope, OperationalSurface, OutboundData, PhysicalData, WarrantyCaseData } from '../contracts/operational-preview';
import { assertScope, opData, opFail, opFields, opMeta, opPositive, operationalHandler, scoped, selectedSku, unpackOperational, type OperationContext, type OperationPlanner } from './operational-policy';
import { projectCatalogSnapshot } from './catalog-policy';
function longText(value:unknown){if(typeof value!=='string'||/[\u0000-\u0009\u000b-\u001f\u007f-\u009f\u2028\u2029]/u.test(value))return opFail('VALIDATION_FAILED',422);const v=value.trim().normalize('NFC');if(!v||[...v].length>2000)return opFail('VALIDATION_FAILED',422);return v;}
function localDate(value:string){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value));}
const outbound:OperationPlanner=(raw,_current,c)=>{
  const {scope,input}=unpackOperational(raw),scenario=assertScope(c.records,scope),p=opFields(input,['recipientId','observedRecipientVersion','requestedLines']);
  const catalog=projectCatalogSnapshot({epoch:'',snapshotRevision:1,records:[...c.records]}),recipient=catalog.recipients.find(r=>r.id===p.recipientId&&r.status==='active');
  if(!recipient)return opFail('RECIPIENT_UNAVAILABLE');if(opPositive(p.observedRecipientVersion)!==recipient.version)return opFail('STALE_MASTER_VERSION');
  if(!Array.isArray(p.requestedLines)||!p.requestedLines.length)return opFail('EMPTY_OUTBOUND');const seen=new Set<string>();
  const prepared=c.preparedPrimary as OutboundData|undefined;
  const requestedLines=p.requestedLines.map((rawLine,index)=>{
    const line=opFields(rawLine,['skuId','quantity','observedSkuVersion','observedProductVersion']),{sku,product}=selectedSku(c.records,scenario,line.skuId);
    if(seen.has(sku.id))return opFail('DUPLICATE_SKU_LINE');seen.add(sku.id);
    if(opPositive(line.observedSkuVersion)!==sku.version||opPositive(line.observedProductVersion)!==product.version)return opFail('STALE_MASTER_VERSION');
    return{id:prepared?.requestedLines[index]?.id??'outbound-line:'+crypto.randomUUID(),skuId:sku.id,quantity:opPositive(line.quantity),skuVersion:sku.version,productVersion:product.version};
  });
  const data:OutboundData={...opMeta({scenarioId:scenario.id,generation:scenario.data.generation},c.committedAt,c.actorKey),code:'PV-PX-'+c.entityId.slice('outbound:'.length),appRequestId:c.commandId,recipientId:recipient.id,recipientVersion:recipient.version,recipientSnapshot:null,requestedLines,allocatedPhysicalIds:[],status:'DRAFT',submissionId:null,submittedHash:null,submittedVersion:null,postedEventIds:[]};return{data,writes:[]};
};
function caseEvent(data:WarrantyCaseData,c:OperationContext){return{id:'case-event:'+c.commandId,kind:'case-event',expectedVersion:null,data:{...opMeta(data,c.committedAt,c.actorKey),caseId:c.entityId,state:data.state,actor:c.actorKey,timestamp:c.committedAt,defectIds:data.defectIds,expectedFinishDate:data.expectedFinishDate,commandId:c.commandId,commitSnapshotId:c.commitSnapshotId}};}
const intake:OperationPlanner=(raw,_current,c)=>{
  const {scope,input}=unpackOperational(raw),scenario=assertScope(c.records,scope),p=opFields(input,['identityMode','skuId','physicalId','customerReportedIssue']),{sku,product}=selectedSku(c.records,scenario,p.skuId);
  if(!['TEMP_ONLY','SERIAL'].includes(String(p.identityMode)))return opFail('VALIDATION_FAILED',422);
  if(p.identityMode==='TEMP_ONLY'&&p.physicalId!==null)return opFail('INVALID_PHYSICAL_REFERENCE');
  if(p.identityMode==='SERIAL'){
    const physical=c.records.find(r=>r.id===p.physicalId&&r.kind==='physical'&&scoped(r,scope));
    if(!physical||opData<PhysicalData>(physical).status!=='ISSUED'||opData<PhysicalData>(physical).skuId!==sku.id)return opFail('ISSUED_PHYSICAL_REQUIRED');
  }
  const data:WarrantyCaseData={...opMeta({scenarioId:scenario.id,generation:scenario.data.generation},c.committedAt,c.actorKey),code:'PV-BH-'+c.entityId.slice('warranty-case:'.length),identityMode:p.identityMode as 'TEMP_ONLY'|'SERIAL',physicalId:p.physicalId as string|null,temporaryIdentity:p.identityMode==='TEMP_ONLY'?'temporary:'+c.commandId:null,skuId:sku.id,productSnapshot:{productId:product.id,productVersion:product.version,productCode:product.code,productName:product.name,skuId:sku.id,skuVersion:sku.version,skuCode:sku.code,unit:product.unit},receivedAt:c.committedAt,customerReportedIssue:longText(p.customerReportedIssue),technicianDiagnosis:'',defectIds:[],defectSnapshot:[],expectedFinishDate:null,state:'RECEIVED'};
  return{data,writes:[caseEvent(data,c)]};
};
function currentCase(current:Readonly<BusinessRecord>|undefined,scope:OperationalScope){if(!current||current.kind!=='warranty-case'||!scoped(current,scope))return opFail('CASE_NOT_FOUND',404);return opData<WarrantyCaseData>(current);}
const diagnose:OperationPlanner=(raw,current,c)=>{
  const {scope,input}=unpackOperational(raw);assertScope(c.records,scope);const p=opFields(input,['defectIds','technicianDiagnosis','expectedFinishDate']),old=currentCase(current,scope);
  if(!['RECEIVED','CHECKING','REPAIRING'].includes(old.state))return opFail('CASE_IMMUTABLE');
  if(!Array.isArray(p.defectIds)||p.defectIds.some(x=>typeof x!=='string')||new Set(p.defectIds).size!==p.defectIds.length)return opFail('VALIDATION_FAILED',422);
  const defects=p.defectIds.map(id=>{const r=c.records.find(r=>r.id===id&&r.kind==='defect');if(!r||opData<{status:string}>(r).status!=='active')return opFail('DEFECT_UNAVAILABLE');return{id:r.id,version:r.version,data:structuredClone(r.data)};});
  if(p.expectedFinishDate!==null){const date=p.expectedFinishDate;if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date+'T00:00:00Z'))||new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date||date<localDate(old.receivedAt))return opFail('INVALID_FINISH_DATE',422);}
  if(old.state==='REPAIRING'&&(!defects.length||p.expectedFinishDate===null))return opFail('REPAIR_REQUIREMENTS');
  const data:WarrantyCaseData={...old,state:old.state==='RECEIVED'?'CHECKING':old.state,technicianDiagnosis:longText(p.technicianDiagnosis),defectIds:p.defectIds as string[],defectSnapshot:defects,expectedFinishDate:p.expectedFinishDate as string|null,updatedAt:c.committedAt,updatedBy:c.actorKey};return{data,writes:[caseEvent(data,c)]};
};
const transition:OperationPlanner=(raw,current,c)=>{
  const {scope,input}=unpackOperational(raw);assertScope(c.records,scope);const p=opFields(input,['state']),old=currentCase(current,scope),next:{[key:string]:string}={CHECKING:'REPAIRING',REPAIRING:'REPAIRED',REPAIRED:'RETURNED'};
  if(next[old.state]!==p.state)return opFail('INVALID_CASE_TRANSITION');if(p.state==='REPAIRING'&&(!old.defectIds.length||!old.expectedFinishDate))return opFail('REPAIR_REQUIREMENTS');
  const data:WarrantyCaseData={...old,state:p.state as WarrantyCaseData['state'],updatedAt:c.committedAt,updatedBy:c.actorKey};return{data,writes:[caseEvent(data,c)]};
};
export function linkedDocumentHandlers(surface:OperationalSurface):Record<string,BusinessHandler>{
  if(surface==='APP_P05')return{'outbound.create':operationalHandler('create','outbound','outbound:',outbound,surface)};
  if(surface==='APP_P09')return{'warranty.intake':operationalHandler('create','warranty-case','warranty-case:',intake,surface)};
  if(surface==='WEB')return{'warranty.diagnose':operationalHandler('update','warranty-case','warranty-case:',diagnose,surface),'warranty.transition':operationalHandler('update','warranty-case','warranty-case:',transition,surface)};return{};
}
