import type { OverviewRow } from '../contracts/overview';
import type { DefectRow } from '../contracts/defects';
import type { ProductRow } from '../contracts/products';
import type { SkuRow } from '../contracts/skus';
import type { RecipientRow } from '../contracts/recipients';
import type { PvProduct } from '../contracts/pv-products';
import type { TableSearch, TableSortDefinition } from './table-query';

export interface ScreenSortField<Row> {
  field: keyof Row;
  type: TableSortDefinition<Row>['type'];
  /** Project display-only dates/missing markers to sortable values without changing the row. */
  value?: (row: Row) => unknown;
}
export interface ScreenFoundationConfig<Row> {
  id: string;
  detailCount: number;
  stableId: keyof Row;
  searchFields: readonly (keyof Row)[];
  filterFields: readonly (keyof Row)[];
  sortFields: Readonly<Record<string, ScreenSortField<Row>>>;
  defaultSort: { key: string; direction: 'asc' | 'desc' } | null;
  combinedColumns: Readonly<Record<string, string>>;
  dateMode: 'range' | null;
  scopeNote: string;
}

/** Strict projection of existing Vietnamese preview date labels, not an API parser. */
export function previewDateSortValue(value: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})(?:\s*(?:·\s*)?(\d{2}):(\d{2}))?$/u.exec(value.trim());
  if (!match) return null;
  const [, dd, mm, yyyy, hh = '00', minute = '00'] = match;
  const date = new Date(0);
  date.setUTCFullYear(Number(yyyy), Number(mm) - 1, Number(dd));
  date.setUTCHours(Number(hh), Number(minute), 0, 0);
  if (Number(yyyy) < 1 || date.getUTCFullYear() !== Number(yyyy) || date.getUTCMonth() + 1 !== Number(mm) ||
      date.getUTCDate() !== Number(dd) || Number(hh) > 23 || Number(minute) > 59) return null;
  // All current labels belong to the same authorized frontend zone (UTC+07).
  return `${yyyy}-${mm}-${dd}T${hh}:${minute}:00+07:00`;
}

export function screenSearch<Row>(config: ScreenFoundationConfig<Row>, value: string): TableSearch<Row> {
  return { value, fields: config.searchFields.map(field => row => row[field]) };
}
export function screenSort<Row>(config: ScreenFoundationConfig<Row>, key: string | null, direction: 'asc' | 'desc' | null): TableSortDefinition<Row> | undefined {
  if (!key || !direction) return undefined;
  const field = Object.hasOwn(config.sortFields, key) ? config.sortFields[key] : undefined;
  if (!field) return undefined; // The screen adapter must reject unrecognized query keys.
  return { type: field.type, direction, value: field.value ?? (row => row[field.field]) };
}

const define = <Row>(config: ScreenFoundationConfig<Row>): Readonly<ScreenFoundationConfig<Row>> => Object.freeze({
  ...config, searchFields: Object.freeze([...config.searchFields]), filterFields: Object.freeze([...config.filterFields]),
  sortFields: Object.freeze(Object.fromEntries(Object.entries(config.sortFields).map(([key, field]) => [key, Object.freeze(field)]))),
  combinedColumns: Object.freeze({ ...config.combinedColumns }),
  defaultSort: config.defaultSort ? Object.freeze(config.defaultSort) : null,
});

