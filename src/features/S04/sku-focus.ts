/** Reveal the whole control, including the clipping table and sticky app header. */
export function revealSkuControl(target: HTMLElement) {
  const region = target.closest<HTMLElement>('.sku-table .hn-table-scroll');
  if (region) {
    const bounds = region.getBoundingClientRect();
    const control = target.getBoundingClientRect();
    const left = bounds.left + 8;
    const right = bounds.left + region.clientWidth - 8;
    if (control.right > right) region.scrollLeft += control.right - right;
    else if (control.left < left) region.scrollLeft -= left - control.left;
    const headings = Array.from(region.querySelectorAll('thead th')).filter(cell => cell.getClientRects().length);
    const top = Math.max(bounds.top, ...headings.map(cell => cell.getBoundingClientRect().bottom)) + 6;
    if (control.top < top) region.scrollTop -= top - control.top;
    else if (control.bottom > bounds.top + region.clientHeight - 6) region.scrollTop += control.bottom - bounds.top - region.clientHeight + 6;
  }
  const box = target.getBoundingClientRect();
  const header = document.querySelector('.hn-header')?.getBoundingClientRect();
  const top = Math.max(8, (header?.bottom ?? 0) + 12);
  if (box.top < top) window.scrollBy({ top: box.top - top, behavior: 'instant' });
  else if (box.bottom > innerHeight - 12) window.scrollBy({ top: box.bottom - innerHeight + 12, behavior: 'instant' });
}

export function restoreSkuFocus(origin: HTMLElement | null) {
  const visible = origin?.isConnected && origin.matches('button,input,select,textarea,a[href],[tabindex]') && origin.getClientRects().length && !origin.matches(':disabled') && !origin.closest('[inert], [hidden]') && getComputedStyle(origin).visibility !== 'hidden';
  const filterTrigger = document.querySelector<HTMLElement>('.sku-filter-toggle:not([hidden])');
  const target = visible ? origin : origin?.closest('#sku-filter-panel') && filterTrigger ? filterTrigger : document.querySelector<HTMLElement>('.sku-refresh');
  if (!target) return;
  target.focus({ preventScroll: true });
  revealSkuControl(target);
}

