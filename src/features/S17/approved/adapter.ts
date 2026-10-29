export type Status = 'Đã ghi sổ' | 'Nháp' | 'Chờ hàng trả về' | 'Đã hủy';
export type Line = { sku:string; name:string; original:number; prior:number; quantity:number; note:string; unit?:string };
export type RecordRow = { id:string; source:string; type:'Đảo nhập'|'Đảo xuất'; status:Status; reason:string; note?:string; cancelledAt?:string; cancelledBy?:string; created:string; lines:Line[] };
export type Receipt = { kind:'confirmed'; key:string; recordId:string; postedAt:string; version:number };
export type PostResult = Receipt | {kind:'unknown';key:string} | {kind:'conflict'} | {kind:'blocked'};
export interface ReversalDesignAdapter {
 list():RecordRow[]; sources():RecordRow[]; save(row:RecordRow,version:number):boolean|Promise<boolean>;
 initialize?():Promise<void>; refresh?():Promise<void>; operation?(recordId:string):ReversalOperation|undefined; acknowledge?(key:string,receipt:Receipt):Promise<void>; readUi?():ReversalUiState; saveUi?(value:ReversalUiState):Promise<void>;
 post(row:RecordRow,key:string,version:number):Promise<PostResult>; status(key:string):Promise<PostResult>; version():number;
}
export type ReversalUiState={sourceId?:string;draft?:RecordRow;note?:string;emptyQuantitySkus?:string[];draftVersion?:number};
export type ReversalOperation={key:string;recordId:string;payload:RecordRow;fingerprint:string;preparedAt:string;phase:'prepared'|'unknown'|'confirmed';receipt?:Receipt};
type ReceiptEntry={receipt:Receipt;fingerprint:string};
export type ReversalModelSnapshot={records:RecordRow[];rev:number;receipts:[string,ReceiptEntry][];pending:[string,ReceiptEntry][]};
export interface ReversalModel extends ReversalDesignAdapter {snapshot():ReversalModelSnapshot;postSync(row:RecordRow,key:string,version:number):PostResult;statusSync(key:string):PostResult;save(row:RecordRow,version:number):boolean}
const names=[['HN-DRV-001','Bộ điều khiển động cơ'],['HN-PSU-002','Bộ nguồn 24V'],['HN-SEN-003','Cảm biến quang'],['HN-PCB-004','Bo mạch điều khiển'],['HN-MTR-005','Mô tơ cửa'],['HN-SWT-007','Công tắc hành trình'],['HN-HMI-008','Màn hình điều khiển'],['HN-FAN-009','Quạt tản nhiệt'],['HN-RLY-010','Rơ le điều khiển']];
const lines=(count:number,quantity:(i:number)=>number):Line[]=>names.slice(0,count).map(([sku,name],i)=>({sku,name,original:10,prior:0,quantity:quantity(i),note:'',unit:'Cái'}));
const row=(id:string,source:string,type:RecordRow['type'],status:Status,reason:string,created:string,items:Line[]):RecordRow=>({id:`REV-${id}`,source,type,status,reason,created,lines:items});
const fixtureRows:RecordRow[]=[
 row('20261028-009','PN-20261020-001','Đảo nhập','Đã ghi sổ','Sai chứng từ','2026-10-28T14:25',lines(9,i=>i+1)),
 row('20261028-008','PX-20261025-008','Đảo xuất','Chờ hàng trả về','Hàng quay lại kho','2026-10-28T13:40',lines(3,()=>2).map(l=>({...l,original:2}))),
 row('20261028-007','PN-20261022-007','Đảo nhập','Nháp','Nhầm hàng','2026-10-28T11:15',lines(2,()=>2)),
 row('20261027-006','PX-20261024-006','Đảo xuất','Đã ghi sổ','Sai chứng từ','2026-10-27T16:20',lines(1,()=>1)),
 {...row('20261027-005','PN-20261021-005','Đảo nhập','Đã hủy','Không thực hiện','2026-10-27T10:00',lines(1,()=>2).map(l=>({...l,original:2}))),cancelledAt:'2026-10-27T10:15',cancelledBy:'Nguyễn Văn Nam'},
 row('20261026-004','PX-20261023-004','Đảo xuất','Đã ghi sổ','Hàng quay lại kho','2026-10-26T15:30',lines(2,i=>i+1)),
 row('20261026-003','PN-20261019-003','Đảo nhập','Đã ghi sổ','Nhầm hàng','2026-10-26T09:40',lines(1,()=>5)),
 row('20261025-002','PN-20261018-002','Đảo nhập','Nháp','Sai chứng từ','2026-10-25T14:10',lines(1,()=>1)),
 row('20261025-001','PX-20261018-001','Đảo xuất','Đã hủy','Không thực hiện','2026-10-25T08:45',lines(1,()=>1))
];
/** Explicit artwork fixture facts, never generic ID-based posting rules or live audit authority. */
const fixtureFacts:Readonly<Record<string,{postingTime?:string;dependencyBlocked?:boolean}>>={
 'REV-20261028-007':{postingTime:'28/10/2026 14:35'},
 'REV-20261025-002':{dependencyBlocked:true},
};
export const fixtureDependencyBlocked=(recordId:string)=>fixtureFacts[recordId]?.dependencyBlocked===true;
const clone=<T,>(v:T):T=>structuredClone(v);
/** Movement in this isolated fixture; a pending or cancelled record has no posted impact. */
export function reversalImpact(r:RecordRow) {
 const original=r.lines.reduce((n,l)=>n+l.original,0);
 const quantity=r.lines.reduce((n,l)=>n+l.quantity,0);const prior=r.lines.reduce((n,l)=>n+l.prior,0);
 const sign=r.type==='Đảo nhập'?-1:1;
 const posted=r.status==='Đã ghi sổ';
 return {original: -sign*original, change: posted?sign*quantity:0, net: -sign*(original-prior)+(posted?sign*quantity:0), projected:sign*quantity};
}
export const reversalFingerprint=(r:RecordRow)=>JSON.stringify({id:r.id,source:r.source,type:r.type,status:r.status,reason:r.reason,note:r.note??'',created:r.created,lines:r.lines.map(l=>({sku:l.sku,name:l.name,original:l.original,prior:l.prior,quantity:l.quantity,note:l.note,unit:l.unit??null}))});
/** Local in-memory design adapter, not a backend posting or permission contract. */
export function createReversalDesignAdapter(options:{unknownFirst?:boolean;now?:()=>Date;initial?:ReversalModelSnapshot}={}):ReversalModel {
 const sourceBase=clone([...fixtureRows.filter(x=>x.type==='Đảo nhập').sort((a,b)=>Number(b.id.endsWith('-007'))-Number(a.id.endsWith('-007'))),row('20261023-010','PN-20261023-010','Đảo nhập','Đã ghi sổ','', '2026-10-23T10:00',lines(1,()=>0).map(l=>({...l,original:8}))),row('20261024-011','PN-20261024-011','Đảo nhập','Đã ghi sổ','', '2026-10-24T10:00',lines(1,()=>0).map(l=>({...l,original:12}))),row('20261025-012','PN-20261025-012','Đảo nhập','Đã ghi sổ','', '2026-10-25T10:00',lines(2,()=>0)),row('20261026-013','PN-20261026-013','Đảo nhập','Đã ghi sổ','', '2026-10-26T10:00',lines(1,()=>0).map(l=>({...l,original:6})))]);
 Object.freeze(sourceBase);for(const source of sourceBase){Object.freeze(source.lines);for(const line of source.lines)Object.freeze(line);Object.freeze(source)}
 const postingTime=(r:RecordRow)=>{const pinned=fixtureFacts[r.id]?.postingTime;if(pinned)return pinned;const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Ho_Chi_Minh',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts((options.now??(()=>new Date()))());const value=(name:string)=>parts.find(p=>p.type===name)?.value;return `${value('day')}/${value('month')}/${value('year')} ${value('hour')}:${value('minute')}`};
 let records=clone(options.initial?.records??fixtureRows), rev=options.initial?.rev??1; const receipts=new Map<string,ReceiptEntry>(clone(options.initial?.receipts??[])); const pending=new Map<string,ReceiptEntry>(clone(options.initial?.pending??[]));
 const sources=()=>clone(sourceBase.map(x=>({...x,lines:x.lines.map(l=>({...l,prior:records.filter(r=>r.source===x.source&&r.status==='Đã ghi sổ').reduce((n,r)=>n+(r.lines.find(item=>item.sku===l.sku)?.quantity??0),0)}))})));
 const validSource=(r:RecordRow)=>{const source=sources().find(x=>x.source===r.source);if(!source||r.type!=='Đảo nhập'||r.lines.length!==source.lines.length||new Set(r.lines.map(l=>l.sku)).size!==r.lines.length)return false;return r.lines.every(l=>{const item=source.lines.find(x=>x.sku===l.sku);return !!item&&item.name===l.name&&item.original===l.original&&item.prior===l.prior&&item.unit===l.unit})};
 const model:ReversalModel={
 snapshot:()=>clone({records,rev,receipts:[...receipts],pending:[...pending]}),
 async post(r,key,version){return model.postSync(r,key,version)},
 async status(key){return model.statusSync(key)},
 list:()=>clone(records), sources,
 save(r,version){if(version!==rev||r.status!=='Nháp'||!validSource(r))return false;const i=records.findIndex(x=>x.id===r.id);if(i>=0){const old=records[i];if(old.status!=='Nháp'||old.source!==r.source||old.type!==r.type||old.created!==r.created)return false;records[i]=clone(r)}else{if(!r.id||!r.created)return false;records.push(clone(r))}rev++;return true},
 version:()=>rev,
 postSync(r,key,version){const existing=receipts.get(key);if(existing)return existing.fingerprint===reversalFingerprint(r)?clone(existing.receipt):{kind:'conflict'};const unresolved=pending.get(key);if(unresolved)return unresolved.fingerprint===reversalFingerprint(r)?{kind:'unknown',key}:{kind:'conflict'};if(r.type==='Đảo xuất'||fixtureDependencyBlocked(r.id))return {kind:'blocked'};if(!key||version!==rev||r.status!=='Nháp')return {kind:'conflict'};const stored=records.find(x=>x.id===r.id);if(!stored||stored.status!=='Nháp'||stored.source!==r.source||stored.type!==r.type||stored.created!==r.created||!validSource(r))return {kind:'conflict'};if(!r.reason||r.lines.some(l=>!Number.isFinite(l.quantity)||l.quantity<=0||l.quantity>l.original-l.prior))return {kind:'blocked'};const receipt:Receipt={kind:'confirmed',key,recordId:r.id,postedAt:postingTime(r),version:++rev};records[records.indexOf(stored)]={...clone(r),status:'Đã ghi sổ'};const entry={receipt,fingerprint:reversalFingerprint(r)};if(options.unknownFirst){pending.set(key,entry);return {kind:'unknown',key}}receipts.set(key,entry);return clone(receipt)},
 statusSync(key){const entry=receipts.get(key)??pending.get(key);if(!entry)return {kind:'unknown',key};pending.delete(key);receipts.set(key,entry);return clone(entry.receipt)}
 };
 return model;
}
