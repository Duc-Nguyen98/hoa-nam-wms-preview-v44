import { PV_DEMO_ASSETS, PV_DEMO_KIND, PV_DEMO_PROVENANCE, type PvCreatePayload, type PvUpdatePayload, type PvDemoRequest, type PvDemoOutcome, type PvDemoSnapshot, type PvProfile, type PvAudit } from '../contracts/pv-demo';
import { canonicalBusinessJson as json, type BusinessActor, type BusinessCommand, type BusinessHandler, type BusinessRecord, type BusinessSnapshot, type BusinessRepositoryOptions } from './business-repository';
import { projectCatalogSnapshot } from './catalog-policy';
import { CATALOG_KINDS } from '../contracts/catalog-create';
import { INACTIVE_MASTER_ALLOWLIST } from './inactive-master-allowlist';
import { PreviewHttpError } from './errors';

const actorKey = 'preview:ducquang';
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const positive = (v: unknown): v is number => Number.isSafeInteger(v) && Number(v) > 0;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const id = (v: unknown, prefix: string): v is string => typeof v === 'string' && v.startsWith(prefix) && uuid.test(v.slice(prefix.length));
const iso = (v: unknown): v is string => typeof v === 'string' && Number.isFinite(Date.parse(v)) && new Date(v).toISOString() === v;
const fail = (code: string, status = 422, field?: string): never => { throw new PreviewHttpError(status, code, 'Không thể hoàn tất hồ sơ PV Demo.', field ? { field } : undefined); };
const invalid = (field: string): never => fail('VALIDATION_FAILED', 422, field);
const corrupt = (): never => fail('MOCK_STATE_INVALID', 503);
const excluded = (value: string) => INACTIVE_MASTER_ALLOWLIST.some(row => row.entityId === value);
function exact(input: Record<string, unknown>, keys: string[]) {
  const extra = Object.keys(input).find(key => !keys.includes(key));
  if (extra) invalid(extra);
  const missing = keys.find(key => !Object.hasOwn(input, key));
  if (missing) invalid(missing);
}
export function normalizePvPayload(command: string, input: unknown): PvCreatePayload | PvUpdatePayload {
  if (!['pv-products.create', 'pv-products.update'].includes(command) || !object(input)) return invalid('payload');
  const creating = command === 'pv-products.create';
  exact(input, ['observedSkuVersion', 'observedProductVersion', 'displayName', 'imageAssetId', 'visibility', ...(creating ? ['skuId', 'productId'] : [])]);
  if (typeof input.displayName !== 'string' || /[\u0000-\u001f\u007f-\u009f\u2028\u2029]/u.test(input.displayName)) return invalid('displayName');
  const displayName = input.displayName.trim().normalize('NFC');
  if ([...displayName].length < 1 || [...displayName].length > 120) return invalid('displayName');
  if (input.imageAssetId !== null && !PV_DEMO_ASSETS.some(asset => asset.assetId === input.imageAssetId)) return invalid('imageAssetId');
  if (input.visibility !== 'hidden' && input.visibility !== 'visible') return invalid('visibility');
  if (!positive(input.observedSkuVersion)) return invalid('observedSkuVersion');
  if (!positive(input.observedProductVersion)) return invalid('observedProductVersion');
  const common: PvUpdatePayload = { displayName, imageAssetId: input.imageAssetId as string | null, visibility: input.visibility, observedSkuVersion: input.observedSkuVersion, observedProductVersion: input.observedProductVersion };
  if (!creating) return common;
  if (!id(input.skuId, 'preview-sku:') || excluded(input.skuId)) return invalid('skuId');
  if (!id(input.productId, 'preview-product:') || excluded(input.productId)) return invalid('productId');
  return { ...common, skuId: input.skuId, productId: input.productId };
}
type StoredProfile = Omit<PvProfile, 'id' | 'version' | 'masterAvailable'>;
function assertProfile(record: BusinessRecord): asserts record is BusinessRecord & { data: StoredProfile } {
  if (record.kind !== PV_DEMO_KIND || !id(record.id, 'preview-pv:') || !positive(record.version) || !object(record.data)) return corrupt();
  const d = record.data;
  try {
    exact(d, ['skuId','productId','displayName','imageAssetId','visibility','provenance','createdAt','updatedAt','createdBy','updatedBy']);
    const payload = { skuId: d.skuId, productId: d.productId, displayName: d.displayName, imageAssetId: d.imageAssetId, visibility: d.visibility, observedSkuVersion: 1, observedProductVersion: 1 };
    if (json(normalizePvPayload('pv-products.create', payload)) !== json(payload) || d.provenance !== PV_DEMO_PROVENANCE
      || !iso(d.createdAt) || !iso(d.updatedAt) || d.updatedAt < d.createdAt || d.createdBy !== actorKey || d.updatedBy !== actorKey) return corrupt();
  } catch { return corrupt(); }
}
const profileView = (record: BusinessRecord): Omit<PvProfile, 'masterAvailable'> => { assertProfile(record); return { ...structuredClone(record.data), id: record.id, version: record.version }; };
function auditView(record: BusinessRecord): PvAudit {
  if (record.kind !== 'audit-event' || record.version !== 1 || !object(record.data)) return corrupt();
  const d = record.data;
  try { exact(d, ['domain','commandId','entityId','actorKey','committedAt','command','before','after','commitSnapshotId']); } catch { return corrupt(); }
  if (d.domain !== 'pv-demo' || typeof d.commandId !== 'string' || !uuid.test(d.commandId) || record.id !== `pv-audit:${d.commandId}` || d.actorKey !== actorKey
    || !iso(d.committedAt) || !id(d.commitSnapshotId, 'commit-snapshot:') || !object(d.after) || !['pv-products.create','pv-products.update'].includes(String(d.command))) return corrupt();
  function asRecord(value: Record<string, unknown>): BusinessRecord { const { id: profileId, version, ...data } = value; return { id: profileId as string, version: version as number, kind: PV_DEMO_KIND, data }; }
  const after = profileView(asRecord(d.after));
  const before = d.before === null ? null : object(d.before) ? profileView(asRecord(d.before)) : corrupt();
  if (after.id !== d.entityId || after.updatedAt !== d.committedAt || (d.command === 'pv-products.create'
    ? before !== null || after.version !== 1 || after.createdAt !== d.committedAt
    : !before || before.id !== after.id || before.version + 1 !== after.version || before.skuId !== after.skuId || before.productId !== after.productId || before.createdAt !== after.createdAt)) return corrupt();
  return { id: record.id, commandId: d.commandId, entityId: after.id, actorKey, committedAt: d.committedAt, command: d.command as PvAudit['command'], before, after };
}
export function projectPvDemoSnapshot(snapshot: Pick<BusinessSnapshot, 'epoch' | 'snapshotRevision' | 'records'>): PvDemoSnapshot {
  const catalog = projectCatalogSnapshot(snapshot);
  const profiles: PvProfile[] = [], audits: PvAudit[] = [], skus = new Set<string>();
  for (const record of snapshot.records) {
    const pvAudit = record.kind === 'audit-event' && object(record.data) && record.data.domain === 'pv-demo';
    if ((record.id.startsWith('pv-audit:') || object(record.data) && record.data.domain === 'pv-demo') && !pvAudit) return corrupt();
    if (record.kind === PV_DEMO_KIND) {
      const row = profileView(record);
      if (skus.has(row.skuId)) return corrupt();
      skus.add(row.skuId);
      const sku = catalog.skus.find(item => item.id === row.skuId), product = catalog.products.find(item => item.id === row.productId);
      profiles.push({ ...row, masterAvailable: !!sku && !!product && sku.productId === product.id && sku.status === 'active' && product.status === 'active' });
    } else if (record.id.startsWith('preview-pv:') || object(record.data) && record.data.provenance === PV_DEMO_PROVENANCE) return corrupt();
    if (pvAudit) audits.push(auditView(record));
  }
  for (const row of profiles) {
    const history = audits.filter(audit => audit.entityId === row.id).sort((a,b) => a.after.version - b.after.version);
    const { masterAvailable: _available, ...stored } = row;
    if (history.length !== row.version || !history.length || history[0].before !== null || json(history.at(-1)!.after) !== json(stored)) return corrupt();
    for (let i = 1; i < history.length; i++) if (json(history[i].before) !== json(history[i-1].after)) return corrupt();
  }
  if (audits.some(audit => !profiles.some(row => row.id === audit.entityId))) return corrupt();
  profiles.sort((a,b) => b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id));
  audits.sort((a,b) => b.committedAt.localeCompare(a.committedAt) || a.id.localeCompare(b.id));
  return { mode: 'MOCK', actorKey, epoch: snapshot.epoch, snapshotRevision: snapshot.snapshotRevision,
    products: catalog.products, skus: catalog.skus, profiles, audits, assets: PV_DEMO_ASSETS,
    summary: { total: profiles.length, visible: profiles.filter(r => r.visibility === 'visible').length, hidden: profiles.filter(r => r.visibility === 'hidden').length, missingImage: profiles.filter(r => r.imageAssetId === null).length } };
}
export const validatePvDemoHistory: NonNullable<BusinessRepositoryOptions['validateCanonicalState']> = (snapshot, committedCommand) => {
  if (!snapshot.records.some(r => r.kind === PV_DEMO_KIND || r.id.startsWith('preview-pv:') || r.id.startsWith('pv-audit:') || object(r.data) && (r.data.domain === 'pv-demo' || r.data.provenance === PV_DEMO_PROVENANCE))) return;
  const view = projectPvDemoSnapshot({ ...snapshot, records: [...snapshot.records], snapshotRevision: 1 });
  for (const audit of view.audits) {
    const proof = committedCommand(audit.actorKey, audit.commandId);
    if (!proof || !proof.receipt.changed || proof.receipt.commitSnapshotId !== (snapshot.records.find(r => r.id === audit.id)!.data as { commitSnapshotId: string }).commitSnapshotId
      || !isPvDemoOutcome({ receipt: proof.receipt, replayed: true }, proof.request as PvDemoRequest) || json(profileView(proof.receipt.record)) !== json(audit.after)) return corrupt();
  }
};
export function authorizePvDemo(actor: Readonly<BusinessActor>, request: Readonly<BusinessCommand>) {
  return actor.key === actorKey && actor.confirmed && ['pv-products.create','pv-products.update'].includes(request.command);
}
export const PV_DEMO_HANDLERS: Readonly<Record<string, BusinessHandler>> = Object.fromEntries(['create','update'].map(operation => [`pv-products.${operation}`, {
  operation: operation as 'create' | 'update', entityKind: PV_DEMO_KIND, idPrefix: 'preview-pv:', dependentWritesOnChangeOnly: true,
  apply(input, current, context) {
    if (!context || context.actorKey !== actorKey) return corrupt();
    const payload = normalizePvPayload(`pv-products.${operation}`, input);
    if (current) assertProfile(current);
    const old = current?.data as StoredProfile | undefined;
    const skuId = old?.skuId ?? (payload as PvCreatePayload).skuId, productId = old?.productId ?? (payload as PvCreatePayload).productId;
    const view = projectPvDemoSnapshot({ epoch: context.epoch, snapshotRevision: 1, records: [...context.records] });
    const sku = view.skus.find(row => row.id === skuId), product = view.products.find(row => row.id === productId);
    if (!sku || !product || sku.productId !== productId || sku.status !== 'active' || product.status !== 'active' || excluded(skuId) || excluded(productId)) return fail('MASTER_UNAVAILABLE', 409, 'skuId');
    if (sku.version !== payload.observedSkuVersion || product.version !== payload.observedProductVersion) return fail('STALE_MASTER_VERSION', 409, 'skuId');
    if (!current && view.profiles.some(row => row.skuId === skuId)) return fail('DUPLICATE_VALUE', 409, 'skuId');
    const editable = { displayName: payload.displayName, imageAssetId: payload.imageAssetId, visibility: payload.visibility };
    if (old && old.displayName === editable.displayName && old.imageAssetId === editable.imageAssetId && old.visibility === editable.visibility) return structuredClone(old);
    return { ...editable, skuId, productId, provenance: PV_DEMO_PROVENANCE, createdAt: old?.createdAt ?? context.committedAt, updatedAt: context.committedAt, createdBy: old?.createdBy ?? actorKey, updatedBy: actorKey };
  },
  dependentWrites(primary, context) {
    const old = context.records.find(row => row.id === primary.id);
    return [{ id: `pv-audit:${context.request.commandId}`, kind: 'audit-event', expectedVersion: null,
      data: { domain: 'pv-demo', commandId: context.request.commandId, entityId: primary.id, actorKey: context.actorKey, committedAt: context.committedAt,
        command: context.request.command, before: old ? profileView(old) : null, after: profileView(primary), commitSnapshotId: context.commitSnapshotId } }];
  },
} satisfies BusinessHandler]));

