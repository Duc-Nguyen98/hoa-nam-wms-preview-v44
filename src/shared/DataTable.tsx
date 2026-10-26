import { useUiCopy } from '../i18n/use-ui-copy';
import { isValidElement, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, Key, ReactNode } from 'react';
import { revealControl } from './focus';
import { PageState } from './PageState';
import { Button } from './primitives';
import './page-state.css';

export interface TableColumn<Row> {
  id: string;
  heading: string;
  headingContent?: ReactNode;
  render: (row: Row, index: number) => ReactNode;
  sortKey?: string;
  align?: 'start' | 'end';
  sortLabel?: string;
  sortType?: 'text' | 'number' | 'date';
  kind?: 'data' | 'ordinal' | 'selection' | 'actions';
}

/** Presentation ordinal, independent of the business identity and source ordinal. */
export function ordinalColumn<Row>(page = 1, pageSize = 1): TableColumn<Row> {
  return { id: 'ordinal', kind: 'ordinal', heading: 'STT', render: (_row, index) => (page - 1) * pageSize + index + 1 };
}

export interface TableSort {
  key: string;
  direction: 'asc' | 'desc';
}

export interface DataTableProps<Row> {
  caption: string;
  columns: readonly TableColumn<Row>[];
  rows: readonly Row[];
  rowKey: (row: Row) => Key;
  sort?: TableSort | null;
  onSort?: (key: string) => void;
  emptyContent?: ReactNode;
  /** Owner-supplied empty reason; never inferred from row count. */
  emptyStateKind?: 'empty' | 'no-results';
  onResetFilters?: () => void;
  busy?: boolean;
  /** Accepted query identity: query changes reveal the first row, refresh keeps position. */
  scrollResetKey?: string;
  /** Optional presentation refinements. Query/sort semantics remain caller-owned. */
  appearance?: 'default' | 'refined';
  density?: 'default' | 'compact';
  isRowSelected?: (row: Row) => boolean;
  stickyHeader?: boolean;
  /** Optional left-pinned identity columns; offsets remain feature-owned. */
  stickyColumnIds?: readonly string[];
  captionVisibility?: 'visible' | 'sr-only';
  rowActionAppearance?: 'default' | 'quiet';
  sortIndicatorAppearance?: 'default' | 'quiet';
  stickyEndColumnIds?: readonly string[];
  /** Existing visible guidance may carry the scroll region's compact focus indicator. */
  scrollFocusIndicatorId?: string;
}

