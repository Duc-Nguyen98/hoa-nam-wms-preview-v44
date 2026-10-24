import { reportDateTick } from '../report-date-display';
import { formatBusinessDate } from '../../i18n/format-business-date';
import { useShellPreferences } from '../../shared/shell-preferences';
import { formatDeclaredPercentage } from '../../i18n/format-declared-percentage';
import { useReportCopy } from '../../i18n/reports-copy';
import type { TraceSummary } from '../../contracts/goods-trace-report';
import { reportAxisWidth, reportCountScale, reportDayCenter } from '../../shared/report-chart-scale';

/** SVG presentation from the controller model, no fixture import or chart library. */
export function TraceCharts({ summary }: { summary: TraceSummary }) {
  const tx = useReportCopy();
  const { language } = useShellPreferences();
  const groups = [
    { label: tx('Đủ lịch sử'), value: summary.complete, color: '#34785a' },
    { label: tx('Thiếu sự kiện'), value: summary.missingEvents, color: '#bf7d16' },
    { label: tx('Lệch trạng thái'), value: summary.statusMismatch, color: '#ba3a35' },
  ];
  let offset = 0;
  const scale = reportCountScale(summary.daily.map(day => day.events));
  const left = reportAxisWidth(scale.maximum, 32) + 8;
  const width = Math.max(380, left + summary.daily.length * 72 + 12);
  const plotWidth = width - left - 12;
  const hasEvents = summary.daily.some(day => day.events > 0);
  return <div className="s26-charts">
    <section className="s26-panel s26-events hn-premium-panel" aria-labelledby="s26-events-title">
      <div className="s26-panel-heading"><h2 id="s26-events-title">{tx("Sự kiện truy vết theo ngày")}</h2><span>{summary.events} {tx("sự kiện · toàn kỳ")}</span></div>
      {hasEvents ? <div className="s26-chart-scroll" role="region" aria-label={tx("Biểu đồ sự kiện theo ngày; cuộn ngang khi cần")} tabIndex={0}><svg className="s26-bar-chart" style={{ minWidth: width }} viewBox={`0 0 ${width} 190`} role="img" aria-label={summary.daily.map(day => tx('{date}: {count} sự kiện', { date: formatBusinessDate(day.date, language), count: day.events })).join('; ')}>
        {scale.ticks.map(value => <g key={value}><line x1={left} x2={width - 12} y1={154 - value / scale.maximum * 120} y2={154 - value / scale.maximum * 120} stroke="#e4e9ef" /><text x={left - 8} y={159 - value / scale.maximum * 120} textAnchor="end" className="s26-axis">{value.toLocaleString(tx('vi-VN'))}</text></g>)}
        {summary.daily.map((day, index) => {
          const x = left + reportDayCenter(index, summary.daily.length, plotWidth), height = day.events / scale.maximum * 120;
          return <g key={day.date}>
            <rect x={x - 23} y={154 - height} width="46" height={height} rx="4" fill="#004E74" />
            <text x={x} y={145 - height} textAnchor="middle" className="s26-bar-value">{day.events}</text>
            <text x={x} y="179" textAnchor="middle" className="s26-axis">{reportDateTick(day.date, language)}</text>
          </g>;
        })}
      </svg></div> : <p role="status">{tx("Chưa có sự kiện trong kỳ.")}</p>}
    </section>
    <section className="s26-panel hn-premium-panel" aria-labelledby="s26-quality-title">
      <div className="s26-panel-heading"><h2 id="s26-quality-title">{tx("Chất lượng truy vết")}</h2><span>{tx("Toàn bộ")} {summary.total} {tx("hàng hóa")}</span></div>
      <div className="s26-quality-body"><div className="s26-ring">
        <svg viewBox="0 0 120 120" aria-hidden="true">
          {!summary.total && <circle cx="60" cy="60" r="49" fill="none" stroke="#e4e9ef" strokeWidth="10" />}
          {groups.map(group => {
          const length = summary.total ? group.value / summary.total * 100 : 0, start = offset; offset += length;
          return <circle key={group.label} cx="60" cy="60" r="49" fill="none" stroke={group.color} strokeWidth="10" pathLength="100" strokeDasharray={`${length} ${100 - length}`} strokeDashoffset={-start} transform="rotate(-90 60 60)" />;
        })}</svg><div className="s26-ring-label"><strong>{formatDeclaredPercentage(summary.qualityRate, language)}</strong><span>{tx("Đủ lịch sử")}</span></div>
      </div><ul className="s26-quality-legend">{groups.map(group => <li key={group.label}><span><i style={{ background: group.color }} aria-hidden="true" />{group.label}</span><strong>{group.value}</strong></li>)}</ul></div>
    </section>
  </div>;
}
