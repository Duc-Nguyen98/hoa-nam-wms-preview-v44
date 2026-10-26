import { useShellPreferences } from '../../shared/shell-preferences';
import { reportDateTick } from '../report-date-display';
import { formatBusinessDate } from '../../i18n/format-business-date';
import { useReportCopy } from '../../i18n/reports-copy';
import type { CSSProperties } from 'react';
import { type InventoryReportSummary } from '../../contracts/inventory-report';
import { reportAxisWidth, reportCountScale, reportDayCenter } from '../../shared/report-chart-scale';

/** SVG data composition follows the current React report stack; no new chart library. */
export function InventoryReportChart({ summary }: { summary: InventoryReportSummary }) {
  const tx = useReportCopy();
  const { language } = useShellPreferences();
  const description = summary.daily.map(day => tx('{date}: nhập {inbound}, xuất sản phẩm {outbound}, tồn cuối {closing}', { date: formatBusinessDate(day.date, language), inbound: day.inbound, outbound: day.outboundProducts, closing: day.closing })).join('; ');
  const scale = reportCountScale(summary.daily.flatMap(day => [day.inbound, day.outboundProducts, day.closing]));
  const axisWidth = reportAxisWidth(scale.maximum, 28);
  const dayCount = summary.daily.length;
  const dateRange = dayCount ? `${formatBusinessDate(summary.daily[0].date, language)} – ${formatBusinessDate(summary.daily[dayCount - 1].date, language)}` : 'Kỳ đã chọn';
  return <section className="s21-panel hn-premium-panel s21-chart" aria-labelledby="s21-chart-title">
    <div className="s21-panel-heading"><div><h2 id="s21-chart-title">{tx("Biến động tồn kho")}</h2><p>{tx(dateRange)} {tx("· Đơn vị tồn")}</p></div>
      <ul className="s21-chart-legend" aria-label={tx("Chú giải biểu đồ")}><li><i className="s21-inbound" />{tx("Nhập")}</li><li><i className="s21-outbound" />{tx("Xuất SP")}</li><li><i className="s21-closing" />{tx("Tồn cuối ngày")}</li></ul>
    </div>
    {dayCount > 0 ? <div className="s21-chart-scroll" tabIndex={0} role="region" aria-label={tx("Biểu đồ biến động tồn kho; cuộn ngang khi khung hẹp")}>
      <div className="s21-chart-plot" style={{ '--report-axis-width': `${axisWidth}px`, minWidth: Math.max(480, dayCount * 72 + axisWidth + 10) } as CSSProperties} role="img" aria-label={tx('Nhập, xuất sản phẩm và tồn cuối ngày. {description}', { description })}>
        <div className="s21-gridlines" aria-hidden="true">{scale.ticks.map(value => <div key={value}><span>{value.toLocaleString(tx('vi-VN'))}</span><i /></div>)}</div>
        <div className="s21-chart-data" aria-hidden="true">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none"><polyline points={summary.daily.map((day,index) => `${reportDayCenter(index, dayCount)},${100 - day.closing / scale.maximum * 100}`).join(' ')} fill="none" className="s21-stock-line" vectorEffect="non-scaling-stroke" /></svg>
          {summary.daily.map(day => <div className="s21-day" key={day.date}>
            <div className="s21-day-bars"><i className="s21-bar-inbound" style={{height:`${day.inbound / scale.maximum * 100}%`}} /><i className="s21-bar-outbound" style={{height:`${day.outboundProducts / scale.maximum * 100}%`}} /></div>
            <div className="s21-stock-point" style={{bottom:`${day.closing / scale.maximum * 100}%`}}><b>{day.closing.toLocaleString(tx('vi-VN'))}</b><i /></div>
            <span className="s21-day-label">{reportDateTick(day.date, language)}</span>
          </div>)}
        </div>
      </div>
    </div> : <p className="s21-chart-empty" role="status">{tx("Chưa có dữ liệu tồn kho theo ngày.")}</p>}
    <p className="s21-chart-note">{tx("Tồn cuối ngày đã tính Xuất BH và Hoàn tác.")}</p>
  </section>;
}
