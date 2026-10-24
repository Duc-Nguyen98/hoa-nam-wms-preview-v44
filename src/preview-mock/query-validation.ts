import type { BusinessScreenId } from '../data/http/api-contract';
import { isRecord } from '../data/http/api-contract';
import { PV_SORT_KEYS } from '../contracts/pv-products';
import { RECIPIENT_SORT_KEYS } from '../contracts/recipients';
import { REVERSAL_SORT_KEYS } from '../contracts/reversal-slips';
import { INBOUND_REPORT_SORT_KEYS } from '../contracts/inbound-report';
import { OUTBOUND_REPORT_SORT_KEYS } from '../contracts/outbound-report';
import { MOVEMENT_SORT_KEYS } from '../contracts/movement-history';
import { INVENTORY_REPORT_SORT_KEYS } from '../contracts/inventory-report';
import { LABEL_SORT_KEYS, LABEL_STATUSES } from '../contracts/label-report';
import { DATA_QUALITY_SORT_KEYS, DATA_QUALITY_RESULTS } from '../contracts/data-quality-report';
import { DEALER_EXPORT_SORT_KEYS } from '../contracts/dealer-export-report';
import { TRACE_SORT_KEYS, TRACE_STATUSES } from '../contracts/goods-trace-report';
import type { OverviewSortKey } from '../contracts/overview';
import type { DefectsSortKey } from '../contracts/defects';
import type { ProductSortKey } from '../contracts/products';
import type { SkusSortKey } from '../contracts/skus';
import type { InventorySortKey } from '../contracts/inventory-reconciliation';

// Validate technical choices against the existing UI contracts. Open string
// filters remain open: an unknown recipient/SKU may legitimately match no rows.
export const HTTP_SORT_KEYS: Partial<Record<BusinessScreenId, readonly unknown[]>> = {
  S01: ['number', 'type', 'time', 'actor', 'quantity', 'status'] satisfies OverviewSortKey[],
  S02: [null, ...(['code', 'name', 'description', 'status'] satisfies DefectsSortKey[])],
  S03: [null, ...(['name', 'group', 'skuCount', 'unit', 'status', 'updatedAt'] satisfies ProductSortKey[])],
  S04: ['code', 'group', 'unit', 'barcode', 'status', 'updatedAt'] satisfies SkusSortKey[],
  S06: PV_SORT_KEYS,
  S16: ['', ...(['sku', 'name', 'stockStatus', 'available', 'onHand', 'ledger', 'difference', 'reconciliation'] satisfies InventorySortKey[])],
  S17: ['', ...REVERSAL_SORT_KEYS], S18: INBOUND_REPORT_SORT_KEYS, S19: OUTBOUND_REPORT_SORT_KEYS,
  S20: MOVEMENT_SORT_KEYS, S21: INVENTORY_REPORT_SORT_KEYS,
  S23: [null, ...LABEL_SORT_KEYS], S24: [null, ...DATA_QUALITY_SORT_KEYS],
  S25: DEALER_EXPORT_SORT_KEYS, S26: [null, ...TRACE_SORT_KEYS],
};

export function invalidQueryField(screen: BusinessScreenId, query: Record<string, unknown>): string | null {
  const keys = HTTP_SORT_KEYS[screen];
  if (keys && !keys.includes(query.sortKey)) return 'sortKey';
  if ('sortDirection' in query && !['asc', 'desc'].includes(String(query.sortDirection))) return 'sortDirection';
  if ('sort' in query) {
    if (screen === 'S05') {
      const sort = query.sort;
      if (sort !== null && (!isRecord(sort)
        || Object.keys(sort).length !== 2
        || !RECIPIENT_SORT_KEYS.some(key => key === sort.key)
        || !['asc', 'desc'].includes(String(sort.direction)))) return 'sort';
    } else {
      const allowed: readonly unknown[] = screen === 'S12' ? ['updated-asc', 'updated-desc']
        : screen === 'S15' ? ['created-asc', 'created-desc']
          : ['S02', 'S03', 'S04'].includes(screen) ? [null, 'asc', 'desc'] : ['asc', 'desc'];
      if (!allowed.includes(query.sort)) return 'sort';
    }
  }
  if (screen === 'S01') {
    if (!['all', 'inbound', 'outbound'].includes(String(query.type))) return 'type';
    if (!['all', 'waiting', 'posted'].includes(String(query.status))) return 'status';
  }
  if (['S02', 'S03', 'S04', 'S05'].includes(screen) && !['all', 'active', 'inactive'].includes(String(query.status))) return 'status';
  if (screen === 'S23' && !['', ...LABEL_STATUSES].includes(query.status as typeof LABEL_STATUSES[number])) return 'status';
  if (screen === 'S24') {
    if (query.dataType !== '') return 'dataType';
    if (!['', ...DATA_QUALITY_RESULTS].includes(query.result as typeof DATA_QUALITY_RESULTS[number])) return 'result';
  }
  if (screen === 'S25' && query.status !== '') return 'status';
  if (screen === 'S26') {
    if (query.codeType !== '') return 'codeType';
    if (!['', ...TRACE_STATUSES].includes(query.status as typeof TRACE_STATUSES[number])) return 'status';
  }
  return null;
}
