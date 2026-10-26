import { useShellPreferences } from '../../shared/shell-preferences';
import { formatDeclaredPercentage } from '../../i18n/format-declared-percentage';
import { OperationResultToast } from '../../toast/OperationResultToast';
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import type { FormEvent } from 'react';
import { DEFAULT_DEFECTS_QUERY, resetDefectsTableQuery, updateDefectsQuery, validateDefectDraft } from '../../contracts/defects';
import type { DefectDraft, DefectRow, DefectsFormErrors, DefectsModel, DefectsQuery, DefectsSortKey } from '../../contracts/defects';
import { createDefectsRuntimeController } from '../../controllers/defects-runtime';
import { getDefectsPresentation } from '../../controllers/defects-presentation';
import { recordReviewDiagnostic, recordUnresolvedAction } from '../../app/review-diagnostics';
import { CatalogueHeader, CatalogueSummary, SummaryMetric, CatalogueListHeader, CatalogueToolbar, NoticeSlot, ordinalColumn, Button, DataTable, FilterSelect, GlobalShell, Icon, Pagination, PageState, S02_SHELL_NAVIGATION, StatusBadge, GlobalModal, ConfirmDialog, FormField } from '../../shared';
import type { TableColumn } from '../../shared';
import { useDefectsTableLayout } from './useDefectsTableLayout';
import { Notice } from '../../shared/Notice';
import { revealControl } from '../../shared/focus';
import './defects.css';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { CATALOGUE_EN_COPY, catalogueNoticeCopy } from '../../i18n/catalogue-copy';
import { createDefectsCommandService, type DefectsCommandService, type DefectsSaveResult } from './defects-command-service';
import { S02_COMMAND_EN_COPY } from './defects-command-copy';
import { loadDefectsReconciliation, type DefectsFormSnapshot, type DefectsReconciliationResult } from './defects-reconciliation';
import { DefectsRecoveryPanel } from './DefectsRecoveryPanel';

const screenCopy = Object.freeze({ ...CATALOGUE_EN_COPY, ...S02_COMMAND_EN_COPY });

const statusLabels = { all: 'Tất cả', active: 'Đang sử dụng', inactive: 'Ngừng sử dụng' };
type FeedbackTone = 'info' | 'success' | 'error';
type Feedback = { message: string; tone: FeedbackTone; sequence: number; container: HTMLElement; origin: HTMLElement | null };
type ReadState = 'loading' | 'ready' | 'blocked' | 'error';
type ReviewScenario = 'default' | 'empty-records' | 'load-error' | 'unauthorized-401' | 'forbidden-403' | 'not-found-404';

type FormMode = 'add' | 'edit';
type ModalState =
  | { kind: 'detail'; row: DefectRow }
  | DefectsFormSnapshot;
type FormErrors = DefectsFormErrors;

type BlockedRead = Extract<Awaited<ReturnType<ReturnType<typeof createDefectsRuntimeController>['load']>>, { kind: 'blocked' }>;

function blockedMessage(result: BlockedRead) {
  if (result.reason === 'LOAD_ERROR') return 'Không thể tải danh sách. Hãy thử lại.';
  if (result.reason === 'UNAUTHORIZED') return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.';
  if (result.reason === 'FORBIDDEN') return 'Bạn không có quyền truy cập danh mục bệnh / lỗi.';
  if (result.reason === 'NOT_FOUND') return 'Không tìm thấy nội dung bệnh / lỗi được yêu cầu.';
  if (result.reason === 'STATE_NOT_SUPPLIED') return 'Trạng thái này chưa có dữ liệu được duyệt.';
  if (result.reason === 'PAGE_SIZE_UNCONFIRMED') return 'S02 dùng 15 dòng mỗi trang theo contract riêng của màn này.';
  if (result.reason === 'PAGE_OUT_OF_RANGE') return 'Trang này chưa có trong phạm vi dữ liệu được duyệt.';
  return 'Lựa chọn hiện tại chưa khả dụng trong bản xem trước.';
}

function readReviewScenario(): ReviewScenario {
  if (typeof window === 'undefined') return 'default';
  const query = window.location.hash.split('?')[1] ?? window.location.search.slice(1);
  const value = new URLSearchParams(query).get('s02State');
  if (value === 'empty' || value === 'empty-records') return 'empty-records';
  if (value === 'load-error' || value === 'error') return 'load-error';
  if (value === '401' || value === 'unauthorized' || value === 'unauthorized-401') return 'unauthorized-401';
  if (value === '403' || value === 'forbidden' || value === 'forbidden-403') return 'forbidden-403';
  if (value === '404' || value === 'not-found' || value === 'not-found-404') return 'not-found-404';
  return 'default';
}

function clearReviewScenarioFromUrl() {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.searchParams.delete('s02State');
  const hashQueryIndex = url.hash.indexOf('?');
  if (hashQueryIndex >= 0) {
    const hashPath = url.hash.slice(0, hashQueryIndex);
    const hashParams = new URLSearchParams(url.hash.slice(hashQueryIndex + 1));
    hashParams.delete('s02State');
    const nextHashQuery = hashParams.toString();
    url.hash = nextHashQuery ? `${hashPath}?${nextHashQuery}` : hashPath;
  }
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
}

