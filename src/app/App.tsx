import { resolveNotificationDocumentSelection } from './notification-document-route';
import { NotificationSourceDocumentScreen } from '../features/documents/NotificationSourceDocumentScreen';
import { SystemAuditScreen } from '../features/S27/SystemAuditScreen';
import { WarehouseConfigScreen } from '../features/S28/WarehouseConfigScreen';
import { UsersRbacScreen } from '../features/S29/UsersRbacScreen';
import { businessHttpAdapters } from '../data/http/business-adapters';
import { adminHttpAdapters } from '../data/http/admin-adapters';
import { createOverviewController } from '../controllers/overview-controller';
import { createProductsController } from '../controllers/products-controller';
import { createDefectsController } from '../controllers/defects-controller';
import { useShellUi } from '../shared/shell-locale';
import { ACCOUNT_EN_COPY } from '../i18n/account-copy';
import { IS_BROWSER_PREVIEW } from '../preview-mode';
import { useUiCopy } from '../i18n/use-ui-copy';
import { ADMIN_EN_COPY } from '../i18n/admin-copy';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPreviewController } from '../controllers/preview-controller';
import { Button, Card, Feedback, GlobalShell, PageState } from '../shared';
import { resolvePreviewRoute, screenRegistry } from './registry';
import { blockNavigation, consumeApprovedNavigation, getNavigationGuard } from './navigation-blocker';
import { resolveCanonicalPreviewSelection } from './canonical-preview-route';
import { resolveOverviewDocumentSelection } from './overview-document-route';
import { OverviewSourceDocumentScreen } from '../features/documents/OverviewSourceDocumentScreen';
import { OverviewScreen } from '../features/S01/OverviewScreen';
import { DefectsScreen } from '../features/S02/DefectsScreen';
import { createDefectsCommandService } from '../features/S02/defects-command-service';
import { createDefectsCommandHttpAdapter } from '../features/S02/defects-command-http';
import { createApprovedDefectsCommandPolicy } from '../features/S02/defects-approved-policy';
import { ProductsScreen } from '../features/S03/ProductsScreen';
import { SkusScreen } from '../features/S04/SkusScreen';
import { RecipientsScreen } from '../features/S05/RecipientsScreen';
import { createRecipientUpdateHttpAdapter } from '../data/http/recipient-update-adapter';
import { PvProductsScreen } from '../features/S06/PvProductsScreen';
import { WarrantyCasesScreen } from '../features/S09/WarrantyCasesScreen';
import { LoginScreen } from '../features/S07/LoginScreen';
import { SessionScreen } from '../features/S08/SessionScreen';
import { PartsSlipsScreen } from '../features/S10/PartsSlipsScreen';
import { TraysScreen } from '../features/S11/TraysScreen';
import { ReceiptsScreen } from '../features/S12/ReceiptsScreen';
import { PutawayQueueScreen } from '../features/S13/PutawayQueueScreen';
import { PutawayOrdersScreen } from '../features/S14/PutawayOrdersScreen';
import { OutboundSlipsScreen } from '../features/S15/OutboundSlipsScreen';
import { InventoryScreen } from '../features/S16/InventoryScreen';
import { ReversalSlipsScreen } from '../features/S17/ReversalSlipsScreen';
import { PutawayHistoryScreen } from '../features/putaway/PutawayHistoryScreen';
import { createPutawayHistoryAdapter } from '../data/http/putaway-history-adapter';
import { apiClient } from '../data/http/api-client';

import { InboundReportScreen } from '../features/S18/InboundReportScreen';
import { OutboundReportScreen } from '../features/S19/OutboundReportScreen';
import { MovementHistoryScreen } from '../features/S20/MovementHistoryScreen';
import { InventoryReportScreen } from '../features/S21/InventoryReportScreen';
import { WarrantyPartsReportScreen } from '../features/S22/WarrantyPartsReportScreen';
import { LabelReportScreen } from '../features/S23/LabelReportScreen';
import { createLabelPrintHttpAdapter } from '../data/http/label-print-adapter';
import { DataQualityScreen } from '../features/S24/DataQualityScreen';
import { DealerExportScreen } from '../features/S25/DealerExportScreen';
import { GoodsTraceScreen } from '../features/S26/GoodsTraceScreen';

import { AccountCenterScreen } from '../account/AccountCenterScreen';
import { ACCOUNT_PANELS, resolveAccountPanel } from '../account/account-center-model';
import { AccountSignedOutView, useAccountCenter } from '../account/AccountCenterContext';
import { S00_SHELL_NAVIGATION } from '../shared/s00-navigation';
import { localeForLanguage, useShellPreferences } from '../shared/shell-preferences';
import { DatePolicyQaScreen } from '../shared/DatePolicyQaScreen';
import { NotificationHarnessScreen } from '../notifications/NotificationHarnessScreen';
import { NotificationRepositoryQaScreen } from '../notifications/NotificationRepositoryQaScreen';
import { ToastQaScreen } from '../toast/ToastQaScreen';
import { OperationalAppPreview, OperationalScenarioQa } from '../operations/OperationalPreview';

