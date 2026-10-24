import { useReportCopy } from '../../i18n/reports-copy';
import { Button, Feedback } from '../../shared/primitives';
import { FilterSelect } from '../../shared/controls';
import type { MovementQuery } from '../../contracts/movement-history';
import { movementSortOptions, movementSortPatch } from './movement-history-presentation';

export function MovementInitialFeedback({ failed, blocked, pending, onRetry }: {
  failed: boolean; blocked: boolean; pending: boolean; onRetry: () => void;
}) {
  const tx = useReportCopy();
  const unavailable = failed || blocked;
  return <section className="s20-initial-feedback" aria-label={tx("Trạng thái tải lịch sử giao dịch")}>
    <Feedback live tone={failed ? 'error' : 'neutral'} title={tx(failed ? 'Chưa thể tải lịch sử giao dịch' : blocked ? 'Chưa có dữ liệu cho kỳ báo cáo' : 'Đang đọc lịch sử giao dịch…')}>
      {unavailable && <p>{tx("Chưa có dữ liệu để hiển thị. Vui lòng thử tải lại.")}</p>}
    </Feedback>
    <Button data-s20-retry loading={pending} onClick={onRetry}>{tx(pending ? 'Đang tải…' : 'Thử tải lại')}</Button>
  </section>;
}

export function MovementResultStatus({ pending, total, detailTotal }: { pending: boolean; total: number; detailTotal: number }) {
  const tx = useReportCopy();
  return <span className="s20-result-count" role="status" aria-live="polite" aria-atomic="true">{tx(pending ? 'Đang cập nhật danh sách…' : `${total} / ${detailTotal} giao dịch chi tiết`)}</span>;
}

export function MovementCompactSort({ query, onChange }: { query: MovementQuery; onChange: (patch: Partial<MovementQuery>) => void }) {
  const tx = useReportCopy();
  return <div className="s20-compact-sort"><FilterSelect id="s20-sort" label={tx("Sắp xếp")} value={`${query.sortKey}:${query.sortDirection}`} onChange={event => {
    const patch = movementSortPatch(event.target.value); if (patch) onChange(patch);
  }}>{movementSortOptions.flatMap(option => (['asc', 'desc'] as const).map((direction, index) =>
    <option key={`${option.key}:${direction}`} value={`${option.key}:${direction}`}>{tx(option.label)} {tx("·")} {tx(option.orders[index])}</option>
  ))}</FilterSelect></div>;
}