function blockedPageState(result: BlockedRead): 'stale' | 'error' | 'unauthorized' | 'forbidden' | 'not-found' {
  if (result.reason === 'LOAD_ERROR') return 'error';
  if (result.reason === 'UNAUTHORIZED') return 'unauthorized';
  if (result.reason === 'FORBIDDEN') return 'forbidden';
  if (result.reason === 'NOT_FOUND') return 'not-found';
  return 'stale';
}

/** Controller injection is for the isolated DEV harness; the application uses the approved fixture. */
export function DefectsScreen({ createController = createDefectsRuntimeController, createCommandService = createDefectsCommandService }: {
  createController?: typeof createDefectsRuntimeController;
  createCommandService?: () => DefectsCommandService;
} = {}) {
  const tx = useUiCopy(screenCopy);
  const { language } = useShellPreferences();
  const controller = useMemo(createController, [createController]);
  const commands = useMemo(createCommandService, [createCommandService]);
  const commandState = useSyncExternalStore(commands.subscribe, commands.getSnapshot, commands.getSnapshot);
  const formSubmitting = commandState.phase === 'submitting';
  const formUncertain = commandState.phase === 'outcome-unknown';
  const durableRecovery = commandState.recovery;
  const recoveryBlocking = !!durableRecovery && durableRecovery.kind !== 'empty';
  const recoveryBusy = durableRecovery?.kind === 'loading' || durableRecovery?.kind === 'acknowledging';
  const recoveryObscuresModal = durableRecovery?.kind === 'blocked' || recoveryBusy;
  const [reviewScenario, setReviewScenario] = useState<ReviewScenario>(() => readReviewScenario());
  const presentation = useMemo(getDefectsPresentation, []);
  const [query, setQuery] = useState<DefectsQuery>(() => structuredClone(DEFAULT_DEFECTS_QUERY));
  const [model, setModel] = useState<DefectsModel | null>(null);
  const [revision, setRevision] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const localizedFeedback = useMemo(() => feedback && { ...feedback, message: catalogueNoticeCopy(tx, feedback.message) }, [feedback, tx]);
  const [readState, setReadState] = useState<ReadState>('loading');
  const [blockedRead, setBlockedRead] = useState<BlockedRead | null>(null);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [formNotice, setFormNotice] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [reconciliation, setReconciliation] = useState<{ kind: 'required' | 'loading' } | DefectsReconciliationResult | null>(null);
  const formReconciling = reconciliation?.kind === 'loading';
  const formLocked = formSubmitting || formUncertain || formReconciling || recoveryBlocking;
  const staleReadRequired = useRef(false);
  const reconciliationAttempt = useRef(0);
  const presentedRecoveryReceipt = useRef<string | null>(null);
  const formCodeRef = useRef<HTMLInputElement>(null);
  const stableModalOpener = useRef<HTMLElement | null>(null);
  const feedbackSequence = useRef(0);
  const statusFocusFrame = useRef<number | null>(null);
  const resetReviewStateOnSuccess = useRef(false);
  const intent = useRef<'reset' | 'refresh' | null>(null);
  const { screenRef, overflows } = useDefectsTableLayout(model !== null, JSON.stringify(model?.query));
  const formDirty = modal?.kind === 'form' && JSON.stringify(modal.draft) !== JSON.stringify(modal.original);
  const emptyDraft = (): DefectDraft => ({ code: '', name: '', description: '', status: 'active' });
  const draftFromRow = (row: DefectRow): DefectDraft => ({ code: row.code, name: row.name, description: row.description, status: row.status });

  function openDetail(row: DefectRow) {
    if (!commands.reset()) return;
    ++reconciliationAttempt.current;
    setReconciliation(null);
    const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (active && !active.closest('dialog[open]')) stableModalOpener.current = active;
    setFeedback(null);
    setFormErrors({});
    setFormNotice(null);
    setModal({ kind: 'detail', row });
  }

  function openForm(mode: FormMode, row?: DefectRow) {
    if (!commands.reset()) return;
    ++reconciliationAttempt.current;
    setReconciliation(staleReadRequired.current ? { kind: 'required' } : null);
    const draft = row ? draftFromRow(row) : emptyDraft();
    const replacingOpenModal = modal !== null;
    const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (active && !active.closest('dialog[open]')) stableModalOpener.current = active;
    setFeedback(null);
    setFormErrors({});
    setFormNotice(null);
    setConfirmDiscard(false);
    setModal({ kind: 'form', mode, draft, original: structuredClone(draft),
      context: model?.commandContext ? structuredClone(model.commandContext) : undefined,
      target: row && model?.commandContext?.records[row.key] ? structuredClone(model.commandContext.records[row.key]) : undefined });
    if (replacingOpenModal) requestAnimationFrame(() => formCodeRef.current?.focus({ preventScroll: true }));
  }

  function closeModal() {
    const snapshot = commands.getSnapshot();
    if (snapshot.recovery && snapshot.recovery.kind !== 'empty') {
      if (snapshot.recovery.kind === 'loading' || snapshot.recovery.kind === 'acknowledging') return;
      // Closing only dismisses the view. Continue explicitly acknowledges the journal.
    } else if (!commands.reset()) return;
    ++reconciliationAttempt.current;
    setReconciliation(null);
    const opener = stableModalOpener.current;
    setConfirmDiscard(false);
    setFormErrors({});
    setFormNotice(null);
    setModal(null);
    requestAnimationFrame(() => {
      if (opener?.isConnected && opener.getClientRects().length && !opener.matches(':disabled')) opener.focus({ preventScroll: true });
    });
  }

  function requestModalClose() {
    if (formSubmitting || formReconciling) return;
    if (recoveryBlocking) { void closeModal(); return; }
    if (formUncertain) {
      setFormNotice('Chưa xác định được kết quả lưu. Hãy kiểm tra lại cùng thao tác trước khi chỉnh sửa hoặc rời đi.');
      return;
    }
    if (modal?.kind === 'form' && formDirty) {
      setConfirmDiscard(true);
      return;
    }
    closeModal();
  }

  function updateDraft<K extends keyof DefectDraft>(field: K, value: DefectDraft[K]) {
    if (formLocked || field === 'code' && modal?.kind === 'form' && modal.mode === 'edit' && !commands.savedCodeEditable()) return;
    commands.reset();
    setModal(current => current?.kind === 'form' ? { ...current, draft: { ...current.draft, [field]: value } } : current);
    setFormErrors(current => ({ ...current, [field]: undefined }));
    setFormNotice(null);
  }

  function validateDraft(draft: DefectDraft): FormErrors {
    return validateDefectDraft(draft);
  }

  function validateDraftField(field: 'code' | 'name') {
    if (modal?.kind !== 'form') return;
    const errors = validateDraft(modal.draft);
    setFormErrors(current => ({ ...current, [field]: errors[field] }));
  }

  function commandNotice(result: DefectsSaveResult): string {
    if (result.kind === 'blocked') return 'Thao tác lưu chưa khả dụng. Bản nháp được giữ nguyên.';
    if (result.kind !== 'failed') return 'Kiểm tra giá trị đã nhập.';
    if (result.outcomeUnknown) return 'Chưa xác định được kết quả lưu. Hãy kiểm tra lại cùng thao tác trước khi chỉnh sửa hoặc rời đi.';
    if (result.status === 401) return 'Phiên đăng nhập đã hết hạn. Bản nháp được giữ nguyên.';
    if (result.status === 403) return 'Bạn không có quyền lưu hồ sơ này. Bản nháp được giữ nguyên.';
    if (result.code === 'STALE_VERSION') return 'Hồ sơ đã thay đổi. Bản nháp được giữ nguyên. Hãy kiểm tra dữ liệu mới trước khi tiếp tục.';
    if (result.code === 'STALE_DEMO_EPOCH') return 'Dữ liệu đã được đặt lại. Bản nháp được giữ nguyên. Hãy kiểm tra dữ liệu mới trước khi tiếp tục.';
    if (result.code === 'DUPLICATE_DEFECT_CODE') return 'Mã lỗi đã tồn tại. Kiểm tra lại mã đã nhập.';
    if (result.code === 'IMMUTABLE_OR_UNKNOWN_FIELD') return 'Chỉ có thể sửa tên, mô tả và trạng thái.';
    if (result.status === 404) return 'Không tìm thấy hồ sơ cần cập nhật. Bản nháp được giữ nguyên.';
    return 'Không thể lưu hồ sơ. Bản nháp được giữ nguyên. Vui lòng thử lại.';
  }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (modal?.kind !== 'form' || formSubmitting || reconciliation) return;
    const errors = validateDraft(modal.draft);
    setFormErrors(errors);
    setFormNotice(null);
    const firstInvalid = (['code', 'name'] as const).find(field => errors[field]);
    if (firstInvalid) {
      requestAnimationFrame(() => document.getElementById(`df-form-${firstInvalid}`)?.focus());
      return;
    }
    const result = await commands.save({ operation: modal.mode === 'add' ? 'create' : 'update',
      draft: modal.draft, original: modal.original, context: modal.context, target: modal.target });
    if (result.kind === 'committed') {
      // Detail reflects the authoritative receipt; list/summary reread the accepted query.
      setModal({ kind: 'detail', row: result.outcome.receipt.record.data });
      setFormErrors({});
      setFormNotice('Đã lưu hồ sơ.');
      if (model) setQuery(structuredClone(model.query));
      if (!commands.getSnapshot().recovery) setRevision(current => current + 1);
      return;
    }
    if (result.kind === 'validation' || result.kind === 'failed') {
      setFormErrors(result.kind === 'validation' ? result.fieldErrors
        : Object.fromEntries(Object.keys(result.fieldErrors).map(key => [key, 'Kiểm tra giá trị đã nhập.'])));
      const invalid = (['code', 'name', 'description', 'status'] as const).find(field => result.fieldErrors[field]);
      if (invalid) requestAnimationFrame(() => document.getElementById(`df-form-${invalid}`)?.focus());
    }
    if (result.kind === 'failed' && !result.outcomeUnknown && ['STALE_VERSION', 'STALE_DEMO_EPOCH'].includes(result.code)) {
      staleReadRequired.current = true;
      setReconciliation({ kind: 'required' });
    }
    if (result.kind === 'blocked') recordUnresolvedAction(`S02:${modal.mode}:save`);
    setFormNotice(commandNotice(result));
  }
  async function checkCanonicalData() {
    if (modal?.kind !== 'form' || formLocked || !reconciliation) return;
    const attempt = ++reconciliationAttempt.current;
    setReconciliation({ kind: 'loading' });
    setRefreshing(true);
    const result = await loadDefectsReconciliation(controller, model?.query ?? query, modal, reviewScenario);
    if (attempt !== reconciliationAttempt.current) return;
    setRefreshing(false);
    if (result.model) {
      setModel(result.model);
      setReadState('ready');
      setBlockedRead(null);
      staleReadRequired.current = false;
    }
    setReconciliation(result);
  }
  function discardDraftAndUseCanonicalData() {
    if (reconciliation?.kind !== 'ready' || !commands.reset()) return;
    // Explicit discard opens a fresh form. Never merge or resubmit the old draft.
    setModal(structuredClone(reconciliation.candidate));
    setReconciliation(null);
    setFormErrors({});
    setFormNotice(null);
    requestAnimationFrame(() => formCodeRef.current?.focus({ preventScroll: true }));
  }
  async function retryPendingCommand() {
    const result = await commands.retryRecovery();
    if (result?.kind === 'committed' && modal?.kind === 'form') {
      setModal({ kind: 'detail', row: result.outcome.receipt.record.data });
      setReconciliation(null);
      setFormErrors({});
      setFormNotice('Đã lưu hồ sơ.');
    }
  }
  async function viewRecoveredRecord() {
    await commands.restoreRecovery();
    const recovery = commands.getSnapshot().recovery;
    if (recovery?.kind !== 'committed') return;
    setModal({ kind: 'detail', row: recovery.outcome.receipt.record.data });
    setFormNotice('Đã lưu hồ sơ.');
    setRevision(current => current + 1);
  }
  async function continueAfterRecovery() {
    if (await commands.acknowledgeRecovery()) {
      setModal(null);
      setFormNotice(null);
    }
  }
  useEffect(() => { void commands.restoreRecovery(); }, [commands]);
  useEffect(() => {
    if (durableRecovery?.kind !== 'committed' || presentedRecoveryReceipt.current === durableRecovery.request.commandId) return;
    presentedRecoveryReceipt.current = durableRecovery.request.commandId;
    // This read starts only after receipt validation, including on route/remount/reload recovery.
    setRevision(current => current + 1);
  }, [durableRecovery]);
  useEffect(() => () => {
    ++reconciliationAttempt.current;
    if (statusFocusFrame.current !== null) cancelAnimationFrame(statusFocusFrame.current);
  }, []);
  function revealStatusFocus(target: HTMLSelectElement) {
    if (statusFocusFrame.current !== null) cancelAnimationFrame(statusFocusFrame.current);
    // Native focus scrolling includes the border box, but can clip its outline
    // at high zoom. Reuse the shared shell clearance after that scroll settles.
    statusFocusFrame.current = requestAnimationFrame(() => {
      statusFocusFrame.current = null;
      if (document.activeElement === target && target.matches(':focus-visible') && !target.matches(':open')) revealControl(target);
    });
  }
  const showFeedback = useCallback((message: string, tone: FeedbackTone = 'info') => {
    setFeedback({ message, tone, sequence: ++feedbackSequence.current, container: document.querySelector<HTMLDialogElement>('dialog[open]') ?? document.body, origin: document.activeElement instanceof HTMLElement ? document.activeElement : null });
  }, []);
  useEffect(() => {
    let cancelled = false;
    const recoveryAtRead = commands.getSnapshot().recovery;
    const receiptAtRead = recoveryAtRead?.kind === 'committed' ? recoveryAtRead.outcome.receipt : null;
    const action = intent.current;
    intent.current = null;
    setRefreshing(true);
    setReadState(model ? 'ready' : 'loading');
    setBlockedRead(null);
    void controller.load(query, reviewScenario).then(result => {
      if (cancelled || controller.getSnapshot() !== result) return;
      setRefreshing(false);
      if (result.kind === 'ready') {
        staleReadRequired.current = false;
        setReadState('ready');
        setModel(result.model);
        const context = result.model.commandContext;
        if (receiptAtRead && context?.epoch === receiptAtRead.epoch && context.snapshotRevision >= receiptAtRead.snapshotRevision
          && Object.values(context.records).some(target => target.entityId === receiptAtRead.entityId && target.version >= receiptAtRead.version)) {
          void commands.confirmRecoveryRead(receiptAtRead.commandId);
        }
        if (resetReviewStateOnSuccess.current) {
          resetReviewStateOnSuccess.current = false;
          clearReviewScenarioFromUrl();
        }
        if (action === 'refresh') showFeedback('Đã cập nhật danh sách.', 'success');
        if (action === 'reset') showFeedback('Đã đặt lại bộ lọc.', 'success');
      } else {
        setReadState(result.reason === 'LOAD_ERROR' ? 'error' : 'blocked');
        setBlockedRead(result);
        recordReviewDiagnostic({ kind: 'blocked-query', key: `S02:${result.reason}`, detail: result.detail });
        if (model) showFeedback(`${blockedMessage(result)} Danh sách hiện tại được giữ nguyên.`);
      }
    }).catch(error => {
      if (cancelled) return;
      setRefreshing(false);
      setReadState('error');
      recordReviewDiagnostic({ kind: 'runtime-error', key: 'S02_READ', detail: String(error) });
      if (model) showFeedback('Chưa thể cập nhật danh sách. Vui lòng thử lại.', 'error');
    });
    return () => { cancelled = true; };
  }, [controller, commands, query, reviewScenario, revision, showFeedback]);

  function unavailable(key: string, message = 'Chức năng này chưa khả dụng trong bản xem trước.') {
    recordUnresolvedAction(key);
    showFeedback(message);
  }
  function patchQuery(patch: Partial<DefectsQuery>) {
    intent.current = null;
    setFeedback(null);
    setQuery(current => updateDefectsQuery(current, patch));
  }
  function reset() {
    intent.current = 'reset';
    setFeedback(null);
    setQuery(resetDefectsTableQuery());
  }
  function refresh() {
    intent.current = 'refresh';
    // A previous success/error notice describes the completed read, not the
    // new pending one. Clear it before showing the spinner so the feedback
    // region never reports stale state during refresh.
    setFeedback(null);
    setRefreshing(true);
    if (!model && reviewScenario !== 'default') {
      // Review URLs deliberately return a typed blocked state. A successful
      // retry/reload recovers through the normal default read path, then the
      // synthetic state query is removed from the address bar.
      resetReviewStateOnSuccess.current = true;
      setReviewScenario('default');
      setQuery(structuredClone(DEFAULT_DEFECTS_QUERY));
    }
    setRevision(current => current + 1);
  }
  const acceptedLabel = model ? [tx(statusLabels[model.query.status]), model.query.search.trim() && `“${model.query.search.trim()}”`].filter(Boolean).join(' · ') : tx('Tất cả');
  const formAvailability = modal?.kind === 'form' ? commands.availability(modal.mode === 'add' ? 'create' : 'update') : null;
  const formPolicyReady = !!formAvailability && formAvailability.missing.length === 0;
  const formAvailable = modal?.kind === 'form' && formAvailability?.available
    && !!modal.context && (modal.mode === 'add' || !!modal.target);
  const formReady = formAvailable && !reconciliation;
  const savedCodeReadOnly = modal?.kind === 'form' && modal.mode === 'edit' && !commands.savedCodeEditable();
  const createAvailable = commands.availability('create').available;
  const updateAvailable = commands.availability('update').available;
  const recoveryPanel = <DefectsRecoveryPanel state={commandState} tx={text => tx(text)} refreshing={refreshing}
    onRetry={() => void retryPendingCommand()} onReload={refresh} onContinue={() => void continueAfterRecovery()} onView={() => void viewRecoveredRecord()} />;
  const columns: TableColumn<DefectRow>[] = [
    ordinalColumn(model?.pagination.page, model?.pagination.pageSize),
    { id: 'code', heading: tx("Mã lỗi"), headingContent: <><span className="df-code-heading">{tx("Mã lỗi")}</span><span className="df-merged-heading">{tx("Mã / Tên lỗi, bệnh")}</span></>, sortKey: 'code', render: row => <span className="df-code-name"><strong>{row.code}</strong><span>{row.name}</span></span> },
    { id: 'name', heading: tx("Tên lỗi / bệnh"), sortKey: 'name', render: row => <span className="df-name">{row.name}</span> },
    { id: 'description', heading: tx("Mô tả"), sortKey: 'description', render: row => row.description },
    { id: 'status', heading: tx("Trạng thái"), sortKey: 'status', render: row => <StatusBadge tone={row.status === 'active' ? 'success' : 'neutral'}><span className="df-status-dot" aria-hidden="true" />{tx(row.statusLabel)}</StatusBadge> },
    { id: 'action', heading: tx("Thao tác"), kind: 'actions', render: row => <span className="df-row-actions">
      <Button variant="secondary" className="df-view" aria-label={tx('Xem {code}', { code: row.code })} onClick={() => openDetail(row)}><Icon name="eye" width={17} height={17} />{tx("Xem")}</Button>
      <Button variant="secondary" className="df-edit" aria-label={tx('Sửa {code}', { code: row.code })} onClick={() => openForm('edit', row)}><Icon name="edit" width={17} height={17} />{tx("Sửa")}</Button>
    </span> },
  ];
  return <GlobalShell title={tx("Danh mục bệnh / lỗi")} variant="wms" activeKey="S02" navigation={S02_SHELL_NAVIGATION} profile={presentation.profile} onUnresolvedAction={unavailable}>
    <div ref={screenRef} className="df-screen hn-catalogue-screen" data-screen="S02" data-design="compact" data-visual-variant="premium">
      <span id="s02-add-hint" className="hn-sr-only">{tx(createAvailable ? 'Mở biểu mẫu thêm hồ sơ bệnh / lỗi.' : 'Mở biểu mẫu thêm bản nháp cục bộ; thao tác ghi vẫn chưa khả dụng trong bản xem trước.')}</span>
      <CatalogueHeader title={tx("Danh mục bệnh / lỗi")} breadcrumb={tx("Bệnh / lỗi")} description={tx("Quản lý hồ sơ bệnh/lỗi phục vụ nghiệp vụ bảo hành")} action={model ? tx('Thêm lỗi / bệnh') : undefined} describedBy="s02-add-hint" onAction={() => openForm('add')} />
      {(modal?.kind !== 'form' || recoveryObscuresModal) && recoveryPanel}
      {!model && <section className="df-panel hn-premium-panel df-state-panel" aria-label={tx("Trạng thái danh sách")}>
        <div className="df-state-context">
          <div><p className="df-eyebrow">{tx("Danh mục bệnh / lỗi")}</p><h2>{tx("Dữ liệu danh mục")}</h2></div>
          <span className="df-state-context__meta">{tx("Trạng thái hệ thống")}</span>
        </div>
        <div className="df-state-slot">
          {readState === 'loading' && <PageState kind="loading" title={tx("Đang tải danh sách")} description={tx("Đang lấy dữ liệu bệnh / lỗi từ nguồn được duyệt…")} />}
          {readState === 'blocked' && <PageState kind={blockedRead ? blockedPageState(blockedRead) : 'stale'} description={tx(blockedRead ? blockedMessage(blockedRead) : 'Nguồn dữ liệu cho lựa chọn này chưa được cung cấp.')} onRetry={refresh} retryLabel={tx("Tải lại danh sách")} />}
          {readState === 'error' && <PageState kind="error" title={tx("Không thể tải danh sách")} description={tx("Đã xảy ra lỗi khi đọc dữ liệu. Vui lòng thử lại.")} onRetry={refresh} />}
        </div>
      </section>}
      {model && <>
        <CatalogueSummary label={tx("Thống kê toàn danh mục")}><SummaryMetric label={tx("Tổng danh mục")} value={model.summary.total} detail={tx("hồ sơ")} icon="shield"/><SummaryMetric label={tx("Đang sử dụng")} value={model.summary.active} detail={formatDeclaredPercentage(model.summary.activePercentage, language)}/><SummaryMetric label={tx("Ngừng sử dụng")} value={model.summary.inactive} detail={formatDeclaredPercentage(model.summary.inactivePercentage, language)}/></CatalogueSummary>
        <section className="df-panel hn-premium-panel df-list" aria-labelledby="df-list-title">
          <CatalogueListHeader id="df-list-title" title={tx("Danh sách bệnh / lỗi")} count={`${model.pagination.total} ${tx('hồ sơ')}`} />
          <CatalogueToolbar id="df" label={tx("Bộ lọc bệnh / lỗi")} searchLabel={tx("Tìm mã hoặc tên bệnh/lỗi")} searchHint={tx("Tìm theo mã hoặc tên, không phân biệt chữ hoa và dấu.")} searchValue={query.search} onSearchChange={search => patchQuery({ search })} onReset={reset} onRefresh={refresh} busy={refreshing} applyMode="immediate" acceptedLabel={acceptedLabel}><FilterSelect id="df-status-filter" label={tx("Trạng thái")} aria-label={tx("Trạng thái")} value={query.status} onFocus={event => revealStatusFocus(event.currentTarget)} onChange={event => patchQuery({ status: event.target.value as DefectsQuery['status'] })}><option value="all">{tx("Tất cả")}</option><option value="active">{tx("Đang sử dụng")}</option><option value="inactive">{tx("Ngừng sử dụng")}</option></FilterSelect></CatalogueToolbar>
          <NoticeSlot name="table" />
          {overflows && <p className="hn-scroll-hint">{tx("↔ Cuộn ngang để xem đầy đủ thông tin")}</p>}
          {refreshing && <div className="df-inline-state" role="status" aria-live="polite"><span className="df-page-state__spinner" aria-hidden="true" />{tx("Đang cập nhật danh sách…")}</div>}
          {readState === 'error' && <div className="df-inline-state df-inline-state--error" role="alert"><Icon name="info" width={18} height={18} /><span>{tx("Chưa thể cập nhật danh sách. Vui lòng thử lại.")}</span><Button variant="secondary" onClick={refresh}>{tx("Thử lại")}</Button></div>}
          {readState === 'blocked' && <div className="df-inline-state df-inline-state--blocked" role="status"><Icon name="info" width={18} height={18} /><span>{tx(blockedRead ? blockedMessage(blockedRead) : 'Lựa chọn hiện tại chưa khả dụng.')}</span></div>}
          <div className="df-table" aria-busy={refreshing}><DataTable appearance="refined" density="compact" stickyHeader captionVisibility="sr-only" caption={tx("Danh sách bệnh / lỗi")} columns={columns} rows={model.rows} rowKey={row => row.key} sort={model.query.sortKey && model.query.sort ? {key:model.query.sortKey,direction:model.query.sort} : null} onSort={key => { intent.current = null; setFeedback(null); setReadState('loading'); setQuery(current => updateDefectsQuery(current,{sortKey:key as DefectsSortKey,sort:current.sortKey===key && current.sort==='asc'?'desc':'asc'})); }} busy={refreshing} scrollResetKey={JSON.stringify(model.query)} emptyContent={model.emptyReason === 'no-matches' ? <PageState kind="no-results" title={tx("Không có hồ sơ phù hợp")} description={tx("Thử đổi từ khóa hoặc đặt lại bộ lọc để xem lại danh sách.")} action={<Button variant="secondary" onClick={reset}>{tx("Đặt lại bộ lọc")}</Button>} /> : model.emptyReason === 'no-records' ? <PageState kind="empty" title={tx("Chưa có hồ sơ")} description={tx("Nguồn dữ liệu hiện chưa có hồ sơ bệnh / lỗi.")} /> : undefined} /></div>
          <Pagination variant="defects" unit={tx("hồ sơ")} page={model.pagination.page} pageSize={model.pagination.pageSize} filteredTotal={model.pagination.total} canGoPrevious={model.pagination.page > 1} canGoNext={model.pagination.page < model.pagination.pageCount} onPageChange={page => patchQuery({ page })} pageSizeOptions={model.pagination.pageSizeOptions} onPageSizeChange={pageSize => patchQuery({ pageSize })} />
          <NoticeSlot name="pagination" />
        </section>
      </>}
      {modal?.kind === 'detail' && !recoveryObscuresModal && <GlobalModal
        open
        size="medium"
        title={tx('Chi tiết {code}', { code: modal.row.code })}
        description={tx("Thông tin hồ sơ bệnh / lỗi từ nguồn dữ liệu được duyệt.")}
        onClose={requestModalClose}
        footer={<div className="df-modal-actions"><Button variant="secondary" onClick={requestModalClose}>{tx("Đóng")}</Button><Button variant="primary" disabled={recoveryBlocking} onClick={() => openForm('edit', modal.row)}><Icon name="edit" width={16} height={16} />{tx(updateAvailable ? 'Sửa' : 'Sửa bản nháp')}</Button></div>}
      >
        <dl className="df-detail-fields">
          <div><dt>{tx("Mã lỗi")}</dt><dd>{modal.row.code}</dd></div>
          <div><dt>{tx("Tên lỗi / bệnh")}</dt><dd>{modal.row.name}</dd></div>
          <div><dt>{tx("Mô tả")}</dt><dd>{modal.row.description || '—'}</dd></div>
          <div><dt>{tx("Trạng thái")}</dt><dd><StatusBadge tone={modal.row.status === 'active' ? 'success' : 'neutral'}><span className="df-status-dot" aria-hidden="true" />{tx(modal.row.statusLabel)}</StatusBadge></dd></div>
        </dl>
        <p className="df-readonly-note" role="note"><Icon name="info" width={17} height={17} />{tx(updateAvailable || recoveryBlocking ? 'Đây là chế độ xem chỉ đọc.' : 'Đây là chế độ xem chỉ đọc. Các thay đổi tiếp theo chỉ là bản nháp cục bộ.')}</p>
        
      </GlobalModal>}
      {modal?.kind === 'form' && !recoveryObscuresModal && <GlobalModal
        open
        size="medium"
        initialFocusRef={formCodeRef}
        title={modal.mode === 'add' ? tx('Thêm lỗi / bệnh') : tx('Sửa {code}', { code: modal.original.code })}
        description={tx('Kiểm tra thông tin hồ sơ trước khi lưu.')}
        onClose={requestModalClose}
        footer={<div className="df-modal-actions"><Button variant="secondary" onClick={requestModalClose} disabled={formSubmitting || formReconciling || (formUncertain && !durableRecovery)}>{tx("Hủy")}</Button>{!recoveryBlocking && <Button variant="primary" type="submit" form="df-defect-form" disabled={formSubmitting || (!formUncertain && !formReady)} title={!formReady ? tx('Thao tác lưu chưa khả dụng. Bản nháp được giữ nguyên.') : undefined}>{tx(formSubmitting ? 'Đang lưu hồ sơ…' : formUncertain ? 'Kiểm tra kết quả' : 'Lưu')}</Button>}</div>}
      >
        <form id="df-defect-form" className="df-form" onSubmit={submitForm} aria-busy={formSubmitting || formReconciling} data-command-state={commandState.phase} data-reconciliation-state={reconciliation?.kind} noValidate>
          {recoveryPanel}
          {reconciliation && <section aria-label={tx('Kiểm tra dữ liệu mới')} className="df-form-reconciliation">
            <p role="status" aria-live="polite">{tx(reconciliation.kind === 'loading' ? 'Đang tải dữ liệu mới. Bản nháp được giữ nguyên.'
              : reconciliation.kind === 'ready' ? 'Đã tải dữ liệu mới. Bản nháp bên dưới chưa bị thay đổi. Chỉ dùng dữ liệu mới khi bạn chọn bỏ bản nháp.'
              : reconciliation.kind === 'blocked' && reconciliation.reason === 'TARGET_NOT_VISIBLE' ? 'Hồ sơ không nằm trong danh sách theo bộ lọc hiện tại. Bản nháp được giữ nguyên. Bạn có thể hủy bản nháp rồi đổi bộ lọc.'
              : reconciliation.kind === 'blocked' && reconciliation.reason === 'TARGET_UNAVAILABLE' ? 'Hồ sơ cũ không còn khả dụng trong dữ liệu mới. Bản nháp được giữ nguyên.'
              : reconciliation.kind === 'blocked' ? 'Chưa thể lấy dữ liệu mới để chỉnh sửa. Bản nháp được giữ nguyên. Hãy thử tải lại.'
              : 'Bản nháp đang dùng dữ liệu cũ. Hãy kiểm tra dữ liệu mới; không có thay đổi nào được tự động gửi lại.')}</p>
            <Button variant="secondary" type="button" onClick={() => void checkCanonicalData()} disabled={formLocked}>{tx('Kiểm tra dữ liệu mới')}</Button>
            {reconciliation.kind === 'ready' && <>
              {modal.mode === 'edit' && <dl className="df-detail-fields" aria-label={tx('Dữ liệu mới từ danh mục')}>
                <div><dt>{tx('Mã lỗi')}</dt><dd>{reconciliation.candidate.draft.code}</dd></div>
                <div><dt>{tx('Tên lỗi / bệnh')}</dt><dd>{reconciliation.candidate.draft.name}</dd></div>
                <div><dt>{tx('Mô tả')}</dt><dd>{reconciliation.candidate.draft.description || '—'}</dd></div>
                <div><dt>{tx('Trạng thái')}</dt><dd>{tx(statusLabels[reconciliation.candidate.draft.status])}</dd></div>
              </dl>}
              <Button variant="secondary" type="button" onClick={discardDraftAndUseCanonicalData}>{tx('Bỏ bản nháp và dùng dữ liệu mới')}</Button>
            </>}
          </section>}
          <div className="df-form-grid">
            <FormField label={tx("Mã lỗi")} htmlFor="df-form-code" required error={tx(formErrors.code)} hint={savedCodeReadOnly ? tx('Thay đổi mã lỗi chưa khả dụng.') : formAvailability?.missing.includes('P02') ? tx('Mã chỉ được giữ trong bản nháp; quy tắc duy nhất chưa có contract.') : undefined}>
              <input ref={formCodeRef} id="df-form-code" name="code" value={modal.draft.code} disabled={formLocked} readOnly={savedCodeReadOnly} onChange={event => updateDraft('code', event.target.value)} onBlur={() => validateDraftField('code')} placeholder={tx("VD: DF-NEW-01")} autoComplete="off" />
            </FormField>
            <FormField label={tx("Tên lỗi / bệnh")} htmlFor="df-form-name" required error={tx(formErrors.name)}>
              <input id="df-form-name" name="name" value={modal.draft.name} disabled={formLocked} onChange={event => updateDraft('name', event.target.value)} onBlur={() => validateDraftField('name')} placeholder={tx("Nhập tên lỗi / bệnh")} autoComplete="off" />
            </FormField>
          </div>
          <FormField label={tx("Mô tả")} htmlFor="df-form-description" error={tx(formErrors.description)} hint={tx(formPolicyReady ? 'Không bắt buộc.' : 'Không bắt buộc trong bản nháp này.')}>
            <textarea id="df-form-description" name="description" rows={4} value={modal.draft.description} disabled={formLocked} onChange={event => updateDraft('description', event.target.value)} placeholder={tx("Mô tả ngắn về lỗi / bệnh")} />
          </FormField>
          <FormField label={tx("Trạng thái")} htmlFor="df-form-status" required error={tx(formErrors.status)}>
            <select id="df-form-status" name="status" value={modal.draft.status} disabled={formLocked} onChange={event => updateDraft('status', event.target.value as DefectDraft['status'])}>
              <option value="active">{tx("Đang sử dụng")}</option>
              <option value="inactive">{tx("Ngừng sử dụng")}</option>
            </select>
          </FormField>
          {!formAvailable && !formLocked && <p className="df-form-blocked-note" role="note"><Icon name="info" width={17} height={17} /><span>{tx('Thao tác lưu chưa khả dụng. Bản nháp được giữ nguyên.')}</span></p>}
          {formSubmitting && <p className="df-form-notice" role="status">{tx('Đang lưu hồ sơ…')}</p>}
          {formDirty && !recoveryBlocking && !formUncertain && commandState.phase !== 'committed' && <p className="df-dirty-state" role="status">{tx("Có thay đổi chưa lưu.")}</p>}
          {formNotice && (formUncertain || reconciliation) && <p className="df-form-notice" role="status" aria-live="polite"><Icon name="info" width={17} height={17} /><span>{catalogueNoticeCopy(tx, formNotice)}</span></p>}
        </form>
      </GlobalModal>}
      <ConfirmDialog
        open={confirmDiscard}
        title={tx("Bỏ thay đổi chưa lưu?")}
        description={tx("Bạn có thay đổi chưa lưu trong biểu mẫu này. Nếu rời đi, bản nháp cục bộ sẽ bị xóa.")}
        confirmLabel={tx("Bỏ thay đổi")}
        cancelLabel={tx("Tiếp tục chỉnh sửa")}
        tone="danger"
        onConfirm={closeModal}
        onCancel={() => setConfirmDiscard(false)}
      />
      {formNotice && <OperationResultToast eventKey={formNotice} message={catalogueNoticeCopy(tx, formNotice)} tone={commandState.phase === 'committed' ? 'success' : 'warning'} />}
      {localizedFeedback && <Notice feedback={localizedFeedback} onClose={() => setFeedback(null)} placement="top-right" autoDismissMs={localizedFeedback.tone === 'error' ? undefined : 3000} />}
    </div>
  </GlobalShell>;
}
