import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Icon } from './Icon';
import { Button } from './primitives';
import type { ShellDestination } from './s00-navigation';
import { useShellUi } from './shell-locale';
import { SHORTCUT_LIMIT } from './shortcut-model';
import { acquireBodyScrollLock } from './body-scroll-lock';
import './shortcut-settings.css';

function revealChoice(target: HTMLElement) {
  const scrollport = target.closest<HTMLElement>('.hn-shortcut-settings__body');
  if (!scrollport) return;
  const bounds = scrollport.getBoundingClientRect();
  const choice = target.closest('label')?.getBoundingClientRect() ?? target.getBoundingClientRect();
  const box = choice.height <= bounds.height - 12 ? choice : target.getBoundingClientRect();
  if (box.top < bounds.top + 6) scrollport.scrollTop -= bounds.top + 6 - box.top;
  else if (box.bottom > bounds.bottom - 6) scrollport.scrollTop += box.bottom - bounds.bottom + 6;
}

export function ShortcutSettings({ open, destinations, selectedKeys, onCancel, onSave }: {
  open: boolean;
  destinations: readonly ShellDestination[];
  selectedKeys: readonly string[];
  onCancel: () => void;
  onSave: (keys: readonly string[]) => void;
}) {
  const { t, language } = useShellUi();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const pointerOnBackdrop = useRef(false);
  const [draft, setDraft] = useState<readonly string[]>([]);
  const full = draft.length >= SHORTCUT_LIMIT;
  const dirty = draft.length !== selectedKeys.length || draft.some((key, index) => key !== selectedKeys[index]);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setDraft([...selectedKeys]); pointerOnBackdrop.current = false;
      dialog.showModal(); closeRef.current?.focus();
      const body = dialog.querySelector<HTMLElement>('.hn-shortcut-settings__body');
      if (body) body.scrollTop = 0;
    } else if (!open && dialog.open) dialog.close();
  }, [open, selectedKeys]);
  useEffect(() => {
    if (!open) return;
    const releaseScrollLock = acquireBodyScrollLock();
    const observer = new ResizeObserver(() => {
      const target = document.activeElement;
      if (target instanceof HTMLElement && dialogRef.current?.contains(target)) revealChoice(target);
    });
    const body = dialogRef.current?.querySelector('.hn-shortcut-settings__body');
    if (body) observer.observe(body);
    return () => { observer.disconnect(); releaseScrollLock(); };
  }, [open]);

  function change(key: string, checked: boolean) {
    setDraft(current => checked ? current.includes(key) || current.length >= SHORTCUT_LIMIT ? current : [...current, key] : current.filter(item => item !== key));
  }
  function keepFocus(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== 'Tab' || event.altKey || event.ctrlKey || event.metaKey) return;
    const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled)'));
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }

  return <dialog ref={dialogRef} id="hn-shortcut-settings" className="hn-shell-dialog hn-shortcut-settings" lang={language}
    aria-labelledby="hn-shortcut-settings-title" aria-describedby="hn-shortcut-settings-description" onKeyDown={keepFocus}
    onFocus={event => revealChoice(event.target as HTMLElement)}
    onCancel={event => { event.preventDefault(); onCancel(); }} onClose={() => { if (open) onCancel(); }}
    onPointerDown={event => { pointerOnBackdrop.current = event.target === event.currentTarget; }} onPointerCancel={() => { pointerOnBackdrop.current = false; }}
    onClick={event => { if (pointerOnBackdrop.current && event.target === event.currentTarget) onCancel(); pointerOnBackdrop.current = false; }}>
    <div className="hn-popup-header"><h2 id="hn-shortcut-settings-title">{t('shortcuts.configure')}</h2><button ref={closeRef} className="hn-icon-button" type="button" aria-label={t('shortcuts.closeSettings')} onClick={onCancel}><Icon name="close" /></button></div>
    <div className="hn-shortcut-settings__body">
      <div className="hn-shortcut-settings__intro"><p id="hn-shortcut-settings-description">{t('shortcuts.description')}</p><p id="hn-shortcut-limit-hint" role="status">{full ? t('shortcuts.limitReached') : t('shortcuts.chooseHint')}</p></div>
      <div className="hn-shortcut-options" role="group" aria-label={t('shortcuts.available')}>
        {destinations.map(item => {
          const checked = draft.includes(item.key);
          return <label key={item.key} className="hn-shortcut-choice" data-selected={checked} data-unavailable={!checked && full}>
            <input type="checkbox" checked={checked} disabled={!checked && full} aria-describedby={!checked && full ? 'hn-shortcut-limit-hint' : undefined} onChange={event => change(item.key, event.currentTarget.checked)} />
            <Icon name={item.icon ?? 'section'} />
            <span><strong>{item.label}</strong><small>{item.group ?? 'Hoa Nam WMS'}</small></span>
          </label>;
        })}
      </div>
      <p className="hn-shortcut-settings__scope">{t('shortcuts.browserScope')}</p>
    </div>
    <div className="hn-shortcut-settings__actions"><span aria-live="polite">{draft.length}/{SHORTCUT_LIMIT}</span><Button variant="secondary" onClick={onCancel}>{t('shortcuts.cancel')}</Button><Button aria-disabled={!dirty} onClick={() => { if (dirty) onSave(draft); }}>{t('shortcuts.save')}</Button></div>
  </dialog>;
}
