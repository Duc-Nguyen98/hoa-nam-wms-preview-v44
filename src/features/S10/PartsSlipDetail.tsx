import { useEffect, useRef, useState } from 'react';
import type { PartsRow } from '../../contracts/parts-slips';
import { Button, Icon, Notice, StatusBadge, type NoticeFeedback } from '../../shared';
import { acquireBodyScrollLock } from '../../shared/body-scroll-lock';
import { restoreControlFocus } from '../../shared/focus';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { OPERATIONS_EN_COPY } from '../../i18n/operations-copy';
import { copyText } from '../../shared/copy-text';
import { componentLabelParts } from './parts-presentation';

export const PARTS_DETAIL_COPY = {
  ...OPERATIONS_EN_COPY,
  'Chi tiết phiếu xuất linh kiện': 'Parts issue slip details',
  'Thông tin đã ghi nhận · Chỉ xem': 'Recorded information · Read only',
  'Đóng chi tiết phiếu': 'Close slip details',
  'Mã phiếu': 'Slip code',
  'Mã hồ sơ bảo hành đã ghi nhận': 'Recorded warranty case code',
  'Tổng hợp số lượng': 'Quantity summary',
  'Theo dõi': 'Tracking',
  'Dòng linh kiện': 'Component lines',
  'Chưa có dữ liệu từng dòng linh kiện để đối chiếu SKU, số lượng, Serial hoặc BOX.': 'Individual component lines are not available to reconcile SKU, quantity, serial or BOX.',
  'Chứng từ liên quan': 'Related documents',
  'Chưa có dữ liệu liên kết chứng từ để mở hoặc đối soát hồ sơ bảo hành.': 'Linked document data is not available to open or reconcile the warranty case.',
  'Xem thông tin phiếu đã ghi nhận; dòng linh kiện và chứng từ liên quan chưa khả dụng.': 'View recorded slip information; component lines and related documents are unavailable.',
  'Sao chép': 'Copy',
  'Sao chép {label}': 'Copy {label}',
  'Đã sao chép.': 'Copied.',
  'Không thể sao chép. Vui lòng thử lại.': 'Unable to copy. Please try again.',
  'Mở hồ sơ bảo hành': 'Open warranty case',
  'Mã linh kiện': 'Component code',
};

