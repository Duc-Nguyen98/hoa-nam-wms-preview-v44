import { useUiCopy } from '../i18n/use-ui-copy';
import { Icon } from './Icon';
import type { ReportEmptyReason } from './report-state';
import './report-status.css';

/**
 * User-facing list state for read-only reports.  The source owns the reason;
 * this helper only gives an accepted model a consistent presentation.  It
 * never creates rows, totals, requests or permissions.
 */
const reasonCopy: Record<ReportEmptyReason, { title: string; detail: string; icon: 'tray' | 'search' | 'info' }> = {
  'no-records': {
    title: 'Chưa có dữ liệu trong kỳ',
    detail: 'Nguồn báo cáo không có bản ghi trong kỳ đã chọn.',
    icon: 'tray',
  },
  'no-matches': {
    title: 'Không có dữ liệu phù hợp',
    detail: 'Thử thay đổi điều kiện lọc hoặc đặt lại bộ lọc.',
    icon: 'search',
  },
  blocked: {
    title: 'Danh sách chi tiết chưa khả dụng',
    detail: 'Nguồn chi tiết hiện chưa đủ để hiển thị danh sách.',
    icon: 'info',
  },
};

/** Consistent, read-only empty state for report tables. */
export function ReportEmptyState({ reason, itemLabel = 'bản ghi', className = '' }: {
  reason: ReportEmptyReason;
  itemLabel?: string;
  className?: string;
}) {
  const tx = useUiCopy();
  const copy = reasonCopy[reason];
  const title = reason === 'no-records' ? tx('Chưa có {item} trong kỳ', { item: tx(itemLabel) }) : reason === 'no-matches' ? tx('Không có {item} phù hợp', { item: tx(itemLabel) }) : copy.title;
  return <div className={`hn-report-empty hn-report-empty--${reason} ${className}`.trim()} data-report-empty-reason={reason} role="status">
    <Icon name={copy.icon} size={24} aria-hidden="true" />
    <strong>{tx(title)}</strong>
    <span>{tx(copy.detail)}</span>
  </div>;
}

/**
 * Scope annotation shared by report summaries.  Values are supplied by the
 * caller and remain independent from the current filtered table page.
 */
export function ReportScopeNote({ summary = 'Tổng hợp toàn kỳ', detail = 'Không thay đổi theo bộ lọc danh sách', className = '' }: {
  summary?: string;
  detail?: string;
  className?: string;
}) {
  const tx = useUiCopy();
  return <p className={`hn-report-scope ${className}`.trim()} data-report-scope="period"><span>{tx(summary)}</span><span>{tx(detail)}</span></p>;
}
