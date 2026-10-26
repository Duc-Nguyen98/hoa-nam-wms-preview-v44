import { reportDateTick } from '../report-date-display';
import { formatBusinessDate } from '../../i18n/format-business-date';
import { useShellPreferences } from '../../shared/shell-preferences';
import { formatDeclaredPercentage } from '../../i18n/format-declared-percentage';
import { useReportCopy } from '../../i18n/reports-copy';
import type { CSSProperties } from 'react';
import type { InboundReportSummary } from '../../contracts/inbound-report';
import { reportAxisWidth, reportCountScale } from '../../shared/report-chart-scale';

const colors = ['#0A3765', '#167D9A', '#B87510', '#8895A5'];
/** Native React/SVG chart, matching the existing stack's SVG approach; no chart library. */
export function InboundReportCharts({ summary }: { summary: InboundReportSummary }) {
  const tx = useReportCopy();
  const { language } = useShellPreferences();
  let offset = 0;
  const scale = reportCountScale(summary.daily.map(point => point.quantity));
  const axisWidth = reportAxisWidth(scale.maximum);
  const hasVolume = summary.daily.some(point => point.quantity > 0);
  const hasComparison = summary.previousProducts > 0;
  return <div className="s18-charts">
    <section className="hn-premium-panel s18-panel s18-volume" aria-labelledby="s18-volume-title">
      <div className="s18-panel-heading"><div><h2 id="s18-volume-title">{tx("Sản lượng nhập kho")}</h2><p>{tx("Thực nhập theo ngày · sản phẩm")}</p></div><span className="s18-trend" data-positive={hasComparison && summary.increasePercentage > 0}>{hasComparison ? <>{summary.increasePercentage > 0 ? '+' : ''}{summary.increasePercentage.toLocaleString(tx('vi-VN'))}{tx("%")} <small>{tx("so với kỳ trước")}</small></> : tx('Chưa có kỳ so sánh')}</span></div>
      {hasVolume ? <div className="s18-chart-scroll" tabIndex={0} role="region" aria-label={tx("Biểu đồ sản lượng nhập kho; cuộn ngang khi khung hẹp")}><div className="s18-bars" style={{ '--report-axis-width': `${axisWidth}px`, minWidth: Math.max(380, summary.daily.length * 58 + axisWidth + 14) } as CSSProperties} role="img" aria-label={summary.daily.map(point => tx('{date}: {count} sản phẩm', { date: formatBusinessDate(point.date, language), count: point.quantity })).join('; ')}>
        <div className="s18-gridlines" aria-hidden="true">{scale.ticks.map(value => <div key={value}><span>{value.toLocaleString(tx('vi-VN'))}</span><i /></div>)}</div>
        <div className="s18-bar-columns" aria-hidden="true">{summary.daily.map(point => <div className="s18-bar-column" key={point.date}><div className="s18-bar-space"><div className="s18-bar" style={{ height: `${point.quantity / scale.maximum * 100}%` }}><strong>{point.quantity}</strong></div></div><span>{reportDateTick(point.date, language)}</span></div>)}</div>
      </div></div> : <p className="s18-chart-empty" role="status">{tx("Chưa có sản lượng nhập kho trong kỳ.")}</p>}
      <p className="s18-chart-foot">{tx("Tổng hợp toàn kỳ")} <span>{tx("Kỳ trước:")} <strong>{summary.previousProducts.toLocaleString(tx('vi-VN'))}</strong> {tx("sản phẩm")}</span></p>
    </section>
    <section className="hn-premium-panel s18-panel s18-progress" aria-labelledby="s18-progress-title">
      <div className="s18-panel-heading"><div><h2 id="s18-progress-title">{tx("Tiến độ nhập kho")}</h2><p>{tx("Trạng thái")} {summary.receipts} {tx("phiếu trong kỳ")}</p></div></div>
      <div className="s18-progress-body">
        <div className="s18-donut"><svg viewBox="0 0 120 120" role="img" aria-label={tx(summary.receipts ? summary.progress.map(item => `${tx(item.status)}: ${item.count} phiếu`).join('; ') : 'Chưa có phiếu nhập trong kỳ.')}>
          {summary.receipts === 0 && <circle cx="60" cy="60" r="48" fill="none" stroke="var(--hn-border)" strokeWidth="12" />}
          {summary.progress.map((item, index) => { if (!summary.receipts || !item.count) return null; const start = offset; const value = item.count / summary.receipts * 100; offset += value; return <circle key={tx(item.status)} cx="60" cy="60" r="48" fill="none" stroke={colors[index]} strokeWidth="12" pathLength="100" strokeDasharray={`${value} ${100 - value}`} strokeDashoffset={-start} transform="rotate(-90 60 60)" />; })}
        </svg><div aria-hidden="true"><strong>{summary.receipts ? formatDeclaredPercentage(summary.completedPercentage, language) : '0'}</strong><span>{tx(summary.receipts ? 'Hoàn tất' : 'phiếu nhập')}</span></div></div>
        <ul className="s18-legend">{summary.progress.map((item, index) => <li key={tx(item.status)}><span><i style={{ background: colors[index] }} />{tx(item.status)}</span><strong>{item.count}</strong></li>)}</ul>
      </div>
    </section>
  </div>;
}
