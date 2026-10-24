import { useShellPreferences, localeForLanguage } from './shell-preferences';
import { useUiCopy } from '../i18n/use-ui-copy';
import { useId, useLayoutEffect, useRef } from 'react';
import { Button } from './primitives';
import { Icon } from './Icon';
import { BasicSelect } from './controls';
import { PAGE_SIZE_OPTIONS, paginationWindow } from './table-query';
import { revealControl, useKeyboardFocusReveal } from './focus';

const foregroundSelector = '.hn-header-popup, dialog[open], .hn-date-picker__popup[data-open="true"]';

export interface PaginationProps {
  page: number;
  pageSize: number;
  filteredTotal: number | null;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onPageChange: (page: number) => void;
  pageSizeOptions?: readonly number[];
  onPageSizeChange?: (pageSize: number) => void;
  variant?: 'default' | 'overview' | 'defects' | 'products';
  unit?: string;
  /** Actual rows supplied by the accepted adapter response, when its page is partial. */
  displayedCount?: number;
  preserveBoundaryFocus?: boolean;
}

/** No page sizes or unknown-total pagination policy are invented. Caller supplies source-backed values. */
export function Pagination({ page, pageSize, filteredTotal, canGoPrevious, canGoNext, onPageChange, pageSizeOptions = PAGE_SIZE_OPTIONS, onPageSizeChange, variant = 'default', unit, displayedCount, preserveBoundaryFocus = false }: PaginationProps) {
  const tx = useUiCopy();
  const { language } = useShellPreferences();
  const sizeId = useId();
  const revealKeyboardFocus = useKeyboardFocusReveal();
  const navigation = useRef<HTMLElement>(null);
  const pendingFocus = useRef<{ origin: HTMLButtonElement; from: number; to: number; size: number; total: number | null } | null>(null);
  const numbered = variant === 'overview' || variant === 'defects' || variant === 'products';
  const keepBoundaryFocus = preserveBoundaryFocus && numbered;
  useLayoutEffect(() => {
    if (!keepBoundaryFocus) { pendingFocus.current = null; return; }
    const cancelForFocus = (event: FocusEvent) => {
      const pending = pendingFocus.current;
      if (pending && event.target !== pending.origin && event.target !== document.body && event.target !== document.documentElement) pendingFocus.current = null;
    };
    const cancelForPointer = (event: PointerEvent) => {
      const pending = pendingFocus.current;
      if (pending && event.target instanceof Node && !pending.origin.contains(event.target)) pendingFocus.current = null;
    };
    const cancelForKey = (event: KeyboardEvent) => {
      if (event.key === 'Tab' || event.key === 'Escape') pendingFocus.current = null;
    };
    const cancelForForeground = () => { if (document.querySelector(foregroundSelector)) pendingFocus.current = null; };
    const observer = new MutationObserver(cancelForForeground);
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['open', 'data-open', 'class'] });
    document.addEventListener('focusin', cancelForFocus);
    document.addEventListener('pointerdown', cancelForPointer, true);
    document.addEventListener('keydown', cancelForKey, true);
    return () => {
      pendingFocus.current = null; observer.disconnect();
      document.removeEventListener('focusin', cancelForFocus);
      document.removeEventListener('pointerdown', cancelForPointer, true);
      document.removeEventListener('keydown', cancelForKey, true);
    };
  }, [keepBoundaryFocus]);
  useLayoutEffect(() => {
    const pending = pendingFocus.current;
    if (!keepBoundaryFocus || !pending) return;
    if (pageSize !== pending.size || document.querySelector(foregroundSelector)) { pendingFocus.current = null; return; }
    if (page === pending.from) {
      if (filteredTotal !== pending.total) pendingFocus.current = null;
      return;
    }
    // Only the accepted page can transfer focus from a now-disabled arrow.
    pendingFocus.current = null;
    if (page !== pending.to || filteredTotal !== pending.total || !pending.origin.disabled) return;
    const active = document.activeElement;
    if (active !== pending.origin && active !== document.body && active !== document.documentElement) return;
    const current = navigation.current?.querySelector<HTMLButtonElement>('button[aria-current="page"]');
    if (!current || current.disabled || !current.isConnected || !current.getClientRects().length
      || current.closest('[hidden],[inert],[aria-hidden="true"]') || getComputedStyle(current).visibility !== 'visible') return;
    current.focus({ preventScroll: true }); revealControl(current);
  }, [page, pageSize, filteredTotal, keepBoundaryFocus]);
  const changeFromArrow = (origin: HTMLButtonElement, target: number) => {
    pendingFocus.current = keepBoundaryFocus && document.activeElement === origin && !document.querySelector(foregroundSelector)
      ? { origin, from: page, to: target, size: pageSize, total: filteredTotal } : null;
    onPageChange(target);
  };
  if (variant === 'overview' || variant === 'defects' || variant === 'products') {
    const displayUnit = unit ?? (variant === 'defects' ? 'hồ sơ' : 'phiếu');
    const from = filteredTotal === null ? '—' : filteredTotal === 0 || displayedCount === 0 ? 0 : (page - 1) * pageSize + 1;
    const to = filteredTotal === null ? '—' : displayedCount === 0 ? 0 : Math.min((page - 1) * pageSize + (displayedCount ?? pageSize), filteredTotal);
    const pageCount = filteredTotal === null ? 0 : Math.max(variant === 'defects' || variant === 'products' ? 1 : 0, Math.ceil(filteredTotal / pageSize));
    const previousEnabled = canGoPrevious && page > 1;
    const nextEnabled = canGoNext && (filteredTotal === null || page < pageCount);
    const compactNumbers = paginationWindow(page, pageCount);
    return <nav ref={navigation} className={`hn-pagination hn-pagination--overview${variant === 'defects' ? ' hn-pagination--defects' : ''}${variant === 'products' ? ' hn-pagination--products' : ''}`} aria-label={tx("Phân trang bảng")} onFocusCapture={keepBoundaryFocus ? revealKeyboardFocus : undefined}>
      <span className="hn-pagination__range" role="status" aria-atomic="true">{tx("Hiển thị")}{' '}{from}–{to} {variant === 'defects' || variant === 'products' ? '/' : tx("trên")} {filteredTotal === null ? '—' : filteredTotal.toLocaleString(localeForLanguage(language))} {tx(displayUnit)}</span>
      <div className="hn-pagination__controls">
        {pageSizeOptions && onPageSizeChange && <label className="hn-page-size" htmlFor={sizeId}><span className="hn-sr-only">{tx("Số dòng mỗi trang")}</span><BasicSelect id={sizeId} value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))}>{pageSizeOptions.map((size) => <option key={size} value={size}>{size} / {tx('trang')}</option>)}</BasicSelect></label>}
        <Button variant="secondary" disabled={!previousEnabled} onClick={event => changeFromArrow(event.currentTarget, page - 1)} aria-label={tx("Trang trước")}><Icon name="chevron-left" width="16" height="16" /></Button>
        {compactNumbers.map(number => typeof number === 'string'
          ? <span key={number} className="hn-pagination__ellipsis" aria-hidden="true">…</span>
          : <Button key={number} variant={number === page ? 'primary' : 'secondary'} aria-current={number === page ? 'page' : undefined} aria-label={`${tx('Trang')} ${number}`} onClick={() => onPageChange(number)}>{number}</Button>)}
        <Button variant="secondary" disabled={!nextEnabled} onClick={event => changeFromArrow(event.currentTarget, page + 1)} aria-label={tx("Trang sau")}><Icon name="chevron-right" width="16" height="16" /></Button>
      </div>
    </nav>;
  }
  return <nav className="hn-pagination" aria-label={tx("Phân trang bảng")}>
    <span role="status" aria-atomic="true">{tx("Tổng số bản ghi:")}{' '}<strong>{filteredTotal === null ? '—' : filteredTotal.toLocaleString(localeForLanguage(language))}</strong></span>
    {pageSizeOptions && onPageSizeChange && <label className="hn-page-size" htmlFor={sizeId}>{tx("Số dòng / trang")}{' '}<BasicSelect id={sizeId} value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))}>{pageSizeOptions.map((size) => <option key={size} value={size}>{size}</option>)}</BasicSelect>
    </label>}
    <div className="hn-pagination__controls">
      <Button variant="secondary" disabled={!canGoPrevious} onClick={() => onPageChange(page - 1)} aria-label={tx("Trang trước")}>{tx("Trước")}</Button>
      <span className="hn-pagination__current" aria-current="page">{tx('Trang')} {page}</span>
      <Button variant="secondary" disabled={!canGoNext} onClick={() => onPageChange(page + 1)} aria-label={tx("Trang sau")}>{tx("Sau")}</Button>
    </div>
  </nav>;
}