/** Mappings reference existing frontend fields only; screen owners retain their business adapters. */
export const SCREEN_FOUNDATION = Object.freeze({
  S01: define<OverviewRow>({
    id: 'S01', detailCount: 16, stableId: 'id', searchFields: ['number', 'actor'], filterFields: ['type', 'status'],
    sortFields: {
      number: { field: 'number', type: 'code' }, type: { field: 'typeLabel', type: 'text' },
      actor: { field: 'actor', type: 'text' }, quantity: { field: 'quantity', type: 'number' },
      status: { field: 'statusLabel', type: 'text' },
      time: { field: 'time', type: 'date', value: row => row.day && row.time ? `${row.day}T${row.time}:00+07:00` : null },
    },
    defaultSort: { key: 'time', direction: 'desc' }, combinedColumns: { 'Thời gian': 'time (day + time)' }, dateMode: 'range',
    scopeNote: 'Danh sách dùng 16 phiếu nguồn tháng 09/2026. Phạm vi dữ liệu từng chỉ số được giữ riêng.',
  }),
  S02: define<DefectRow>({
    id: 'S02', detailCount: 10, stableId: 'key', searchFields: ['code', 'name'], filterFields: ['status'],
    sortFields: { code: { field: 'code', type: 'code' }, name: { field: 'name', type: 'text' }, description: { field: 'description', type: 'text' }, status: { field: 'statusLabel', type: 'text' } },
    defaultSort: null, combinedColumns: { 'Mã lỗi / Tên lỗi': 'code' }, dateMode: null,
    scopeNote: 'Tìm kiếm và bộ lọc áp dụng trên 10 hồ sơ nguồn hiện có.',
  }),
  S03: define<ProductRow>({
    id: 'S03', detailCount: 7, stableId: 'key', searchFields: ['code', 'name'], filterFields: ['group', 'status', 'unit'],
    sortFields: {
      name: { field: 'name', type: 'text' }, group: { field: 'group', type: 'text' }, skuCount: { field: 'skuCount', type: 'number' },
      unit: { field: 'unit', type: 'text' }, status: { field: 'statusLabel', type: 'text' },
      updatedAt: { field: 'updatedAt', type: 'date', value: row => previewDateSortValue(row.updatedAt) },
    },
    defaultSort: null, combinedColumns: { 'Sản phẩm': 'name' }, dateMode: null,
    scopeNote: 'Danh sách gồm 7 sản phẩm nguồn; số tổng quan giữ theo toàn danh mục.',
  }),
  S04: define<SkuRow>({
    id: 'S04', detailCount: 7, stableId: 'key', searchFields: ['code', 'name'], filterFields: ['group', 'status', 'unit'],
    sortFields: {
      code: { field: 'code', type: 'code' }, group: { field: 'group', type: 'text' }, unit: { field: 'unit', type: 'text' },
      barcode: { field: 'barcode', type: 'code' }, status: { field: 'statusLabel', type: 'text' },
      updatedAt: { field: 'updatedAt', type: 'date', value: row => previewDateSortValue(row.updatedAt) },
    },
    defaultSort: null, combinedColumns: { 'Mã SKU / Sản phẩm': 'code' }, dateMode: null,
    scopeNote: 'Danh sách gồm 7 SKU nguồn; số tổng quan giữ theo toàn danh mục.',
  }),
  S05: define<RecipientRow>({
    id: 'S05', detailCount: 5, stableId: 'key', searchFields: ['code', 'name', 'market', 'area'], filterFields: ['type', 'status'],
    sortFields: {
      name: { field: 'name', type: 'text' }, type: { field: 'type', type: 'text' }, market: { field: 'market', type: 'text' },
      contact: { field: 'contact', type: 'text' }, address: { field: 'address', type: 'text' }, statusLabel: { field: 'statusLabel', type: 'text' },
    },
    defaultSort: null, combinedColumns: { 'Nơi nhận': 'name', 'Thị trường / Khu vực': 'market', 'Liên hệ': 'contact' }, dateMode: null,
    scopeNote: 'Danh sách gồm 5 dòng nguồn; tổng 27 và mốc 01/10 được giữ riêng.',
  }),
  S06: define<PvProduct>({
    id: 'S06', detailCount: 7, stableId: 'key', searchFields: ['productName', 'productCode', 'sku'], filterFields: ['productGroup', 'visibilityLabel'],
    sortFields: {
      product: { field: 'productName', type: 'text' }, productCode: { field: 'productCode', type: 'code' }, sku: { field: 'sku', type: 'code' },
      group: { field: 'productGroup', type: 'text' },
      visibility: { field: 'visibilityLabel', type: 'text', value: row => row.visibilityLabel === '—' ? null : row.visibilityLabel },
      updated: { field: 'updatedAtLabel', type: 'date', value: row => previewDateSortValue(row.updatedAtLabel) },
    },
    defaultSort: { key: 'updated', direction: 'desc' }, combinedColumns: { 'Sản phẩm': 'productName' }, dateMode: null,
    scopeNote: 'Danh sách gồm 7 hồ sơ nguồn; số tổng quan 128/116/12/7 được giữ riêng.',
  }),
});
