import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { RECIPIENT_MARKETS, RECIPIENT_TYPES, type CatalogCreateAdapter, type CatalogCreateOutcome, type CatalogCreateRequest, type CatalogRecipient, type CatalogSnapshot } from '../../contracts/catalog-create';
import type { CommandRecoveryResult } from '../../data/command-recovery';
import { isCatalogCreateOutcome, normalizeCatalogPayload } from '../../preview-mock/catalog-policy';
import { Icon } from '../../shared';
import { BasicSelect } from '../../shared/controls';
import { acquireBodyScrollLock } from '../../shared/body-scroll-lock';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { acceptCreatedRecipient, createRecipientCatalogRequest, emptyRecipientDraft, isRecipientCatalogScopeBusy, RECIPIENT_CREATE_FIELDS, recipientDraftFromPayload, type RecipientCreateDraft, type RecipientCreateField } from './recipient-catalog';
import { RECIPIENT_CATALOG_COPY, RECIPIENT_FIELD_ERRORS, RECIPIENT_FIELD_LABELS } from './recipient-catalog-copy';

type Mode = 'loading' | 'ready' | 'pending' | 'committed' | 'blocked';
type Failure = { code?: string; status?: number | null; outcomeUnknown?: boolean; details?: { field?: string } };
type Recovery = CommandRecoveryResult<CatalogCreateRequest<'recipient'>, CatalogCreateOutcome>;

