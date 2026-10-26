import type { ListModel } from './list-runtime';
import type { TablePageQuery } from './table-query';

/** Presentation state for an accepted read-only report result. */
export type ReportEmptyReason = 'no-records' | 'no-matches' | 'blocked';

export type ReportEmptyModel<Row, Query extends TablePageQuery, Summary> = Pick<ListModel<Row, Query, Summary>, 'pagination' | 'source'> & {
  /** Some HTTP read models supply the reason even when a legacy adapter does not. */
  emptyReason?: 'no-records' | 'no-matches' | null;
};

/**
 * Prefer the source's explicit reason. Legacy models may use complete-source
 * counts, never visible page rows, to distinguish an empty period from a filter
 * with no matches. A partial source cannot prove either state.
 */
export function getReportEmptyReason<Row, Query extends TablePageQuery, Summary>(
  model: ReportEmptyModel<Row, Query, Summary>,
): ReportEmptyReason | null {
  if (model.pagination.total > 0) return null;
  if (model.emptyReason === 'no-records' || model.emptyReason === 'no-matches') return model.emptyReason;
  if (model.source.completeness !== 'complete') return 'blocked';
  return model.source.detailTotal === 0 ? 'no-records' : 'no-matches';
}

/** Read failures never describe missing source or confirm a successful refresh. */
export function reportReadErrorMessage(hasAcceptedData: boolean): string {
  return hasAcceptedData
    ? 'Chưa thể đọc báo cáo. Dữ liệu và điều kiện đã áp dụng được giữ nguyên.'
    : 'Chưa thể đọc báo cáo. Chưa có dữ liệu để hiển thị.';
}
