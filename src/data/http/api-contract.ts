/** Versioned local integration contract. A real service must implement this contract to be URL-compatible. */
export const API_VERSION = '1' as const;
export const BUSINESS_RESOURCES = {
  S01: 'overview', S02: 'defects', S03: 'products', S04: 'skus', S05: 'recipients', S06: 'pv-products',
  S09: 'warranty-cases', S10: 'parts-slips', S11: 'trays', S12: 'receipts', S13: 'putaway-queue',
  S14: 'putaway-orders', S15: 'outbound-slips', S16: 'inventory', S17: 'reversals',
  S18: 'reports/inbound', S19: 'reports/outbound', S20: 'reports/movements', S21: 'reports/inventory',
  S22: 'reports/warranty', S23: 'reports/labels', S24: 'reports/data-quality',
  S25: 'reports/dealer-exports', S26: 'reports/goods-trace',
} as const;
export type BusinessScreenId = keyof typeof BUSINESS_RESOURCES;
export interface ApiSuccess<T> { apiVersion: typeof API_VERSION; requestId: string; data: T }
export interface ApiFailure { apiVersion: typeof API_VERSION; requestId: string; error: { code: string; message: string; details?: unknown } }
export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
/** Strings stay strings (including leading-zero codes); objects and null use JSON. */
export function serializeQuery(query: object): Record<string, string> {
  return Object.fromEntries(Object.entries(query).filter(([, value]) => value !== undefined)
    .map(([key, value]) => [key, typeof value === 'string' ? value : JSON.stringify(value)]));
}

type RowShape = { strings?: string; numbers?: string; nullableStrings?: string; nullableNumbers?: string; booleans?: string };
const rowShapes: Record<Exclude<BusinessScreenId, 'S22'>, RowShape> = {
  S01: { strings: 'id number type typeLabel partner warehouse actor day time timeLabel status statusLabel', numbers: 'quantity' },
  S02: { strings: 'key ordinal code name description status statusLabel' },
  S03: { strings: 'key code name group unit status statusLabel updatedAt', numbers: 'skuCount' },
  S04: { strings: 'key code name group unit barcode status statusLabel updatedAt' },
  S05: { strings: 'key code name type market area contact phone address status statusLabel' },
  S06: { strings: 'key productName productCode sku productGroup visibilityLabel updatedAtLabel', booleans: 'missingImage', nullableStrings: 'thumbnailUrl' },
  S09: { strings: 'caseCode identity product maskedCustomer receiptAndDueDate statusLabel ageAtSnapshot reviewAction' },
  S10: { strings: 'slipCode warrantyCaseCode componentSummary quantitySummary trackingLabel slipStatus updatedAtLabel' },
  S11: { strings: 'trayCode updatedAtLabel', numbers: 'boxCount skuCount', nullableStrings: 'latestPackingOrder' },
  S12: { strings: 'receipt source reference creator status updatedAt action', numbers: 'skuCount codeCount' },
  S13: { strings: 'boxCode sku componentName receiptCode status updatedAt action', numbers: 'quantity' },
  S14: { strings: 'orderCode boxCode sku sourceReceipt destinationTray status updatedAt version action', numbers: 'quantity' },
  S15: { strings: 'issueCode requestCode recipient createdAt note reconciliation status action' },
  S16: { strings: 'renderKey sku name itemType stockStatus unit suggestedLocation reconciliation warehouse', nullableNumbers: 'available onHand ledger difference' },
  S17: { strings: 'renderKey code originalDocument status reason reasonDetail', nullableNumbers: 'totalQuantity', nullableStrings: 'createdAt createdBy' },
  S18: { strings: 'renderKey code receivedDate supplier status creator', nullableNumbers: 'receivedQuantity' },
  S19: { strings: 'renderKey code shippedDate customer status creator', nullableNumbers: 'shippedQuantity' },
  S20: { strings: 'renderKey occurredAt type code subject performer', numbers: 'quantity' },
  S21: { strings: 'renderKey sku name status', numbers: 'opening inbound outboundProducts outboundWarranty reversals closing actual difference' },
  S23: { strings: 'labelCode documentCode sku productName printedAt status', numbers: 'printCount' },
  S24: { strings: 'referenceCode object result detail updatedAt', nullableStrings: 'systemValue comparisonValue' },
  S25: { strings: 'rowKey dealer recipient lastExport', numbers: 'documents products completed incomplete' },
  S26: { strings: 'sku name serial lot pallet status lastEvent updatedAt', nullableStrings: 'location', numbers: 'completeness' },
};
function validRow(row: unknown, shape: RowShape): boolean {
  if (!isRecord(row)) return false;
  const check = (keys: string | undefined, type: string, nullable = false) => !keys || keys.split(' ').every(key =>
    (nullable && row[key] === null) || (typeof row[key] === type && (type !== 'number' || Number.isFinite(row[key]))));
  return check(shape.strings, 'string') && check(shape.numbers, 'number') && check(shape.booleans, 'boolean')
    && check(shape.nullableStrings, 'string', true) && check(shape.nullableNumbers, 'number', true);
}

