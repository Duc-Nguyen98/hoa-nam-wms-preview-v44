import { useReportCopy } from '../../i18n/reports-copy';
import { ReportExcelButton } from '../../exports/ReportExcelButton';
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { createWarrantyPartsReportController, type WarrantyReportOutcome } from '../../controllers/warranty-parts-report-controller';
import { DEFAULT_WARRANTY_REPORT_PERIOD, warrantyReportPeriodLabel, type WarrantyReportAdapter, type WarrantyReportPeriod } from '../../contracts/warranty-parts-report';
import { Button, Card, CatalogueListHeader, CataloguePageHeader, DateRangePicker, GlobalShell, Icon, Notice, PageState, ReportScopeNote, reportReadErrorMessage, type NoticeFeedback } from '../../shared';
import { S00_SHELL_NAVIGATION } from '../../shared/s00-navigation';
import { useKeyboardFocusReveal } from '../../shared/focus';
import { WarrantyPartsProgress } from './WarrantyPartsProgress';
import { WarrantyPartsReadStatus } from './WarrantyPartsReadStatus';
import { WarrantyPartsDetail } from './WarrantyPartsDetail';
import type { WarrantyDetailAdapter } from '../../contracts/warranty-parts-detail';
import { createOperationalWebAdapter } from '../../data/http/operational-preview-adapter';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { OperationalWarrantyReport, S22_OPERATIONAL_COPY } from './OperationalWarrantyReport';
import './warranty-parts-report.css';
import { IS_BROWSER_PREVIEW } from '../../preview-mode';

export function WarrantyPartsReportScreen({ adapter, detailAdapter }: { adapter?: WarrantyReportAdapter; detailAdapter?: WarrantyDetailAdapter } = {}) {
  const tx = useReportCopy(), copy = useUiCopy(S22_OPERATIONAL_COPY);
  const operational = useMemo(() => createOperationalWebAdapter(undefined, { scope: 'S22' }), []);
  const [cohort, setCohort] = useState<'scenario' | 'legacy'>(() => IS_BROWSER_PREVIEW ? 'legacy' : operational.available ? 'scenario' : 'legacy');
  const controls = operational.available ? <div className="s22-cohorts"><Button variant="secondary" aria-pressed={cohort === 'scenario'} onClick={() => setCohort('scenario')}>{copy('Báo cáo phiên hiện tại')}</Button><Button variant="secondary" aria-pressed={cohort === 'legacy'} onClick={() => setCohort('legacy')}>{copy('Báo cáo tham chiếu')}</Button></div> : null;
  if (cohort === 'legacy') return <LegacyWarrantyPartsReportScreen adapter={adapter} detailAdapter={detailAdapter} cohortControls={controls} />;
  return <GlobalShell title={tx('Báo cáo bảo hành linh kiện')} variant="wms" activeKey="S22" navigation={S00_SHELL_NAVIGATION}>
    <div className="hn-catalogue-screen s22-screen" data-screen="S22" data-visual-variant="premium">
      <CataloguePageHeader appearance="worklist" title={tx('Báo cáo bảo hành linh kiện')} parentLabel={tx('Báo cáo & Thống kê')} breadcrumb={tx('Bảo hành linh kiện')} description={tx('Theo dõi tình hình tiếp nhận và xử lý bảo hành linh kiện theo kỳ.')} />
      {controls}<OperationalWarrantyReport adapter={operational} />
    </div>
  </GlobalShell>;
}