/** Only the accepted list row is projected. Summary text is not expanded into lines or joins. */
export function PartsSlipDetail({ row, origin, onClose }: { row: PartsRow; origin: HTMLElement | null; onClose: () => void }) {
  const tx = useUiCopy(PARTS_DETAIL_COPY);
  const dialog = useRef<HTMLDialogElement>(null);
  const pointerOnBackdrop = useRef(false);
  const copySequence = useRef(0);
  const [copyFeedback, setCopyFeedback] = useState<NoticeFeedback | null>(null);
  useEffect(() => {
    const element = dialog.current!;
    const release = acquireBodyScrollLock();
    element.showModal();
    element.querySelector<HTMLButtonElement>('button')?.focus({ preventScroll: true });
    return () => {
      element.close();
      release();
      // Do not move focus into another screen when route navigation unmounts this dialog.
      if (origin?.isConnected) restoreControlFocus(origin);
    };
  }, [origin]);
  const counts = /^(\d+) SKU · (\d+) linh kiện$/u.exec(row.quantitySummary);
  const quantity = counts ? tx(counts[2] === '1' ? '{skuCount} SKU · 1 linh kiện' : '{skuCount} SKU · {partCount} linh kiện', { skuCount: counts[1], partCount: counts[2] }) : row.quantitySummary;
  const component = componentLabelParts(row.componentSummary);
  const copy = async (value: string, origin: HTMLElement) => {
    const sequence = ++copySequence.current;
    let success = false;
    try { await copyText(value); success = true; } catch { /* Shared feedback handles clipboard rejection. */ }
    if (sequence !== copySequence.current) return;
    setCopyFeedback({ message: success ? 'Đã sao chép.' : 'Không thể sao chép. Vui lòng thử lại.', tone: success ? 'success' : 'error', sequence, origin, container: document.body });
  };
  const codeValue = (label: string, value: string) => <span className="s10-detail__copy-value"><code>{value}</code><Button variant="ghost" iconOnly className="s10-detail__copy" disabled={!value} aria-label={tx('Sao chép {label}', { label: tx(label) })} title={tx('Sao chép {label}', { label: tx(label) })} data-s10-copy={label} onClick={event => void copy(value, event.currentTarget)}><Icon name="copy" size={17} /></Button></span>;
  return <dialog ref={dialog} className="s10-detail" aria-labelledby="s10-detail-title" aria-describedby="s10-detail-description"
    onCancel={event => { event.preventDefault(); onClose(); }}
    onKeyDown={event => {
      if (event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey) return;
      const controls = event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])');
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }}
    onPointerDown={event => { pointerOnBackdrop.current = event.target === event.currentTarget; }}
    onPointerCancel={() => { pointerOnBackdrop.current = false; }}
    onClick={event => { if (pointerOnBackdrop.current && event.target === event.currentTarget) onClose(); pointerOnBackdrop.current = false; }}>
    <header className="s10-detail__header"><div><h2 id="s10-detail-title">{tx('Chi tiết phiếu xuất linh kiện')}</h2><p id="s10-detail-description">{tx('Thông tin đã ghi nhận · Chỉ xem')}</p></div><Button variant="ghost" iconOnly aria-label={tx('Đóng chi tiết phiếu')} onClick={onClose}><Icon name="close" /></Button></header>
    <div className="s10-detail__body">
      <dl className="s10-detail__fields">
        <div><dt>{tx('Mã phiếu')}</dt><dd data-field="slipCode">{codeValue('Mã phiếu', row.slipCode)}</dd></div>
        <div><dt>{tx('Mã hồ sơ bảo hành đã ghi nhận')}</dt><dd data-field="warrantyCaseCode"><span className="s10-detail__related-value">{codeValue('Mã hồ sơ bảo hành đã ghi nhận', row.warrantyCaseCode)}{row.warrantyCaseCode.trim() && <a href="#/preview/S09" data-s10-related="warranty-case">{tx('Mở hồ sơ bảo hành')}</a>}</span></dd></div>
        <div><dt>{tx('Linh kiện tóm tắt')}</dt><dd data-field="componentSummary">{component.code ? <span className="s10-detail__related-value">{codeValue('Mã linh kiện', component.code)}<span>{component.name}</span></span> : row.componentSummary}</dd></div>
        <div><dt>{tx('Tổng hợp số lượng')}</dt><dd data-field="quantitySummary">{quantity}</dd></div>
        <div><dt>{tx('Theo dõi')}</dt><dd data-field="trackingLabel">{tx(row.trackingLabel)}</dd></div>
        <div><dt>{tx('Trạng thái')}</dt><dd data-field="slipStatus"><StatusBadge tone={row.slipStatus === 'Đã xuất' ? 'success' : row.slipStatus === 'Nháp' ? 'warning' : 'neutral'}>{tx(row.slipStatus)}</StatusBadge></dd></div>
        <div><dt>{tx('Cập nhật')}</dt><dd data-field="updatedAtLabel">{row.updatedAtLabel}</dd></div>
      </dl>
      <div className="s10-detail__limits">
        <section aria-labelledby="s10-detail-lines-title"><h3 id="s10-detail-lines-title">{tx('Dòng linh kiện')}</h3><p>{tx('Chưa có dữ liệu từng dòng linh kiện để đối chiếu SKU, số lượng, Serial hoặc BOX.')}</p></section>
        <section aria-labelledby="s10-detail-documents-title"><h3 id="s10-detail-documents-title">{tx('Chứng từ liên quan')}</h3><p>{tx('Chưa có dữ liệu liên kết chứng từ để mở hoặc đối soát hồ sơ bảo hành.')}</p></section>
      </div>
    </div>
    <footer className="s10-detail__footer"><Button onClick={onClose}>{tx('Đóng')}</Button></footer>
    {copyFeedback && <Notice feedback={{ ...copyFeedback, message: tx(copyFeedback.message) }} onClose={() => setCopyFeedback(null)} />}
  </dialog>;
}
