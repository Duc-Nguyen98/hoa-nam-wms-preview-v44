import { useEffect, useRef } from 'react';
import type { CatalogRecipient } from '../../contracts/catalog-create';
import { Icon, StatusBadge } from '../../shared';
import { acquireBodyScrollLock } from '../../shared/body-scroll-lock';
import { useShellPreferences } from '../../shared/shell-preferences';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { RECIPIENT_CATALOG_COPY, RECIPIENT_FIELD_LABELS } from './recipient-catalog-copy';
import { formatRecipientCreatedAt, RECIPIENT_CREATE_FIELDS } from './recipient-catalog';

/** New-cohort details have a persisted ID; no source Update binding is accepted here. */
export function CatalogRecipientDetailDialog({ row, onClose }: { row: CatalogRecipient; onClose: () => void }) {
  const tx = useUiCopy(RECIPIENT_CATALOG_COPY);
  const { language } = useShellPreferences();
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    dialog.current?.showModal();
    const unlock = acquireBodyScrollLock();
    dialog.current?.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
    return unlock;
  }, [row.id]);
  return <dialog ref={dialog} className="hn-shell-dialog recipient-detail-dialog recipient-catalog-detail" data-recipient-id={row.id} aria-labelledby="recipient-catalog-detail-title"
    onCancel={event => { event.preventDefault(); onClose(); }}
    onKeyDown={event => {
      if (event.key !== 'Tab') return;
      const panel = event.currentTarget.querySelector('.recipient-detail-dialog__panel');
      const buttons = [...(panel?.querySelectorAll<HTMLButtonElement>('button:not([disabled])') ?? [])]
        .filter(control => !control.closest('.hn-global-toast-viewport,[inert],[hidden],[aria-hidden="true"],[aria-disabled="true"]')
          && control.getClientRects().length > 0 && getComputedStyle(control).visibility === 'visible');
      const first = buttons[0], last = buttons.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }}>
    <div className="recipient-detail-dialog__panel">
      <header className="recipient-detail-dialog__header"><div><p className="recipient-detail-dialog__eyebrow">{tx('Chi tiết nơi nhận')}</p><h2 id="recipient-catalog-detail-title">{row.name}</h2><p className="recipient-detail-dialog__code">{tx('Mã nơi nhận')}: <strong>{row.code}</strong></p></div><button type="button" className="hn-button hn-button--ghost recipient-detail-dialog__close" aria-label={tx('Đóng chi tiết nơi nhận')} onClick={onClose}><Icon name="close" width={18} height={18}/></button></header>
      <div className="recipient-detail-dialog__body">
        <dl className="recipient-detail-dialog__fields">
          {RECIPIENT_CREATE_FIELDS.filter(field => field !== 'code' && field !== 'name').map(field => <div key={field}><dt>{tx(RECIPIENT_FIELD_LABELS[field])}</dt><dd data-field={field}>{field === 'status'
            ? <StatusBadge tone={row.status === 'active' ? 'success' : 'neutral'}>{tx(row.status === 'active' ? 'Đang sử dụng' : 'Ngừng sử dụng')}</StatusBadge>
            : (field === 'type' || field === 'market') ? tx(row[field]) : row[field] || '—'}</dd></div>)}
          <div><dt>{tx('Ngày tạo')}</dt><dd><time dateTime={row.createdAt}>{formatRecipientCreatedAt(row.createdAt, language)}</time></dd></div>
          <div><dt>{tx('Mã định danh')}</dt><dd>{row.id}</dd></div>
          <div><dt>{tx('Phiên bản')}</dt><dd>{row.version}</dd></div>
        </dl>
        <p className="recipient-update-hint">{tx('Hồ sơ chỉ đọc.')}</p>
        {row.status === 'inactive' && <p className="recipient-update-hint">{tx('Nơi nhận ngừng sử dụng không thể được kích hoạt lại tại đây.')}</p>}
      </div>
      <footer className="recipient-detail-dialog__footer"><button type="button" className="hn-button hn-button--secondary" onClick={onClose}>{tx('Đóng')}</button></footer>
    </div>
  </dialog>;
}
