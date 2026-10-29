import {createIndexedDbBusinessPersistence,type BusinessPersistence} from '../../../preview-mock/business-persistence';
import {createReversalDesignAdapter,reversalFingerprint,type RecordRow,type Receipt,type PostResult,type ReversalDesignAdapter,type ReversalModelSnapshot,type ReversalOperation,type ReversalUiState} from './adapter';

/** Fixture isolation labels only. These are not authenticated permissions or a security boundary. */
export type ReversalModelScope={username:string;roleLabel:string;warehouseLabel:string;scenario?:string};
type Envelope={schema:1;scope:string;model:ReversalModelSnapshot;operations:ReversalOperation[];ui:ReversalUiState};
export interface DurableReversalDesignAdapter extends ReversalDesignAdapter{initialize():Promise<void>;refresh():Promise<void>;save(row:RecordRow,version:number):Promise<boolean>;operation(recordId:string):ReversalOperation|undefined;acknowledge(key:string,receipt:Receipt):Promise<void>;readUi():ReversalUiState;saveUi(value:ReversalUiState):Promise<void>}
export const REVERSAL_FIXTURE_NAMESPACE='hoa-nam-wms-reversal-design-v1';
const clone=<T,>(value:T):T=>structuredClone(value);
const fault=(code:string,message:string)=>Object.assign(new Error(message),{code,status:503});
const invalid=()=>fault('REVERSAL_MODEL_INVALID','Không thể đọc dữ liệu phiếu đảo đã lưu. Dữ liệu khôi phục được giữ nguyên.');
const object=(v:unknown):v is Record<string,unknown>=>!!v&&typeof v==='object'&&!Array.isArray(v);
const text=(v:unknown):v is string=>typeof v==='string';
const finite=(v:unknown):v is number=>typeof v==='number'&&Number.isFinite(v);
function rowValid(value:unknown):value is RecordRow{
 if(!object(value)||!text(value.id)||!value.id||!text(value.source)||!text(value.created)||!text(value.reason)||!['Đảo nhập','Đảo xuất'].includes(String(value.type))||!['Nháp','Đã ghi sổ','Chờ hàng trả về','Đã hủy'].includes(String(value.status))||!Array.isArray(value.lines)||!value.lines.length)return false;
 if(value.note!==undefined&&!text(value.note))return false;
 const skus=new Set<string>();
 return value.lines.every(line=>{
  if(!object(line)||!text(line.sku)||!line.sku||skus.has(line.sku)||!text(line.name)||!finite(line.original)||line.original<0||!finite(line.prior)||line.prior<0||line.prior>line.original||!finite(line.quantity)||!text(line.note)||(line.unit!==undefined&&(!text(line.unit)||!line.unit.trim())))return false;
  skus.add(line.sku);return true;
 });
}
function receiptValid(value:unknown):value is Receipt{return object(value)&&value.kind==='confirmed'&&text(value.key)&&!!value.key&&text(value.recordId)&&!!value.recordId&&text(value.postedAt)&&!!value.postedAt&&Number.isSafeInteger(value.version)&&Number(value.version)>0;}
// Immutable input authority comes from the seed registry, never from persisted record fields.
const seed=createReversalDesignAdapter();
const seededRecords=new Map(seed.list().map(row=>[row.id,row]));
const eligibleSources=new Set(seed.sources().map(row=>row.source));
const sourceRegistry=new Map([...seed.sources(),...seed.list()].map(row=>[row.source,row]));
function identityValid(row:RecordRow):boolean{
 const fixed=seededRecords.get(row.id),source=sourceRegistry.get(row.source);
 if(!source||source.type!==row.type||(!fixed&&!eligibleSources.has(row.source)))return false;
 if(fixed&&(fixed.source!==row.source||fixed.type!==row.type||fixed.created!==row.created))return false;
 if(fixed&&fixed.status!=='Nháp')return reversalFingerprint(row)===reversalFingerprint(fixed)&&row.cancelledAt===fixed.cancelledAt&&row.cancelledBy===fixed.cancelledBy;
 if(!['Nháp','Đã ghi sổ'].includes(row.status)||row.lines.length!==source.lines.length)return false;
 return row.lines.every(line=>{const original=source.lines.find(value=>value.sku===line.sku);return !!original&&line.name===original.name&&line.original===original.original&&line.unit===original.unit});
}
function uiValid(value:unknown):value is ReversalUiState{
 if(!object(value)||(value.sourceId!==undefined&&(!text(value.sourceId)||!eligibleSources.has(value.sourceId)))||(value.note!==undefined&&!text(value.note))||(value.draft!==undefined&&(!rowValid(value.draft)||!identityValid(value.draft))))return false;
 if(value.draftVersion!==undefined&&(!Number.isSafeInteger(value.draftVersion)||Number(value.draftVersion)<1))return false;
 if(value.emptyQuantitySkus!==undefined){if(!Array.isArray(value.emptyQuantitySkus)||new Set(value.emptyQuantitySkus).size!==value.emptyQuantitySkus.length||!rowValid(value.draft)||!value.emptyQuantitySkus.every(sku=>text(sku)&&(value.draft as RecordRow).lines.some(line=>line.sku===sku&&line.quantity===0)))return false;}
 return true;
}
function envelope(raw:unknown,scope:string):Envelope{
 if(!object(raw)||raw.schema!==1||raw.scope!==scope||!object(raw.model)||!Number.isSafeInteger(raw.model.rev)||Number(raw.model.rev)<1||!Array.isArray(raw.model.records)||!raw.model.records.length||!raw.model.records.every(rowValid)||!Array.isArray(raw.operations)||!uiValid(raw.ui))throw invalid();
 const model=raw.model;const records=model.records as RecordRow[];
 if(new Set(records.map(r=>r.id)).size!==records.length||!records.every(identityValid)||[...seededRecords.keys()].some(id=>!records.some(row=>row.id===id)))throw invalid();
 for(const field of ['receipts','pending']){
  const entries=model[field];if(!Array.isArray(entries)||!entries.every(e=>Array.isArray(e)&&e.length===2&&text(e[0])&&object(e[1])&&text(e[1].fingerprint)&&receiptValid(e[1].receipt)&&e[0]===e[1].receipt.key))throw invalid();
 }
 // Durable commits store their proof in receipts before returning unknown. Pending is unused in this schema.
 if((model.pending as unknown[]).length)throw invalid();
 const entries=model.receipts as [string,{receipt:Receipt;fingerprint:string}][];
 if(new Set(entries.map(entry=>entry[0])).size!==entries.length||new Set(entries.map(entry=>entry[1].receipt.version)).size!==entries.length)throw invalid();
 const keys=new Set<string>(),resources=new Set<string>();
 for(const op of raw.operations){
  if(!object(op)||!text(op.key)||!op.key||keys.has(op.key)||!text(op.recordId)||!rowValid(op.payload)||!identityValid(op.payload)||op.payload.status!=='Nháp'||!op.payload.reason||op.payload.lines.some(line=>line.quantity<=0||line.quantity>line.original-line.prior)||op.recordId!==op.payload.id||resources.has(op.recordId)||op.fingerprint!==reversalFingerprint(op.payload)||!text(op.preparedAt)||!Number.isFinite(Date.parse(op.preparedAt))||!['prepared','unknown','confirmed'].includes(String(op.phase)))throw invalid();
  if(op.receipt!==undefined&&(!receiptValid(op.receipt)||op.receipt.key!==op.key||op.receipt.recordId!==op.recordId||op.receipt.version>Number(model.rev)))throw invalid();
  if(op.phase==='confirmed'&&!op.receipt)throw invalid();
  if(op.receipt){const entries=model.receipts as [string,{receipt:Receipt;fingerprint:string}][];const entry=entries.find(e=>e[0]===op.key);const posted=records.find(r=>r.id===op.recordId);if(!entry||entry[1].fingerprint!==op.fingerprint||JSON.stringify(entry[1].receipt)!==JSON.stringify(op.receipt)||!posted||posted.status!=='Đã ghi sổ'||reversalFingerprint({...posted,status:'Nháp'})!==op.fingerprint)throw invalid();}
  keys.add(op.key);resources.add(op.recordId);
 }
 if(entries.some(([key,entry])=>!(raw.operations as unknown[]).some(op=>object(op)&&op.key===key&&op.receipt!==undefined&&JSON.stringify(op.receipt)===JSON.stringify(entry.receipt))))throw invalid();
 if(records.some(row=>row.status==='Đã ghi sổ'&&seededRecords.get(row.id)?.status!=='Đã ghi sổ'&&!(raw.operations as unknown[]).some(op=>object(op)&&op.recordId===row.id&&op.receipt!==undefined)))throw invalid();
 const result=clone(raw as unknown as Envelope);
 // UI scratch is advisory. Legacy or stale scratch must never inherit the current model revision.
 if(result.ui.draft&&result.ui.draftVersion!==result.model.rev){const sourceId=result.ui.sourceId;result.ui=sourceId?{sourceId}:{}};
 return result;
}
export function reversalModelScopeKey(scope:ReversalModelScope):string{
 for(const name of ['username','roleLabel','warehouseLabel'] as const)if(typeof scope[name]!=='string'||!scope[name].trim()||scope[name].length>160)throw fault('REVERSAL_SCOPE_REQUIRED','Chưa xác định phạm vi dữ liệu phiếu đảo.');
 const scenario=scope.scenario??'default';if(!/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(scenario))throw fault('REVERSAL_SCENARIO_INVALID','Phạm vi tình huống không hợp lệ.');
 return JSON.stringify([scope.username,scope.roleLabel,scope.warehouseLabel,scenario]);
}