const summaryShapes: Record<BusinessScreenId, RowShape> = {
  S01: { numbers: 'inbound outbound openWarranties posted waiting', nullableNumbers: 'stockTotal', strings: 'stockDisplay stockHelp' },
  S02: { numbers: 'total active inactive', strings: 'activePercentage inactivePercentage scope' },
  S03: { numbers: 'productsTotal linkedSkus active inactive', strings: 'activePercentage inactivePercentage scope' },
  S04: { numbers: 'skusTotal active inactive', strings: 'activePercentage inactivePercentage scope' },
  S05: { numbers: 'total', strings: 'scope auditDate' },
  S06: { numbers: 'total visible hidden missingImage' },
  S09: { numbers: 'total completed incomplete overdueWithinIncomplete progressPercent', strings: 'snapshot' },
  S10: { numbers: 'total exported draft scanning cancelled exportedPercent', strings: 'snapshot' },
  S11: { numbers: 'trayCount boxCount' },
  S12: { numbers: 'totalReceipts received draft recording scannedCodeAggregate', strings: 'percentage' },
  S13: { numbers: 'boxCount skuCount quantityAggregate' },
  S14: { numbers: 'totalOrders confirmedOrders draftOrders cancelledOrders relatedQueueBadge' },
  S15: { numbers: 'totalDocuments draftDocuments scanningDocuments exportedDocuments cancelledDocuments' },
  S16: { numbers: 'detailRows', strings: 'scopeLabel' }, S17: { numbers: 'detailRows', strings: 'scopeLabel' },
  S18: { numbers: 'products receipts completed suppliers needsAttention previousProducts increasePercentage', strings: 'completedPercentage' },
  S19: { numbers: 'products receipts shipped packing waiting' },
  S20: { numbers: 'transactions inbound outbound products inboundProducts outboundProducts inboundPercent outboundPercent' },
  S21: { numbers: 'opening inbound outboundProducts outboundWarranty reversals closing actual difference needsReview' },
  S22: { numbers: 'total completed processing waiting incomplete overdueWithinIncomplete' },
  S23: { numbers: 'uniqueLabels successful errors reprints', strings: 'successRate' },
  S24: { numbers: 'total matched different errors needsReview', strings: 'qualityRate' },
  S25: { numbers: 'documents completed incomplete dealers' },
  S26: { numbers: 'total events needsReview complete missingEvents statusMismatch', strings: 'qualityRate' },
};
const optionKeys: Partial<Record<BusinessScreenId, readonly string[]>> = {
  S03: ['groups', 'units'], S04: ['groups', 'units'], S05: ['observedTypes'], S06: ['groups', 'visibility'],
  S09: ['status', 'identity', 'due'], S10: ['status'], S12: ['status', 'source'], S13: ['status', 'receiptCode'],
  S14: ['status', 'sourceReceipt'], S15: ['status', 'recipient'], S16: ['itemType', 'stockStatus'], S17: ['status'],
  S18: ['supplier', 'status'], S19: ['customer', 'status'], S20: ['type', 'performer'], S21: ['sku', 'status'], S23: ['status'], S24: ['result'],
  S25: ['dealer'], S26: ['status'],
};
function validArray(value: unknown, shape: RowShape): boolean { return Array.isArray(value) && value.every(row => validRow(row, shape)); }
function validSummary(screen: BusinessScreenId, summary: unknown): boolean {
  if (!validRow(summary, summaryShapes[screen]) || !isRecord(summary)) return false;
  if (screen === 'S05') return Array.isArray(summary.staticLabels) && summary.staticLabels.every(value => typeof value === 'string');
  if (screen === 'S18' || screen === 'S19') return validArray(summary.daily, { strings: 'date', numbers: 'quantity' })
    && validArray(summary.progress, { strings: 'status', numbers: 'count' });
  if (screen === 'S20') return validArray(summary.daily, { strings: 'date', numbers: 'inbound outbound' })
    && validRow(summary.peak, { strings: 'date', numbers: 'total inbound outbound' });
  if (screen === 'S21') return validArray(summary.daily, { strings: 'date', numbers: 'opening inbound outboundProducts outboundWarranty reversals closing' });
  if (screen === 'S24') return validArray(summary.daily, { strings: 'date', numbers: 'matched different errors' });
  if (screen === 'S25') return validArray(summary.top, { strings: 'dealer', numbers: 'documents completed incomplete' });
  if (screen === 'S26') return validArray(summary.daily, { strings: 'date', numbers: 'events' });
  return true;
}
function validOptions(screen: BusinessScreenId, options: unknown): boolean {
  return isRecord(options) && (optionKeys[screen] ?? []).every(key => Array.isArray(options[key])
    && (options[key] as unknown[]).every(value => typeof value === 'string' || typeof value === 'number'));
}
function validWarrantyReport(value: Record<string, unknown>): boolean {
  if (value.kind !== 'available' || !isRecord(value.model)) return false;
  const model = value.model;
  if (!validSummary('S22', model.summary) || !validRow(model.period, { strings: 'from to' }) || !isRecord(model.details)) return false;
  const detail = model.details;
  if (detail.kind === 'available') return validArray(detail.rows, {
    strings: 'id code sku productName partName receivedAt status', nullableStrings: 'serial dueAt',
  }) && (detail.rows as Record<string, unknown>[]).every(row => ['Hoàn tất', 'Đang xử lý', 'Chờ tiếp nhận'].includes(String(row.status)))
    && Number.isSafeInteger(detail.total) && detail.total === (detail.rows as unknown[]).length;
  return (detail.kind === undefined || detail.kind === 'blocked') && detail.availability === 'BLOCKED_SOURCE_CONFLICT'
    && detail.selectedFixture === null && detail.rows === null && detail.total === null;
}

