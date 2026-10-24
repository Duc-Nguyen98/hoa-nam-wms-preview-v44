/** User-confirmed frontend conventions; not an API/DTO contract. */
export const UI_FOUNDATION_VERSION = 'HN_UI_SHARED_v1.0.1';
export const PREVIEW_TIME_ZONE = 'Asia/Ho_Chi_Minh';
export const PREVIEW_DATE_FORMAT = 'dd/MM/yyyy';
export const SEARCH_DEBOUNCE_MS = 250;

export const UI_FOUNDATION = Object.freeze({
  version: UI_FOUNDATION_VERSION,
  brand: '#0A3765',
  control: '#004E74',
  font: 'Public Sans',
  warehouse: 'readonly',
  locale: 'vi-VN',
  timeZone: PREVIEW_TIME_ZONE,
  dateFormat: PREVIEW_DATE_FORMAT,
  rangeInclusive: true,
  searchDebounceMs: SEARCH_DEBOUNCE_MS,
  filterApplyMode: 'immediate',
  defaultPageSize: 10,
  pageSizeOptions: Object.freeze([10, 15, 25, 50] as const),
  dateModes: Object.freeze({ single: 'basic', contiguous: 'range', discrete: 'multiple-when-sourced', disabled: 'sourced-rule-only' } as const),
  resetPageOnQueryChange: true,
  resetPageOnSortChange: true,
  listScope: 'available-detail-scenario',
  summaryScope: 'independent-source-summary',
  realApi: false,
} as const);
