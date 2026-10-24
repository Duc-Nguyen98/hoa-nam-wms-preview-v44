import { translateUiCopy } from '../../i18n/ui-copy';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { ADMIN_EN_COPY } from '../../i18n/admin-copy';
import { useEffect, useMemo, useReducer, useState } from 'react';
import type { EditableField, WarehouseConfigAdapter, WarehouseRead } from '../../contracts/warehouse-config';
import { createWarehouseConfigController } from '../../controllers/warehouse-config-controller';
import { GlobalShell } from '../../shared/GlobalShell';
import { Button, Card, Feedback } from '../../shared/primitives';
import { InitialReadState } from '../../shared/InitialReadState';
import { BasicSelect, FilterInput } from '../../shared/controls';
import { Icon } from '../../shared/Icon';
import { S00_SHELL_NAVIGATION } from '../../shared/s00-navigation';
import { revealControl, useKeyboardFocusReveal } from '../../shared/focus';
import { useGlobalToast } from '../../toast/GlobalToastProvider';
import './warehouse-config.css';

const commandCopy = { ...ADMIN_EN_COPY,
  'Đang lưu thay đổi…': 'Saving changes…', 'Kiểm tra kết quả lưu': 'Check save outcome',
  'Tải lại thông tin kho': 'Reload warehouse information', 'Kết quả lưu cấu hình': 'Warehouse save outcome',
  'Thay đổi đã được ghi nhận.': 'The change was committed.',
  'Tải lại thông tin kho để tiếp tục.': 'Reload warehouse information to continue.',
  'Đang tải lại thông tin kho…': 'Reloading warehouse information…',
  'Chưa xác định được kết quả lưu.': 'The save outcome is unknown.',
  'Thử lại cùng yêu cầu để kiểm tra kết quả.': 'Retry the same request to check its outcome.',
  'Đã lưu thay đổi cấu hình kho.': 'Warehouse configuration changes saved.',
  'Thông tin kho không thay đổi.': 'Warehouse information is unchanged.',
  'Chưa xác định được kết quả lưu. Thử lại cùng yêu cầu để kiểm tra kết quả.': 'The save outcome is unknown. Retry the same request to check its outcome.',
  'Dữ liệu đã thay đổi. Bản nháp được giữ lại; tải lại để đối chiếu trước khi lưu.': 'The data has changed. Your draft is retained; reload to reconcile before saving.',
  'Không thể lưu thay đổi. Bản nháp được giữ lại.': 'Unable to save changes. Your draft is retained.',
  'Thay đổi đã được ghi nhận nhưng chưa tải lại được thông tin kho. Vui lòng tải lại.': 'The change was committed, but warehouse information could not be refreshed. Please reload.',
  'Không thể tải lại thông tin kho. Bản nháp được giữ lại.': 'Unable to reload warehouse information. Your draft is retained.',
  'Các thay đổi hợp lệ sẽ được lưu theo quyền được cung cấp.': 'Valid changes can be saved with the supplied permission.',
  'Đang kiểm tra yêu cầu lưu trước đó…': 'Checking the previous save request…',
  'Chưa thể kiểm tra yêu cầu lưu trước đó. Yêu cầu vẫn được giữ; khôi phục phiên phù hợp rồi kiểm tra lại.': 'The previous save request cannot be checked yet. It is retained; restore the matching session and check again.',
  'Tiếp tục chỉnh sửa': 'Continue editing',
};

/** Mounted only for an assigned command outcome; presentation stays with the existing global provider. */
function WarehouseCommandToast({ event }: { event: { message: string; tone: 'success' | 'warning'; sequence: number; origin: HTMLElement | null } }) {
  const toast = useGlobalToast();
  useEffect(() => { toast.notify({ tone: event.tone, origin: event.origin, dedupeKey: `s28-command:${event.sequence}`,
    message: language => translateUiCopy(event.message, commandCopy, language) }); }, [toast, event]);
  return null;
}