/** Validate the HTTP envelope/model boundary before controllers can commit server data. */
export function isBusinessResult(screen: BusinessScreenId, value: unknown): boolean {
  if (!isRecord(value)) return false;
  if (value.kind === 'blocked' || value.kind === 'missing-fixture') {
    return typeof value.reason === 'string' && (screen === 'S22' || (typeof value.detail === 'string' && isRecord(value.query)));
  }
  if (screen === 'S22') {
    return validWarrantyReport(value);
  }
  if (value.kind !== 'ready' || !isRecord(value.model)) return false;
  const model = value.model;
  if (!Array.isArray(model.rows) || !model.rows.every(row => validRow(row, rowShapes[screen])) || !isRecord(model.query)
    || !validSummary(screen, model.summary) || !isRecord(model.pagination)) return false;
  const page = model.pagination;
  if (!['page', 'pageSize', 'pageCount', 'total', 'unfilteredTotal', 'start', 'end'].every(key =>
    typeof page[key] === 'number' && Number.isSafeInteger(page[key]) && (page[key] as number) >= 0)) return false;
  if ((page.page as number) < 1 || (page.pageSize as number) < 1 || !Array.isArray(page.pageSizeOptions)
    || !page.pageSizeOptions.every(value => Number.isSafeInteger(value) && value > 0)
    || (page.end as number) < (page.start as number) || model.rows.length > (page.pageSize as number)) return false;
  if (screen === 'S01') return validArray(model.chart, { strings: 'label', numbers: 'inbound outbound' }) && isRecord(model.source);
  if (screen === 'S06') return validRow(model.scope, { strings: 'kind', numbers: 'total' }) && validOptions(screen, model.filterOptions)
    && validRow(model.profile, { strings: 'displayName initials' });
  return isRecord(model.source) && (screen === 'S02' || validOptions(screen, model.filterOptions));
}
