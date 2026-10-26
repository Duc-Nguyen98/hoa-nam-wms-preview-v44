import type { OperationalSnapshot, StockEventData, WarrantyCaseData } from '../contracts/operational-preview';
import type { CatalogRecipient } from '../contracts/catalog-create';
import type { CommitSnapshotData } from '../preview-mock/business-atomic';
import { canonicalBusinessJson } from '../preview-mock/business-repository';
import { sha256Text } from '../preview-mock/operational-hash';
export interface OperationalReportQuery { from:string;to:string;asOf:string }
interface CaseProductSnapshot { productId:string;productVersion:number;productCode:string;productName:string;skuId:string;skuVersion:number;skuCode:string;unit:string }
const fail=(code:string):never=>{throw Object.assign(new Error(code),{code});};
export function vietnamDate(value:string){if(!Number.isFinite(Date.parse(value)))return fail('INVALID_AS_OF');return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value));}
export function vietnamPeriod(from:string,to:string){
  for(const date of [from,to])if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date+'T00:00:00Z'))||new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date)return fail('INVALID_PERIOD');
  if(from>to)return fail('INVALID_PERIOD');return{fromInclusive:Date.parse(from+'T00:00:00+07:00'),toExclusive:Date.parse(to+'T00:00:00+07:00')+86400000};
}
function freeze<T>(value:T):T{if(value&&typeof value==='object'){Object.freeze(value);Object.values(value).forEach(freeze);}return value;}
/** A complete, immutable read model for all consumers. No hard-coded balance, label or hidden row. */
export function pinOperationalReports(source:OperationalSnapshot,query:OperationalReportQuery){
  if(source.complete!==true||source.token.epoch!==source.epoch||source.token.revision!==source.snapshotRevision||source.actorKey!=='preview:ducquang')return fail('INCOMPLETE_POPULATION');
  const s=structuredClone(source),period=vietnamPeriod(query.from,query.to),asOf=Date.parse(query.asOf);vietnamDate(query.asOf);
  const proofs=new Map(s.commitSnapshots.map(r=>[r.id,r.data as CommitSnapshotData]));
  const population=[...(s.scenario?[s.scenario]:[]),...s.profiles,...s.receipts,...s.lines,...s.physical,...s.boxes,...s.outbounds,...s.warrantyCases,...s.partsIssues,...s.reversals,...s.putaways,...s.stockEvents,...s.caseEvents,...s.auditEvents,...s.evidence,...s.setupMasters,...s.appSubmissions,...s.scanObservations,...s.physicalRegistry];
  if(s.scenario&&!proofs.size)return fail('INCOMPLETE_POPULATION');
  for(const proof of proofs.values())for(const change of proof.changes){
    const old=JSON.parse(change.canonicalRecord) as {id:string;version:number;kind:string;data:{scenarioId?:string;generation?:number}};
    if(old.data.scenarioId!==s.token.scenarioId||old.data.generation!==s.token.generation)continue;
    const current=population.find(r=>r.id===old.id);
    if(!current||current.version<old.version||current.version===old.version&&canonicalBusinessJson(current)!==change.canonicalRecord)return fail('INCOMPLETE_POPULATION');
  }
  for(const event of [...s.stockEvents,...s.caseEvents,...s.auditEvents]){
    const d=event.data as {commitSnapshotId:string},proof=proofs.get(d.commitSnapshotId);
    if(!proof||proof.revision>s.token.revision||!proof.changes.some(c=>c.entityId===event.id&&c.canonicalRecord===canonicalBusinessJson(event)))return fail('INCOMPLETE_POPULATION');
  }
  // This reader pins current state; a historical state requires its historical snapshot, never today's mapping.
  if([...proofs.values()].some(p=>Date.parse(p.committedAt)>asOf))return fail('AS_OF_BEFORE_SNAPSHOT');
  const inPeriod=(timestamp:string)=>Date.parse(timestamp)>=period.fromInclusive&&Date.parse(timestamp)<period.toExclusive&&Date.parse(timestamp)<=asOf;
  const allEvents=s.stockEvents.filter(e=>Date.parse(e.data.committedAt)<=asOf),events=allEvents.filter(e=>inPeriod(e.data.committedAt));
  const stock=new Map<string,{skuId:string;warehouseId:string;unit:string;opening:number;inbound:number;outbound:number;parts:number;reversals:number;closing:number;actual:null;difference:null}>();
  for(const event of allEvents){const e=event.data,key=canonicalBusinessJson([e.skuId,e.warehouseId,e.unit]),row=stock.get(key)??{skuId:e.skuId,warehouseId:e.warehouseId,unit:e.unit,opening:0,inbound:0,outbound:0,parts:0,reversals:0,closing:0,actual:null,difference:null};
    if(Date.parse(e.committedAt)>=period.toExclusive)continue;
    if(Date.parse(e.committedAt)<period.fromInclusive)row.opening+=e.signedQuantity;
    else if(e.eventType==='RECEIPT_POST')row.inbound+=e.signedQuantity;else if(e.eventType==='OUTBOUND_POST')row.outbound-=e.signedQuantity;else if(e.eventType==='PARTS_ISSUE_POST')row.parts-=e.signedQuantity;else if(e.eventType==='REVERSAL_POST')row.reversals+=e.signedQuantity;else return fail('UNKNOWN_EVENT');
    row.closing=row.opening+row.inbound-row.outbound-row.parts+row.reversals;if(!Object.values(row).filter(v=>typeof v==='number').every(Number.isSafeInteger)||row.closing<0)return fail('INVALID_BALANCE');stock.set(key,row);
  }
  const cases=s.warrantyCases.filter(c=>inPeriod(c.data.receivedAt)).map(c=>{
    const product=c.data.productSnapshot as CaseProductSnapshot|null;
    if(!product||product.skuId!==c.data.skuId||!['productId','productCode','productName','skuCode','unit'].every(key=>typeof product[key as keyof CaseProductSnapshot]==='string'&&String(product[key as keyof CaseProductSnapshot]).length>0)
      ||!Number.isSafeInteger(product.productVersion)||product.productVersion<1||!Number.isSafeInteger(product.skuVersion)||product.skuVersion<1)return fail('INCOMPLETE_POPULATION');
    const timeline=s.caseEvents.filter(e=>(e.data as {caseId:string}).caseId===c.id&&Date.parse((e.data as {timestamp:string}).timestamp)<=asOf).sort((a,b)=>proofs.get((a.data as {commitSnapshotId:string}).commitSnapshotId)!.revision-proofs.get((b.data as {commitSnapshotId:string}).commitSnapshotId)!.revision);
    const last=timeline.at(-1)?.data as {state:WarrantyCaseData['state'];expectedFinishDate:string|null}|undefined;if(!last)return fail('INCOMPLETE_POPULATION');
    const category=last.state==='RECEIVED'?'waiting':['CHECKING','REPAIRING'].includes(last.state)?'processing':'complete',overdue=category!=='complete'&&last.expectedFinishDate!==null&&last.expectedFinishDate<vietnamDate(query.asOf);
    return{id:c.id,code:c.data.code,skuId:c.data.skuId,skuCode:product.skuCode,productId:product.productId,productCode:product.productCode,productName:product.productName,unit:product.unit,productSnapshot:{...product},physicalId:c.data.physicalId,identityMode:c.data.identityMode,receivedAt:c.data.receivedAt,state:last.state,category,expectedFinishDate:last.expectedFinishDate,overdue,timeline};
  });
  const summary={total:cases.length,complete:cases.filter(c=>c.category==='complete').length,processing:cases.filter(c=>c.category==='processing').length,waiting:cases.filter(c=>c.category==='waiting').length,incomplete:cases.filter(c=>c.category!=='complete').length,overdue:cases.filter(c=>c.overdue).length};
  const trace=[...s.physical,...s.boxes].map(p=>({id:p.id,kind:p.kind,...p.data,lot:null,pallet:null,historyCoverage:'PREVIEW_GENERATION_ONLY',events:allEvents.filter(e=>e.data.boxId===p.id||e.data.physicalIds.includes(p.id))}));
  const recipients=s.outbounds.filter(o=>o.data.status==='POSTED'&&events.some(e=>e.data.documentId===o.id&&e.data.eventType==='OUTBOUND_POST')).map(o=>{
    const recipient=o.data.recipientSnapshot as CatalogRecipient|null;
    if(!recipient||recipient.id!==o.data.recipientId||!['name','type','market'].every(key=>typeof recipient[key as keyof CatalogRecipient]==='string'))return fail('INCOMPLETE_POPULATION');
    const selected=events.filter(e=>e.data.documentId===o.id&&e.data.eventType==='OUTBOUND_POST');
    if(selected.length!==o.data.requestedLines.length||selected.length!==o.data.postedEventIds.length||new Set(selected.map(e=>e.data.sourceLineId)).size!==selected.length)return fail('INCOMPLETE_POPULATION');
    const eventLines=selected.map(e=>{
      const d=e.data,line=o.data.requestedLines.find(l=>l.id===d.sourceLineId&&l.skuId===d.skuId);
      if(!line||!o.data.postedEventIds.includes(e.id)||d.warehouseId!==o.data.warehouseId||!Number.isSafeInteger(d.signedQuantity)||d.signedQuantity!==-line.quantity||line.quantity<=0)return fail('INCOMPLETE_POPULATION');
      return{eventId:e.id,sourceLineId:d.sourceLineId,skuId:d.skuId,warehouseId:d.warehouseId,unit:d.unit,quantity:-d.signedQuantity,signedQuantity:d.signedQuantity,committedAt:d.committedAt,physicalIds:[...d.physicalIds],boxId:d.boxId,commitSnapshotId:d.commitSnapshotId};
    });
    const snapshotKey=sha256Text(canonicalBusinessJson({recipientId:o.data.recipientId,recipientSnapshot:recipient}));
    return{outboundId:o.id,documentCode:o.data.code,committedAt:eventLines[0].committedAt,warehouseId:o.data.warehouseId,recipientId:o.data.recipientId,recipientSnapshot:recipient,snapshotKey,lines:o.data.requestedLines,eventIds:o.data.postedEventIds,eventLines};
  });
  const recipientGroups=new Map<string,{recipientId:string;snapshotKey:string;name:string;type:string;market:string;skuId:string;warehouseId:string;unit:string;quantity:number;signedQuantity:number;outboundIds:string[];eventIds:string[]}>();
  for(const document of recipients)for(const line of document.eventLines){
    const key=canonicalBusinessJson([document.recipientId,document.snapshotKey,line.skuId,line.warehouseId,line.unit]);
    const total=recipientGroups.get(key)??{recipientId:document.recipientId,snapshotKey:document.snapshotKey,name:document.recipientSnapshot.name,type:document.recipientSnapshot.type,market:document.recipientSnapshot.market,skuId:line.skuId,warehouseId:line.warehouseId,unit:line.unit,quantity:0,signedQuantity:0,outboundIds:[],eventIds:[]};
    total.quantity+=line.quantity;total.signedQuantity+=line.signedQuantity;if(!Number.isSafeInteger(total.quantity)||!Number.isSafeInteger(total.signedQuantity))return fail('INVALID_BALANCE');
    if(!total.outboundIds.includes(document.outboundId))total.outboundIds.push(document.outboundId);total.eventIds.push(line.eventId);recipientGroups.set(key,total);
  }
  const recipientTotals=[...recipientGroups.values()].map(row=>({...row,documentCount:row.outboundIds.length,eventCount:row.eventIds.length}));
  const data={complete:true as const,token:s.token,query:{...query},timezone:'Asia/Ho_Chi_Minh' as const,coverage:'COMPLETE_CURRENT_SCENARIO' as const,events,stock:[...stock.values()],inventory:s.stock.map(row=>({...row,actual:null,difference:null})),cases,summary,trace,recipients,recipientTotals,audit:s.auditEvents.filter(e=>inPeriod((e.data as {timestamp:string}).timestamp)),receipts:s.receipts,outbounds:s.outbounds,partsIssues:s.partsIssues,reversals:s.reversals,putaways:s.putaways,setupMasters:s.setupMasters};
  return freeze({...data,sha256:sha256Text(canonicalBusinessJson(data))});
}
export type OperationalReports=ReturnType<typeof pinOperationalReports>;
export type OperationalEventCohortKind='inbound'|'outbound';
export type OperationalExportKind='events'|'stock'|'cases'|'trace'|'recipients'|OperationalEventCohortKind;
function assertPinnedReport(report:OperationalReports){
  const{sha256,...data}=report;if(report.complete!==true||sha256Text(canonicalBusinessJson(data))!==sha256)return fail('INCOMPLETE_POPULATION');
}
/** Select from the accepted complete pin; never filter/re-hash a partial report.
 * S18/S19 share these exact rows/totals with their export. No stock mutation. */
