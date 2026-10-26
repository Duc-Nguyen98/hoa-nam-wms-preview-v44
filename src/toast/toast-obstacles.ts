import type { ToastObstacle } from './toast-placement';

export const TOAST_CONTROL_SELECTOR = 'button,a[href],input,select,textarea,[role="button"],[tabindex]:not([tabindex="-1"])';
const intersects = (a: ToastObstacle, b: ToastObstacle) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

/** Retain every exposed fragment when a pinned table cell covers part of a control. */
export function subtractToastObstacle(a: ToastObstacle, b: ToastObstacle): ToastObstacle[] {
  if (a.right <= a.left || a.bottom <= a.top) return [];
  if (b.right <= b.left || b.bottom <= b.top) return [a];
  if (!intersects(a, b)) return [a];
  const left = Math.max(a.left, b.left), right = Math.min(a.right, b.right);
  return [
    { left: a.left, right: a.right, top: a.top, bottom: Math.max(a.top, b.top) },
    { left: a.left, right: a.right, top: Math.min(a.bottom, b.bottom), bottom: a.bottom },
    { left: a.left, right: left, top: Math.max(a.top, b.top), bottom: Math.min(a.bottom, b.bottom) },
    { left: right, right: a.right, top: Math.max(a.top, b.top), bottom: Math.min(a.bottom, b.bottom) },
  ].filter(r => r.right > r.left && r.bottom > r.top);
}

function clippedRect(element: HTMLElement, box: ToastObstacle = element.getBoundingClientRect()): ToastObstacle | null {
  const rect = { left: Math.max(0, box.left), right: Math.min(innerWidth, box.right), top: Math.max(0, box.top), bottom: Math.min(innerHeight, box.bottom) };
  for (let parent = element.parentElement; parent; parent = parent.parentElement) {
    const style = getComputedStyle(parent), bounds = parent.getBoundingClientRect();
    if (/(auto|scroll|hidden|clip)/.test(style.overflowX)) {
      rect.left = Math.max(rect.left, bounds.left + parent.clientLeft);
      rect.right = Math.min(rect.right, bounds.left + parent.clientLeft + parent.clientWidth);
    }
    if (/(auto|scroll|hidden|clip)/.test(style.overflowY)) {
      rect.top = Math.max(rect.top, bounds.top + parent.clientTop);
      rect.bottom = Math.min(rect.bottom, bounds.top + parent.clientTop + parent.clientHeight);
    }
  }
  return rect.right > rect.left && rect.bottom > rect.top ? rect : null;
}

/** Protect controls, table scrollbars and active focus outlines, not passive table data. */
export function collectToastObstacles(exclude: HTMLElement | null, include: (control: HTMLElement) => boolean = () => true): ToastObstacle[] {
  const obstacles: ToastObstacle[] = [];
  for (const control of document.querySelectorAll<HTMLElement>(TOAST_CONTROL_SELECTOR)) {
    if (exclude?.contains(control) || !include(control) || !control.getClientRects().length || getComputedStyle(control).visibility !== 'visible') continue;
    const rect = clippedRect(control);
    if (!rect) continue;
    const focused = control === document.activeElement && control.matches(':focus-visible');
    if (control.matches('.hn-table-scroll[tabindex]')) {
      // The shared scroll region is not a button occupying its entire data rectangle.
      const box = control.getBoundingClientRect();
      const bottom = box.top + control.clientTop + control.clientHeight;
      const right = box.left + control.clientLeft + control.clientWidth;
      if (box.bottom - bottom > 2) obstacles.push({ ...rect, top: Math.max(rect.top, bottom) });
      if (box.right - right > 2) obstacles.push({ ...rect, left: Math.max(rect.left, right) });
      if (focused) {
        const style = getComputedStyle(control);
        const indicatorId = control.dataset.focusIndicator;
        const indicator = indicatorId ? document.getElementById(indicatorId) : null;
        if (indicator?.getClientRects().length) {
          const indicatorStyle = getComputedStyle(indicator);
          const margin = Math.max(0, (parseFloat(indicatorStyle.outlineWidth) || 0) + (parseFloat(indicatorStyle.outlineOffset) || 0));
          const bounds = indicator.getBoundingClientRect();
          const exposed = clippedRect(indicator, { left: bounds.left - margin, right: bounds.right + margin, top: bounds.top - margin, bottom: bounds.bottom + margin });
          if (exposed) obstacles.push(exposed);
        }
        // Protect the real indicator, not a perimeter removed by the component.
        if (style.outlineStyle === 'none' || style.outlineStyle === 'hidden') continue;
        const offset = parseFloat(style.outlineOffset) || 0;
        const outset = Math.max(0, (parseFloat(style.outlineWidth) || 0) + offset);
        const inset = Math.max(3, -offset);
        const outer = { left: box.left - outset, right: box.right + outset, top: box.top - outset, bottom: box.bottom + outset };
        for (const edge of [
          { ...outer, bottom: box.top + inset }, { ...outer, top: box.bottom - inset },
          { ...outer, right: box.left + inset }, { ...outer, left: box.right - inset },
        ]) {
          const exposed = clippedRect(control, edge);
          if (exposed) obstacles.push(exposed);
        }
      }
      continue;
    }
    let fragments = [rect];
    const cell = control.closest<HTMLElement>('th[data-column],td[data-column]');
    if (!focused && cell?.closest('.hn-table-scroll') && cell.parentElement) {
      const layer = Number.parseInt(getComputedStyle(cell).zIndex, 10) || 0;
      for (const sibling of cell.parentElement.children) {
        if (!(sibling instanceof HTMLElement) || sibling === cell || !sibling.matches('[data-sticky-column]')) continue;
        const style = getComputedStyle(sibling);
        // Only the known opaque, higher pinned sibling can subtract hidden fragments.
        if (style.visibility !== 'visible' || Number(style.opacity) !== 1 || !/^rgb\([\d,\s]+\)$/.test(style.backgroundColor) || (Number.parseInt(style.zIndex, 10) || 0) <= layer) continue;
        const cover = clippedRect(sibling);
        if (cover) fragments = fragments.flatMap(fragment => subtractToastObstacle(fragment, cover));
      }
    }
    if (focused) {
      const style = getComputedStyle(control);
      const margin = style.outlineStyle !== 'none' && style.outlineStyle !== 'hidden'
        ? Math.max(0, (parseFloat(style.outlineWidth) || 0) + (parseFloat(style.outlineOffset) || 0)) : 0;
      // A compact exterior gap must still clear the whole visible focus ring.
      obstacles.push(...fragments.map(r => ({ left: r.left - margin, right: r.right + margin, top: r.top - margin, bottom: r.bottom + margin })));
    } else obstacles.push(...fragments);
  }
  return obstacles.filter(rect => rect.right > rect.left && rect.bottom > rect.top);
}
