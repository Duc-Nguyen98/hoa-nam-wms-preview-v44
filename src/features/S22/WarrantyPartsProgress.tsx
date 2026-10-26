import { useReportCopy } from '../../i18n/reports-copy';
import type { WarrantyReportSummary } from '../../contracts/warranty-parts-report';

/** Screen-owned three-category report chart. Widths use counts, not rounded labels. */
export function WarrantyPartsProgress({ summary }: { summary: WarrantyReportSummary }) {
  const tx = useReportCopy();
  const segments = [
    { key: 'completed', label: tx('Hoàn tất'), count: summary.completed },
    { key: 'processing', label: tx('Đang xử lý'), count: summary.processing },
    { key: 'waiting', label: tx('Chờ tiếp nhận'), count: summary.waiting },
  ];
  // A valid period may contain no warranty tickets. Keep the summary usable
  // without presenting a mathematically false rate (or leaking NaN/Infinity
  // into the accessible chart label).
  const percentage = (value: number) => summary.total > 0
    ? (value / summary.total * 100).toLocaleString(tx('vi-VN'), { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%'
    : '—';
  return <>
    <div className="s22-completion"><div><span>{tx("Tỷ lệ hoàn tất")}</span><strong>{percentage(summary.completed)}</strong></div><p><b>{summary.completed}</b> {tx("/")} {summary.total} {tx("phiếu")}<br /><span>{tx("đã hoàn tất trong kỳ")}</span></p></div>
    <div className="s22-progress" role="img" aria-label={tx(segments.map(item => `${item.label}: ${item.count} phiếu, ${percentage(item.count)}`).join('; '))}>
      {segments.map(item => <span key={item.key} data-segment={item.key} style={{ flexGrow: item.count }} />)}
    </div>
    <dl className="s22-legend">{segments.map(item => <div key={item.key}>
      <dt><span className="s22-dot" data-segment={item.key} />{tx(item.label)}</dt>
      <dd><strong>{item.count}</strong><span>{percentage(item.count)}</span></dd>
    </div>)}</dl>
    <p className="s22-note">{tx(summary.total > 0
      ? 'Tỷ lệ làm tròn riêng có thể cộng thành 100,1%. Số lượng phiếu là số liệu chuẩn.'
      : 'Chưa có phiếu trong kỳ; tỷ lệ chỉ hiển thị khi có mẫu số.')}</p>
  </>;
}
