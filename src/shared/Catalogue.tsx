import { formatDeclaredPercentage } from '../i18n/format-declared-percentage';
import { useShellPreferences, localeForLanguage } from './shell-preferences';
import { useUiCopy } from '../i18n/use-ui-copy';
import { Children, useLayoutEffect, useRef, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { Button } from './primitives';
import { Icon } from './Icon';
import { FilterInput } from './controls';
import { revealControl } from './focus';
import { RefreshButton } from './RefreshButton';
import './wave4-catalogue.css';

export function CatalogueHeader({ title, breadcrumb, description, action, onAction, describedBy }: {
  title: string; breadcrumb: string; description: string; action?: string; onAction?: () => void; describedBy?: string;
}) {
  const tx = useUiCopy();
  return <header className="hn-page-heading">
    <div><p className="hn-breadcrumb">{tx("Danh mục")}{' '}<span>/</span> {tx(breadcrumb)}</p><h1>{tx(title)}</h1><p className="hn-page-description">{tx(description)}</p></div>
    <div className="hn-page-actions"><span className="hn-page-warehouse"><Icon name="warehouse" width={18} height={18} />{tx('Kho Hoa Nam')}</span>{action && onAction && <Button aria-describedby={describedBy} onClick={onAction}><Icon name="plus" />{tx(action)}</Button>}</div>
    <NoticeSlot name="heading" />
  </header>;
}

/** Foundation heading with screen-owned actions and optional parent label. */
export function CataloguePageHeader({ title, breadcrumb, parentLabel = 'Danh mục', description, actions, className, appearance }: {
  title: string; breadcrumb: string; parentLabel?: string; description?: ReactNode; actions?: ReactNode;
  className?: string; appearance?: 'default' | 'compact' | 'worklist';
}) {
  const tx = useUiCopy();
  return <header className={['hn-page-heading', className].filter(Boolean).join(' ')} data-appearance={appearance === 'compact' || appearance === 'worklist' ? appearance : undefined}>
    <div><p className="hn-breadcrumb">{tx(parentLabel)} <span>/</span> {tx(breadcrumb)}</p><h1>{tx(title)}</h1>{description !== undefined && <p className="hn-page-description">{tx(description)}</p>}</div>
    {actions && <div className="hn-page-actions">{actions}</div>}
    <NoticeSlot name="heading" />
  </header>;
}

export function NoticeSlot({ name }: { name: 'heading' | 'query' | 'table' | 'pagination' }) {
  const tx = useUiCopy();
  return <div className="hn-notice-slot" data-feedback-slot={name} />;
}

export function CatalogueListHeader({ id, title, count, density }: { id: string; title: string; count?: string; density?: 'default' | 'compact' }) {
  const tx = useUiCopy();
  return <div className="hn-list-heading" data-density={density === 'compact' ? density : undefined}><h2 id={id}>{tx(title)}</h2>{count && <span className="hn-count">{count}</span>}</div>;
}

/** Shared list heading for screens that expose snapshot and source scope. */
export function CatalogueListHeading({ id, title, count, snapshot, scope, className }: {
  id: string; title: string; count?: string; snapshot?: string; scope?: ReactNode; className?: string;
}) {
  const tx = useUiCopy();
  return <div className={['hn-catalogue-list-heading', className].filter(Boolean).join(' ')}>
    <CatalogueListHeader id={id} title={tx(title)} count={count} />
    {(snapshot || scope) && <div className="hn-catalogue-list-meta">
      {snapshot && <span className="hn-catalogue-snapshot"><Icon name="calendar" size={14} />{tx("Mốc dữ liệu")}{' '}{snapshot}</span>}
      {scope && <span role="status" aria-live="polite" aria-atomic="true">{tx(scope)}</span>}
    </div>}
  </div>;
}

/** Accepted query chips; the owner supplies removal semantics and focus policy. */
export function CatalogueActiveFilters<Key extends string>({ items, onRemove, className }: {
  items: readonly { key: Key; label: string }[]; onRemove: (key: Key) => void; className?: string;
}) {
  const tx = useUiCopy();
  if (!items.length) return null;
  return <div className={['hn-active-filters', className].filter(Boolean).join(' ')} role="group" aria-label={tx("Điều kiện đang áp dụng")}>
    {items.map(item => <Button key={item.key} variant="secondary" aria-label={tx('Bỏ điều kiện {label}', { label: item.label })} onClick={() => onRemove(item.key)}><span className="hn-active-filter-label" title={item.label}>{item.label}</span><Icon name="close" size={16} /></Button>)}
  </div>;
}

export function CatalogueSummary({ label, children, columns, density, appearance, alignRows }: { label: string; children: ReactNode; columns?: 2 | 3 | 4; density?: 'default' | 'compact'; appearance?: 'default' | 'inline' | 'cards'; alignRows?: boolean }) {
  const tx = useUiCopy();
  return <section className="hn-catalogue-summary" data-columns={columns === 2 || columns === 4 ? columns : undefined} data-density={density === 'compact' ? density : undefined} data-appearance={appearance === 'inline' || appearance === 'cards' ? appearance : undefined} data-align-rows={appearance === 'inline' && columns === 4 && alignRows ? 'true' : undefined} aria-label={tx(label)}>{children}</section>;
}

export function SummaryMetric({ label, value, detail, icon }: { label: string; value: ReactNode; detail?: ReactNode; icon?: Parameters<typeof Icon>[0]['name'] }) {
  const tx = useUiCopy();
  return <div className="hn-summary-metric"><div><h2>{tx(label)}</h2><p><strong>{value}</strong>{detail && <span>{detail}</span>}</p></div>{icon && <span className="hn-summary-icon"><Icon name={icon} width={24} height={24}/></span>}</div>;
}

export function SummaryDistribution({ title, active, inactive, activePercentage, inactivePercentage, activeLabel = 'Đang hoạt động' }: {
  title: string; active: number; inactive: number; activePercentage: string; inactivePercentage: string; activeLabel?: string;
}) {
  const tx = useUiCopy();
  const { language } = useShellPreferences();
  activePercentage = formatDeclaredPercentage(activePercentage, language);
  inactivePercentage = formatDeclaredPercentage(inactivePercentage, language);
  return <div className="hn-summary-distribution"><h2>{tx(title)}</h2><div className="hn-distribution-bar" role="img" aria-label={`${tx(activeLabel)} ${activePercentage}; ${tx('Ngừng sử dụng')} ${inactivePercentage}`}><span style={{ flex: active }} /><span style={{ flex: inactive }} /></div><div className="hn-distribution-labels"><span>{tx(activeLabel)} <b>{active.toLocaleString(localeForLanguage(language))} · {activePercentage}</b></span><span>{tx("Ngừng sử dụng")}{' '}<b>{inactive.toLocaleString(localeForLanguage(language))} · {inactivePercentage}</b></span></div></div>;
}

export interface CatalogueToolbarProps {
  id: string; label: string; searchLabel: string; searchHint: string; searchValue: string; onSearchChange: (value: string) => void;
  onSubmit?: (event: FormEvent) => void; onReset: () => void; onRefresh?: () => void; busy?: boolean; draftChanged?: boolean; applyMode?: 'submit' | 'immediate'; acceptedLabel?: string; children: ReactNode;
  searchPlaceholder?: string;
  /** Keep the hint in aria-describedby without allocating a visible helper row. */
  searchHintMode?: 'visible' | 'sr-only';
  /** undefined preserves the accepted label; null hides immediate-mode context in lookup/worklist layouts. */
  queryContext?: ReactNode;
  /** Worklist keeps trailing controls visible while optional filter fields collapse. */
  layout?: 'default' | 'search-first' | 'lookup' | 'worklist';
  /** Worklist only. Callers supply the existing labeled controls and their behavior. */
  trailingControls?: ReactNode;
  /** Worklist with filters only. Always keeps fields behind the existing disclosure at every width. */
  filterDisclosure?: 'responsive' | 'always';
  /** Worklist wide layout only. Compact sizing reserves more space for search. */
  filterSizing?: 'default' | 'compact';
}

/** Controllers own reads/debounce. Null/empty children opt into search-only;
 * callers with filter children retain the existing disclosure and layout. */
export function CatalogueToolbar({ id, label, searchLabel, searchHint, searchValue, onSearchChange, onSubmit, onReset, onRefresh, busy = false, draftChanged = false, applyMode = onSubmit ? 'submit' : 'immediate', acceptedLabel = 'Tất cả', searchPlaceholder = 'Nhập nội dung tìm kiếm…', searchHintMode = 'visible', queryContext, layout, trailingControls, filterDisclosure = 'responsive', filterSizing, children }: CatalogueToolbarProps) {
  const tx = useUiCopy();
  const hasFilters = Children.toArray(children).length > 0;
  // Lookup is a presentation opt-in for search-only callers, never hides filters.
  const lookup = layout === 'lookup' && !hasFilters;
  const worklist = layout === 'worklist';
  const alwaysDisclosure = worklist && hasFilters && filterDisclosure === 'always';
  const hasTrailing = worklist && Children.toArray(trailingControls).length > 0;
  const form = useRef<HTMLFormElement>(null), fields = useRef<HTMLDivElement>(null);
  const composing = useRef(false);
  const [compositionValue, setCompositionValue] = useState<string | null>(null);
  const immediate = applyMode === 'immediate';
  const [compact, setCompact] = useState(alwaysDisclosure), [open, setOpen] = useState(false);
  const [wrapControls, setWrapControls] = useState(false);
  const frame = useRef<number | null>(null);
  useLayoutEffect(() => {
    const element = form.current;
    if (!element) return;
    const coarse = matchMedia('(pointer: coarse)');
    let wasCompact = false;
    const measure = () => {
      const next = alwaysDisclosure || element.clientWidth < 1100 || (!worklist && coarse.matches);
      if (worklist) setWrapControls(element.clientWidth < 700);
      const active = document.activeElement;
      if (next && !wasCompact && fields.current?.contains(active)) setOpen(true);
      if (!next && active === element.querySelector('.hn-filter-toggle')) element.querySelector<HTMLInputElement>('input')?.focus({ preventScroll: true });
      // The close button is removed in the wide layout. Transfer its focus while
      // the old node still exists so React cannot leave focus on the document.
      if (!next && active === element.querySelector('.hn-filter-close')) fields.current?.querySelector<HTMLSelectElement>('select')?.focus({ preventScroll: true });
      wasCompact = next; setCompact(next);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = requestAnimationFrame(() => {
        const focused = document.activeElement;
        if (focused instanceof HTMLElement && element.contains(focused) && !document.querySelector('dialog[open]')) revealControl(focused);
      });
    };
    const observer = new ResizeObserver(measure); observer.observe(element); coarse.addEventListener('change', measure); measure();
    return () => { observer.disconnect(); coarse.removeEventListener('change', measure); if (frame.current !== null) cancelAnimationFrame(frame.current); };
  }, [worklist, alwaysDisclosure]);
  function closeFields() {
    setOpen(false);
    const button = form.current?.querySelector<HTMLButtonElement>('.hn-filter-toggle');
    button?.focus({ preventScroll: true }); if (button) revealControl(button);
  }
  const filterToggle = hasFilters && <Button key="toggle" variant="secondary" className="hn-filter-toggle" hidden={!compact} aria-label={tx("Bộ lọc")} aria-expanded={open} aria-controls={`${id}-fields`} aria-describedby={!immediate && draftChanged ? `${id}-draft` : undefined} onClick={() => setOpen(value => !value)}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4"/></svg>{tx("Bộ lọc")}{!immediate && draftChanged && <span className="hn-draft-dot" aria-hidden="true"/>}<Icon name="chevron-down" width={16} height={16}/></Button>;
  const filterFields = hasFilters && <div key="fields" ref={fields} className="hn-catalogue-fields" id={`${id}-fields`} hidden={compact && !open} onKeyDown={event => { if (event.key === 'Escape' && !event.nativeEvent.isComposing && compact && !document.querySelector('.hn-notice:not([data-suspended="true"])')) { event.preventDefault(); event.stopPropagation(); closeFields(); } }}>{children}{compact && <Button variant="ghost" iconOnly={worklist} className="hn-filter-close" aria-label={tx("Đóng bộ lọc")} onClick={closeFields}><Icon name="close" width={18} height={18}/></Button>}</div>;
  const actions = <div key="actions" className="hn-catalogue-actions">{!immediate && <Button type="submit">{tx("Áp dụng")}</Button>}<Button variant="ghost" onClick={onReset}>{lookup && <Icon name="refresh" width={18} height={18} />}{tx("Đặt lại")}</Button>{onRefresh && <RefreshButton busy={busy} onRefresh={onRefresh} />}</div>;
  // Stable sibling keys retain the actual controls on resize. Worklist's DOM
  // order follows its rows, including Reset before an expanded compact panel.
  const worklistControls = [hasTrailing && <div key="trailing" className="hn-catalogue-trailing">{trailingControls}</div>, filterToggle, ...(compact ? [actions, filterFields] : [filterFields, actions])];
  const searchControl = <div className="hn-catalogue-search"><label htmlFor={`${id}-search`} className={lookup || worklist ? 'hn-sr-only' : undefined}>{tx(searchLabel)}</label><FilterInput id={`${id}-search`} label={tx(searchLabel)} aria-label={tx(searchLabel)} aria-describedby={`${id}-search-help`} type="search" placeholder={tx(searchPlaceholder)} value={compositionValue ?? searchValue} onChange={event => {
      if (immediate && composing.current) setCompositionValue(event.target.value);
      else onSearchChange(event.target.value);
    }} onCompositionStart={event => { composing.current = true; if (immediate) setCompositionValue(event.currentTarget.value); }} onCompositionEnd={event => {
      composing.current = false; setCompositionValue(null); if (immediate) onSearchChange(event.currentTarget.value);
    }} onBlur={event => {
      if (immediate && composing.current) onSearchChange(event.currentTarget.value);
      composing.current = false; setCompositionValue(null);
    }} onKeyDown={event => { if (event.key === 'Enter' && (composing.current || event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229)) event.preventDefault(); }} /><p id={`${id}-search-help`} className={searchHintMode === 'sr-only' ? 'hn-sr-only' : undefined}>{tx(searchHint)}</p></div>;
  const queryControl = ((!worklist && !lookup) || queryContext !== null || !immediate) && <div className="hn-query-context">{queryContext === undefined ? <span>{tx("Đang hiển thị:")}{' '}<strong>{tx(acceptedLabel)}</strong></span> : queryContext}{!immediate && <span id={`${id}-draft`} className="hn-draft-note" role="status" aria-atomic="true">{draftChanged ? tx('Có thay đổi chưa áp dụng.') : ''}</span>}</div>;
  const formProps = {
    ref: form, className: 'hn-catalogue-toolbar', 'aria-label': tx(label),
    'data-layout': worklist ? 'worklist' : lookup ? 'lookup' : layout === 'search-first' ? layout : undefined,
    'data-filter-sizing': worklist && filterSizing === 'compact' ? filterSizing : undefined,
    'data-filter-disclosure': alwaysDisclosure ? 'always' : undefined,
    'data-has-filters': hasFilters ? undefined : 'false', 'data-has-trailing': worklist ? hasTrailing : undefined,
    'data-wrap-controls': worklist ? wrapControls : undefined, 'data-compact': compact, 'data-apply-mode': applyMode,
    onSubmit: (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!composing.current && !immediate) onSubmit?.(event); },
  };
  // Keep the original six sibling slots for legacy callers, including React's
  // generated IDs. Only worklist opts into the keyed responsive composition.
  return worklist
    ? <form {...formProps}>{searchControl}{worklistControls}{queryControl}<NoticeSlot name="query" /></form>
    : <form {...formProps}>{searchControl}{filterToggle}{filterFields}{actions}{queryControl}<NoticeSlot name="query" /></form>;
}