/** No fixture or API import here. The host selects the adapter explicitly. */
export function WarehouseConfigScreen({ adapter, developmentNote }: { adapter?: WarehouseConfigAdapter; developmentNote?: string }) {
  const tx = useUiCopy(ADMIN_EN_COPY);
  const [readVersion, retryRead] = useReducer(value => value + 1, 0);
  const [readResult, setReadResult] = useState<{
    adapter: WarehouseConfigAdapter; version: number; value: WarehouseRead | null; failed: boolean;
  } | null>(null);
  // Match the adapter and retry generation during render, so a replaced adapter
  // cannot briefly display the previous warehouse before its effect starts.
  const currentRead = readResult && readResult.adapter === adapter && readResult.version === readVersion ? readResult : null;
  const pending = Boolean(adapter?.readAsync && !currentRead);
  useEffect(() => {
    if (!adapter?.readAsync) return;
    setReadResult(null);
    const controller = new AbortController();
    let active = true;
    // Invoke inside the Promise chain so a synchronous adapter throw follows
    // the same error/retry presentation as a rejected read.
    void Promise.resolve().then(() => adapter.readAsync!({ signal: controller.signal }))
      .then(value => { if (active) setReadResult({ adapter, version: readVersion, value, failed: false }); })
      .catch(() => { if (active) setReadResult({ adapter, version: readVersion, value: null, failed: true }); });
    return () => { active = false; controller.abort(); };
  }, [adapter, readVersion]);
  const asyncRead = adapter?.readAsync ? currentRead?.value : null;
  const resolvedAdapter = useMemo<WarehouseConfigAdapter | undefined>(() => asyncRead ? { ...adapter, read: () => asyncRead } : adapter, [adapter, asyncRead]);
  const controller = useMemo(() => createWarehouseConfigController(resolvedAdapter), [resolvedAdapter]);
  return <GlobalShell title={tx("Cấu hình kho Hoa Nam")} variant="wms" activeKey="S28" navigation={S00_SHELL_NAVIGATION}>
    <WarehouseConfigForm key={resolvedAdapter ? 'selected' : 'unselected'} controller={controller} developmentNote={developmentNote}
      pending={pending} readFailed={Boolean(adapter?.readAsync && currentRead?.failed)} onRetry={retryRead} />
  </GlobalShell>;
}

