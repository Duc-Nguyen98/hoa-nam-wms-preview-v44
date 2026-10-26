import { ApiRequestError, readBusinessResource } from '../data/http/api-client';
import { isBusinessResult, isRecord } from '../data/http/api-contract';
import type { WarrantyReportReadResult } from '../contracts/warranty-parts-report';
import { queryWarrantyDetails, DEFAULT_WARRANTY_DETAIL_QUERY, type WarrantyDetailQuery } from '../features/S22/warranty-parts-query';
import { REPORT_EXPORTS, exportFilterLabel, exportPeriodLabel, type ExportScreen } from './report-export-contract';
import { validateBusinessDateRange } from '../shared/date-policy';

export class ReportExportError extends Error {}
export const MAX_EXPORT_ROWS = 50_000;
type Query = Record<string, unknown>;
export type ReportReader = (screen: ExportScreen, query: object, context: { signal: AbortSignal }) => Promise<unknown>;
interface PageModel { rows: Record<string, unknown>[]; query: Query; source: unknown; pagination: { page: number; pageSize: number; total: number; pageCount: number; start: number; end: number } }
const fail = (message = 'Dữ liệu báo cáo chưa đầy đủ hoặc đã thay đổi. Vui lòng tải lại báo cáo rồi xuất Excel.') => { throw new ReportExportError(message); };
function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (isRecord(value)) return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stable(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
const criteria = (query: Query) => Object.fromEntries(Object.entries(query).filter(([key]) => key !== 'page' && key !== 'pageSize'));
function validateUnique(rows: Record<string, unknown>[], screen: ExportScreen, seen = new Set<unknown>()) {
  for (const row of rows) {
    const key = row[REPORT_EXPORTS[screen].identity];
    if (typeof key !== 'string' || !key || seen.has(key)) fail();
    seen.add(key);
  }
}

/** Reads every accepted result page, never the DOM/current-page subset. No permission bypass or fallback fixture. */
export async function collectReport(screen: ExportScreen, accepted: object, options: {
  signal: AbortSignal; expectedTotal?: number; onProgress?: (loaded: number, total: number) => void; reader?: ReportReader; translate?: (value: string) => string;
}) {
  const tx = options.translate ?? ((value: string) => value);
  const query = structuredClone(accepted) as Query;
  const reader = options.reader ?? readBusinessResource;
  const period = query.period;
  if (!isRecord(period) || typeof period.from !== 'string' || typeof period.to !== 'string') return fail('Kỳ báo cáo chưa hợp lệ.');
  if (!validateBusinessDateRange(period).valid) {
    return fail('Vui lòng chọn kỳ trong 90 ngày gần đây, không vượt quá ngày hôm nay.');
  }
  const checkAbort = () => options.signal.throwIfAborted();
  const read = async (request: Query) => {
    checkAbort();
    if (!validateBusinessDateRange(period).valid) return fail('Vui lòng chọn kỳ trong 90 ngày gần đây, không vượt quá ngày hôm nay.');
    const result = await reader(screen, request, { signal: options.signal });
    checkAbort();
    if (!isBusinessResult(screen, result) || !isRecord(result)) return fail();
    if (result.kind === 'blocked' || result.kind === 'missing-fixture') return fail('Chưa có đủ dữ liệu cho kỳ và bộ lọc này. Vui lòng chọn lại kỳ hoặc tải lại báo cáo.');
    return result;
  };
  let rows: Record<string, unknown>[];
  let filters = query;
  if (screen === 'S22') {
    const result = await read(period) as unknown as WarrantyReportReadResult;
    if (result.kind !== 'available' || result.model.details.kind !== 'available') return fail('Chưa có đủ danh sách chi tiết để xuất báo cáo.');
    if (stable(result.model.period) !== stable(period)) return fail();
    const details = result.model.details;
    if (details.total > MAX_EXPORT_ROWS) return fail('Báo cáo vượt 50.000 dòng. Vui lòng thu hẹp kỳ hoặc bộ lọc để xuất Excel.');
    if (options.expectedTotal !== undefined && details.total !== options.expectedTotal) return fail();
    const detailQuery = { ...DEFAULT_WARRANTY_DETAIL_QUERY, ...(isRecord(query.detailQuery) ? query.detailQuery : {}), page: 1, pageSize: 50 } as WarrantyDetailQuery;
    filters = { ...detailQuery };
    const first = queryWarrantyDetails(details.rows, details.total, detailQuery);
    if (first.kind !== 'ready') return fail();
    rows = [];
    for (let page = 1; page <= Math.max(1, first.pagination.pageCount); page++) {
      const part = queryWarrantyDetails(details.rows, details.total, { ...detailQuery, page });
      if (part.kind !== 'ready') return fail();
      rows.push(...part.rows.map(row => ({ ...row })));
    }
    if (rows.length !== first.pagination.total) return fail();
    validateUnique(rows, screen);
    options.onProgress?.(rows.length, rows.length);
  } else {
    const size = typeof query.pageSize === 'number' ? query.pageSize : 10;
    const first = (await read({ ...query, page: 1, pageSize: size })).model as PageModel;
    const { total, pageCount } = first.pagination;
    if (total > MAX_EXPORT_ROWS) return fail('Báo cáo vượt 50.000 dòng. Vui lòng thu hẹp kỳ hoặc bộ lọc để xuất Excel.');
    if (options.expectedTotal !== undefined && total !== options.expectedTotal) return fail();
    rows = []; const seen = new Set<unknown>();
    for (let page = 1; page <= Math.max(1, pageCount); page++) {
      const part = page === 1 ? first : (await read({ ...query, page, pageSize: size })).model as PageModel;
      const pagination = part.pagination;
      const expectedLength = Math.max(0, Math.min(size, total - (page - 1) * size));
      if (pagination.page !== page || pagination.pageSize !== size || pagination.total !== total
        || pagination.pageCount !== pageCount || pageCount !== Math.ceil(total / size)
        || part.rows.length !== expectedLength || stable(criteria(part.query)) !== stable(criteria(query))
        || stable(part.source) !== stable(first.source)) return fail();
      validateUnique(part.rows, screen, seen);
      rows.push(...part.rows); options.onProgress?.(rows.length, total);
    }
    if (rows.length !== total) return fail();
    // Current local contract has immutable snapshots. Detect a changed first page
    // before downloading; production services must provide a stable snapshot/job.
    if (pageCount > 1) {
      const verify = (await read({ ...query, page: 1, pageSize: size })).model as PageModel;
      if (stable(verify) !== stable(first)) return fail();
    }
  }
  checkAbort();
  return { rows, title: tx(REPORT_EXPORTS[screen].title), columns: REPORT_EXPORTS[screen].columns.map(column => ({ ...column, label: tx(column.label) })),
    periodLabel: exportPeriodLabel(period as { from: string; to: string }, tx), filtersLabel: `${exportFilterLabel(filters, tx)} · ${rows.length.toLocaleString(tx('vi-VN'))} ${tx('dòng')}`, exportedAt: new Date() };
}

export function exportErrorMessage(error: unknown): string {
  if (error instanceof ReportExportError) return error.message;
  if (error instanceof ApiRequestError && error.status === 403) return 'Bạn không có quyền đọc dữ liệu này để xuất Excel.';
  if (error instanceof ApiRequestError && error.status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để xuất Excel.';
  return 'Không thể xuất Excel. Vui lòng kiểm tra kết nối và thử lại.';
}
