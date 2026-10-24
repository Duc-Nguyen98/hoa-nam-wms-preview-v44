import { useShellPreferences } from '../../shared/shell-preferences';
import { reportDateTick } from '../report-date-display';
import { formatBusinessDate } from '../../i18n/format-business-date';
import { useReportCopy } from '../../i18n/reports-copy';
import type { CSSProperties } from 'react';
import { type MovementSummary } from '../../contracts/movement-history';
import { Icon } from '../../shared/Icon';
import { reportAxisWidth, reportCountScale } from '../../shared/report-chart-scale';
export function MovementHistoryCharts({ summary }: { summary: MovementSummary }) {
  const tx = useReportCopy();
  const { language } = useShellPreferences();
  const fraction = summary.transactions ? summary.inbound / summary.transactions * 100 : 0;
  const scale = reportCountScale(summary.daily.flatMap(point => [point.inbound, point.outbound]));
  const axisWidth = reportAxisWidth(scale.maximum, 20);
  const hasTransactions = summary.transactions > 0;
  return <div className="s20-charts">
    <section className="s20-volume" aria-label={tx("Biểu đồ số giao dịch theo ngày")}>
      <div className="s20-panel-heading"><p>{tx("Số giao dịch")}</p><div className="s20-chart-legend"><span><i />{tx("Nhập kho")}</span><span><i />{tx("Xuất kho")}</span></div></div>
      {hasTransactions && summary.daily.length > 0 ? <div className="s20-chart-scroll" role="region" aria-label={tx("Biểu đồ giao dịch theo ngày; cuộn ngang khi khung hẹp")} tabIndex={0}>
      <div className="s20-bars" style={{ '--report-axis-width': `${axisWidth}px`, minWidth: Math.max(420, summary.daily.length * 68 + axisWidth + 14) } as CSSProperties} role="img" aria-label={summary.daily.map(p => tx('{date}: {inbound} giao dịch nhập, {outbound} giao dịch xuất', { date: formatBusinessDate(p.date, language), inbound: p.inbound, outbound: p.outbound })).join('; ')}>
        <div className="s20-gridlines" aria-hidden="true">{scale.ticks.map(value=><div key={value}><span>{value.toLocaleString(tx('vi-VN'))}</span><i /></div>)}</div>
        <div className="s20-bar-columns" aria-hidden="true">{summary.daily.map(point=><div className="s20-bar-column" key={point.date}>
          <div className="s20-bar-space"><div className="s20-bar" style={{height:`${point.inbound / scale.maximum * 100}%`}}><strong>{point.inbound}</strong></div><div className="s20-bar s20-bar-out" style={{height:`${point.outbound / scale.maximum * 100}%`}}><strong>{point.outbound}</strong></div></div>
          <span className="s20-date-tick">{reportDateTick(point.date, language)}</span>
        </div>)}</div>
      </div>
      </div> : <p className="s20-chart-empty" role="status">{tx(hasTransactions ? 'Chưa có dữ liệu theo ngày.' : 'Chưa có giao dịch trong kỳ.')}</p>}
    </section>
    <section className="s20-composition" aria-labelledby="s20-composition-title">
      <div className="s20-composition-ratio"><h3 id="s20-composition-title">{tx("Cơ cấu giao dịch")}</h3>
        <div className="s20-ratio-bar" role="img" aria-label={tx(hasTransactions ? `${summary.inbound} giao dịch nhập (${summary.inboundPercent.toLocaleString(tx('vi-VN'), { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%); ${summary.outbound} giao dịch xuất (${summary.outboundPercent.toLocaleString(tx('vi-VN'), { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%)` : 'Chưa có giao dịch trong kỳ.')}><span style={{width:`${fraction}%`}} /><span style={{width:`${hasTransactions ? 100-fraction : 0}%`}} /></div>
        <ul className="s20-legend"><li><span><i />{tx("Nhập kho")}</span><strong>{summary.inbound} <small>{tx("·")} {summary.inboundPercent.toLocaleString(tx('vi-VN'), { minimumFractionDigits: 1, maximumFractionDigits: 1 })}{tx("%")}</small></strong></li><li><span><i />{tx("Xuất kho")}</span><strong>{summary.outbound} <small>{tx("·")} {summary.outboundPercent.toLocaleString(tx('vi-VN'), { minimumFractionDigits: 1, maximumFractionDigits: 1 })}{tx("%")}</small></strong></li></ul>
      </div>
      <div className="s20-peak"><Icon name="calendar" size={18} /><div>{hasTransactions && summary.peak.total > 0 ? <><span>{tx("Cao nhất:")} <strong>{formatBusinessDate(summary.peak.date, language)}</strong></span><span><strong>{summary.peak.total} {tx("giao dịch")}</strong> {tx("·")} {summary.peak.inbound} {tx("nhập ·")} {summary.peak.outbound} {tx("xuất")}</span></> : <span>{tx("Chưa có ngày phát sinh giao dịch.")}</span>}</div></div>
    </section>
  </div>;
}
