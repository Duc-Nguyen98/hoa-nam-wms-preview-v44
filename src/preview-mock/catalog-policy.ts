import {
  CATALOG_COMMANDS, CATALOG_KINDS, CATALOG_PROVENANCE, PRODUCT_GROUPS, PRODUCT_UNITS, RECIPIENT_TYPES, RECIPIENT_MARKETS,
  type CatalogDomain, type CatalogPayloads, type CatalogSnapshot, type CatalogProduct, type CatalogSku, type CatalogRecipient, type CatalogCreateRequest, type CatalogCreateOutcome,
} from '../contracts/catalog-create';
import { canonicalBusinessJson, type BusinessActor, type BusinessCommand, type BusinessHandler, type BusinessRecord, type BusinessSnapshot } from './business-repository';
import { PreviewHttpError } from './errors';
import { INACTIVE_MASTER_ALLOWLIST } from './inactive-master-allowlist';

const domains: CatalogDomain[] = ['product', 'sku', 'recipient'];
const prefixes = { product: 'preview-product:', sku: 'preview-sku:', recipient: 'preview-recipient:' } as const;
const fields = {
  product: ['code', 'name', 'group', 'unit', 'status'],
  sku: ['code', 'productId', 'observedProductVersion', 'barcode', 'status'],
  recipient: ['code', 'name', 'type', 'market', 'area', 'address', 'contact', 'phone', 'status'],
} as const;
const reserved = {
  product: ['SP-HN-001', 'SP-HN-002', 'SP-HN-003', 'SP-HN-004', 'SP-HN-005', 'SP-HN-006', 'SP-HN-007'],
  sku: ['HN-A01', 'HN-B12', 'HN-C03', 'HN-D08', 'HN-E11', 'HN-F06', 'HN-G15'],
  recipient: ['NR-001', 'NR-002', 'NR-003', 'NR-004', 'NR-005'],
};
const reservedBarcodes = ['8938500123451', '8938500123452', '8938500123453', '8938500123454', '8938500123455', '8938500123456', '8938500123457'];
const uuidV4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const controls = /[\u0000-\u001f\u007f-\u009f\u2028\u2029]/u;
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const invalid = (field: string): never => { throw new PreviewHttpError(422, 'VALIDATION_FAILED', 'Trường dữ liệu chưa hợp lệ.', { field }); };
const corrupt = (): never => { throw new PreviewHttpError(503, 'MOCK_STATE_INVALID', 'Không thể đọc hồ sơ đã lưu.'); };
const conflict = (field: string): never => { throw new PreviewHttpError(409, 'DUPLICATE_VALUE', 'Giá trị đã tồn tại.', { field }); };
function text(value: unknown, field: string, min: number, max: number): string {
  if (typeof value !== 'string' || controls.test(value)) return invalid(field);
  const normalized = value.trim().normalize('NFC');
  if ([...normalized].length < min || [...normalized].length > max) return invalid(field);
  return normalized;
}
function option<T extends string>(value: unknown, field: string, options: readonly T[]): T {
  if (typeof value !== 'string' || !options.includes(value as T)) return invalid(field);
  return value as T;
}
/** Normalize once before journaling. The transaction independently repeats these checks. */
export function normalizeCatalogPayload<D extends CatalogDomain>(domain: D, input: unknown): CatalogPayloads[D] {
  if (!domains.includes(domain) || !object(input)) return invalid('payload');
  const allowed: readonly string[] = fields[domain];
  const extra = Object.keys(input).find(key => !allowed.includes(key));
  if (extra) return invalid(extra);
  const missing = allowed.find(key => !Object.hasOwn(input, key));
  if (missing) return invalid(missing);
  if (typeof input.code !== 'string' || controls.test(input.code)) return invalid('code');
  const rawCode = input.code.trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9-]{0,39}$/.test(rawCode)) return invalid('code');
  const code = rawCode.toUpperCase(), status = option(input.status, 'status', ['active', 'inactive']);
  let result: CatalogPayloads[CatalogDomain];
  if (domain === 'product') {
    result = { code, name: text(input.name, 'name', 1, 200), group: option(input.group, 'group', PRODUCT_GROUPS), unit: option(input.unit, 'unit', PRODUCT_UNITS), status };
  } else if (domain === 'sku') {
    if (typeof input.productId !== 'string' || !input.productId.startsWith(prefixes.product) || !uuidV4.test(input.productId.slice(prefixes.product.length))) return invalid('productId');
    if (!Number.isSafeInteger(input.observedProductVersion) || Number(input.observedProductVersion) < 1) return invalid('observedProductVersion');
    let barcode: string | null = null;
    if (input.barcode !== null) {
      if (typeof input.barcode !== 'string' || controls.test(input.barcode)) return invalid('barcode');
      barcode = input.barcode.trim() || null;
      if (barcode !== null && !/^[!-~]{1,64}$/.test(barcode)) return invalid('barcode');
    }
    result = { code, productId: input.productId, observedProductVersion: input.observedProductVersion as number, barcode, status };
  } else {
    const phone = text(input.phone, 'phone', 0, 32);
    if (phone && (!/^[0-9 +()\-]+$/.test(phone) || !/^[0-9]{6,15}$/.test(phone.replace(/[^0-9]/g, '')))) return invalid('phone');
    result = { code, name: text(input.name, 'name', 1, 120), type: option(input.type, 'type', RECIPIENT_TYPES), market: option(input.market, 'market', RECIPIENT_MARKETS),
      area: text(input.area, 'area', 1, 120), address: text(input.address, 'address', 1, 300), contact: text(input.contact, 'contact', 0, 100), phone, status };
  }
  return result as CatalogPayloads[D];
}
function recordDomain(record: BusinessRecord): CatalogDomain | undefined {
  return domains.find(domain => record.kind === CATALOG_KINDS[domain]);
}
function assertRecord(record: BusinessRecord, domain: CatalogDomain) {
  if (!record.id.startsWith(prefixes[domain]) || !uuidV4.test(record.id.slice(prefixes[domain].length)) || !object(record.data)) return corrupt();
  if (record.version !== 1) {
    const approved = INACTIVE_MASTER_ALLOWLIST.find(entry => entry.entityId === record.id && entry.kind === record.kind);
    if (!approved || ![2, 3].includes(record.version)
      || canonicalBusinessJson(record.data) !== canonicalBusinessJson({ ...approved.originalReceipt.record.data, status: record.version === 2 ? 'inactive' : 'active' })) return corrupt();
  }
  const data = record.data;
  const storedFields = fields[domain].filter(field => field !== 'observedProductVersion');
  const allowed = [...storedFields, 'provenance', 'createdAt', 'updatedAt'];
  if (Object.keys(data).length !== allowed.length || Object.keys(data).some(key => !allowed.includes(key))
    || data.provenance !== CATALOG_PROVENANCE || typeof data.createdAt !== 'string' || !Number.isFinite(Date.parse(data.createdAt))
    || new Date(data.createdAt).toISOString() !== data.createdAt || data.updatedAt !== data.createdAt) return corrupt();
  const payload = Object.fromEntries(storedFields.map(field => [field, data[field]]));
  if (domain === 'sku') payload.observedProductVersion = 1;
  try { if (canonicalBusinessJson(normalizeCatalogPayload(domain, payload)) !== canonicalBusinessJson(payload)) return corrupt(); }
  catch { return corrupt(); }
}
/** Fail closed for malformed additive records, duplicate keys or broken relationships. */
export function projectCatalogSnapshot(snapshot: Pick<BusinessSnapshot, 'epoch' | 'snapshotRevision' | 'records'>): CatalogSnapshot {
  const result: CatalogSnapshot = { actorKey: 'preview:ducquang', epoch: snapshot.epoch, snapshotRevision: snapshot.snapshotRevision, products: [], skus: [], recipients: [] };
  const codes = { product: new Set(reserved.product), sku: new Set(reserved.sku), recipient: new Set(reserved.recipient) };
  const barcodes = new Set(reservedBarcodes), ids = new Set<string>();
  for (const record of snapshot.records) {
    const domain = recordDomain(record);
    if (!domain) {
      if (domains.some(d => record.id.startsWith(prefixes[d])) || object(record.data) && record.data.provenance === CATALOG_PROVENANCE) return corrupt();
      continue;
    }
    assertRecord(record, domain);
    const data = record.data as Record<string, unknown>;
    if (ids.has(record.id) || codes[domain].has(data.code as string)) return corrupt();
    ids.add(record.id); codes[domain].add(data.code as string);
    const row = { ...structuredClone(data), id: record.id, version: record.version };
    if (domain === 'product') result.products.push({ ...row, skuCount: 0 } as CatalogProduct);
    else if (domain === 'recipient') result.recipients.push(row as CatalogRecipient);
    else {
      if (data.barcode !== null) {
        if (barcodes.has(data.barcode as string)) return corrupt();
        barcodes.add(data.barcode as string);
      }
      result.skus.push(row as CatalogSku);
    }
  }
  for (const sku of result.skus) {
    const product = result.products.find(row => row.id === sku.productId);
    if (!product || product.status !== 'active' && !(product.version === 2
      && INACTIVE_MASTER_ALLOWLIST.some(entry => entry.entityId === product.id && entry.kind === CATALOG_KINDS.product)
      && INACTIVE_MASTER_ALLOWLIST.some(entry => entry.entityId === sku.id && entry.kind === CATALOG_KINDS.sku))) return corrupt();
    product.skuCount++;
    Object.assign(sku, { productCode: product.code, name: product.name, group: product.group, unit: product.unit });
  }
  const order = (a: {createdAt: string; id: string}, b: {createdAt: string; id: string}) => b.createdAt.localeCompare(a.createdAt) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  result.products.sort(order); result.skus.sort(order); result.recipients.sort(order);
  return result;
}
export function authorizeCatalogCreate(actor: Readonly<BusinessActor>, command: Readonly<BusinessCommand>) {
  return actor.key === 'preview:ducquang' && actor.confirmed === true && Object.values(CATALOG_COMMANDS).some(value => value === command.command);
}
export function isCatalogSnapshot(value: unknown): value is CatalogSnapshot {
  try {
    if (!object(value) || value.actorKey !== 'preview:ducquang' || typeof value.epoch !== 'string' || !uuidV4.test(value.epoch)
      || !Number.isSafeInteger(value.snapshotRevision) || Number(value.snapshotRevision) < 1) return false;
    const records: BusinessRecord[] = [];
    for (const domain of domains) {
      const rows = value[domain === 'product' ? 'products' : domain === 'sku' ? 'skus' : 'recipients'];
      if (!Array.isArray(rows)) return false;
      for (const row of rows) {
        if (!object(row) || typeof row.id !== 'string' || typeof row.version !== 'number') return false;
        const data = { ...row }; delete data.id; delete data.version;
        if (domain === 'product') delete data.skuCount;
        if (domain === 'sku') { delete data.productCode; delete data.name; delete data.group; delete data.unit; }
        records.push({ id: row.id, version: row.version, kind: CATALOG_KINDS[domain], data });
      }
    }
    return canonicalBusinessJson(projectCatalogSnapshot({ epoch: value.epoch, snapshotRevision: value.snapshotRevision as number, records })) === canonicalBusinessJson(value);
  } catch { return false; }
}
export function isCatalogCreateOutcome(value: unknown, request: CatalogCreateRequest, actorKey = 'preview:ducquang'): value is CatalogCreateOutcome {
  try {
    if (!object(value) || typeof value.replayed !== 'boolean' || !object(value.receipt)) return false;
    const receipt = value.receipt;
    const domain = domains.find(d => CATALOG_COMMANDS[d] === request.command);
    if (!domain || !object(receipt.record)) return false;
    const record = receipt.record as unknown as BusinessRecord;
    if (record.kind !== CATALOG_KINDS[domain] || record.version !== 1) return false;
    assertRecord(record, domain);
    const data = record.data as Record<string, unknown>, expected = { ...normalizeCatalogPayload(domain, request.payload) } as Record<string, unknown>;
    delete expected.observedProductVersion;
    Object.assign(expected, { provenance: CATALOG_PROVENANCE, createdAt: receipt.committedAt, updatedAt: receipt.committedAt });
    return receipt.mode === 'MOCK' && receipt.actorKey === actorKey && actorKey === 'preview:ducquang'
      && receipt.commandId === request.commandId && receipt.epoch === request.epoch && receipt.command === request.command
      && receipt.entityId === record.id && receipt.previousVersion === null && receipt.version === 1 && receipt.changed === true
      && Number.isSafeInteger(receipt.snapshotRevision) && Number(receipt.snapshotRevision) >= 2
      && canonicalBusinessJson(data) === canonicalBusinessJson(expected);
  } catch { return false; }
}
export const CATALOG_CREATE_HANDLERS: Readonly<Record<string, BusinessHandler>> = Object.fromEntries(domains.map(domain => [CATALOG_COMMANDS[domain], {
  operation: 'create', entityKind: CATALOG_KINDS[domain], idPrefix: prefixes[domain],
  apply(input: unknown, _current: Readonly<BusinessRecord> | undefined, context?: { records: readonly BusinessRecord[]; entityId: string; committedAt: string }) {
    if (!context || !context.entityId.startsWith(prefixes[domain]) || !uuidV4.test(context.entityId.slice(prefixes[domain].length))) return corrupt();
    const payload = normalizeCatalogPayload(domain, input);
    const view = projectCatalogSnapshot({ epoch: '', snapshotRevision: 1, records: [...context.records] });
    const rows = domain === 'product' ? view.products : domain === 'sku' ? view.skus : view.recipients;
    if (reserved[domain].includes(payload.code) || rows.some(row => row.code === payload.code)) return conflict('code');
    if (domain === 'sku') {
      const sku = payload as CatalogPayloads['sku'];
      const product = view.products.find(row => row.id === sku.productId);
      if (!product || product.status !== 'active') throw new PreviewHttpError(409, 'PRODUCT_UNAVAILABLE', 'Sản phẩm không còn khả dụng.', { field: 'productId' });
      if (product.version !== sku.observedProductVersion) throw new PreviewHttpError(409, 'STALE_PRODUCT_VERSION', 'Phiên bản sản phẩm đã thay đổi.', { field: 'productId' });
      if (sku.barcode !== null && (reservedBarcodes.includes(sku.barcode) || view.skus.some(row => row.barcode === sku.barcode))) return conflict('barcode');
    }
    const stored = { ...payload } as Record<string, unknown>;
    delete stored.observedProductVersion;
    return { ...stored, provenance: CATALOG_PROVENANCE, createdAt: context.committedAt, updatedAt: context.committedAt };
  },
} satisfies BusinessHandler]));
