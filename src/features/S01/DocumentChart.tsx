import { formatOverviewBucketDate } from './overview-bucket-date';
import { useShellPreferences } from '../../shared/shell-preferences';
import { formatBusinessPeriod } from '../../i18n/format-business-date';
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { OverviewModel, OverviewPeriod } from '../../contracts/overview';
import './document-chart.css';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { CATALOGUE_EN_COPY } from '../../i18n/catalogue-copy';

const BASELINE = 150;
const STEP = 30;
const LEFT = 30;
const RIGHT = 12;

/** Rounded top corners only; bars still meet the shared zero baseline exactly. */
function barPath(x: number, width: number, value: number) {
  const height = value * STEP;
  const top = BASELINE - height;
  const radius = Math.min(5, width / 2, height);
  return `M ${x} ${BASELINE} V ${top + radius} Q ${x} ${top} ${x + radius} ${top} H ${x + width - radius} Q ${x + width} ${top} ${x + width} ${top + radius} V ${BASELINE} Z`;
}

/** S01 source counts only. Inspecting a bucket never changes the table or its query. */
export function DocumentChart({ points, period }: { points: OverviewModel['chart']; period: OverviewPeriod }) {
  const tx = useUiCopy(CATALOGUE_EN_COPY);
  const { language } = useShellPreferences();
  const bucketDate = (label: string) => formatOverviewBucketDate(label, language);
  const chartRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const [hovered, setHovered] = useState<number | null>(null);
  const [focused, setFocused] = useState<number | null>(null);
  const [pinned, setPinned] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const titleId = useId();
  const descriptionId = useId();
  const tooltipId = useId();
  const activeIndex = dismissed ? null : pinned ?? hovered ?? focused;
  const activePoint = activeIndex === null ? null : points[activeIndex];

  const inspectWithPointer = (index: number) => {
    // Inspecting another bucket replaces the previous pointer pin.
    if (pinned !== index) setPinned(null);
    setHovered(index);
    setDismissed(false);
  };

  useLayoutEffect(() => {
    const element = chartRef.current;
    if (!element) return;
    const measure = () => setWidth(Math.max(1, element.getBoundingClientRect().width));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!activePoint) return;
    const dismiss = () => { setPinned(null); setDismissed(true); };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismiss();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !chartRef.current?.contains(event.target)) {
        setHovered(null);
        dismiss();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [activePoint]);

  const groupWidth = (width - LEFT - RIGHT) / Math.max(1, points.length);
  const barWidth = Math.min(46, Math.max(8, groupWidth * 0.28));
  const barGap = Math.min(10, groupWidth * 0.1);
  const tooltipWidth = Math.min(220, Math.max(0, width - 16));
  const tooltipCenter = LEFT + ((activeIndex ?? 0) + 0.5) * groupWidth;
  const tooltipLeft = Math.max(8, Math.min(tooltipCenter - tooltipWidth / 2, width - tooltipWidth - 8));

  return <section className="ov-panel ov-chart ov-document-chart hn-premium-panel" aria-labelledby={titleId}>
    <div className="ov-document-chart__heading">
      <div><h2 id={titleId}>{tx("Phiếu nhập và xuất")}</h2><p>{tx('Số phiếu ·')}{' '}{period.from === '2026-09-01' && period.to === '2026-09-30' ? tx('Tháng 09/2026') : formatBusinessPeriod(period, language)}{' '}{tx('· Tất cả trạng thái')}</p></div>
      <ul className="ov-document-chart__legend" aria-label={tx("Chú giải biểu đồ")}>
        <li><i className="ov-document-chart__dot--inbound" aria-hidden="true" />{tx("Nhập kho")}</li>
        <li><i className="ov-document-chart__dot--outbound" aria-hidden="true" />{tx("Xuất kho")}</li>
      </ul>
    </div>
    <div className="ov-document-chart__canvas" ref={chartRef} onPointerLeave={() => setHovered(null)}>
      <svg viewBox={`0 0 ${width} 190`} role="img" aria-labelledby={`${titleId} ${descriptionId}`} className="ov-chart__plot ov-document-chart__plot">
        <desc id={descriptionId}>{points.map((point) => tx('{date}: {inbound} phiếu nhập, {outbound} phiếu xuất', { date: bucketDate(point.label), inbound: point.inbound, outbound: point.outbound })).join('; ')}{tx('. Số phiếu ở tất cả trạng thái.')}</desc>
        {[0, 1, 2, 3, 4].map((value) => <g key={value} className="ov-document-chart__axis">
          <line x1={LEFT} x2={width - RIGHT} y1={BASELINE - value * STEP} y2={BASELINE - value * STEP} className={value === 0 ? 'ov-document-chart__baseline' : undefined} />
          <text x="17" y={BASELINE - value * STEP + 4} textAnchor="end">{value}</text>
        </g>)}
        {points.map((point, index) => {
          const center = LEFT + (index + 0.5) * groupWidth;
          const inboundX = center - barWidth - barGap / 2;
          const outboundX = center + barGap / 2;
          return <g key={point.label} className="ov-document-chart__bucket" data-active={index === activeIndex}>
            {point.inbound > 0 && <path d={barPath(inboundX, barWidth, point.inbound)} className="ov-document-chart__bar--inbound" />}
            {point.outbound > 0 && <path d={barPath(outboundX, barWidth, point.outbound)} className="ov-document-chart__bar--outbound" />}
            <text className="ov-document-chart__value" x={inboundX + barWidth / 2} y={BASELINE - point.inbound * STEP - 10} textAnchor="middle">{point.inbound}</text>
            <text className="ov-document-chart__value" x={outboundX + barWidth / 2} y={BASELINE - point.outbound * STEP - 10} textAnchor="middle">{point.outbound}</text>
            <text className="ov-document-chart__date" x={center} y="178" textAnchor="middle">{point.label}</text>
          </g>;
        })}
      </svg>
      {/* Native controls are siblings of role=img, so assistive technology can reach every bucket. */}
      <div className="ov-document-chart__targets">
        {points.map((point, index) => <button
          key={point.label}
          type="button"
          className="ov-document-chart__target"
          data-chart-bucket={point.label}
          aria-label={tx('Chi tiết phiếu ngày {date}', { date: bucketDate(point.label) })}
          aria-describedby={index === activeIndex ? tooltipId : undefined}
          aria-pressed={pinned === index && !dismissed}
          onPointerEnter={(event) => {
            // Focusing a control can scroll another bucket under a stationary
            // pointer. Only deliberate movement should replace that focus.
            if (event.pointerType !== 'touch' && focused === null) inspectWithPointer(index);
          }}
          onPointerMove={(event) => {
            if (event.pointerType !== 'touch' && focused !== null && (event.movementX !== 0 || event.movementY !== 0)) {
              setFocused(null);
              inspectWithPointer(index);
            }
          }}
          onFocus={() => {
            setHovered(null);
            setFocused(index);
            setPinned(null);
            setDismissed(false);
          }}
          onBlur={() => { setFocused(null); setPinned(null); }}
          onClick={(event) => {
            // Pointer activation uses the explicit pin; it must not leave an
            // invisible focus fallback that restores an older bucket on exit.
            if (event.detail > 0) setFocused(null);
            if (pinned === index) { setPinned(null); setDismissed(true); }
            else { setPinned(index); setDismissed(false); }
          }}
        />)}
      </div>
      {activePoint && <div
        id={tooltipId}
        role="tooltip"
        className="ov-document-chart__tooltip"
        style={{ left: tooltipLeft, width: tooltipWidth }}
        // This read-only content should not steal focus and cancel a touch pin.
        onPointerDown={(event) => event.preventDefault()}
      >
        <strong>{bucketDate(activePoint.label)}</strong>
        <div><span><i className="ov-document-chart__dot--inbound" aria-hidden="true" />{tx("Nhập kho")}</span><b>{activePoint.inbound} <span>{tx("phiếu")}</span></b></div>
        <div><span><i className="ov-document-chart__dot--outbound" aria-hidden="true" />{tx("Xuất kho")}</span><b>{activePoint.outbound} <span>{tx("phiếu")}</span></b></div>
      </div>}
    </div>
  </section>;
}
