/** Portaled toast controls are outside the catalog dialog's Tab cycle. */
export function catalogDialogControls(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>('button:enabled, input:enabled, select:enabled')].filter(control =>
    control.getAttribute('aria-disabled') !== 'true'
    && !control.closest('.hn-global-toast-viewport, [inert], [hidden]')
    && control.getClientRects().length > 0
    && getComputedStyle(control).visibility === 'visible');
}