/** Opt-in durable MOCK only. Dedicated database; never reads/writes canonical business/account state. */
export function createDurableReversalDesignAdapter(options:{scope:ReversalModelScope;persistence?:BusinessPersistence;unknownFirst?:boolean;now?:()=>Date;afterPrepare?:()=>Promise<void>}):DurableReversalDesignAdapter{
 const scope=reversalModelScopeKey(options.scope);
 const persistence=options.persistence??createIndexedDbBusinessPersistence(`${REVERSAL_FIXTURE_NAMESPACE}:${encodeURIComponent(scope)}`);
 let cache:Envelope|undefined;
 const now=options.now??(()=>new Date());
 const read=(raw:unknown|null)=>raw===null?{schema:1 as const,scope,model:createReversalDesignAdapter().snapshot(),operations:[],ui:{}}:envelope(raw,scope);
 const publish=(state:Envelope)=>{cache=clone(state)};
 const current=()=>{if(!cache)throw fault('REVERSAL_MODEL_NOT_READY','Dữ liệu phiếu đảo chưa sẵn sàng.');return cache};
 async function refresh(){const state=await persistence.transact(raw=>{const value=read(raw);return{value,...(raw===null?{write:value}:{})}});publish(state)}
 const adapter:DurableReversalDesignAdapter={
  initialize:refresh,refresh,
  list:()=>cache?clone(cache.model.records):[],
  sources:()=>cache?createReversalDesignAdapter({initial:cache.model}).sources():[],
  version:()=>cache?.model.rev??0,
  operation(recordId){return clone(cache?.operations.find(op=>op.recordId===recordId))},
  readUi:()=>clone(cache?.ui??{}),
  async saveUi(value){
   current();if(!uiValid(value))throw invalid();if(value.draft&&value.draftVersion===undefined)throw fault('REVERSAL_DRAFT_STALE','Bản nháp thiếu phiên bản gốc. Tải lại bản nháp đã lưu trước khi tiếp tục.');
   const result=await persistence.transact(raw=>{
    if(raw===null)throw invalid();const state=envelope(raw,scope);
    if(value.draft&&value.draftVersion!==state.model.rev){
     // Source choice does not authorize an old input payload to overwrite acknowledged draft data.
     const sameAsAcknowledged=!value.emptyQuantitySkus?.length&&state.model.records.some(row=>row.id===value.draft!.id&&reversalFingerprint(row)===reversalFingerprint(value.draft!));
     const sourceChanged=value.sourceId!==undefined&&state.ui.sourceId!==value.sourceId;if(sourceChanged)state.ui.sourceId=value.sourceId;
     return{value:{state,stale:!sameAsAcknowledged},...(sourceChanged?{write:state}:{})};
    }
    state.ui=value.draft?clone(value):{...state.ui,...clone(value)};
    return{value:{state,stale:false},write:state};
   });publish(result.state);
   if(result.stale)throw fault('REVERSAL_DRAFT_STALE','Bản nháp trên trình duyệt đã cũ. Tải lại bản nháp đã lưu trước khi tiếp tục.');
  },
  async save(row,version){current();if(!rowValid(row)||!identityValid(row))return false;const result=await persistence.transact(raw=>{if(raw===null)throw invalid();const state=envelope(raw,scope);if(state.operations.some(op=>op.recordId===row.id&&op.phase!=='confirmed'))return{value:{saved:false,state}};const model=createReversalDesignAdapter({initial:state.model,now});const saved=model.save(row,version);if(saved){state.model=model.snapshot();state.ui={sourceId:state.ui.sourceId,draft:clone(row),draftVersion:state.model.rev,note:row.note??''}}return{value:{saved,state},...(saved?{write:state}:{})}});publish(result.state);return result.saved},
  async post(row,key,version):Promise<PostResult>{
   current();if(!key)return{kind:'conflict'};
   // Intent is durable before the simulated request. An interrupted prepared operation is never replayed by a read.
   const preparation=await persistence.transact<{attempt:boolean;state:Envelope;result:PostResult}>(raw=>{
    if(raw===null)throw invalid();const state=envelope(raw,scope);const existing=state.operations.find(op=>op.key===key);
    if(existing)return{value:{attempt:false,state,result:existing.fingerprint!==reversalFingerprint(row)?{kind:'conflict' as const}:existing.phase==='confirmed'&&existing.receipt?existing.receipt:{kind:'unknown' as const,key}}};
    if(state.operations.some(op=>op.recordId===row.id)||version!==state.model.rev)return{value:{attempt:false,state,result:{kind:'conflict' as const}}};
    // Validate on an isolated copy before reserving intent, without committing its mutation.
    const probe=createReversalDesignAdapter({initial:state.model,now}).postSync(row,key,version);
    if(probe.kind!=='confirmed')return{value:{attempt:false,state,result:probe}};
    state.operations.push({key,recordId:row.id,payload:clone(row),fingerprint:reversalFingerprint(row),preparedAt:now().toISOString(),phase:'prepared'});
    return{value:{attempt:true,state,result:{kind:'unknown' as const,key}},write:state};
   });
   publish(preparation.state);if(!preparation.attempt)return clone(preparation.result);
   await options.afterPrepare?.();
   const result=await persistence.transact(raw=>{
    if(raw===null)throw invalid();const state=envelope(raw,scope);const op=state.operations.find(v=>v.key===key);
    if(!op||op.fingerprint!==reversalFingerprint(row))throw invalid();
    if(op.receipt)return{value:{state,result:options.unknownFirst?{kind:'unknown' as const,key}:op.receipt}};
    const model=createReversalDesignAdapter({initial:state.model,now:()=>new Date(op.preparedAt)});
    const proof=model.postSync(op.payload,key,version);
    if(proof.kind!=='confirmed')return{value:{state,result:{kind:'unknown' as const,key}}};
    state.model=model.snapshot();op.receipt=proof;op.phase=options.unknownFirst?'unknown':'confirmed';
    return{value:{state,result:options.unknownFirst?{kind:'unknown' as const,key}:proof},write:state};
   });publish(result.state);return clone(result.result);
  },
  async status(key){
   current();const result=await persistence.transact(raw=>{if(raw===null)throw invalid();const state=envelope(raw,scope);const op=state.operations.find(v=>v.key===key);return{value:{state,result:op?.receipt??{kind:'unknown' as const,key}}}});publish(result.state);return clone(result.result);
  },
  async acknowledge(key,receipt){
   current();const state=await persistence.transact(raw=>{if(raw===null)throw invalid();const next=envelope(raw,scope);const op=next.operations.find(v=>v.key===key);if(!op?.receipt||JSON.stringify(op.receipt)!==JSON.stringify(receipt))throw invalid();op.phase='confirmed';return{value:next,write:next}});publish(state);
  }
 };
 return adapter;
}
