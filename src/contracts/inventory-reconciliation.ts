import type { ListDataAdapter, ListModel } from '../shared/list-runtime';

/** Frontend S16 snapshot contract. This is a fixture view model, not a backend DTO. */
export interface InventoryQuery {
  search: string;
  itemType: string;
  stockStatus: string;
  page: number;
  pageSize: number;
  sortKey: InventorySortKey | '';
  sortDirection: 'asc' | 'desc';
}

export type InventorySortKey =
  | 'sku'
  | 'name'
  | 'stockStatus'
  | 'available'
  | 'onHand'
  | 'ledger'
  | 'difference'
  | 'reconciliation';

export const DEFAULT_INVENTORY_QUERY: Readonly<InventoryQuery> = Object.freeze({
  search: '', itemType: '', stockStatus: '', page: 1, pageSize: 10, sortKey: '', sortDirection: 'asc',
});

export interface InventoryRow {
  /** Internal source-position key, never a balance ID or a unique-SKU assertion. */
  renderKey: string;
  sku: string;
  name: string;
  itemType: 'Sản phẩm' | 'Linh kiện';
  stockStatus: 'Khả dụng' | 'Không thể bán/xuất' | 'Hàng lỗi' | 'Chờ kiểm tra';
  available: number | null;
  onHand: number | null;
  ledger: number | null;
  difference: number | null;
  unit: 'cái' | 'bộ';
  suggestedLocation: string;
  reconciliation: 'Khớp' | 'Có chênh lệch';
  warehouse: 'Kho Hoa Nam';
}

export interface InventorySummary {
  detailRows: number;
  scopeLabel: string;
}

export type InventoryModel = ListModel<InventoryRow, InventoryQuery, InventorySummary>;
export type InventoryAdapter = ListDataAdapter<InventoryRow, InventoryQuery, InventorySummary>;