function LegacyWarrantyPartsReportScreen({ adapter, detailAdapter, cohortControls }: { adapter?: WarrantyReportAdapter; detailAdapter?: WarrantyDetailAdapter; cohortControls?: ReactNode }) {
  const tx = useReportCopy();
  const controller = useMemo(() => createWarrantyPartsReportController(adapter), [adapter]);
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
  const screen = useRef<HTMLDivElement>(null);
  const sequence = useRef(0);
  const [notice, setNotice] = useState<NoticeFeedback | null>(null);
  const [intendedPeriod, setIntendedPeriod] = useState<WarrantyReportPeriod>(DEFAULT_WARRANTY_REPORT_PERIOD);
  const [initialReadIssue, setInitialReadIssue] = useState<'error' | 'blocked' | null>(null);
  const [periodHelpOpen, setPeriodHelpOpen] = useState(false);
  const revealFocus = useKeyboardFocusReveal();
  const notify = useCallback((message: string, origin: HTMLElement | null, tone: NoticeFeedback['tone'] = 'info') => {
    setNotice({ message, origin, tone, sequence: ++sequence.current, container: document.body });
  }, []);
  const finishRead = useCallback((result: WarrantyReportOutcome, origin: HTMLElement | null) => {
    if (result.kind === 'superseded') return;
    if (result.kind === 'error') {
      if (controller.getSnapshot().model) notify(reportReadErrorMessage(true), origin, 'error');
      else setInitialReadIssue('error');
      return;
    }
    if (result.kind === 'blocked') {
      if (result.reason === 'INVALID_PERIOD') { notify(result.detail, origin); if (!controller.getSnapshot().model) setInitialReadIssue('blocked'); return; }
      const accepted = controller.getSnapshot().model?.period;
      if (accepted) notify(`Chưa có dữ liệu cho kỳ vừa chọn. Đang hiển thị kỳ ${warrantyReportPeriodLabel(accepted)}.`, origin);
      else setInitialReadIssue('blocked');
      return;
    }
    setIntendedPeriod(controller.getSnapshot().model?.period ?? DEFAULT_WARRANTY_REPORT_PERIOD);
    setInitialReadIssue(null);
  }, [controller, notify]);
  useEffect(() => {
    let mounted = true;
    void controller.load().then(result => { if (mounted) finishRead(result, null); });
    return () => { mounted = false; controller.clear(); };
  }, [controller, finishRead]);
  const model = state.model;
  const period = intendedPeriod;
  const summary = model?.summary;
  async function changePeriod(next: WarrantyReportPeriod) {
    setIntendedPeriod({ ...next });
    const origin = screen.current?.querySelector<HTMLElement>('#s22-period') ?? null;
    setNotice(null);
    const outcome = await controller.load(next);
    if (outcome.kind === 'superseded') return;
    const accepted = controller.getSnapshot().model?.period;
    if (outcome.kind === 'blocked' && outcome.reason === 'INVALID_PERIOD') {
      notify(outcome.detail, origin); if (!accepted) setInitialReadIssue('blocked'); return;
    }
    setIntendedPeriod(accepted ?? DEFAULT_WARRANTY_REPORT_PERIOD);
    if (outcome.kind === 'blocked') notify(accepted
      ? `Chưa có dữ liệu cho kỳ vừa chọn. Đang hiển thị kỳ ${warrantyReportPeriodLabel(accepted)}.`
      : 'Chưa có dữ liệu cho kỳ vừa chọn.', origin);
    else if (outcome.kind === 'error') {
      if (accepted) notify(reportReadErrorMessage(true), origin, 'error');
      else setInitialReadIssue('error');
    } else if (outcome.kind === 'available') {
      setInitialReadIssue(null);
    }
  }
  function retryRead() {
    const origin = screen.current?.querySelector<HTMLElement>('#s22-period') ?? null;
    setInitialReadIssue(null);
    void controller.load(intendedPeriod).then(result => finishRead(result, origin));
  }
  const inlineSlot = useCallback((origin: HTMLElement | null) => screen.current?.querySelector<HTMLElement>(
    origin?.closest('.hn-page-heading') ? '[data-s22-notice="heading"]' : origin?.closest('.s22-list') ? '[data-s22-notice="detail"]' : '[data-s22-notice="period"]') ?? null, []);
  return <GlobalShell title={tx("Báo cáo bảo hành linh kiện")} variant="wms" activeKey="S22" navigation={S00_SHELL_NAVIGATION}>
    <div ref={screen} className="hn-catalogue-screen s22-screen" data-screen="S22" data-visual-variant="premium" onFocusCapture={revealFocus}>
      <div className="s22-heading-group"><CataloguePageHeader appearance="worklist" title={tx("Báo cáo bảo hành linh kiện")} parentLabel={tx("Báo cáo & Thống kê")} breadcrumb={tx("Bảo hành linh kiện")}
        description={tx("Theo dõi tình hình tiếp nhận và xử lý bảo hành linh kiện theo kỳ.")}
        actions={<ReportExcelButton screen="S22" query={model ? { period: model.period } : null} expectedTotal={model?.details.total ?? undefined} busy={state.loading} onNotice={notify} />} />
      <div data-s22-notice="heading" /></div>
      {cohortControls}<section className="s22-period-panel hn-premium-panel" aria-label={tx("Kỳ báo cáo")}>
        <div className="s22-period-row"><div className="s22-period-field"><DateRangePicker id="s22-period" label={tx("Kỳ báo cáo")} value={period} clearable={false} onChange={next => { if (next) void changePeriod(next); }} /></div>
          <Button id="s22-period-help-toggle" variant="ghost" leadingIcon={<Icon name="info" size={18} />} aria-expanded={periodHelpOpen} aria-controls="s22-period-help" onClick={() => setPeriodHelpOpen(open => !open)} onKeyDown={event => {
            if (event.key === 'Escape' && periodHelpOpen) { event.preventDefault(); event.stopPropagation(); setPeriodHelpOpen(false); }
          }}>{tx("Thông tin kỳ")}</Button>
          <WarrantyPartsReadStatus loading={state.loading} hasSnapshot={Boolean(model)} />
        </div>
        <div id="s22-period-help" className="s22-period-help" hidden={!periodHelpOpen}>{tx("Số liệu tổng hợp toàn kỳ, theo thời gian Việt Nam (Asia/Ho_Chi_Minh), gồm cả ngày bắt đầu và kết thúc. Nếu kỳ mới chưa có dữ liệu, báo cáo giữ nguyên kỳ đang hiển thị và thông báo rõ.")}</div>
        <div data-s22-notice="period" />
      </section>
      {summary ? <>
        <section className="s22-kpis" aria-label={tx("Tổng hợp bảo hành linh kiện toàn kỳ")} aria-busy={state.loading}>
          <ReportScopeNote summary={tx("Tổng hợp toàn kỳ")} detail={tx("Không thay đổi theo bộ lọc chi tiết")} />
          {([
            { key: 'total', label: tx('Tổng phiếu'), value: summary.total, icon: 'documents' },
            { key: 'completed', label: tx('Hoàn tất'), value: summary.completed, icon: 'circle-check' },
            { key: 'processing', label: tx('Đang xử lý'), value: summary.processing, icon: 'history' },
            { key: 'waiting', label: tx('Chờ tiếp nhận'), value: summary.waiting, icon: 'tray' },
          ] as const).map(metric => <Card key={metric.key} className="s22-kpi hn-premium-panel" data-metric={metric.key}>
            <div className="s22-kpi-heading"><h2>{tx(metric.label)}</h2><span className="s22-kpi-icon"><Icon name={metric.icon} size={22} /></span></div>
            <p className="s22-kpi-value"><strong>{metric.value}</strong><span>{tx("phiếu")}</span></p>
          </Card>)}
        </section>
        <div className="s22-analysis" aria-busy={state.loading}>
          <Card className="s22-progress-card hn-premium-panel" title={tx("Tiến độ xử lý")}>
            <WarrantyPartsProgress summary={summary} />
          </Card>
          <Card className="s22-attention-card hn-premium-panel" title={tx("Cần chú ý")}>
            <div className="s22-attention-layout"><div>
              <div className="s22-incomplete"><strong>{summary.incomplete}</strong><span>{tx("phiếu chưa hoàn tất")}</span></div>
              <p className="s22-attention-breakdown">{summary.processing} {tx("đang xử lý")} <span aria-hidden="true">{tx("·")}</span> {summary.waiting} {tx("chờ tiếp nhận")}</p>
            </div><div className="s22-overdue"><Icon name="alert-triangle" size={22} /><div><p><strong>{summary.overdueWithinIncomplete}</strong><span>{tx("phiếu quá hạn")}</span></p><small>{tx("Nằm trong")} {summary.incomplete} {tx("phiếu chưa hoàn tất.")}</small></div></div></div>
            <p className="s22-note">{tx("Theo số liệu kỳ báo cáo, không phải trạng thái hiện tại.")}</p>
          </Card>
        </div>
      </> : <section className="s22-read-state hn-card hn-premium-panel" aria-label={tx("Số liệu tổng hợp bảo hành")}>
        <CatalogueListHeader id="s22-read-title" title={tx("Tổng hợp bảo hành linh kiện")} density="compact" />
        <PageState kind={state.loading || !initialReadIssue ? 'loading' : initialReadIssue === 'error' ? 'error' : 'stale'}
          title={tx(state.loading ? 'Đang đọc số liệu tổng hợp…' : initialReadIssue === 'blocked' ? 'Chưa có dữ liệu cho kỳ báo cáo đã chọn' : initialReadIssue === 'error' ? 'Chưa thể đọc báo cáo' : 'Số liệu tổng hợp hiện chưa khả dụng')}
          description={tx(state.loading ? 'Đang đọc tình hình tiếp nhận và xử lý bảo hành trong kỳ.' : initialReadIssue === 'error' ? reportReadErrorMessage(false) : 'Kỳ báo cáo này chưa có số liệu được cung cấp.')}
          onRetry={initialReadIssue && !state.loading ? retryRead : undefined} />
      </section>}
      {model && <WarrantyPartsDetail adapter={detailAdapter} notify={notify} clearNotice={() => setNotice(null)} />}
      {notice && <Notice feedback={{ ...notice, message: tx(notice.message) }} onClose={() => setNotice(null)} resolveInlineSlot={inlineSlot}
        resolveFocusFallback={() => screen.current?.querySelector<HTMLElement>(notice.origin?.closest('.s22-list') ? '#s22-detail-search' : '#s22-period') ?? null} revealInlineOnOpen protectedContentSelector=".s22-kpis,.s22-analysis,.s22-list" />}
    </div>
  </GlobalShell>;
}