/** Controlled presentation only. Query semantics, sort direction and row completeness belong to the controller. */
export function DataTable<Row>({ caption, columns, rows, rowKey, sort, onSort, emptyContent, emptyStateKind = 'empty', onResetFilters, busy = false, scrollResetKey, appearance = 'default', density = 'default', rowActionAppearance, sortIndicatorAppearance, isRowSelected, stickyHeader = false, stickyColumnIds = [], stickyEndColumnIds = [], captionVisibility = 'visible', scrollFocusIndicatorId }: DataTableProps<Row>) {
  const tx = useUiCopy();
  const captionId = useId();
  const scrollRef = useRef<HTMLDivElement>(null);
  const focusFrame = useRef<number | null>(null);
  const lastFocused = useRef<HTMLElement | null>(null);
  const [stickyOffsets, setStickyOffsets] = useState<{ start: Readonly<Record<string, number>>; end: Readonly<Record<string, number>> }>({ start: {}, end: {} });
  const columnIdentity = JSON.stringify(columns.map(column => column.id));
  const stickyIdentity = JSON.stringify(stickyColumnIds);
  const stickyEndIdentity = JSON.stringify(stickyEndColumnIds);
  const pinnedIds = columns.map(column => column.id).filter(id => stickyOffsets.start[id] !== undefined);
  const pinnedEndIds = columns.map(column => column.id).filter(id => stickyOffsets.end[id] !== undefined);
  useLayoutEffect(() => {
    const region = scrollRef.current;
    if (!region) return;
    const requested = new Set<string>(JSON.parse(stickyIdentity));
    const requestedEnd = new Set<string>(JSON.parse(stickyEndIdentity));
    if (!requested.size && !requestedEnd.size) {
      setStickyOffsets(current => Object.keys(current.start).length || Object.keys(current.end).length ? { start: {}, end: {} } : current);
      return;
    }
    const headings = [...region.querySelectorAll<HTMLTableCellElement>('thead th[data-column]')];
    let frame: number | null = null;
    const measure = () => {
      const next: Record<string, number> = {}, nextEnd: Record<string, number> = {};
      let left = 0, right = 0;
      for (const heading of headings) {
        const id = heading.dataset.column!, width = heading.getBoundingClientRect().width;
        if (!requested.has(id) || !heading.getClientRects().length || width <= 0) continue;
        next[id] = left; left += width;
      }
      for (const heading of [...headings].reverse()) {
        const id = heading.dataset.column!, width = heading.getBoundingClientRect().width;
        if (!requestedEnd.has(id) || requested.has(id) || !heading.getClientRects().length || width <= 0) continue;
        nextEnd[id] = right; right += width;
      }
      // Leave enough room for the actual focused middle control and its ring.
      let requiredGap = 56;
      const active = document.activeElement;
      if (right > 0 && active instanceof HTMLElement && active.closest('.hn-table-scroll') === region) {
        const id = active.closest<HTMLElement>('th[data-column],td[data-column]')?.dataset.column;
        if (id && next[id] === undefined && nextEnd[id] === undefined && active.getClientRects().length) requiredGap = Math.max(requiredGap, active.getBoundingClientRect().width + 12);
      }
      const safe = region.clientWidth - left - right >= requiredGap ? { start: next, end: nextEnd } : { start: {}, end: {} };
      setStickyOffsets(current => {
        const same = (a: Readonly<Record<string, number>>, b: Readonly<Record<string, number>>) => Object.keys(a).length === Object.keys(b).length && Object.keys(a).every(id => a[id] === b[id]);
        return same(safe.start, current.start) && same(safe.end, current.end) ? current : safe;
      });
    };
    const schedule = () => { if (frame !== null) cancelAnimationFrame(frame); frame = requestAnimationFrame(() => { frame = null; measure(); }); };
    const observer = new ResizeObserver(schedule); observer.observe(region);
    if (region.firstElementChild) observer.observe(region.firstElementChild);
    headings.forEach(heading => observer.observe(heading));
    window.addEventListener('resize', schedule);
    if (requestedEnd.size) { region.addEventListener('focusin', schedule); region.addEventListener('focusout', schedule); }
    measure();
    return () => { observer.disconnect(); window.removeEventListener('resize', schedule); region.removeEventListener('focusin', schedule); region.removeEventListener('focusout', schedule); if (frame !== null) cancelAnimationFrame(frame); };
  }, [columnIdentity, stickyIdentity, stickyEndIdentity]);
  useLayoutEffect(() => {
    if (!stickyColumnIds.length && !stickyEndColumnIds.length) return;
    const target = document.activeElement;
    if (!document.querySelector('dialog[open]') && target instanceof HTMLElement && scrollRef.current?.contains(target)) revealControl(target);
  }, [stickyOffsets, stickyIdentity, stickyEndIdentity]);
  const stickyCellProps = (id: string) => stickyOffsets.start[id] !== undefined ? {
    'data-sticky-column': 'left', 'data-sticky-edge': id === pinnedIds.at(-1) ? 'end' : undefined,
    style: { '--hn-table-sticky-left': `${stickyOffsets.start[id]}px` } as CSSProperties,
  } : stickyOffsets.end[id] !== undefined ? {
    'data-sticky-column': 'right', 'data-sticky-edge': id === pinnedEndIds[0] ? 'start' : undefined,
    style: { '--hn-table-sticky-right': `${stickyOffsets.end[id]}px` } as CSSProperties,
  } : {};
  useLayoutEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = 0; }, [scrollResetKey]);
  useEffect(() => () => { if (focusFrame.current !== null) cancelAnimationFrame(focusFrame.current); }, []);
  useLayoutEffect(() => {
    const region = scrollRef.current;
    if (!region) return;
    let frame: number | null = null;
    const schedule = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        frame = null;
        if (document.querySelector('dialog[open]')) return;
        const active = document.activeElement, previous = lastFocused.current;
        // A responsive merged column can hide its focused sort button. Move to
        // the first visible heading without activating a sort or losing Tab order.
        if (previous && region.contains(previous) && !previous.getClientRects().length &&
          (active === previous || active === document.body || active === document.documentElement)) {
          const fallback = [...region.querySelectorAll<HTMLElement>('thead button')].find(e => e.getClientRects().length) ?? region;
          fallback.focus({ preventScroll: true }); revealControl(fallback);
        } else if (active instanceof HTMLElement && region.contains(active)) revealControl(active);
      });
    };
    const observer = new ResizeObserver(schedule); observer.observe(region);
    if (region.firstElementChild) observer.observe(region.firstElementChild);
    window.addEventListener('resize', schedule);
    return () => { observer.disconnect(); window.removeEventListener('resize', schedule); if (frame !== null) cancelAnimationFrame(frame); };
  }, []);
  const revealFocusedControl = () => {
    if (document.activeElement instanceof HTMLElement) lastFocused.current = document.activeElement;
    if (focusFrame.current !== null) cancelAnimationFrame(focusFrame.current);
    // Native focus scrolling does not account for sticky table headings.
    focusFrame.current = requestAnimationFrame(() => {
      const region = scrollRef.current;
      const target = document.activeElement;
      if (region && target instanceof HTMLElement && region.contains(target)) revealControl(target);
    });
  };
  return <div ref={scrollRef} className="hn-table-scroll" role="region" aria-labelledby={captionId} aria-describedby={scrollFocusIndicatorId} data-focus-indicator={scrollFocusIndicatorId} tabIndex={0} onFocusCapture={revealFocusedControl}>
    <table hidden={rows.length === 0} className="hn-table" data-ui-contract="s05" aria-busy={busy} data-appearance={appearance === 'refined' ? 'refined' : undefined} data-density={density === 'compact' ? density : undefined} data-row-action-appearance={rowActionAppearance === 'quiet' ? rowActionAppearance : undefined} data-sort-indicator-appearance={sortIndicatorAppearance === 'quiet' ? sortIndicatorAppearance : undefined} data-sticky-columns={stickyColumnIds.length || stickyEndColumnIds.length ? pinnedIds.length || pinnedEndIds.length ? 'active' : 'suspended' : undefined} data-sticky-header={stickyHeader ? 'true' : undefined}>
      <caption id={captionId} data-caption-visibility={captionVisibility === 'sr-only' ? 'sr-only' : undefined}>{tx(caption)}</caption>
      <thead><tr>{columns.map((column) => {
        const direction = column.sortKey && sort?.key === column.sortKey ? sort.direction : null;
        const sortable = Boolean(column.sortKey && onSort && (!column.kind || column.kind === 'data') && !['ordinal', 'action', 'actions', 'checkbox', 'selection'].includes(column.id));
        const sortDescriptionId = `${captionId}-${column.id}-sort`;
        const orderLabels = column.sortType === 'number' ? [tx("nhỏ đến lớn"), tx("lớn đến nhỏ")] : column.sortType === 'date' ? [tx("cũ đến mới"), tx("mới đến cũ")] : [tx("A đến Z"), tx("Z đến A")];
        return <th key={column.id} data-column={column.id} {...stickyCellProps(column.id)} scope="col" className={column.align === 'end' ? 'hn-align-end' : undefined} aria-sort={sortable ? (direction === 'asc' ? 'ascending' : direction === 'desc' ? 'descending' : 'none') : undefined}>
          {sortable ? <><button type="button" className="hn-table-sort" onClick={() => onSort?.(column.sortKey!)} aria-label={`${tx('Sắp xếp theo')} ${tx(column.sortLabel ?? column.heading)}`} aria-describedby={sortDescriptionId}>
            {column.headingContent && <span className="hn-sr-only">{tx("Sắp xếp theo")}{' '}</span>}
            {column.headingContent ?? tx(column.heading)}<span aria-hidden="true">{direction === 'asc' ? '↑' : direction === 'desc' ? '↓' : '↕'}</span>
          </button><span className="hn-sr-only" id={sortDescriptionId}>{direction ? `${tx('Đang xếp')} ${orderLabels[direction === 'asc' ? 0 : 1]}. ` : ''}{tx("Kích hoạt để xếp")}{' '}{orderLabels[direction === 'asc' ? 1 : 0]}.</span></> : column.headingContent ?? tx(column.heading)}
        </th>;
      })}</tr></thead>
      <tbody>{rows.map((row, index) => <tr key={rowKey(row)} data-selected={isRowSelected?.(row) || undefined}>{columns.map((column) => <td key={column.id} data-column={column.id} {...stickyCellProps(column.id)} className={column.align === 'end' ? 'hn-align-end' : undefined}>{column.render(row, index)}</td>)}</tr>)}</tbody>
    </table>
    {rows.length === 0 && <div className="hn-table-empty">{busy ? <PageState kind="loading"/> : isValidElement(emptyContent) && typeof emptyContent.type !== 'string' ? emptyContent : <PageState kind={emptyStateKind} description={emptyContent ?? undefined} action={onResetFilters ? <Button onClick={onResetFilters}>{tx("Đặt lại bộ lọc")}</Button> : undefined}/>}</div>}
  </div>;
}
