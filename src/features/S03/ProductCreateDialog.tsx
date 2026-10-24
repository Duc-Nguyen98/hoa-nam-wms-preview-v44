import { useEffect, useRef, useState } from 'react';
import { PRODUCT_GROUPS, PRODUCT_UNITS, type CatalogCreateAdapter, type CatalogCreateRequest, type CatalogCreateOutcome, type CatalogSnapshot } from '../../contracts/catalog-create';
import { normalizeCatalogPayload } from '../../preview-mock/catalog-policy';
import { BasicSelect, Button, Icon } from '../../shared';
import { acquireBodyScrollLock } from '../../shared/body-scroll-lock';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { PRODUCT_CATALOG_COPY } from './catalog-copy';
import { isUndispatchedCatalogScopeBusy, reconcileCreatedProduct } from './catalog-products';
import { revealProductControl } from './product-focus';
import { catalogDialogControls } from './catalog-focus';

type Draft = { code: string; name: string; group: string; unit: string; status: string };
type Failure = { code?: string; status?: number; outcomeUnknown?: boolean; details?: { field?: string } };
const EMPTY: Draft = { code: '', name: '', group: '', unit: '', status: '' };
const fields = ['code', 'name', 'group', 'unit', 'status'] as const;
const labels = { code: 'Mã sản phẩm', name: 'Tên sản phẩm', group: 'Nhóm hàng', unit: 'Đơn vị tính', status: 'Trạng thái' };
const hints = {
  code: 'Mã gồm 1–40 chữ cái ASCII, chữ số hoặc dấu gạch nối; bắt đầu bằng chữ hoặc số.',
  name: 'Tên cần 1–200 ký tự, không chứa ký tự điều khiển hoặc xuống dòng.',
  group: 'Vui lòng chọn một giá trị.', unit: 'Vui lòng chọn một giá trị.', status: 'Vui lòng chọn một giá trị.',
};