export function WarehouseConfigForm({ controller, developmentNote, pending, readFailed, onRetry }: {
  controller: ReturnType<typeof createWarehouseConfigController>; developmentNote?: string;
  pending: boolean; readFailed: boolean; onRetry: () => void;
}) {
  const tx = useUiCopy(commandCopy);
  const [, rerender] = useReducer(count => count + 1, 0);
  const [toastEvent, setToastEvent] = useState<{ message: string; tone: 'success' | 'warning'; sequence: number; origin: HTMLElement | null } | null>(null);
  const vm = controller.view();
  const committedAwaitingRead = vm.commandState === 'saved-refresh-error' && Boolean(vm.receipt);
  const outcomeUnknown = vm.commandState === 'outcome-unknown';
  const draftStatus = committedAwaitingRead ? 'Thay đổi đã được ghi nhận.'
    : outcomeUnknown ? 'Chưa xác định được kết quả lưu.'
    : vm.dirty ? 'Bạn có thay đổi chưa lưu.' : 'Chưa có thay đổi.';
  const saveHint = committedAwaitingRead ? (vm.refreshing ? 'Đang tải lại thông tin kho…' : 'Tải lại thông tin kho để tiếp tục.')
    : outcomeUnknown ? 'Thử lại cùng yêu cầu để kiểm tra kết quả.'
    : Object.keys(vm.errors).length ? 'Kiểm tra các trường chưa hợp lệ trước khi lưu.'
    : vm.writeAssigned ? 'Các thay đổi hợp lệ sẽ được lưu theo quyền được cung cấp.' : 'Luồng lưu chưa được bàn giao. Bản xem trước không cập nhật dữ liệu kho.';
  const setVm = (_value: unknown) => rerender();
  useEffect(() => {
    if (pending || readFailed) return;
    let active = true;
    void controller.initializeRecovery().then(() => { if (active) rerender(); });
    return () => { active = false; };
  }, [controller, pending, readFailed]);
  const revealFocus = useKeyboardFocusReveal();
  function update(field: EditableField, value: string) { setVm(controller.update(field, value)); }
  async function submit() {
    const assigned = controller.view().writeAssigned;
    const origin = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const result = assigned ? controller.submitAsync() : Promise.resolve(controller.submit());
    rerender();
    const next = await result;
    setVm(next);
    if (assigned && next.feedback) setToastEvent(previous => ({ message: next.feedback, tone: next.commandState === 'saved' ? 'success' : 'warning', sequence: (previous?.sequence ?? 0) + 1, origin }));
    if (next.firstInvalid) requestAnimationFrame(() => {
      const field = document.getElementById(`s28-${next.firstInvalid}`);
      field?.focus({ preventScroll: true });
      if (field) revealControl(field);
    });
  }
  return <div className="s28-screen" data-screen="S28" data-visual-variant="premium" onFocusCapture={revealFocus}>
    {toastEvent && <WarehouseCommandToast event={toastEvent} />}
    <header className="s28-heading">
      <div className="s28-heading-main">
        <p className="s28-breadcrumb" aria-label={tx("Đường dẫn")}><span>{tx("Hệ thống")}</span><Icon name="chevron-right" size={14} /><strong>{tx("Cấu hình kho")}</strong></p>
        <h1>{tx("Cấu hình kho Hoa Nam")}</h1>
        <p>{tx("Thông tin chung, liên hệ và địa chỉ của kho.")}</p>
      </div>
      {!pending && !readFailed && vm.snapshot && <div className="s28-heading-context" aria-label={tx("Trạng thái cấu hình")}>
        <span className="s28-context-status" data-status={vm.snapshot.status}><span className="s28-status-dot" aria-hidden="true" />{tx(vm.statusLabel)}</span>
      </div>}
    </header>
    {developmentNote && <aside className="s28-preview-note" aria-label={tx("Phạm vi kiểm thử S28")}>
      <span className="s28-preview-note__icon" aria-hidden="true"><Icon name="info" size={18} /></span>
      <Feedback title="Preview S28" tone="warning">{developmentNote}</Feedback>
    </aside>}
    {!pending && !readFailed && vm.restoring && <div role="status" aria-busy="true" data-s28-recovery="restoring">{tx('Đang kiểm tra yêu cầu lưu trước đó…')}</div>}
    {!pending && !readFailed && (vm.canRecover || vm.canContinue || (!vm.snapshot && vm.canReload)) && <section data-s28-recovery={vm.canContinue ? 'committed' : vm.commandState} aria-label={tx('Kết quả lưu cấu hình')}>
      {vm.feedback && <Feedback title={tx('Kết quả lưu cấu hình')} tone={vm.canContinue ? 'success' : 'warning'} live>{tx(vm.feedback)}</Feedback>}
      {vm.canRecover && <Button type="button" data-s28-recovery-action="retry" onClick={() => { const result = controller.retryRecovery(); rerender(); void result.then(setVm); }}>{tx('Kiểm tra kết quả lưu')}</Button>}
      {vm.canContinue && <Button type="button" data-s28-recovery-action="continue" onClick={() => { const result = controller.continueAfterSave(); rerender(); void result.then(setVm); }}>{tx('Tiếp tục chỉnh sửa')}</Button>}
      {!vm.snapshot && vm.canReload && <Button type="button" onClick={() => { const result = controller.reload(); rerender(); void result.then(setVm); }}>{tx('Tải lại thông tin kho')}</Button>}
    </section>}
    {pending || readFailed ? <section aria-busy={pending} data-s28-read-state={pending ? 'loading' : 'error'}>
      <InitialReadState label={tx('Cấu hình kho Hoa Nam')} loading={pending} error={readFailed} onRetry={onRetry} />
    </section> : vm.sourceMessage ? <Feedback title={tx("Chưa thể hiển thị cấu hình kho")} tone="warning">{tx(vm.sourceMessage)}</Feedback> : vm.snapshot && vm.draft &&
    <form className="s28-form" noValidate onSubmit={event => { event.preventDefault(); void submit(); }} aria-label={tx("Cấu hình kho Hoa Nam")} aria-busy={vm.commandState === 'submitting' || vm.refreshing || vm.restoring} data-command-state={vm.commandState}>
      <div className="s28-columns">
        <div className="s28-edit-sections">
          <Card className="s28-card s28-general-card" title={tx("Thông tin chung")} description={tx("Thông tin nhận diện của kho.")}>
            <div className="s28-fields">
              <div className="s28-field"><label id="s28-code-label" htmlFor="s28-code">{tx("Mã kho")}</label>
                <FilterInput id="s28-code" label={tx("Mã kho")} icon="lock" value={vm.snapshot.code} readOnly aria-labelledby="s28-code-label" aria-describedby="s28-code-hint" />
                <p id="s28-code-hint" className="s28-hint">{tx("Mã kho chỉ đọc.")}</p>
              </div>
              <div className="s28-field"><label htmlFor="s28-status">{tx("Trạng thái")}</label>
                <BasicSelect id="s28-status" value={vm.snapshot.status} disabled aria-describedby="s28-status-hint">
                  <option value="ACTIVE">{tx("Đang hoạt động")}</option><option value="INACTIVE">{tx("Ngừng hoạt động")}</option>
                </BasicSelect>
                <p id="s28-status-hint" className="s28-hint">{tx("Chỉ Super Admin được đổi trạng thái kho. Luồng đổi trạng thái chưa được bàn giao trong phiên bản hiện tại.")}</p>
              </div>
              <div className="s28-field s28-field--full"><label id="s28-name-label" htmlFor="s28-name">{tx("Tên kho")}{' '}<span aria-hidden="true">*</span></label>
                <FilterInput id="s28-name" label={tx("Tên kho")} icon="warehouse" value={vm.draft.name} required disabled={!vm.canEdit} aria-labelledby="s28-name-label" aria-invalid={Boolean(vm.visibleErrors.name)} aria-describedby={vm.visibleErrors.name ? 's28-name-error s28-name-hint' : 's28-name-hint'} onChange={event => update('name', event.target.value)} onBlur={() => setVm(controller.blur('name'))} />
                <p id="s28-name-hint" className="s28-hint">{tx("Bắt buộc, tối đa 200 ký tự.")}</p>
                {vm.visibleErrors.name && <div id="s28-name-error"><Feedback title={tx(vm.visibleErrors.name)} tone="error" live /></div>}
              </div>
            </div>
          </Card>
          <Card className="s28-card s28-contact-card" title={tx("Liên hệ")} description={tx("Thông tin liên hệ của kho (không bắt buộc).")}>
            <div className="s28-fields">
              <div className="s28-field"><label id="s28-contact-label" htmlFor="s28-contact_person">{tx("Người liên hệ")}</label>
                <FilterInput id="s28-contact_person" label={tx("Người liên hệ")} icon="user" value={vm.draft.contact_person} disabled={!vm.canEdit} aria-labelledby="s28-contact-label" aria-invalid={Boolean(vm.visibleErrors.contact_person)} aria-describedby={vm.visibleErrors.contact_person ? 's28-contact-error s28-contact-hint' : 's28-contact-hint'} onChange={event => update('contact_person', event.target.value)} onBlur={() => setVm(controller.blur('contact_person'))} />
                <p id="s28-contact-hint" className="s28-hint">{tx("Tối đa 200 ký tự.")}</p>
                {vm.visibleErrors.contact_person && <div id="s28-contact-error"><Feedback title={tx(vm.visibleErrors.contact_person)} tone="error" live /></div>}
              </div>
              <div className="s28-field"><label id="s28-phone-label" htmlFor="s28-phone">{tx("Số điện thoại")}</label>
                <FilterInput id="s28-phone" label={tx("Số điện thoại")} icon="info" type="tel" inputMode="tel" value={vm.draft.phone} disabled={!vm.canEdit} aria-labelledby="s28-phone-label" aria-invalid={Boolean(vm.visibleErrors.phone)} aria-describedby={vm.visibleErrors.phone ? 's28-phone-error s28-phone-hint' : 's28-phone-hint'} onChange={event => update('phone', event.target.value)} onBlur={() => setVm(controller.blur('phone'))} />
                <p id="s28-phone-hint" className="s28-hint">{tx("Không bắt buộc; 10 chữ số, đầu số 03/05/07/08/09. Có thể nhập khoảng trắng, dấu gạch, dấu chấm hoặc ngoặc.")}</p>
                {vm.visibleErrors.phone && <div id="s28-phone-error"><Feedback title={tx(vm.visibleErrors.phone)} tone="error" live /></div>}
              </div>
            </div>
          </Card>
        </div>
        <Card className="s28-card s28-address" title={tx("Địa chỉ kho")} description={tx("Thông tin địa chỉ hiện có.")}>
          <div className="s28-address-empty">
            <span className="s28-address-empty__icon" aria-hidden="true"><Icon name="building" size={22} /></span>
            <div><strong>{vm.snapshot.address || tx("Chưa có thông tin")}</strong><p>{tx("Địa chỉ hiện chỉ xem.")}</p></div>
          </div>
          <Feedback title={tx("Đang chờ quy tắc địa chỉ")}>{tx("Phần chỉnh sửa địa chỉ sẽ được mở sau khi D01 được xác nhận. Thông tin hiện có được giữ nguyên.")}</Feedback>
        </Card>
      </div>
      {!vm.canManage && <Feedback title={tx("Cấu hình chỉ đọc")}>{tx("Ngữ cảnh được cung cấp không có quyền quản lý kho.")}</Feedback>}
      <Card className="s28-card s28-save-panel" aria-label={tx("Lưu thay đổi cấu hình")}>
        <div className="s28-save-row"><div className="s28-save-state">
          <span className={`s28-save-state__dot${vm.dirty && !committedAwaitingRead ? ' is-dirty' : ''}`} aria-hidden="true" />
          <div><p className="s28-draft-status" role="status">{tx(draftStatus)}</p>
            <p id="s28-save-hint" className="s28-hint">{tx(saveHint)}</p></div>
        </div><div className="s28-save-action"><Button type="submit" disabled={!vm.saveEnabled} aria-describedby="s28-save-hint" leadingIcon={<Icon name="save" />}>{tx(vm.commandState === 'submitting' ? 'Đang lưu thay đổi…' : vm.commandState === 'outcome-unknown' ? 'Kiểm tra kết quả lưu' : "Lưu thay đổi")}</Button></div></div>
        
        {vm.canReload && <Button type="button" onClick={() => { const result = controller.reload(); rerender(); void result.then(setVm); }}>{tx('Tải lại thông tin kho')}</Button>}
      </Card>
    </form>}
  </div>;
}
