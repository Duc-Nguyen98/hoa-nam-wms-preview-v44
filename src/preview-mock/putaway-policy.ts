import type { BusinessHandler, BusinessRecord } from './business-repository';
import type { BoxData, OperationalScope, OperationalSurface, PutawayData, StockEventData } from '../contracts/operational-preview';
import { assertScope, opData, opFail, opFields, opMeta, opPositive, opText, operationalHandler, scoped, unpackOperational, type OperationContext, type OperationPlanner } from './operational-policy';
function eligibleBox(c:OperationContext,id:unknown,scope:OperationalScope){
  const box=c.records.find(r=>r.id===id&&r.kind==='box'&&scoped(r,scope));if(!box)return opFail('BOX_NOT_FOUND',404);
  const d=opData<BoxData>(box);
  const receipt=c.records.find(r=>r.id===d.sourceReceiptId&&r.kind==='receipt'&&scoped(r,scope));
  if(!d.posted||d.status!=='IN_STOCK'||d.trayId!==null||!receipt||opData<{status:string}>(receipt).status!=='POSTED')return opFail('BOX_NOT_ELIGIBLE');
  const quantity=c.records.filter(r=>r.kind==='stock-event'&&scoped(r,scope)&&opData<StockEventData>(r).boxId===box.id).reduce((n,r)=>{const q=n+opData<StockEventData>(r).signedQuantity;if(!Number.isSafeInteger(q))return opFail('QUANTITY_OVERFLOW');return q;},0);opPositive(quantity);
  return{box,data:d,quantity};
}
const create:OperationPlanner=(raw,_current,c)=>{
  const {scope,input}=unpackOperational(raw),scenario=assertScope(c.records,scope),p=opFields(input,['boxId','observedBoxVersion']),b=eligibleBox(c,p.boxId,scope);
  if(opPositive(p.observedBoxVersion)!==b.box.version)return opFail('STALE_BOX_VERSION');
  if(c.records.some(r=>r.kind==='putaway'&&scoped(r,scope)&&opData<PutawayData>(r).boxId===b.box.id&&opData<PutawayData>(r).status==='DRAFT'))return opFail('BOX_HAS_ACTIVE_TASK');
  const data:PutawayData={...opMeta({scenarioId:scenario.id,generation:scenario.data.generation},c.committedAt,c.actorKey),boxId:b.box.id,receiptId:b.data.sourceReceiptId,capturedBoxVersion:b.box.version,capturedContentRevision:b.data.contentRevision,quantityAtCreate:b.quantity,status:'DRAFT',trayId:null,cancellationReason:null};return{data,writes:[]};
};
function task(current:Readonly<BusinessRecord>|undefined,scope:OperationalScope){if(!current||current.kind!=='putaway'||!scoped(current,scope))return opFail('TASK_NOT_FOUND',404);const d=opData<PutawayData>(current);if(d.status!=='DRAFT')return opFail('TASK_NOT_DRAFT');return d;}
const confirm:OperationPlanner=(raw,current,c)=>{
  const {scope,input}=unpackOperational(raw);assertScope(c.records,scope);const p=opFields(input,['trayId']),t=task(current,scope),b=eligibleBox(c,t.boxId,scope);
  if(b.box.version!==t.capturedBoxVersion||b.data.contentRevision!==t.capturedContentRevision||b.quantity!==t.quantityAtCreate)return opFail('STALE_BOX_CONTENT');
  const tray=c.records.find(r=>r.id===p.trayId&&r.kind==='operational-setup-tray');
  const td=tray?.data as {warehouseId:string;active:boolean;locationId:string}|undefined;
  const location=c.records.find(r=>r.id===td?.locationId&&r.kind==='operational-setup-location');
  if(!td||!td.active||td.warehouseId!==t.warehouseId||!location||!(location.data as {active:boolean}).active||(location.data as {warehouseId:string}).warehouseId!==t.warehouseId)return opFail('TRAY_UNAVAILABLE');
  return{data:{...t,status:'CONFIRMED',trayId:tray!.id,updatedAt:c.committedAt,updatedBy:c.actorKey},writes:[{id:b.box.id,kind:'box',expectedVersion:b.box.version,data:{...b.data,trayId:tray!.id,updatedAt:c.committedAt,updatedBy:c.actorKey}}]};
};
const cancel:OperationPlanner=(raw,current,c)=>{const {scope,input}=unpackOperational(raw);assertScope(c.records,scope);const p=opFields(input,['reason']),t=task(current,scope);return{data:{...t,status:'CANCELLED',cancellationReason:opText(p.reason,1,500),updatedAt:c.committedAt,updatedBy:c.actorKey},writes:[]};};
export function putawayHandlers(surface:OperationalSurface):Record<string,BusinessHandler>{return surface==='WEB'?{
  'putaway.create':operationalHandler('create','putaway','putaway:',create,surface),
  'putaway.confirm':operationalHandler('update','putaway','putaway:',confirm,surface),
  'putaway.cancel':operationalHandler('update','putaway','putaway:',cancel,surface),
}:{};}