export function ProductCreateDialog({ adapter, origin, onClose, onSaved }: {
  adapter: CatalogCreateAdapter<'product'>; origin: HTMLElement; onClose: () => void;
  onSaved: (snapshot: CatalogSnapshot, id: string) => void;
}) {
  const tx = useUiCopy(PRODUCT_CATALOG_COPY);
  const dialog = useRef<HTMLDialogElement>(null);
  const mounted = useRef(false), busy = useRef(false);
  const generation = useRef(0);
  const request = useRef<CatalogCreateRequest<'product'> | null>(null);
  const committed = useRef<CatalogCreateOutcome | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [context, setContext] = useState<CatalogSnapshot | null>(null);
  const [working, setWorking] = useState(true);
  const [unresolved, setUnresolved] = useState(false);
  const [message, setMessage] = useState('');
  const [fieldError, setFieldError] = useState<{ field: string; message: string } | null>(null);

  function focusField(field: string) {
    const token = generation.current;
    requestAnimationFrame(() => { if (isCurrent(token)) dialog.current?.querySelector<HTMLElement>(`#pr-create-${field}`)?.focus(); });
  }
  const isCurrent = (token: number) => mounted.current && generation.current === token;
  async function accept(sent: CatalogCreateRequest<'product'>, outcome: CatalogCreateOutcome, token: number) {
    if (!isCurrent(token)) return;
    committed.current = outcome;
    const accepted = await reconcileCreatedProduct(adapter, sent, outcome, () => isCurrent(token));
    if (accepted && isCurrent(token)) onSaved(accepted.snapshot, accepted.product.id);
  }
  async function restore(retry = false) {
    if (busy.current) return;
    const token = generation.current;
    busy.current = true; setWorking(true); setMessage(''); setFieldError(null);
    try {
      if (!adapter.available) throw new Error('COMMAND_UNAVAILABLE');
      const result = retry ? await adapter.recovery.retry() : await adapter.recovery.restore();
      if (!isCurrent(token)) return;
      if (result.kind === 'blocked') {
        setContext(null); setUnresolved(true);
        setMessage('Chưa thể xác nhận quyền hoặc dữ liệu hiện tại. Hãy thử đọc lại.');
        return;
      }
      if (result.kind === 'committed') {
        request.current = result.request; setDraft(result.request.payload); setUnresolved(true);
        await accept(result.request, result.outcome, token);
        return;
      }
      if (result.kind === 'pending') {
        request.current = result.request; setDraft(result.request.payload); setUnresolved(true);
        setMessage('Chưa xác nhận được kết quả. Kiểm tra lại cùng thao tác để tránh ghi trùng.');
        return;
      }
      // A known committed receipt whose acknowledgement succeeded still permits
      // only reading that result if a caller interrupted the completion boundary.
      if (committed.current && request.current) {
        await accept(request.current, committed.current, token);
        return;
      }
      request.current = null;
      const snapshot = await adapter.readSnapshot();
      if (!isCurrent(token)) return;
      setContext(snapshot); setUnresolved(false); focusField('code');
    } catch {
      if (!isCurrent(token)) return;
      setContext(null);
      setMessage(committed.current ? 'Đã lưu nhưng chưa đọc lại được hồ sơ. Hãy kiểm tra lại kết quả.'
        : 'Chưa thể xác nhận quyền hoặc dữ liệu hiện tại. Hãy thử đọc lại.');
    } finally {
      if (isCurrent(token)) { busy.current = false; setWorking(false); }
    }
  }
  useEffect(() => {
    mounted.current = true; ++generation.current; busy.current = false;
    request.current = null; committed.current = null;
    setContext(null); setUnresolved(false); setDraft(EMPTY);
    const element = dialog.current!;
    const unlock = acquireBodyScrollLock();
    element.showModal(); void restore();
    return () => {
      mounted.current = false; ++generation.current; element.close(); unlock();
      if (origin.isConnected) { origin.focus({ preventScroll: true }); revealProductControl(origin); }
    };
  }, [adapter, origin]);

  function close() { if (!busy.current) onClose(); }
  async function save() {
    if (busy.current || !context || unresolved || committed.current) return;
    const token = generation.current;
    setFieldError(null); setMessage('');
    let payload;
    try { payload = normalizeCatalogPayload('product', draft); }
    catch (error) {
      const field = (error as Failure).details?.field ?? 'code';
      setFieldError({ field, message: hints[field as keyof typeof hints] ?? 'Kiểm tra lại trường được đánh dấu.' });
      focusField(field); return;
    }
    busy.current = true; setWorking(true);
    let dispatched = false;
    try {
      const current = await adapter.readSnapshot();
      if (!isCurrent(token)) return;
      if (current.epoch !== context.epoch) throw new Error('STALE_DEMO_EPOCH');
      const sent: CatalogCreateRequest<'product'> = { commandId: crypto.randomUUID(), epoch: current.epoch, command: 'products.create', payload };
      request.current = sent; dispatched = true;
      const outcome = await adapter.execute(sent);
      if (!isCurrent(token)) return;
      setUnresolved(true);
      await accept(sent, outcome, token);
    } catch (error) {
      if (!isCurrent(token)) return;
      const failure = error as Failure;
      if (isUndispatchedCatalogScopeBusy(error)) {
        // Another form owns the journal. This intent never dispatched, so keep
        // our own draft/context and do not restore or acknowledge its receipt.
        request.current = null; setUnresolved(false);
        setMessage('Một thao tác khác đang chờ xác nhận. Nội dung đang nhập được giữ lại; hãy thử lại sau.');
        return;
      }
      const definitive = !failure.outcomeUnknown && !!failure.status && failure.status >= 400 && failure.status < 500
        && ![408, 429].includes(failure.status) && failure.code !== 'INVALID_RESPONSE';
      if (committed.current) {
        setUnresolved(true); setMessage('Đã lưu nhưng chưa đọc lại được hồ sơ. Hãy kiểm tra lại kết quả.');
      } else if (!dispatched) {
        setContext(null); setMessage('Chưa thể xác nhận quyền hoặc dữ liệu hiện tại. Hãy thử đọc lại.');
      } else if (definitive) {
        request.current = null; setUnresolved(false);
        const field = failure.details?.field;
        if (field) {
          setFieldError({ field, message: failure.code === 'DUPLICATE_VALUE' ? 'Mã đã tồn tại. Hãy nhập mã khác.' : hints[field as keyof typeof hints] ?? 'Kiểm tra lại trường được đánh dấu.' });
          focusField(field);
        } else {
          setContext(null); setMessage('Chưa thể lưu sản phẩm. Nội dung đang nhập được giữ lại.');
        }
      } else {
        setUnresolved(true); setMessage('Chưa xác nhận được kết quả. Kiểm tra lại cùng thao tác để tránh ghi trùng.');
      }
    } finally {
      if (isCurrent(token)) { busy.current = false; setWorking(false); }
    }
  }
  const locked = working || unresolved || !context;
  return <dialog ref={dialog} className="pr-detail pr-create" aria-labelledby="pr-create-title"
    onCancel={event => { event.preventDefault(); close(); }} onKeyDown={event => {
      if (event.key !== 'Tab') return;
      const form = event.currentTarget.querySelector('form');
      const controls = form ? catalogDialogControls(form) : [];
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }}>
    <form onSubmit={event => { event.preventDefault(); void save(); }} noValidate>
      <header className="pr-detail__header"><h2 id="pr-create-title">{tx('Thêm sản phẩm')}</h2><Button variant="ghost" iconOnly disabled={working} aria-label={tx('Đóng thêm sản phẩm')} onClick={close}><Icon name="close" /></Button></header>
      <div className="pr-detail__body">
        <p className="pr-scope-note">{tx('Hồ sơ tạo mới chỉ xem; chưa hỗ trợ sửa, xóa hoặc đổi trạng thái.')}</p>
        {fields.map(field => <div className="pr-create-field" key={field}>
          <label htmlFor={`pr-create-${field}`}>{tx(labels[field])} *</label>
          {field === 'code' || field === 'name' ? <input id={`pr-create-${field}`} value={draft[field]} required autoComplete="off" disabled={locked}
            aria-invalid={fieldError?.field === field} aria-describedby={fieldError?.field === field ? `pr-create-${field}-error` : undefined}
            onChange={event => setDraft(value => ({ ...value, [field]: event.target.value }))} />
            : <BasicSelect id={`pr-create-${field}`} value={draft[field]} required disabled={locked}
              aria-invalid={fieldError?.field === field} aria-describedby={fieldError?.field === field ? `pr-create-${field}-error` : undefined}
              onChange={event => setDraft(value => ({ ...value, [field]: event.target.value }))}>
              <option value="">{tx('Chọn giá trị')}</option>
              {(field === 'group' ? PRODUCT_GROUPS : field === 'unit' ? PRODUCT_UNITS : ['active', 'inactive']).map(value => <option key={value} value={value}>{field === 'status' ? tx(value === 'active' ? 'Đang hoạt động' : 'Ngừng sử dụng') : value}</option>)}
            </BasicSelect>}
          {fieldError?.field === field && <p className="pr-create-error" id={`pr-create-${field}-error`} role="alert">{tx(fieldError.message)}</p>}
        </div>)}
        {message && <p role="alert">{tx(message)}</p>}
        {working && <p role="status">{tx(request.current ? 'Đang lưu…' : 'Đang đọc hồ sơ…')}</p>}
      </div>
      <footer className="pr-detail__footer"><Button variant="secondary" disabled={working} onClick={close}>{tx('Hủy')}</Button>
        {unresolved || committed.current ? <Button disabled={working} onClick={() => void restore(true)}>{tx('Kiểm tra lại kết quả')}</Button>
          : !context ? <Button disabled={working} onClick={() => void restore()}>{tx('Đọc lại dữ liệu')}</Button>
            : <Button type="submit" disabled={working}>{tx(working ? 'Đang lưu…' : 'Lưu')}</Button>}
      </footer>
    </form>
  </dialog>;
}
