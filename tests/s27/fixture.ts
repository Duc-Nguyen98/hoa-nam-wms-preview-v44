import type { OperationalSnapshot } from '../../src/contracts/operational-preview';
import type { BusinessRecord } from '../../src/preview-mock/business-repository';
import { createCommitSnapshot } from '../../src/preview-mock/business-atomic';

/** Isolated QA source, not imported by any production entry or persisted to a journal. */
export function auditFixture(count = 3, long = false): OperationalSnapshot {
  const epoch = 'qa-s27-epoch', scenarioId = 'scenario:qa-s27', generation = 1;
  const timestamp = '2026-10-25T07:24:00.000Z';
  const meta = { scenarioId, generation, warehouseId: 'warehouse-hn-01', createdAt: timestamp, createdBy: 'preview:ducquang', updatedAt: timestamp, updatedBy: 'preview:ducquang' };
  const scenario = { id: scenarioId, version: 1, kind: 'scenario', data: { ...meta, ownerActor: 'preview:ducquang', status: 'ACTIVE', selectedSkuIds: [], setupManifestId: 'HN-SIX-FLOWS-v0.1', startedAt: timestamp } };
  const profiles: BusinessRecord[] = [], receipts: BusinessRecord[] = [], auditEvents: BusinessRecord[] = [], stockEvents: BusinessRecord[] = [];
  const commitSnapshots = count < 3 ? [createCommitSnapshot({ id:'commit-snapshot:qa-scenario',epoch,revision:1,commandId:'qa-scenario-command',actorKey:'preview:ducquang',committedAt:timestamp },[],[scenario])] : [];
  for (let i = 0; i < count; i++) {
    const suffix = long ? `${String(i).padStart(3,'0')}-${'9a30b6de-'.repeat(35)}` : `${String(i).padStart(8,'0')}-660f-4264-a31d-5f037f0d64a5`;
    const commandId = suffix, id = `audit:${suffix}`, entityId = i === 2 ? scenarioId : `${i === 1 ? 'receipt' : 'profile'}:${suffix}`, commitSnapshotId = `commit-snapshot:${suffix}`;
    const action = i === 2 ? 'scenario.reset-own' : i === 1 ? 'inbound.post' : i === 3 ? 'future-extension.unknown-action' : 'stock-profiles.create';
    const actor = long && i === 0 ? 'Nguyễn Văn Người Thao Tác Rất Dài '.repeat(8) : i % 2 ? 'preview:operator-b' : 'preview:ducquang';
    const profile = { id:entityId,kind:'stock-profile',version:1,data:{...meta,skuId:`sku-${i}`,productId:`product-${i}`,tracking:'PRODUCT_SERIAL',unit:'cái',skuVersion:1,productVersion:1} };
    const receipt = {id:entityId,kind:'receipt',version:3,data:{...meta,code:'PN-QA-1',mode:'PRODUCT',sourceText:'Supplier',referenceText:'QA-source',status:'POSTED',appSubmissionId:'qa-submission',submittedVersion:2,submittedHash:'qa-hash',postedEventIds:[`event:${suffix}`]}};
    const primary = i === 2 ? scenario : i === 1 ? receipt : profile;
    const before = i === 1 ? [{...receipt,version:2,data:{...receipt.data,status:'SUBMITTED',postedEventIds:[]}}] : [];
    const event = { id:`event:${suffix}`,kind:'stock-event',version:1,data:{...meta,eventType:'RECEIPT_POST',documentId:`receipt:${suffix}`,sourceLineId:`line:${suffix}`,skuId:`sku-${i}`,unit:'cái',signedQuantity:1,physicalIds:[],boxId:null,originalEventId:null,commandId,actor,committedAt:timestamp,commitSnapshotId} };
    const events = i === 1 ? [event] : [];
    const audit = { id,kind:'audit-event',version:1,data:{...meta,actor,action,entityId,commandId,sourceSurface:i === 2 ? 'QA' : 'WEB',timestamp,commitSnapshotId,previousVersion:i === 1 ? 2 : null,newVersion:primary.version,FK:i === 1 ? [entityId] : [],eventIds:events.map(e=>e.id)} };
    if(i === 1) receipts.push(receipt); else if(i !== 2) profiles.push(profile);
    auditEvents.push(audit); stockEvents.push(...events);
    commitSnapshots.push(createCommitSnapshot({id:commitSnapshotId,epoch,revision:i === 2 ? 1 : i+2,commandId,actorKey:actor,committedAt:timestamp},before,[primary,...events,audit]));
  }
  return { mode:'MOCK',complete:true,actorKey:'preview:ducquang',epoch,snapshotRevision:count+1,token:{epoch,revision:count+1,scenarioId,generation},scenario,profiles,auditEvents,stockEvents,commitSnapshots,
    receipts,lines:[],physical:[],boxes:[],outbounds:[],warrantyCases:[],caseEvents:[],partsIssues:[],reversals:[],evidence:[],appSubmissions:[],scanObservations:[],physicalRegistry:[],putaways:[],setupMasters:[],archivedCommitSnapshots:[],stock:[] } as OperationalSnapshot;
}
