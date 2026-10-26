/** Toast portals and nested dialogs are independent keyboard surfaces. */
export const modalControlSelector = 'a[href],button,input,select,textarea,[tabindex]';

export function isModalControl(dialog: HTMLDialogElement, element: HTMLElement): boolean {
  return element.isConnected && dialog.contains(element) && element.closest('dialog') === dialog
    && element.getClientRects().length > 0 && !element.matches(':disabled')
    && !element.closest('[hidden],[inert],[aria-hidden="true"],.hn-global-toast-viewport')
    && getComputedStyle(element).visibility === 'visible';
}

export function modalTabStops(dialog: HTMLDialogElement): HTMLElement[] {
  return [...dialog.querySelectorAll<HTMLElement>(modalControlSelector)]
    .filter(element => element.tabIndex >= 0 && isModalControl(dialog, element));
}

export function modalKeyboardOwned(event: { defaultPrevented: boolean; nativeEvent: { isComposing?: boolean; keyCode?: number } }): boolean {
  return event.defaultPrevented || event.nativeEvent.isComposing === true || event.nativeEvent.keyCode === 229;
}