const controller = createPreviewController();
const createHttpOverview = () => createOverviewController(businessHttpAdapters.S01);
const createHttpProducts = () => createProductsController(businessHttpAdapters.S03);
const createHttpDefects = () => createDefectsController(businessHttpAdapters.S02);
// Owner19October grants the exact Preview label scope; the repository checks actor and target.
const labelPrintCommands = IS_BROWSER_PREVIEW ? createLabelPrintHttpAdapter(undefined, { available: true, durableRecovery: true }) : undefined;
const recipientUpdateCommands = IS_BROWSER_PREVIEW ? createRecipientUpdateHttpAdapter(undefined, { available: true, durableRecovery: true }) : undefined;
const APP_EN_COPY = { ...ADMIN_EN_COPY, ...ACCOUNT_EN_COPY };
type Health = Awaited<ReturnType<typeof controller.loadSetup>>;
function isLegacyCatalogRoute(hash: string, screen: 'S09' | 'S10') {
  const match = new RegExp(`^#/preview/${screen}\\?([^#]*)$`, 'u').exec(hash);
  if (!match) return false;
  const params = new URLSearchParams(match[1]);
  return params.getAll('catalog').length === 1 && params.get('catalog') === 'legacy' && [...params.keys()].every(key => key === 'catalog');
}

