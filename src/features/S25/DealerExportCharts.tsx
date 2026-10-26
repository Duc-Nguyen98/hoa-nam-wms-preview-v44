import { formatDeclaredPercentage } from '../../i18n/format-declared-percentage';
import { useShellPreferences } from '../../shared/shell-preferences';
import { useReportCopy } from '../../i18n/reports-copy';
import { dealerExportPercent, type DealerExportSummary } from '../../contracts/dealer-export-report';

/** Native SVG/CSS, like existing report modules. No chart dependency or daily data. */
export function DealerExportCharts({ summary }: { summary: DealerExportSummary }) {
  const tx = useReportCopy();
  const { language } = useShellPreferences();
  const percentage = (value: number, total: number) => formatDeclaredPercentage(dealerExportPercent(value, total), language);
  const topTotal = summary.top.reduce((sum, row) => sum + row.documents, 0);
  const topCompleted = summary.top.reduce((sum, row) => sum + row.completed, 0);
  const topIncomplete = summary.top.reduce((sum, row) => sum + row.incomplete, 0);
  const max = Math.max(1, ...summary.top.map(row => row.documents));
  const circumference = 2 * Math.PI * 66;
  const fraction = summary.documents > 0 ? summary.completed / summary.documents : 0;
  return <div className="s25-charts" aria-label={tx("Biểu đồ tổng hợp toàn kỳ")}>
    <section className="s25-top" aria-labelledby="s25-top-title">
      <div className="s25-panel-title"><h3 id="s25-top-title">{tx("Top 5 đại lý theo số phiếu")}</h3><span className="s25-chart-share"><strong>{percentage(topTotal, summary.documents)}</strong> {tx("tổng kỳ ·")} {topTotal} {tx("phiếu")}</span></div>
      <ol className="s25-ranking">{summary.top.map((row, index) => <li key={row.dealer}>
        <span className="s25-chart-label"><span className="s25-rank" aria-hidden="true">{index + 1}</span>{row.dealer}</span>
        <span className="s25-bar-track" aria-hidden="true"><span className="s25-bar" style={{ width: `${row.documents / max * 100}%` }} /></span>
        <strong>{row.documents}<span className="hn-sr-only"> {tx("phiếu")}</span></strong>
      </li>)}</ol>
      {!summary.top.length && <p role="status">{tx("Chưa có phiếu xuất cho đại lý trong kỳ.")}</p>}
      <p className="s25-footnote">{topCompleted} {tx("hoàn tất ·")} {topIncomplete} {tx("chưa hoàn tất — đã bao gồm trong tổng kỳ.")}</p>
    </section>
    <section className="s25-completion" aria-labelledby="s25-completion-title">
      <h3 id="s25-completion-title">{tx("Tỷ lệ hoàn tất")}</h3>
      <div className="s25-completion-body">
        <div className="s25-ring">
          <svg viewBox="0 0 160 160" role="img" aria-label={tx(`${summary.completed}/${summary.documents} phiếu hoàn tất, ${percentage(summary.completed, summary.documents)}`)}>
            <circle className="s25-ring-track" cx="80" cy="80" r="66" fill="none" strokeWidth="12" />
            <circle className="s25-ring-value" cx="80" cy="80" r="66" fill="none" strokeWidth="12" strokeDasharray={`${fraction * circumference} ${circumference}`} transform="rotate(-90 80 80)" />
          </svg>
          <div aria-hidden="true"><strong>{percentage(summary.completed, summary.documents)}</strong><span>{tx("Hoàn tất")}</span></div>
        </div>
        <dl className="s25-legend"><div><dt><i />{tx("Hoàn tất")}</dt><dd><strong>{summary.completed}</strong><span>{percentage(summary.completed, summary.documents)}</span></dd></div><div><dt><i />{tx("Chưa hoàn tất")}</dt><dd><strong>{summary.incomplete}</strong><span>{percentage(summary.incomplete, summary.documents)}</span></dd></div></dl>
      </div>
      <p className="s25-footnote">{tx("Chưa hoàn tất không đồng nghĩa lỗi hoặc giao thất bại.")}</p>
    </section>
  </div>;
}