export function RecipientCreateDialog({ adapter, onClose, onAccepted }: {
  adapter: CatalogCreateAdapter<'recipient'>;
  onClose: () => void;
  onAccepted: (snapshot: CatalogSnapshot, row: CatalogRecipient) => void;
}) {
  const tx = useUiCopy(RECIPIENT_CATALOG_COPY);
  const dialog = useRef<HTMLDialogElement>(null);
  const request = useRef<CatalogCreateRequest<'recipient'> | null>(null);
  const pendingFocus = useRef<RecipientCreateField | null>(null);
  const generation = useRef(0), busy = useRef(false), mounted = useRef(false);
  const [draft, setDraft] = useState<RecipientCreateDraft>(emptyRecipientDraft);
  const [epoch, setEpoch] = useState('');
  const [mode, setMode] = useState<Mode>('loading');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Partial<Record<RecipientCreateField, string>>>({});
  const current = (token: number) => mounted.current && token === generation.current;

  function fieldError(error: unknown) {
    const failure = error as Failure;
    const field = failure?.details?.field;
    if (!RECIPIENT_CREATE_FIELDS.includes(field as RecipientCreateField)) return false;
    const key = field as RecipientCreateField;
    pendingFocus.current = key;
    setErrors({ [key]: failure.code === 'DUPLICATE_VALUE' ? 'Mã nơi nhận đã tồn tại. Hãy nhập mã khác.' : RECIPIENT_FIELD_ERRORS[key] });
    setMessage('Kiểm tra lại trường được đánh dấu.');
    return true;
  }

  useEffect(() => {
    if (mode !== 'ready' || saving || !pendingFocus.current) return;
    const control = dialog.current?.querySelector<HTMLElement>(`#recipient-create-${pendingFocus.current}`);
    if (!control || control.matches(':disabled')) return;
    pendingFocus.current = null;
    control.focus();
  }, [mode, saving, errors]);

  async function finish(sent: CatalogCreateRequest<'recipient'>, outcome: CatalogCreateOutcome, token: number) {
    request.current = sent;
    if (!isCatalogCreateOutcome(outcome, sent)) {
      setMode('pending');
      setMessage('Chưa xác nhận được kết quả. Kiểm tra lại cùng thao tác để tránh tạo trùng.');
      return;
    }
    setMode('committed');
    try {
      const accepted = await acceptCreatedRecipient(adapter, sent, outcome, () => current(token));
      if (current(token)) onAccepted(accepted.snapshot, accepted.row);
    } catch {
      if (current(token)) setMessage('Hồ sơ đã lưu; chưa hoàn tất đọc lại hoặc xác nhận. Hãy thử lại.');
    }
  }

  async function applyRecovery(restored: Recovery, token: number) {
    if (!current(token)) return;
    if (restored.kind === 'pending' || restored.kind === 'committed') {
      if (restored.request.command !== 'recipients.create') throw new Error('Unexpected recovery command');
      normalizeCatalogPayload('recipient', restored.request.payload);
    }
    if (restored.kind === 'blocked') {
      setMode('blocked');
      setMessage('Không thể kiểm tra thao tác đang chờ. Đóng rồi thử lại khi phiên hoặc kết nối sẵn sàng.');
    } else if (restored.kind === 'committed') {
      setDraft(recipientDraftFromPayload(restored.request.payload));
      await finish(restored.request, restored.outcome, token);
    } else if (restored.kind === 'pending') {
      request.current = restored.request;
      setDraft(recipientDraftFromPayload(restored.request.payload));
      setMode('pending');
      setMessage('Chưa xác nhận được kết quả. Kiểm tra lại cùng thao tác để tránh tạo trùng.');
    } else {
      const snapshot = await adapter.readSnapshot();
      if (!current(token)) return;
      request.current = null;
      pendingFocus.current ??= 'code';
      setEpoch(snapshot.epoch);
      setMode('ready');
    }
  }

  async function restore(retryPending = false) {
    if (busy.current) return;
    const token = generation.current;
    busy.current = true;
    setSaving(true);
    setMessage('');
    try {
      if (!adapter.available) throw new Error('Unavailable');
      await applyRecovery(await (retryPending ? adapter.recovery.retry() : adapter.recovery.restore()), token);
    } catch {
      if (current(token)) {
        setMode('blocked');
        setMessage('Không thể kiểm tra thao tác đang chờ. Đóng rồi thử lại khi phiên hoặc kết nối sẵn sàng.');
      }
    } finally {
      if (current(token)) { busy.current = false; setSaving(false); }
    }
  }

  useEffect(() => {
    mounted.current = true;
    busy.current = false;
    ++generation.current;
    dialog.current?.showModal();
    const unlock = acquireBodyScrollLock();
    void restore();
    return () => { mounted.current = false; ++generation.current; unlock(); };
  }, [adapter]);

  async function save() {
    if (busy.current || mode !== 'ready' || !epoch) return;
    setErrors({});
    setMessage('');
    let sent: CatalogCreateRequest<'recipient'>;
    try { sent = createRecipientCatalogRequest(epoch, draft); }
    catch (error) { fieldError(error); return; }
    request.current = sent;
    busy.current = true;
    setSaving(true);
    const token = generation.current;
    try {
      const outcome = await adapter.execute(sent);
      if (current(token)) await finish(sent, outcome, token);
    } catch (error) {
      if (!current(token)) return;
      if (isRecipientCatalogScopeBusy(error)) {
        request.current = null;
        setMode('ready');
        setMessage('Một thao tác khác đang chờ xác nhận. Nội dung đang nhập được giữ lại; hãy thử lại sau.');
        return;
      }
      // The journal decides whether this request can be replaced. An HTTP error
      // alone cannot erase an earlier uncertain write, including another tab's intent.
      try {
        const restored = await adapter.recovery.restore();
        if (!current(token)) return;
        await applyRecovery(restored, token);
        if (!current(token) || restored.kind !== 'empty') return;
        const failure = error as Failure;
        if (!fieldError(error)) {
          setMessage(failure.code === 'STALE_DEMO_EPOCH'
            ? 'Đã đổi phiên dữ liệu. Kiểm tra nội dung trước khi lưu lại.'
            : failure.status === 401 || failure.status === 403
              ? 'Không thể tạo nơi nhận trong phiên hiện tại. Nội dung nhập được giữ lại.'
              : 'Chưa lưu được hồ sơ. Nội dung nhập được giữ lại; hãy thử lại.');
        }
      } catch {
        if (current(token)) {
          setMode('blocked');
          setMessage('Không thể kiểm tra thao tác đang chờ. Đóng rồi thử lại khi phiên hoặc kết nối sẵn sàng.');
        }
      }
    } finally {
      if (current(token)) { busy.current = false; setSaving(false); }
    }
  }

  const locked = saving || mode !== 'ready';
  const close = () => { if (!busy.current) onClose(); };
  return <dialog ref={dialog} className="hn-shell-dialog recipient-detail-dialog recipient-create-dialog" aria-labelledby="recipient-create-title"
    onCancel={event => { event.preventDefault(); close(); }}
    onKeyDown={event => {
      if (event.key !== 'Tab') return;
      const panel = event.currentTarget.querySelector('.recipient-detail-dialog__panel');
      const controls = [...(panel?.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),select:not([disabled])') ?? [])]
        .filter(control => !control.closest('.hn-global-toast-viewport,[inert],[hidden],[aria-hidden="true"],[aria-disabled="true"]')
          && control.getClientRects().length > 0 && getComputedStyle(control).visibility === 'visible');
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }}>
    <form className="recipient-detail-dialog__panel" noValidate onSubmit={event => { event.preventDefault(); void save(); }}>
      <header className="recipient-detail-dialog__header"><h2 id="recipient-create-title">{tx('Tạo nơi nhận')}</h2><button type="button" className="hn-button hn-button--ghost recipient-detail-dialog__close" aria-label={tx('Đóng tạo nơi nhận')} disabled={saving} onClick={close}><Icon name="close" width={18} height={18}/></button></header>
      <div className="recipient-detail-dialog__body">
        {mode === 'loading' ? <p role="status">{tx('Đang chuẩn bị biểu mẫu…')}</p> : <div className="recipient-create-fields">
          {RECIPIENT_CREATE_FIELDS.map(field => {
            const optional = field === 'contact' || field === 'phone';
            const options = field === 'type' ? RECIPIENT_TYPES : field === 'market' ? RECIPIENT_MARKETS : field === 'status' ? ['active', 'inactive'] : null;
            const common = { id: `recipient-create-${field}`, value: draft[field], disabled: locked, required: !optional, 'aria-invalid': !!errors[field], 'aria-describedby': errors[field] ? `recipient-create-${field}-error` : undefined, onChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => { setDraft(value => ({ ...value, [field]: event.target.value })); setErrors(value => ({ ...value, [field]: undefined })); } };
            return <div className="recipient-update-field" key={field} data-field={field}>
              <label htmlFor={common.id}>{tx(RECIPIENT_FIELD_LABELS[field])}{optional ? <span className="recipient-create-optional"> · {tx('Không bắt buộc')}</span> : ' *'}</label>
              {options ? <BasicSelect {...common}><option value="">{tx('Chọn giá trị')}</option>{options.map(value => <option key={value} value={value}>{tx(value === 'active' ? 'Đang sử dụng' : value === 'inactive' ? 'Ngừng sử dụng' : value)}</option>)}</BasicSelect>
                : <input {...common} type={field === 'phone' ? 'tel' : 'text'} autoComplete="off"/>}
              {errors[field] && <p className="recipient-update-error" id={`recipient-create-${field}-error`}>{tx(errors[field]!)}</p>}
            </div>;
          })}
        </div>}
        {draft.status === 'inactive' && <p className="recipient-update-hint">{tx('Nơi nhận ngừng sử dụng không thể được kích hoạt lại tại đây.')}</p>}
        {message && <p role="alert" className="recipient-update-message">{tx(message)}</p>}
        {mode === 'pending' && <p className="recipient-update-hint">{tx('Có thể đóng cửa sổ này. Thao tác đang chờ được giữ lại và sẽ khôi phục khi mở lại.')}</p>}
      </div>
      <footer className="recipient-detail-dialog__footer recipient-update-footer">
        <button type="button" className="hn-button hn-button--secondary" disabled={saving} onClick={close}>{tx(mode === 'ready' ? 'Hủy' : 'Đóng')}</button>
        {mode === 'ready' && <button type="submit" className="hn-button hn-button--primary" disabled={saving}>{tx(saving ? 'Đang lưu…' : 'Lưu')}</button>}
        {mode !== 'ready' && mode !== 'loading' && <button type="button" className="hn-button hn-button--primary" disabled={saving} onClick={() => void restore(mode === 'pending')}>{tx(saving ? 'Đang lưu…' : mode === 'pending' ? 'Kiểm tra lại cùng thao tác' : 'Thử lại')}</button>}
      </footer>
    </form>
  </dialog>;
}
