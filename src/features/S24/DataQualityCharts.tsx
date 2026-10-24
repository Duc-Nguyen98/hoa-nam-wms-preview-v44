import { reportDateTick } from '../report-date-display';
import { formatBusinessDate } from '../../i18n/format-business-date';
import { useShellPreferences } from '../../shared/shell-preferences';
import { formatDeclaredPercentage } from '../../i18n/format-declared-percentage';
import { useReportCopy } from '../../i18n/reports-copy';
import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { type DataQualitySummary } from '../../contracts/data-quality-report';
import { Button } from '../../shared/primitives';
import { reportAxisWidth, reportCountScale, reportDayCenter } from '../../shared/report-chart-scale';
import { chartFocusScrollLeft, chartTooltipPosition } from './data-quality-chart-layout';

/** Native React/SVG chart, matching the existing report stack; no new dependency. */
export function DataQualityCharts({ summary }: { summary: DataQualitySummary }) {
  const tx = useReportCopy();
  const { language } = useShellPreferences();
  const [hovered, setHovered] = useState<number | null>(null);
  const [focused, setFocused] = useState<number | null>(null);
  const [inputMode, setInputMode] = useState<'pointer' | 'keyboard'>('pointer');
  const [dismissed, setDismissed] = useState(false);
  const tooltipId = useId();
  const svg = useRef<SVGSVGElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const [visibleChart, setVisibleChart] = useState({ left: 0, width: 720 });
  const [chartWidth, setChartWidth] = useState(720);
  const dayCount = summary.daily.length;
  const scale = reportCountScale(summary.daily.map(day => day.matched + day.different + day.errors), 5);
  const left = reportAxisWidth(scale.maximum, 32) + 8;
  const minChartWidth = Math.max(380, dayCount * 64 + left + 8);
  const width = Math.max(chartWidth, minChartWidth);
  const hasDailyValues = summary.daily.some(day => day.matched + day.different + day.errors > 0);
  useLayoutEffect(() => {
    if (!svg.current) return;
    const measure = () => {
      const width = svg.current?.getBoundingClientRect().width;
      if (width) setChartWidth(width);
      const region = viewport.current;
      if (region) setVisibleChart(old => old.left === region.scrollLeft && old.width === region.clientWidth ? old : { left: region.scrollLeft, width: region.clientWidth });
    };
    const observer = new ResizeObserver(measure); observer.observe(svg.current); measure();
    if (viewport.current) observer.observe(viewport.current);
    return () => observer.disconnect();
  }, [hasDailyValues, minChartWidth]);
  useLayoutEffect(() => {
    if (inputMode !== 'keyboard' || focused === null) return;
    // Run after native focus scrolling, which may reveal only part of a day button.
    const frame = requestAnimationFrame(() => {
      const region = viewport.current;
      const button = region?.querySelectorAll<HTMLButtonElement>('.s24-day-buttons > button')[focused];
      if (!region || !button || document.activeElement !== button) return;
      const area = region.getBoundingClientRect(), box = button.getBoundingClientRect();
      region.scrollLeft = chartFocusScrollLeft(region.scrollLeft, region.clientWidth,
        box.left - area.left + region.scrollLeft, box.right - area.left + region.scrollLeft, region.scrollWidth);
      setVisibleChart(old => old.left === region.scrollLeft && old.width === region.clientWidth ? old : { left: region.scrollLeft, width: region.clientWidth });
    });
    return () => cancelAnimationFrame(frame);
  }, [focused, inputMode, visibleChart.width]);
  const index = inputMode === 'keyboard' ? focused : hovered ?? focused;
  const active = !dismissed && index !== null ? summary.daily[index] : null;
  const tooltip = chartTooltipPosition(left + reportDayCenter(index ?? 0, dayCount, width - left - 8), visibleChart.left, visibleChart.width);
  useEffect(() => {
    if (!active) return;
    // A pointer-opened tooltip must also be dismissible when focus is elsewhere.
    const dismissOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.isComposing) setDismissed(true);
    };
    document.addEventListener('keydown', dismissOnEscape);
    return () => document.removeEventListener('keydown', dismissOnEscape);
  }, [active]);
  const height = 110, base = 129, max = scale.maximum;
  const describeDay = (day: DataQualitySummary['daily'][number]) => tx('{date}: {matched} Khớp, {different} Chênh lệch, {errors} Lỗi dữ liệu; tổng {total}', {
    date: formatBusinessDate(day.date, language), matched: day.matched, different: day.different, errors: day.errors, total: day.matched + day.different + day.errors,
  });
  return <section className="s24-chart hn-premium-panel" aria-labelledby="s24-chart-title">
    <div className="s24-panel-heading"><h2 id="s24-chart-title">{tx("Kết quả đối chiếu theo ngày")}</h2><span>{tx("Đơn vị: bản ghi")}</span></div>
    {hasDailyValues ? <div ref={viewport} className="s24-chart-viewport" role="region" aria-label={tx("Biểu đồ đối chiếu theo ngày; cuộn ngang khi khung hẹp")} tabIndex={0} onScroll={event => { const region = event.currentTarget; setVisibleChart({ left: region.scrollLeft, width: region.clientWidth }); }}><div className="s24-chart-canvas" style={{ minWidth: minChartWidth, '--s24-day-count': dayCount, '--s24-chart-left': `${left}px` } as CSSProperties} onPointerLeave={() => setHovered(null)} onKeyDown={event => { if (event.nativeEvent.isComposing) return; setInputMode('keyboard'); if (event.key === 'Escape') { setDismissed(true); event.stopPropagation(); } }}>
    <svg ref={svg} className="s24-stacked-chart" viewBox={`0 0 ${width} 138`} role="img" aria-labelledby="s24-chart-title s24-chart-description">
      <desc id="s24-chart-description">{summary.daily.map(describeDay).join('; ')}</desc>
      {scale.ticks.map(value => <g key={value} aria-hidden="true"><line x1={left} x2={width - 8} y1={base - value / max * height} y2={base - value / max * height} className="s24-gridline" /><text x={left - 8} y={base - value / max * height + 4} textAnchor="end" className="s24-axis">{value.toLocaleString(tx('vi-VN'))}</text></g>)}
      {summary.daily.map((day, index) => {
        const columnWidth = (width - left - 8) / dayCount;
        const x = left + reportDayCenter(index, dayCount, width - left - 8) - 21, matched = day.matched / max * height, different = day.different / max * height, errors = day.errors / max * height;
        const total = day.matched + day.different + day.errors;
        return <g key={day.date} data-day={day.date} aria-hidden="true" onPointerMove={() => { setInputMode('pointer'); setHovered(index); setDismissed(false); }}>
          <rect x={x + 21 - columnWidth / 2} y="0" width={columnWidth} height={base} fill="transparent" />
          <rect x={x} y={base - matched} width="42" height={matched} fill="#34785a" />
          <rect x={x} y={base - matched - different} width="42" height={different} fill="#bf7d16" />
          <rect x={x} y={base - matched - different - errors} width="42" height={errors} fill="#ba3a35" />
          <text x={x + 21} y={base - total / max * height - 8} textAnchor="middle" className="s24-total">{total}</text>
        </g>;
      })}
    </svg>
    <div className="s24-day-buttons" aria-label={tx("Xem số liệu từng ngày")}>{summary.daily.map((day, dayIndex) => <Button key={day.date} variant="ghost" aria-label={tx('Số liệu ngày {description}', { description: describeDay(day) })} aria-describedby={active && dayIndex === index ? tooltipId : undefined}
      onPointerMove={() => { setInputMode('pointer'); setHovered(dayIndex); setDismissed(false); }}
      onFocus={() => { setInputMode('keyboard'); setHovered(null); setFocused(dayIndex); setDismissed(false); }} onBlur={() => setFocused(null)}
      onClick={() => { setInputMode('keyboard'); setHovered(null); setFocused(dayIndex); setDismissed(false); }}>{reportDateTick(day.date, language)}</Button>)}</div>
    {active && <div className="s24-chart-tooltip" role="tooltip" id={tooltipId} style={{ left: tooltip.center, width: tooltip.width }}>
      <strong>{formatBusinessDate(active.date, language)} <span>{active.matched + active.different + active.errors} {tx("bản ghi")}</span></strong>
      <span><i className="s24-dot s24-dot--match" />{tx("Khớp")} <b>{active.matched}</b></span>
      <span><i className="s24-dot s24-dot--different" />{tx("Chênh lệch")} <b>{active.different}</b></span>
      <span><i className="s24-dot s24-dot--error" />{tx("Lỗi dữ liệu")} <b>{active.errors}</b></span>
    </div>}
    </div></div> : <p className="s24-chart-empty" role="status">{tx("Chưa có bản ghi đối chiếu trong kỳ.")}</p>}
    <ul className="s24-chart-legend" aria-label={tx("Tổng từng kết quả toàn kỳ")}>
      <li><i className="s24-dot s24-dot--match" />{tx("Khớp")} <strong>{summary.matched.toLocaleString(tx('vi-VN'))}</strong></li>
      <li><i className="s24-dot s24-dot--different" />{tx("Chênh lệch")} <strong>{summary.different}</strong></li>
      <li><i className="s24-dot s24-dot--error" />{tx("Lỗi dữ liệu")} <strong>{summary.errors}</strong></li>
    </ul>
  </section>;
}