export function selectOperationalEventCohort(report:OperationalReports,kind:OperationalEventCohortKind){
  assertPinnedReport(report);
  if(kind!=='inbound'&&kind!=='outbound')return fail('INVALID_REPORT_KIND');
  const eventType=kind==='inbound'?'RECEIPT_POST':'OUTBOUND_POST';
  const totals=new Map<string,{skuId:string;warehouseId:string;unit:string;quantity:number;signedQuantity:number}>();
  const rows=report.events.filter(event=>event.data.eventType===eventType).map(event=>{
    const d=event.data,outbound=kind==='outbound'?report.outbounds.find(r=>r.id===d.documentId):undefined;
    const document=kind==='inbound'?report.receipts.find(r=>r.id===d.documentId):outbound;
    if(!document||document.data.status!=='POSTED'||!document.data.postedEventIds.includes(event.id)||!Number.isSafeInteger(d.signedQuantity)||(kind==='inbound'?d.signedQuantity<=0:d.signedQuantity>=0))return fail('INCOMPLETE_POPULATION');
    // Historical S19 customer columns must come from the same frozen submission,
    // never today's catalog labels or a separately fetched recipient record.
    const recipient=outbound?.data.recipientSnapshot as CatalogRecipient|null|undefined;
    if(kind==='outbound'&&(!recipient||recipient.id!==outbound!.data.recipientId||typeof recipient.name!=='string'))return fail('INCOMPLETE_POPULATION');
    const quantity=Math.abs(d.signedQuantity),key=canonicalBusinessJson([d.skuId,d.warehouseId,d.unit]);
    const total=totals.get(key)??{skuId:d.skuId,warehouseId:d.warehouseId,unit:d.unit,quantity:0,signedQuantity:0};
    total.quantity+=quantity;total.signedQuantity+=d.signedQuantity;
    if(!Number.isSafeInteger(total.quantity)||!Number.isSafeInteger(total.signedQuantity))return fail('INVALID_BALANCE');
    totals.set(key,total);
    return{eventId:event.id,eventType:d.eventType,documentId:document.id,documentCode:document.data.code,sourceLineId:d.sourceLineId,skuId:d.skuId,warehouseId:d.warehouseId,unit:d.unit,quantity,signedQuantity:d.signedQuantity,physicalIds:[...d.physicalIds],boxId:d.boxId,commandId:d.commandId,commitSnapshotId:d.commitSnapshotId,committedAt:d.committedAt,actor:d.actor,recipientId:outbound?.data.recipientId??null,recipientName:recipient?.name??null,recipientSnapshot:recipient?structuredClone(recipient):null};
  });
  return freeze({kind,eventType,token:structuredClone(report.token),query:{...report.query},sha256:report.sha256,rows,totals:[...totals.values()]});
}
/** Export every row of the selected complete cohort, with same query/token and exact IDs. */
export async function exportOperationalReport(report:OperationalReports,kind:OperationalExportKind){
  assertPinnedReport(report);const{sha256}=report;
  if(!['events','stock','cases','trace','recipients','inbound','outbound'].includes(kind))return fail('INVALID_REPORT_KIND');
  const cohort=kind==='inbound'||kind==='outbound'?selectOperationalEventCohort(report,kind):null;
  const sourceRows=kind==='inbound'||kind==='outbound'?cohort!.rows:kind==='recipients'?report.recipients.flatMap(document=>document.eventLines.map(line=>({outboundId:document.outboundId,documentCode:document.documentCode,recipientId:document.recipientId,recipientName:document.recipientSnapshot.name,recipientType:document.recipientSnapshot.type,recipientMarket:document.recipientSnapshot.market,recipientSnapshot:document.recipientSnapshot,snapshotKey:document.snapshotKey,...line}))):report[kind];
  const rows=sourceRows.map(row=>{
    const flat:Record<string,unknown>={};for(const[key,value]of Object.entries(row))flat[key]=value&&typeof value==='object'?canonicalBusinessJson(value):value;return flat;
  });
  const keys=[...new Set(rows.flatMap(row=>Object.keys(row)))],columns=keys.map(key=>({key,label:key,type:rows.some(r=>typeof r[key]==='number')?'number' as const:'text' as const}));
  if(!columns.length)columns.push({key:'id',label:'id',type:'text'});
  const {buildHoaNamWorkbook}=await import('../exports/hoa-nam-xlsx');
  const metadata=cohort?{token:report.token,sha256,kind,eventType:cohort.eventType,totals:cohort.totals}:kind==='recipients'?{token:report.token,sha256,kind,recipientTotals:report.recipientTotals}:{token:report.token,sha256,summary:report.summary,stock:report.stock};
  return buildHoaNamWorkbook({title:'Hoa Nam · '+kind,periodLabel:queryLabel(report.query),filtersLabel:canonicalBusinessJson(metadata),exportedAt:new Date(report.query.asOf),columns,rows});
}
function queryLabel(query:OperationalReportQuery){return`${query.from} — ${query.to} · Asia/Ho_Chi_Minh · asOf ${query.asOf}`;}
