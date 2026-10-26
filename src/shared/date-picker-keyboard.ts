type ManualDateKeyEvent = {
  key: string;
  defaultPrevented: boolean;
  nativeEvent: { isComposing?: boolean; keyCode?: number };
  preventDefault: () => void;
};

/** Composition confirmation belongs to the input method, not date submission. */
export function handleManualDateKey(event: ManualDateKeyEvent, accept: () => void): void {
  if (event.defaultPrevented || event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229 || event.key !== 'Enter') return;
  event.preventDefault();
  accept();
}