export function DataQualityRing({ summary }: { summary: DataQualitySummary }) {
  const tx = useReportCopy();
  const { language } = useShellPreferences();
  let offset = 0;
  const segments = [
    { label: tx('Khớp'), count: summary.matched, color: '#34785a' },
    { label: tx('Chênh lệch'), count: summary.different, color: '#bf7d16' },
    { label: tx('Lỗi dữ liệu'), count: summary.errors, color: '#ba3a35' },
  ];
  return <div className="s24-quality-body"><div className="s24-ring">
    <svg viewBox="0 0 120 120" role="img" aria-label={summary.total ? tx('Chất lượng {rate}; {description}', { rate: formatDeclaredPercentage(summary.qualityRate, language), description: segments.map(item => `${item.label}: ${item.count}`).join('; ') }) : tx('Chưa có bản ghi đối chiếu trong kỳ.')}>
      {!summary.total && <circle cx="60" cy="60" r="48" fill="none" stroke="var(--hn-border)" strokeWidth="13" />}
      {segments.map(item => { if (!summary.total || !item.count) return null; const start = offset, value = item.count / summary.total * 100; offset += value;
        return <circle key={item.label} cx="60" cy="60" r="48" fill="none" stroke={item.color} strokeWidth="13" pathLength="100" strokeDasharray={`${value} ${100 - value}`} strokeDashoffset={-start} transform="rotate(-90 60 60)" />;
      })}
    </svg><div className="s24-ring-label" aria-hidden="true"><strong>{summary.total ? formatDeclaredPercentage(summary.qualityRate, language) : '0'}</strong><span>{tx(summary.total ? 'Khớp' : 'bản ghi')}</span></div>
  </div><ul className="s24-quality-legend">{segments.map(item => <li key={item.label}><span><i className="s24-dot" style={{ background: item.color }} />{tx(item.label)}</span><strong>{item.count.toLocaleString(tx('vi-VN'))}</strong></li>)}</ul></div>;
}