export function isPvDemoOutcome(value: unknown, request: PvDemoRequest, expectedActor = actorKey): value is PvDemoOutcome {
  try {
    if (!object(value) || typeof value.replayed !== 'boolean' || !object(value.receipt)) return false;
    const r = value.receipt;
    const row = profileView(r.record as BusinessRecord), p = normalizePvPayload(request.command, request.payload);
    if (r.mode !== 'MOCK' || r.actorKey !== actorKey || expectedActor !== actorKey || r.commandId !== request.commandId || r.epoch !== request.epoch || r.command !== request.command
      || r.entityId !== row.id || r.version !== row.version || !positive(r.snapshotRevision) || !iso(r.committedAt) || typeof r.changed !== 'boolean'
      || row.displayName !== p.displayName || row.visibility !== p.visibility || row.imageAssetId !== p.imageAssetId) return false;
    if (r.changed ? !id(r.commitSnapshotId, 'commit-snapshot:') || row.updatedAt !== r.committedAt : r.commitSnapshotId !== undefined) return false;
    if (request.command === 'pv-products.create') return r.previousVersion === null && r.changed && row.version === 1 && row.createdAt === r.committedAt && row.skuId === request.payload.skuId && row.productId === request.payload.productId;
    return row.id === request.entityId && r.previousVersion === request.expectedVersion && row.version === request.expectedVersion + Number(r.changed);
  } catch { return false; }
}
export function isPvDemoSnapshot(value: unknown): value is PvDemoSnapshot {
  try {
    if (!object(value) || value.mode !== 'MOCK' || value.actorKey !== actorKey || typeof value.epoch !== 'string' || !uuid.test(value.epoch) || !positive(value.snapshotRevision)
      || !Array.isArray(value.products) || !Array.isArray(value.skus) || !Array.isArray(value.profiles) || !Array.isArray(value.audits)) return false;
    const records: BusinessRecord[] = [];
    for (const [key, kind] of [['products',CATALOG_KINDS.product],['skus',CATALOG_KINDS.sku]] as const) for (const row of value[key] as Record<string, unknown>[]) {
      const { id: recordId, version, skuCount: _count, productCode: _code, ...data } = row;
      if (key === 'skus') for (const field of ['name','group','unit']) delete data[field];
      records.push({ id: recordId as string, version: version as number, kind, data });
    }
    for (const row of value.profiles) { const { id: recordId, version, masterAvailable: _available, ...data } = row; records.push({ id: recordId, version, kind: PV_DEMO_KIND, data }); }
    for (const row of value.audits) { const { id: recordId, ...data } = row; records.push({ id: recordId, version: 1, kind: 'audit-event', data: { ...data, domain: 'pv-demo', commitSnapshotId: 'commit-snapshot:00000000-0000-4000-8000-000000000001' } }); }
    return json(projectPvDemoSnapshot({ epoch: value.epoch, snapshotRevision: value.snapshotRevision, records })) === json(value);
  } catch { return false; }
}
