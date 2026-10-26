/** Copy the complete value; always remove the fallback field and restore focus. */
export async function copyText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const origin = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const field = document.createElement('textarea');
  field.value = value;
  field.readOnly = true;
  field.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
  // Keep the fallback inside the active modal so native modal inertness allows selection.
  (document.querySelector('dialog[open]') ?? document.body).appendChild(field);
  try {
    field.select();
    if (!document.execCommand('copy')) throw new Error('COPY_FAILED');
  } finally {
    field.remove();
    if (origin?.isConnected) origin.focus({ preventScroll: true });
  }
}
