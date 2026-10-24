import { useShellPreferences } from '../../shared/shell-preferences';
import { reportDateTick } from '../report-date-display';
import { formatBusinessDate } from '../../i18n/format-business-date';
import { useReportCopy } from '../../i18n/reports-copy';
import type { CSSProperties } from 'react';
import { type OutboundReportSummary } from '../../contracts/outbound-report';
import { reportAxisWidth, reportCountScale } from '../../shared/report-chart-scale';

// Same semantic foreground palette as the inherited shared table badges.
const colors = ['#286645', '#526174', '#835811', '#8895A5'];
/** Native React/CSS/SVG composition, as in the existing report stack. No chart dependency. */
export function OutboundReportCharts({ summary }: { summary: OutboundReportSummary }) {
  const tx = useReportCopy();
  const { language } = useShellPreferences();
  let offset = 0;
  const scale = reportCountScale(summary.daily.map(point => point.quantity));
  const axisWidth = reportAxisWidth(scale.maximum);
  const hasVolume = summary.daily.some(point => point.quantity > 0);
  return <div className="s19-charts">
    <section className="s19-panel" aria-labelledby="s19-volume-title">
      <div className="s19-panel-heading"><div><h2 id="s19-volume-title">{tx("Sản lượng xuất kho")}</h2><p>{tx("Số lượng thực xuất theo ngày")}</p></div><span className="s19-chart-unit">{tx("Đơn vị: sản phẩm")}</span></div>
      {hasVolume ? <div className="s19-chart-scroll" tabIndex={0} role="region" aria-label={tx("Biểu đồ sản lượng xuất kho; cuộn ngang khi khung hẹp")}><div className="s19-bars" style={{ '--report-axis-width': `${axisWidth}px`, minWidth: Math.max(380, summary.daily.length * 58 + axisWidth + 14) } as CSSProperties} role="img" aria-label={summary.daily.map(point => tx('{date}: {count} sản phẩm', { date: formatBusinessDate(point.date, language), count: point.quantity })).join('; ')}>
        <div className="s19-gridlines" aria-hidden="true">{scale.ticks.map(value => <div key={value}><span>{value.toLocaleString(tx('vi-VN'))}</span><i /></div>)}</div>
        <div className="s19-bar-columns" aria-hidden="true">{summary.daily.map(point => <div className="s19-bar-column" key={point.date}><div className="s19-bar-space"><div className="s19-bar" style={{ height: `${point.quantity / scale.maximum * 100}%` }}><strong>{point.quantity}</strong></div></div><span className="s19-date-tick"><span>{reportDateTick(point.date, language).split('/')[0]}</span><span>{tx("/")}{reportDateTick(point.date, language).split('/')[1]}</span></span></div>)}</div>
      </div></div> : <p className="s19-chart-empty" role="status">{tx("Chưa có sản lượng xuất kho trong kỳ.")}</p>}
    </section>
    <section className="s19-panel" aria-labelledby="s19-progress-title">
      <div className="s19-panel-heading"><div><h2 id="s19-progress-title">{tx("Tiến độ xuất kho")}</h2><p>{tx("Trạng thái")} {summary.receipts} {tx("phiếu trong kỳ")}</p></div></div>
      <div className="s19-progress-body">
        <div className="s19-donut"><svg viewBox="0 0 120 120" role="img" aria-label={tx(summary.receipts ? summary.progress.map(item => `${tx(item.status)}: ${item.count} phiếu`).join('; ') : 'Chưa có phiếu xuất trong kỳ.')}>
          {summary.receipts === 0 && <circle cx="60" cy="60" r="48" fill="none" stroke="var(--hn-border)" strokeWidth="14" />}
          {summary.progress.map((item, index) => {
            if (item.count === 0 || summary.receipts === 0) return null;
            const start = offset, value = item.count / summary.receipts * 100; offset += value;
            return <circle key={tx(item.status)} cx="60" cy="60" r="48" fill="none" stroke={colors[index]} strokeWidth="14" pathLength="100" strokeDasharray={`${value} ${100 - value}`} strokeDashoffset={-start} transform="rotate(-90 60 60)" />;
          })}
        </svg><div aria-hidden="true"><strong>{summary.receipts}</strong><span>{tx("phiếu xuất")}</span></div></div>
        <ul className="s19-legend">{summary.progress.map((item, index) => <li key={tx(item.status)}><span><i style={{ background: colors[index] }} />{tx(item.status)}</span><strong>{item.count}</strong></li>)}</ul>
      </div>
    </section>
  </div>;
}
