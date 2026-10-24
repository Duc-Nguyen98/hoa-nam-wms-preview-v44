import seed from '../fixtures/S16.seed.json';
import { collectFilterOptions, type ListReadResult } from '../../shared/list-runtime';
import { PAGE_SIZE_OPTIONS, queryTable } from '../../shared/table-query';
import { DEFAULT_INVENTORY_QUERY, type InventoryAdapter, type InventoryQuery, type InventoryRow, type InventorySortKey, type InventorySummary } from '../../contracts/inventory-reconciliation';

const SORT_KEYS: readonly InventorySortKey[] = ['sku', 'name', 'stockStatus', 'available', 'onHand', 'ledger', 'difference', 'reconciliation'];

/** S16 P01 is complete within the four-row detail scope; it is not a warehouse-wide aggregate. */
export function createInventoryFixtureAdapter(): InventoryAdapter {
  const fixture = structuredClone(seed);
  const rows: InventoryRow[] = fixture.visibleRows.map((values, index) => {
    const [sku, name, itemType, stockStatus, available, onHand, ledger, difference, unit, suggestedLocation, reconciliation, warehouse] = values;
    if (![sku, name, itemType, stockStatus, unit, suggestedLocation, reconciliation, warehouse].every(value => typeof value === 'string') ||
      ![available, onHand, ledger, difference].every(value => typeof value === 'number' && Number.isFinite(value))) throw Error('Invalid S16 source row');
    return { renderKey: `s16-source-${index + 1}`, sku, name, itemType, stockStatus, available, onHand, ledger, difference, unit, suggestedLocation, reconciliation, warehouse } as InventoryRow;
  });
  if (rows.length !== 4 || rows.some(row => row.onHand === null || row.ledger === null || row.onHand - row.ledger !== row.difference)) throw Error('S16 source integrity mismatch');
  return createInventoryRowsAdapter(rows, 'S16-INV-01-P01-r01');
}

/** DEV injection seam for separately owned QA rows; never selects a QA mode in product UI. */
export function createInventoryRowsAdapter(inputRows: readonly InventoryRow[], sourceId: string): InventoryAdapter {
  const rows = structuredClone([...inputRows]);
  if (new Set(rows.map(row => row.renderKey)).size !== rows.length) throw Error('Duplicate internal render key');
  const summary: InventorySummary = { detailRows: rows.length, scopeLabel: `Phạm vi hiển thị: ${rows.length} dòng tồn trong bộ nguồn đối chiếu.` };
  const filterOptions = {
    ...collectFilterOptions(rows, { itemType: row => row.itemType, stockStatus: row => row.stockStatus }),
    ...structuredClone(seed.optionCatalogue),
  };
  const blocked = (query: InventoryQuery, reason: string, detail: string): ListReadResult<InventoryRow, InventoryQuery, InventorySummary> => ({ kind: 'blocked', query, reason, detail });
  return {
    async read(input = { ...DEFAULT_INVENTORY_QUERY }, context) {
      if (context?.signal?.aborted) throw new DOMException('S16 fixture read cancelled', 'AbortError');
      const query = structuredClone(input);
      if (typeof query.search !== 'string' || !Number.isSafeInteger(query.page) || query.page < 1 || !PAGE_SIZE_OPTIONS.includes(query.pageSize as 10) ||
        (query.itemType !== '' && !filterOptions.itemType.includes(query.itemType)) || (query.stockStatus !== '' && !filterOptions.stockStatus.includes(query.stockStatus)) ||
        (query.sortKey !== '' && !SORT_KEYS.includes(query.sortKey)) || !['asc', 'desc'].includes(query.sortDirection)) {
        return blocked(query, 'INVALID_QUERY', 'Điều kiện không thuộc lựa chọn hoặc sort có nguồn của S16.');
      }
      const sort = query.sortKey ? {
        type: (['available', 'onHand', 'ledger', 'difference'].includes(query.sortKey) ? 'number' : query.sortKey === 'sku' ? 'code' : 'text') as 'number' | 'code' | 'text',
        direction: query.sortDirection,
        value: (row: InventoryRow) => row[query.sortKey as InventorySortKey],
      } : undefined;
      const result = queryTable({
        source: { rows, completeness: 'complete', total: rows.length, scope: 'detail' },
        query,
        search: { value: query.search, fields: [row => row.sku, row => row.name, row => row.warehouse] },
        filters: [row => !query.itemType || row.itemType === query.itemType, row => !query.stockStatus || row.stockStatus === query.stockStatus],
        sort,
        // No business ID supplied. Equal values retain original source order.
      });
      if (result.kind === 'blocked') return blocked(query, result.reason, result.detail);
      return { kind: 'ready', model: {
        query: { ...query, page: result.pagination.page, pageSize: result.pagination.pageSize },
        rows: structuredClone(result.rows), summary: structuredClone(summary), filterOptions: structuredClone(filterOptions), pagination: result.pagination,
        source: { id: sourceId, scope: 'detail', completeness: 'complete', detailTotal: rows.length },
      } };
    },
  };
}
