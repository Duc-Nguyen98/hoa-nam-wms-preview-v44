import type { BusinessReceipt, BusinessRecord } from '../preview-mock/business-repository';
export type OperationalSurface = 'WEB' | 'QA' | 'APP_P04' | 'APP_P05' | 'APP_P09' | 'APP_P19';
export type Tracking = 'PRODUCT_SERIAL' | 'COMPONENT_BOX';
export interface OperationalScope { scenarioId: string | null; generation: number }
export interface OperationalPayloads {
  'qa.product.set-status': { confirmed: true; status: 'active' | 'inactive' };
  'qa.sku.set-status': { confirmed: true; status: 'active' | 'inactive' };
  'qa.recipient.set-status': { confirmed: true; status: 'active' | 'inactive' };
  'scenario.reset-own': { confirmed: true; selectedSkuIds: string[] };
  'stock-profiles.create': { skuId: string; tracking: Tracking; observedSkuVersion: number; observedProductVersion: number };
  'inbound.create': { mode: 'PRODUCT' | 'COMPONENT'; sourceText: string; referenceText: string; previewCode?: string };
  'inbound.update-header': OperationalPayloads['inbound.create'];
  'inbound.scan': { receiptId: string; clientScanId: string; skuId: string; tracking: Tracking; physicalCode: string; quantity?: number };
  'inbound.submit': { receiptId: string };
  'inbound.post': { receiptId: string };
  'putaway.create': { boxId: string; observedBoxVersion: number };
  'putaway.confirm': { trayId: string };
  'putaway.cancel': { reason: string };
  'outbound.create': { recipientId:string; observedRecipientVersion:number; requestedLines:{skuId:string;quantity:number;observedSkuVersion:number;observedProductVersion:number}[] };
  'outbound.scan': { outboundId:string;clientScanId:string;physicalCode:string };
  'outbound.submit': { outboundId:string };
  'outbound.receive': { outboundId:string };
  'outbound.post': { outboundId:string };
  'warranty.intake': { identityMode:'TEMP_ONLY'|'SERIAL';skuId:string;physicalId:string|null;customerReportedIssue:string };
  'warranty.diagnose': { defectIds:string[];technicianDiagnosis:string;expectedFinishDate:string|null };
  'warranty.transition': { state:'REPAIRING'|'REPAIRED'|'RETURNED' };
  'parts.create': { caseId:string;observedCaseVersion:number };
  'parts.save': { lines:{physicalCode:string;quantity?:number;observedVersion:number}[] };
  'parts.post': { issueId:string };
  'reversal.create': { originalIssueId:string;observedIssueVersion:number;returnedUnused:true;reasonText:string };
  'reversal.attach-evidence': { label:string;mediaType:string;bytes:number[] };
  'reversal.confirm-return': { confirmed:true };
  'reversal.post': { reversalId:string };
  'reversal.cancel': { reason:string };
}
export type OperationalCommandName = keyof OperationalPayloads;
export type OperationalCommand<C extends OperationalCommandName = OperationalCommandName> = OperationalScope & {
  commandId: string; epoch: string; command: C; entityId?: string; expectedVersion?: number; payload: OperationalPayloads[C];
};
export interface OperationalMeta { scenarioId: string; generation: number; warehouseId: 'warehouse-hn-01'; createdAt: string; createdBy: string; updatedAt: string; updatedBy: string }
export interface ScenarioData extends OperationalMeta { ownerActor: string; status: 'ACTIVE' | 'ARCHIVED'; selectedSkuIds: string[]; setupManifestId: 'HN-SIX-FLOWS-v0.1'; startedAt: string }
export interface StockProfileData extends OperationalMeta { skuId: string; productId: string; tracking: Tracking; unit: string; skuVersion: number; productVersion: number }
export interface ReceiptData extends OperationalMeta { code: string; mode: 'PRODUCT' | 'COMPONENT'; sourceText: string; referenceText: string; status: 'DRAFT' | 'SCANNING' | 'SUBMITTED' | 'POSTED'; appSubmissionId: string | null; submittedVersion: number | null; submittedHash: string | null; postedEventIds: string[] }
export interface InboundLineData extends OperationalMeta { receiptId: string; skuId: string; tracking: Tracking; unit: string; quantity: number; physicalIds: string[]; boxId: string | null; skuVersion: number; productVersion: number; profileId: string; profileVersion: number }
export interface PhysicalData extends OperationalMeta { physicalCode: string; skuId: string; sourceReceiptId: string; sourceLineId: string; unit: string; status: 'PENDING_RECEIPT' | 'IN_STOCK' | 'ISSUED'; issuedDocumentId: string | null }
export interface BoxData extends PhysicalData { posted: boolean; trayId: string | null; contentRevision: number }
export interface OutboundData extends OperationalMeta { code:string;appRequestId:string;recipientId:string;recipientVersion:number;recipientSnapshot:unknown|null;requestedLines:{id:string;skuId:string;quantity:number;skuVersion:number;productVersion:number}[];allocatedPhysicalIds:string[];status:'DRAFT'|'SCANNING'|'SUBMITTED'|'READY'|'POSTED';submissionId:string|null;submittedHash:string|null;submittedVersion:number|null;postedEventIds:string[] }
export interface WarrantyCaseData extends OperationalMeta { code:string;identityMode:'TEMP_ONLY'|'SERIAL';physicalId:string|null;temporaryIdentity:string|null;skuId:string;productSnapshot:unknown;receivedAt:string;customerReportedIssue:string;technicianDiagnosis:string;defectIds:string[];defectSnapshot:unknown[];expectedFinishDate:string|null;state:'RECEIVED'|'CHECKING'|'REPAIRING'|'REPAIRED'|'RETURNED' }
export interface PutawayData extends OperationalMeta { boxId:string; receiptId:string; capturedBoxVersion:number; capturedContentRevision:number; quantityAtCreate:number; status:'DRAFT'|'CONFIRMED'|'CANCELLED'; trayId:string|null; cancellationReason:string|null }
export interface PartsLine { id:string;skuId:string;tracking:'SERIAL'|'BOX_QUANTITY';physicalIds:string[];boxId:string|null;quantity:number;unit:string;observedVersion:number;contentRevision:number|null;skuVersion:number;productVersion:number }
export interface PartsIssueData extends OperationalMeta { code:string;caseId:string;caseVersion:number;purpose:'WARRANTY';status:'DRAFT'|'SCANNING'|'POSTED';lines:PartsLine[];postedEventIds:string[] }
export interface ReversalData extends OperationalMeta { code:string;originalIssueId:string;originalIssueVersion:number;originalEventIds:string[];originalLineIds:string[];status:'DRAFT'|'POSTED'|'CANCELLED';physicalReturn:'PENDING'|'CONFIRMED';returnedUnused:true;evidenceRefs:string[];reasonText:string;postedCompensationEventIds:string[];cancelReason:string|null }
export interface StockEventData extends OperationalMeta { eventType: 'RECEIPT_POST'|'OUTBOUND_POST'|'PARTS_ISSUE_POST'|'REVERSAL_POST'; documentId: string; sourceLineId: string; skuId: string; unit: string; signedQuantity: number; physicalIds: string[]; boxId: string | null; originalEventId: string|null; commandId: string; actor: string; committedAt: string; commitSnapshotId: string }
export type TypedOperationalRecord<T> = Omit<BusinessRecord,'data'> & { data: T };
export interface OperationalSnapshot {
  mode: 'MOCK'; complete: true; actorKey: string; epoch: string; snapshotRevision: number;
  token: { epoch: string; revision: number; scenarioId: string | null; generation: number };
  scenario: TypedOperationalRecord<ScenarioData> | null;
  profiles: TypedOperationalRecord<StockProfileData>[];
  receipts: TypedOperationalRecord<ReceiptData>[];
  lines: TypedOperationalRecord<InboundLineData>[];
  physical: TypedOperationalRecord<PhysicalData>[];
  boxes: TypedOperationalRecord<BoxData>[];
  stockEvents: TypedOperationalRecord<StockEventData>[];
  outbounds:TypedOperationalRecord<OutboundData>[]; warrantyCases:TypedOperationalRecord<WarrantyCaseData>[]; caseEvents:BusinessRecord[];
  partsIssues:TypedOperationalRecord<PartsIssueData>[]; reversals:TypedOperationalRecord<ReversalData>[]; evidence:BusinessRecord[];
  appSubmissions:BusinessRecord[]; scanObservations:BusinessRecord[]; physicalRegistry:BusinessRecord[];
  putaways: TypedOperationalRecord<PutawayData>[]; setupMasters: BusinessRecord[];
  auditEvents: BusinessRecord[]; commitSnapshots: BusinessRecord[];
  /** Read-only immutable proofs from this actor's archived generations; never active projections. */
  archivedCommitSnapshots: BusinessRecord[];
  stock: { skuId: string; warehouseId: string; unit: string; quantity: number }[];
}
export interface OperationalOutcome { receipt: BusinessReceipt; replayed: boolean }
export interface OperationalService {
  read(signal?: AbortSignal): Promise<OperationalSnapshot>;
  execute(request: OperationalCommand, signal?: AbortSignal): Promise<OperationalOutcome>;
}