/** Integrated preview routes; transport is explicitly selected by the host. */
export function App() {
  const tx = useUiCopy(APP_EN_COPY);
  const accountCenter = useAccountCenter();
  const accountRef = useRef(accountCenter); accountRef.current = accountCenter;
  const createHttpDefectsCommands = useCallback(() => createDefectsCommandService({
    adapter: createDefectsCommandHttpAdapter(undefined, { durableRecovery: IS_BROWSER_PREVIEW }),
    // UI readiness follows the confirmed Preview session. The repository resolves
    // the approved stable actor for every command; a renamed login is not a grant.
    policy: IS_BROWSER_PREVIEW ? createApprovedDefectsCommandPolicy(() => accountRef.current?.authStatus === 'active') : undefined,
  }), []);
  const { navLabel } = useShellUi();
  const { language } = useShellPreferences();
  useLayoutEffect(() => { document.documentElement.lang = localeForLanguage(language); }, [language]);
  const [hash, setHash] = useState(window.location.hash);
  const [health, setHealth] = useState<Health | null>(null);
  const [failed, setFailed] = useState(false);
  const previousHash = useRef(hash);
  useEffect(() => {
    const onHashChange = () => {
      const nextHash = window.location.hash;
      const fromHash = previousHash.current;
      if (nextHash !== fromHash && !consumeApprovedNavigation(nextHash) && getNavigationGuard()?.isDirty()) {
        window.history.replaceState(window.history.state, document.title, `${window.location.pathname}${window.location.search}${fromHash}`);
        blockNavigation({ from: fromHash, to: nextHash });
        return;
      }
      setHash(nextHash);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  useEffect(() => {
    let active = true;
    controller.loadSetup().then(value => { if (active) setHealth(value); })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, []);
  const selected = resolvePreviewRoute(hash);
  const notificationDocument = resolveNotificationDocumentSelection(hash);
  const overviewDocument = resolveOverviewDocumentSelection(hash);
  const accountPanel = resolveAccountPanel(hash);
  const notificationHarness = IS_BROWSER_PREVIEW && hash === '#/harness/notifications';
  const notificationRepositoryQa = IS_BROWSER_PREVIEW && hash === '#/harness/notifications-repository';
  const datePolicyQa = IS_BROWSER_PREVIEW && hash === '#/harness/date-policy';
  const toastQa = IS_BROWSER_PREVIEW && hash === '#/qa/toasts';
  const operationalQa=IS_BROWSER_PREVIEW&&hash==='#/qa/operations';
  const putawayHistory = IS_BROWSER_PREVIEW && hash === '#/preview/S14/history';
  const appPage=IS_BROWSER_PREVIEW?/^#\/app\/(P04|P05|P09|P19)$/.exec(hash)?.[1]:undefined;
  const unknown = !notificationHarness && !notificationRepositoryQa && !datePolicyQa && !toastQa && !operationalQa && !putawayHistory && !appPage && hash !== '' && hash !== '#/' && hash !== '#/setup' && !selected && !accountPanel;
  const authStatus = accountCenter?.authStatus;
  useEffect(() => {
    document.title = `${authStatus === 'signed-out' ? tx("Đăng nhập") : authStatus === 'confirmation-required' ? tx("Xác nhận phiên") : accountPanel ? tx(ACCOUNT_PANELS[accountPanel]) : (selected ? navLabel(selected.key, selected.label) : undefined) ?? (unknown ? tx("Không tìm thấy trang") : hash === '#/setup' ? tx("Tổng quan hệ thống") : tx("Tổng quan vận hành"))} · Hoa Nam WMS`;
    if (authStatus === 'signed-out' && hash !== '#/preview/S07') window.location.replace('#/preview/S07');
    else if (authStatus === 'confirmation-required' && hash !== '#/preview/S08') window.location.replace('#/preview/S08');
    else if (authStatus === 'active' && ['S07', 'S08'].includes(selected?.key ?? '')) window.location.replace('#/preview/S01');
    if (previousHash.current !== hash) {
      // Hash navigation replaces the focused link. Start the new screen at its content.
      document.getElementById('main-content')?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      previousHash.current = hash;
    }
  }, [hash, selected?.label, unknown, accountPanel, authStatus, language, tx]);
  if (authStatus === 'loading') return <main id="main-content" className="setup-container" tabIndex={-1}><PageState kind="loading" title={tx("Đang kiểm tra phiên làm việc…")}/></main>;
  if (authStatus === 'error') return <main id="main-content" className="setup-container" tabIndex={-1}><PageState kind="error" title={tx("Chưa thể kết nối hệ thống")} description={tx(accountCenter?.authError)} onRetry={()=>void accountCenter?.refreshSession()}/></main>;
  if (authStatus === 'signed-out') return <AccountSignedOutView><LoginScreen /></AccountSignedOutView>;
  if (authStatus === 'confirmation-required') return <SessionScreen />;
  if (notificationHarness) return <NotificationHarnessScreen />;
  if (notificationRepositoryQa) return <NotificationRepositoryQaScreen />;
  if (datePolicyQa) return <DatePolicyQaScreen />;
  if (toastQa) return <ToastQaScreen />;
  if(operationalQa)return <OperationalScenarioQa/>;
  if(putawayHistory)return <PutawayHistoryScreen reader={createPutawayHistoryAdapter(apiClient)} />;
  if(appPage)return <OperationalAppPreview page={appPage as 'P04'|'P05'|'P09'|'P19'}/>;
  if (unknown) return <GlobalShell title={tx('Không tìm thấy trang')} variant="wms" navigation={S00_SHELL_NAVIGATION}><PageState kind="route-not-found" action={<a href="#/preview/S01">{tx('Tổng quan vận hành')}</a>} /></GlobalShell>;
  if (accountPanel) return <GlobalShell title={tx(ACCOUNT_PANELS[accountPanel])} variant="wms" navigation={S00_SHELL_NAVIGATION}><AccountCenterScreen panel={accountPanel} /></GlobalShell>;
  if (notificationDocument) return <NotificationSourceDocumentScreen key={hash} selection={notificationDocument} />;
  if (overviewDocument) return <OverviewSourceDocumentScreen selection={overviewDocument} />;
  if (hash === '' || hash === '#/' || selected?.key === 'S01') return <OverviewScreen createController={createHttpOverview} />;
  if (selected?.key === 'S02') return <DefectsScreen createController={createHttpDefects} createCommandService={createHttpDefectsCommands} />;
  if (selected?.key === 'S03') return <ProductsScreen createController={createHttpProducts} selectedEntityId={resolveCanonicalPreviewSelection(hash)?.entityId} />;
  if (selected?.key === 'S04') return <SkusScreen adapter={businessHttpAdapters.S04} selectedEntityId={resolveCanonicalPreviewSelection(hash)?.entityId} />;
  if (selected?.key === 'S05') return <RecipientsScreen adapter={businessHttpAdapters.S05} updateAdapter={recipientUpdateCommands} />;
  if (selected?.key === 'S06') return <PvProductsScreen adapter={businessHttpAdapters.S06} />;
  if (selected?.key === 'S09') return <WarrantyCasesScreen adapter={businessHttpAdapters.S09} forceLegacy={isLegacyCatalogRoute(hash, 'S09')} />;
  if (selected?.key === 'S07') return <LoginScreen />;
  if (selected?.key === 'S08') return <SessionScreen />;
  if (selected?.key === 'S10') return <PartsSlipsScreen adapter={businessHttpAdapters.S10} forceLegacy={isLegacyCatalogRoute(hash, 'S10')} />;
  if (selected?.key === 'S11') return <TraysScreen adapter={businessHttpAdapters.S11} />;
  if (selected?.key === 'S12') return <ReceiptsScreen adapter={businessHttpAdapters.S12} />;
  if (selected?.key === 'S13') return <PutawayQueueScreen adapter={businessHttpAdapters.S13} />;
  if (selected?.key === 'S14') return <PutawayOrdersScreen adapter={businessHttpAdapters.S14} />;
  if (selected?.key === 'S15') return <OutboundSlipsScreen adapter={businessHttpAdapters.S15} />;
  if (selected?.key === 'S16') return <InventoryScreen adapter={businessHttpAdapters.S16} />;
  if (selected?.key === 'S17') return <ReversalSlipsScreen adapter={businessHttpAdapters.S17} />;
  if (selected?.key === 'S18') return <InboundReportScreen adapter={businessHttpAdapters.S18} />;
  if (selected?.key === 'S19') return <OutboundReportScreen adapter={businessHttpAdapters.S19} />;
  if (selected?.key === 'S20') return <MovementHistoryScreen adapter={businessHttpAdapters.S20} />;
  if (selected?.key === 'S21') return <InventoryReportScreen adapter={businessHttpAdapters.S21} />;
  if (selected?.key === 'S22') return <WarrantyPartsReportScreen adapter={businessHttpAdapters.S22} />;
  if (selected?.key === 'S23') return <LabelReportScreen adapter={businessHttpAdapters.S23} printAdapter={labelPrintCommands} />;
  if (selected?.key === 'S24') return <DataQualityScreen adapter={businessHttpAdapters.S24} />;
  if (selected?.key === 'S25') return <DealerExportScreen adapter={businessHttpAdapters.S25} />;
  if (selected?.key === 'S26') return <GoodsTraceScreen adapter={businessHttpAdapters.S26} />;
  if (selected?.key === 'S27') return <SystemAuditScreen adapter={adminHttpAdapters.systemAudit} />;
  if (selected?.key === 'S28') return <WarehouseConfigScreen adapter={adminHttpAdapters.warehouse} />;
  if (selected?.key === 'S29') return <UsersRbacScreen userAdapter={adminHttpAdapters.users} roleAdapter={adminHttpAdapters.roles} />;
  return (
    <GlobalShell title={tx("Nền dự án")} navigation={screenRegistry}>
      <div className="setup-container">
        <div className="setup-intro">
          <p className="setup-eyebrow">HOA NAM WMS / SETUP r2</p>
          <h1>{tx("Nền dự án đã sẵn sàng")}</h1>
          <p>{tx("Không gian kiểm tra và bàn giao frontend. Preview S01–S29 cùng bốn trang tài khoản.")}</p>
        </div>
        {unknown ? (
          <Feedback title={tx("Liên kết chưa được đăng ký")} tone="warning">
            <a className="setup-link" href="#/setup">{tx("Trở về trang setup")}</a>
          </Feedback>
        ) : (
          <>
            {IS_BROWSER_PREVIEW&&<p><a href="#/qa/operations">Six Flows · QA / Build Metadata</a></p>}
            <Card title={tx("Kiểm tra nền dự án")} description={tx("Phạm vi hiện tại: hạ tầng dùng chung.")}>
              <div className="setup-health" role="status">
                <span className="setup-status-dot" data-ready={Boolean(health)} aria-hidden="true" />
                {failed ? tx("Không thể đọc cấu hình. Xem console để kiểm tra.") : health ? tx("Runtime và fixture adapter đã sẵn sàng") : tx("Đang đọc cấu hình…")}
              </div>
              <dl className="setup-facts">
                <div><dt>Contract</dt><dd>{tx("r2 + phần mở rộng r3 · UI tĩnh")}</dd></div>
                <div><dt>{tx("Kết nối API nghiệp vụ")}</dt><dd>{tx("Chưa cấu hình")}</dd></div>
                <div><dt>{tx("Màn đang thực hiện")}</dt><dd>{tx("S01–S29 · Preview tích hợp")}</dd></div>
                <div><dt>{tx("Chuyển màn tự động")}</dt><dd>{tx("Tắt")}</dd></div>
              </dl>
            </Card>
            <Card title={tx("Danh sách màn đã đăng ký")} description={tx("S01–S29 có trong Preview; trạng thái MOCK và các giới hạn nghiệp vụ được giữ rõ ràng.")}>
              <ol className="setup-screen-list">
                {screenRegistry.map(screen => (
                  <li key={screen.key}>
                    <span className="setup-screen-key">{screen.key}</span>
                    <div><a href={screen.href}>{navLabel(screen.key, screen.label)}</a><p>{screen.revision}</p></div>
                    <span className="setup-pending">{tx("Đã có preview")}</span>
                  </li>
                ))}
              </ol>
            </Card>
            <p className="setup-footer">Checkpoint: <code>output/RUN_STATE.json</code>{' '}{tx("· Hướng dẫn mở lại:")}{' '}<code>README.md</code></p>
          </>
        )}
      </div>
    </GlobalShell>
  );
}
