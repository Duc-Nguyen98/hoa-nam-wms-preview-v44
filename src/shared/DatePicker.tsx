import { formatBusinessDate } from '../i18n/format-business-date';
import { useShellPreferences } from './shell-preferences';
import { useUiCopy } from '../i18n/use-ui-copy';
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Icon } from './Icon';
import { addCalendarDays, addCalendarMonths, calendarDateLabel, calendarDays, calendarWeekday, isCalendarDateInRange, localToday, normalizeCalendarRange, parseIsoDate, toIsoDate } from './date-picker-calendar';
import type { CalendarDate, CalendarDateRange } from './date-picker-calendar';
import './date-picker.css';
import { clampCalendarFocus } from './date-picker-calendar';
import { businessDatePreset, DATE_VALIDATION_COPY, parseManualBusinessDate, validateBusinessDate, validateBusinessDateRange, type DatePolicyKind, type DateValidation } from './date-policy';
import { useDatePolicy } from './use-date-policy';
import { localeForLanguage } from './shell-preferences';
import { handleManualDateKey } from './date-picker-keyboard';

type CalendarFieldProps = {
  label: string;
  id?: string;
  disabled?: boolean;
  /** Presentation capability only; the owning screen decides whether null is valid. */
  clearable?: boolean;
  placeholder?: string;
  /** Optional compact visible label; the accessible name retains the complete range. */
  displayValue?: string;
  /** Presentation only. Does not select a day or impose a permitted date range. */
  initialMonth?: string;
  className?: string;
  /** Optional sourced/business bounds supplied by the owning screen. */
  minDate?: string;
  maxDate?: string;
  policy?: DatePolicyKind;
  exceptionId?: string;
};

export type DatePickerProps = CalendarFieldProps & {
  /** Controlled date-only value; no implicit business default. */
  value: string | null;
  onChange: (value: string | null) => void;
};
export type DateRangeValue = CalendarDateRange;
export type DateRangePickerProps = CalendarFieldProps & {
  /** Both ISO dates are included. One pending endpoint never invokes onChange. */
  value: DateRangeValue | null;
  onChange: (value: DateRangeValue | null) => void;
};
type CalendarPickerProps = ({ mode: 'single' } & DatePickerProps) | ({ mode: 'range' } & DateRangePickerProps);

export function DatePicker(props: DatePickerProps) {
  const tx = useUiCopy(); return <CalendarPicker mode="single" {...props} />; }
export function DateRangePicker(props: DateRangePickerProps) {
  const tx = useUiCopy(); return <CalendarPicker mode="range" {...props} />; }

const weekdays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const weekdayLabels = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
const focusable = 'a[href],button,input,select,textarea,[tabindex]';

function isAvailable(element: HTMLElement | null): element is HTMLElement {
  return Boolean(element?.isConnected && element.getClientRects().length && !element.matches(':disabled') && !element.closest('[hidden],[inert]') && getComputedStyle(element).visibility !== 'hidden');
}

function activeModal(): HTMLElement | null {
  return [...document.querySelectorAll<HTMLDialogElement>('dialog[open]')].reverse().find(dialog => dialog.matches(':modal')) ?? null;
}

function focusVisibleControl(element: HTMLElement) {
  element.focus({ preventScroll: true });
  const rect = element.getBoundingClientRect();
  const viewport = window.visualViewport;
  const top = viewport?.offsetTop ?? 0;
  const left = viewport?.offsetLeft ?? 0;
  const height = viewport?.height ?? innerHeight;
  const width = viewport?.width ?? innerWidth;
  const headerBottom = document.querySelector('.hn-header')?.getBoundingClientRect().bottom ?? top;
  if (rect.top < Math.max(top, headerBottom) + 8 || rect.bottom > top + height - 8 || rect.left < left || rect.right > left + width) element.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
}

/** Basic and Range share one calendar, popup, keyboard model and date-only engine. */
function CalendarPicker(props: CalendarPickerProps) {
  const { language } = useShellPreferences();
  const tx = useUiCopy();
  const { mode, label, id, disabled = false, clearable = true, placeholder = mode === 'range' ? tx("Chọn khoảng ngày") : tx("Chọn ngày"), initialMonth, className = '' } = props;
  const options = { policy: props.policy, exceptionId: props.exceptionId, minDate: props.minDate, maxDate: props.maxDate };
  const policyWindow = useDatePolicy(options);
  const { minDate, maxDate, today } = policyWindow;
  const validation = props.value ? props.mode === 'range' ? validateBusinessDateRange(props.value, options) : validateBusinessDate(props.value, options) : null;
  const message = (result: DateValidation | null) => result && !result.valid ? tx(DATE_VALIDATION_COPY[result.code], { min: formatBusinessDate(result.window.minDate ?? '—', language), max: formatBusinessDate(result.window.maxDate ?? '—', language) }) : '';
  const generatedId = useId();
  const fieldId = id ?? `hn-date-${generatedId}`;
  const popupId = `${fieldId}-calendar`;
  const selected = props.mode === 'single' ? parseIsoDate(props.value) : null;
  const acceptedRange = props.mode === 'range' && props.value && parseIsoDate(props.value.from) && parseIsoDate(props.value.to) ? props.value : null;
  const initialSelectedDay = selected ?? parseIsoDate(acceptedRange?.from);
  const formatDate = (date: CalendarDate) => formatBusinessDate(toIsoDate(date), language);
  const acceptedText = selected ? formatDate(selected) : acceptedRange ? `${formatDate(parseIsoDate(acceptedRange.from)!)} – ${formatDate(parseIsoDate(acceptedRange.to)!)}` : props.value ? props.mode === 'range' ? `${props.value.from} – ${props.value.to}` : props.value : '';
  const clearLabel = mode === 'range' ? tx("Xóa khoảng ngày") : tx("Xóa ngày");
  const controlledValueKey = props.mode === 'range' ? `${props.value?.from ?? ''}/${props.value?.to ?? ''}` : props.value ?? '';
  const [open, setOpen] = useState(false);
  const [focusedDay, setFocusedDay] = useState<CalendarDate>(() => initialSelectedDay ?? localToday());
  const [month, setMonth] = useState<CalendarDate>(() => initialSelectedDay ?? localToday());
  const [draftStart, setDraftStart] = useState<string | null>(null);
  const [hoverDay, setHoverDay] = useState<string | null>(null);
  const [manualFrom, setManualFrom] = useState('');
  const [manualTo, setManualTo] = useState('');
  const [draftError, setDraftError] = useState<DateValidation | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const moveFocusRef = useRef(false);
  // Keep the popup on the same side of its trigger while its contents change
  // (for example when a future date validation message appears). Recomputing
  // the preferred side on every ResizeObserver tick makes the whole calendar
  // jump between above and below during manual entry.
  const popupPlacementRef = useRef<'below' | 'above' | null>(null);
  const previousValueKeyRef = useRef(controlledValueKey);
  const isSelectable = (value: string) => validateBusinessDate(value, options).valid;
  const focusedIso = toIsoDate(focusedDay);
  const displayedRange = draftStart ? normalizeCalendarRange(draftStart, hoverDay ?? focusedIso) : acceptedRange;
  const monthLabel = new Intl.DateTimeFormat(localeForLanguage(language), {month:'long', year:'numeric', timeZone:'Asia/Ho_Chi_Minh'}).format(new Date(`${toIsoDate({...month,day:1})}T12:00:00+07:00`));
  const days = calendarDays(month);

  const restoreFocus = () => {
    const trigger = triggerRef.current;
    const modal = activeModal();
    if (isAvailable(trigger) && (!modal || modal.contains(trigger))) { focusVisibleControl(trigger); return; }
    const fallback = (modal ?? document).querySelectorAll<HTMLElement>(focusable);
    const target = [...fallback].find(element => !popupRef.current?.contains(element) && element.tabIndex >= 0 && isAvailable(element));
    if (target) focusVisibleControl(target);
  };

  const close = (restore = false) => {
    const popup = popupRef.current;
    if (popup?.matches(':popover-open')) popup.hidePopover();
    setOpen(false);
    setDraftStart(null);
    setHoverDay(null);
    setDraftError(null);
    popupPlacementRef.current = null;
    if (restore) restoreFocus();
  };

  const openCalendar = () => {
    if (disabled) return;
    const requestedMonth = parseIsoDate(initialMonth?.length === 7 ? `${initialMonth}-01` : initialMonth);
    const initialDay = clampCalendarFocus(initialSelectedDay ?? requestedMonth ?? localToday(), minDate, maxDate);
    setDraftStart(null);
    setHoverDay(null);
    setManualFrom(props.mode === 'range' ? props.value?.from ?? '' : props.value ?? '');
    setManualTo(props.mode === 'range' ? props.value?.to ?? '' : '');
    setDraftError(null);
    popupPlacementRef.current = null;
    setMonth(initialDay);
    setFocusedDay(initialDay);
    moveFocusRef.current = true;
    setOpen(true);
  };

  useLayoutEffect(() => {
    if (previousValueKeyRef.current === controlledValueKey) return;
    previousValueKeyRef.current = controlledValueKey;
    // A reset or an asynchronous accepted response invalidates an in-progress
    // selection; its old first endpoint must never join the next user click.
    if (open) close(true);
    else { setDraftStart(null); setHoverDay(null); }
  }, [controlledValueKey, open]);

  const revealCalendarDay = (day: HTMLElement) => {
    const area = scrollRef.current;
    if (!area) return;
    const bounds = area.getBoundingClientRect();
    const button = day.getBoundingClientRect();
    if (button.top < bounds.top + 4) area.scrollTop -= bounds.top + 4 - button.top;
    else if (button.bottom > bounds.bottom - 4) area.scrollTop += button.bottom - bounds.bottom + 4;
    if (button.left < bounds.left + 2) area.scrollLeft -= bounds.left + 2 - button.left;
    else if (button.right > bounds.right - 2) area.scrollLeft += button.right - bounds.right + 2;
  };

  const focusCalendarDay = () => {
    const day = popupRef.current?.querySelector<HTMLButtonElement>(`[data-date='${focusedIso}']`);
    if (!day) return;
    day.focus({ preventScroll: true });
    revealCalendarDay(day);
  };

  useLayoutEffect(() => {
    const popup = popupRef.current;
    const trigger = triggerRef.current;
    if (!popup || !trigger || !open) return;
    if (typeof popup.showPopover === 'function' && !popup.matches(':popover-open')) popup.showPopover();
    let frame = 0;
    const position = () => {
      const viewport = window.visualViewport;
      const leftEdge = viewport?.offsetLeft ?? 0;
      const topEdge = viewport?.offsetTop ?? 0;
      const width = viewport?.width ?? innerWidth;
      const height = viewport?.height ?? innerHeight;
      const anchor = trigger.getBoundingClientRect();
      popup.style.maxHeight = `${Math.max(0, height - 16)}px`;
      popup.style.maxWidth = `${Math.max(0, width - 8)}px`;
      const box = popup.getBoundingClientRect();
      const below = anchor.bottom + 6;
      const above = anchor.top - 6 - box.height;
      const placement = popupPlacementRef.current ?? (
        below + box.height <= topEdge + height - 8 ? 'below' : above >= topEdge + 8 ? 'above' : 'below'
      );
      popupPlacementRef.current = placement;
      const preferredTop = placement === 'below' ? below : above;
      // A resize can move the invoker below the viewport while the calendar
      // retains focus. Keep the entire popup in view even in that situation.
      const top = Math.max(topEdge + 8, Math.min(preferredTop, topEdge + height - box.height - 8));
      popup.style.left = `${Math.max(leftEdge + 4, Math.min(anchor.left, leftEdge + width - box.width - 4))}px`;
      popup.style.top = `${top}px`;
      if (document.activeElement instanceof HTMLElement && popup.contains(document.activeElement) && document.activeElement.matches('.hn-date-picker__day')) revealCalendarDay(document.activeElement);
    };
    const schedule = (event?: Event) => {
      if (event?.target instanceof Node && popup.contains(event.target)) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(position);
    };
    position();
    if (moveFocusRef.current) { moveFocusRef.current = false; focusCalendarDay(); }
    window.addEventListener('resize', schedule);
    window.addEventListener('scroll', schedule, true);
    window.visualViewport?.addEventListener('resize', schedule);
    window.visualViewport?.addEventListener('scroll', schedule);
    const observer = new ResizeObserver(() => schedule());
    observer.observe(popup);
    observer.observe(trigger);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('scroll', schedule, true);
      window.visualViewport?.removeEventListener('resize', schedule);
      window.visualViewport?.removeEventListener('scroll', schedule);
      if (popup.matches(':popover-open')) popup.hidePopover();
    };
  }, [open]);

  useLayoutEffect(() => {
    if (open && moveFocusRef.current) { moveFocusRef.current = false; focusCalendarDay(); }
  }, [open, focusedIso, month.year, month.month]);

  useEffect(() => {
    if (disabled && open) close(true);
  }, [disabled, open]);

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!(event.target instanceof Node) || wrapperRef.current?.contains(event.target)) return;
      close();
      requestAnimationFrame(() => {
        if (document.activeElement === document.body || document.activeElement === document.documentElement) restoreFocus();
      });
    };
    const focusOutside = (event: FocusEvent) => {
      if (event.target instanceof Node && !wrapperRef.current?.contains(event.target)) close();
    };
    document.addEventListener('pointerdown', outside, true);
    document.addEventListener('focusin', focusOutside);
    return () => { document.removeEventListener('pointerdown', outside, true); document.removeEventListener('focusin', focusOutside); };
  }, [open]);

  const moveTo = (date: CalendarDate, focus = true) => {
    // These are ISO representation boundaries, not application/business date limits.
    if (date.year < 1 || date.year > 9999) return;
    moveFocusRef.current = focus;
    if (focus) setHoverDay(null);
    const next = clampCalendarFocus(date, minDate, maxDate);
    setFocusedDay(next);
    setMonth(next);
  };

  useEffect(() => {
    if (open) moveTo(focusedDay, popupRef.current?.contains(document.activeElement) && document.activeElement?.classList.contains('hn-date-picker__day'));
  }, [today, minDate, maxDate]);

  const acceptManual = () => {
    const from = parseManualBusinessDate(manualFrom);
    const to = parseManualBusinessDate(manualTo);
    const result = props.mode === 'range' ? validateBusinessDateRange({from: from ?? manualFrom, to: to ?? manualTo}, options) : validateBusinessDate(from ?? manualFrom, options);
    if (!result.valid) { setDraftError(result); return; }
    close(true);
    if (props.mode === 'range') props.onChange({from:from!,to:to!}); else props.onChange(from!);
  };

  const acceptPreset = (days: 1 | 7 | 30 | 90) => {
    const range = businessDatePreset(days);
    const result = props.mode === 'range' ? validateBusinessDateRange(range, options) : validateBusinessDate(range.to, options);
    if (!result.valid) { setDraftError(result); return; }
    close(true);
    if (props.mode === 'range') props.onChange(range); else props.onChange(range.to);
  };

  const choose = (date: CalendarDate) => {
    const next = toIsoDate(date);
    if (!parseIsoDate(next) || !isSelectable(next)) return;
    if (props.mode === 'range') {
      if (!draftStart) {
        setDraftStart(next);
        setHoverDay(null);
        moveTo(date);
        return;
      }
      const range = { from: draftStart, to: next };
      const result = validateBusinessDateRange(range, options);
      if (!result.valid) { setDraftError(result); return; }
      close(true);
      props.onChange(range);
      return;
    }
    close(true);
    props.onChange(next);
  };

  const clear = () => { if (!clearable) return; close(true); props.onChange(null); };

  const onDayKey = (event: KeyboardEvent<HTMLButtonElement>, date: CalendarDate) => {
    if (event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) return;
    const dayDelta: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7, Home: -calendarWeekday(date), End: 6 - calendarWeekday(date) };
    if (event.key in dayDelta) {
      event.preventDefault(); event.stopPropagation(); moveTo(addCalendarDays(date, dayDelta[event.key]));
    } else if (event.key === 'PageUp' || event.key === 'PageDown') {
      event.preventDefault(); event.stopPropagation(); moveTo(addCalendarMonths(date, (event.key === 'PageUp' ? -1 : 1) * (event.shiftKey ? 12 : 1)));
    }
  };

  const onPopupKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) return;
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(true); }
    if (event.key !== 'Tab') return;
    event.preventDefault(); event.stopPropagation();
    const popupControls = [...(popupRef.current?.querySelectorAll<HTMLElement>(focusable) ?? [])].filter(element => element.tabIndex >= 0 && isAvailable(element));
    const popupIndex = popupControls.indexOf(document.activeElement as HTMLElement);
    const nextControl = popupControls[popupIndex + (event.shiftKey ? -1 : 1)];
    if (popupIndex >= 0 && nextControl) { focusVisibleControl(nextControl); return; }
    const trigger = triggerRef.current;
    const modal = activeModal();
    const controls = [...(modal ?? document).querySelectorAll<HTMLElement>(focusable)].filter(element => element.tabIndex >= 0 && isAvailable(element) && !popupRef.current?.contains(element));
    const index = trigger ? controls.indexOf(trigger) : -1;
    const target = event.shiftKey ? trigger : controls[index + 1];
    close();
    if (isAvailable(target ?? null)) focusVisibleControl(target!);
    else restoreFocus();
  };

  return <div className={`hn-date-picker ${className}`} ref={wrapperRef} data-mode={mode} data-disabled={disabled || undefined}>
    <label className="hn-date-picker__label" htmlFor={fieldId}>{tx(label)}</label>
    <div className="hn-date-picker__field">
      <button ref={triggerRef} id={fieldId} type="button" disabled={disabled} className="hn-date-picker__trigger" aria-invalid={validation && !validation.valid || undefined} aria-describedby={validation && !validation.valid ? `${fieldId}-error` : undefined} aria-label={acceptedText ? `${tx(label)}: ${acceptedText}` : tx(label)} aria-haspopup="dialog" aria-expanded={open} aria-controls={popupId} onClick={() => open ? close(true) : openCalendar()} onKeyDown={event => {
        if (event.key === 'ArrowDown' && !event.nativeEvent.isComposing) { event.preventDefault(); openCalendar(); }
      }}>
        <span className={acceptedText ? undefined : 'hn-date-picker__placeholder'}>{props.displayValue || acceptedText || tx(placeholder)}</span><Icon name="calendar" size={19} />
      </button>
      {clearable && acceptedText && <button type="button" className="hn-date-picker__clear" disabled={disabled} aria-label={`${clearLabel} ${tx(label)}`} onClick={clear}><Icon name="close" size={17} /></button>}
    </div>
    {validation && !validation.valid && <p className="hn-date-picker__error" id={`${fieldId}-error`} role="status">{message(validation)}</p>}
    <div id={popupId} ref={popupRef} popover="manual" role="dialog" aria-label={`${mode === 'range' ? tx("Chọn khoảng ngày") : tx("Chọn ngày")} – ${tx(label)}`} aria-describedby={`${popupId}-help`} className="hn-date-picker__popup" data-open={open} data-mode={mode} data-draft-start={draftStart ?? undefined} onKeyDown={onPopupKey} onPointerDownCapture={event => {
      // A disabled day is still inside the picker. Keep the native popover
      // open when a pointer lands on it; only a valid day may close it.
      if (event.target instanceof HTMLButtonElement && event.target.disabled) {
        event.preventDefault();
        event.stopPropagation();
      }
    }} onToggle={event => { if (event.newState === 'closed') { setOpen(false); setDraftStart(null); setHoverDay(null); } }}>
      <div className="hn-date-picker__header">
        <button type="button" className="hn-date-picker__nav" disabled={policyWindow.empty || Boolean(minDate && toIsoDate({...month,day:1}).slice(0,7) <= minDate.slice(0,7))} aria-label={tx("Tháng trước")} onClick={() => moveTo(addCalendarMonths(focusedDay, -1), false)}><Icon name="chevron-left" size={18} /></button>
        <h2 id={`${popupId}-month`} aria-live="polite" aria-atomic="true">{monthLabel}</h2>
        <button type="button" className="hn-date-picker__nav" disabled={policyWindow.empty || Boolean(maxDate && toIsoDate({...month,day:1}).slice(0,7) >= maxDate.slice(0,7))} aria-label={tx("Tháng sau")} onClick={() => moveTo(addCalendarMonths(focusedDay, 1), false)}><Icon name="chevron-right" size={18} /></button>
      </div>
      {mode === 'range' && <p className="hn-date-picker__range-status" role="status" aria-live="polite" aria-atomic="true">{draftStart ? tx('Đã chọn {date}; chọn ngày còn lại.', { date: formatDate(parseIsoDate(draftStart)!) }) : tx('Chọn ngày bắt đầu cho khoảng mới.')}</p>}
      <div className="hn-date-picker__scroll" ref={scrollRef}>
        {props.policy !== 'business-exception' && <div className="hn-date-picker__presets" aria-label={tx('Khoảng ngày nhanh')}>{([1,7,30,90] as const).filter(days => mode === 'range' || days === 1).map(days => <button key={days} type="button" className="hn-date-picker__text-button" onClick={() => acceptPreset(days)}>{days === 1 ? tx('Hôm nay') : tx('{days} ngày', {days})}</button>)}</div>}
        <div className="hn-date-picker__grid" role="grid" aria-labelledby={`${popupId}-month`} aria-multiselectable={mode === 'range' || undefined} onPointerLeave={() => setHoverDay(null)}>
          <div className="hn-date-picker__week" role="row">{weekdays.map((day, index) => <span role="columnheader" key={day} aria-label={tx(weekdayLabels[index])}>{tx(day)}</span>)}</div>
          {Array.from({ length: 6 }, (_, row) => <div className="hn-date-picker__week" role="row" key={row}>{days.slice(row * 7, row * 7 + 7).map(date => {
            const iso = toIsoDate(date);
            if (date.year < 1 || date.year > 9999) return <div role="gridcell" key={iso} className="hn-date-picker__cell" />;
            const currentMonth = date.month === month.month && date.year === month.year;
            const inRange = mode === 'range' && isCalendarDateInRange(iso, displayedRange);
            const rangePosition = inRange ? iso === displayedRange!.from && iso === displayedRange!.to ? 'both' : iso === displayedRange!.from ? 'start' : iso === displayedRange!.to ? 'end' : 'between' : undefined;
            const picked = props.mode === 'single' ? iso === props.value : Boolean(rangePosition && rangePosition !== 'between');
            const ariaSelected = props.mode === 'single' ? picked : draftStart ? iso === draftStart : isCalendarDateInRange(iso, acceptedRange);
            const selectable = isSelectable(iso);
            return <div role="gridcell" key={iso} aria-selected={ariaSelected} aria-disabled={!selectable || undefined} className="hn-date-picker__cell"><button type="button" className="hn-date-picker__day" data-date={iso} data-outside={!currentMonth || undefined} data-selected={picked || undefined} data-range={rangePosition} data-range-preview={inRange && draftStart ? true : undefined} aria-label={calendarDateLabel(date, language)} aria-current={iso === today ? 'date' : undefined} aria-disabled={!selectable || undefined} disabled={!selectable} tabIndex={iso === focusedIso && selectable ? 0 : -1} onFocus={() => { setFocusedDay(date); setHoverDay(null); }} onPointerEnter={() => { if (mode === 'range' && draftStart && selectable) setHoverDay(iso); }} onKeyDown={event => onDayKey(event, date)} onClick={() => choose(date)}>{date.day}</button></div>;
          })}</div>)}
        </div>
        <div className="hn-date-picker__manual">
          <label htmlFor={`${fieldId}-manual-from`}>{mode === 'range' ? tx('Từ ngày') : tx('Nhập ngày')}</label>
          <input id={`${fieldId}-manual-from`} value={manualFrom} placeholder="dd/MM/yyyy" onChange={event => {setManualFrom(event.target.value);setDraftError(null);}} onKeyDown={event => handleManualDateKey(event, acceptManual)} />
          {mode === 'range' && <><label htmlFor={`${fieldId}-manual-to`}>{tx('Đến ngày')}</label><input id={`${fieldId}-manual-to`} value={manualTo} placeholder="dd/MM/yyyy" onChange={event => {setManualTo(event.target.value);setDraftError(null);}} onKeyDown={event => handleManualDateKey(event, acceptManual)} /></>}
          <button type="button" className="hn-date-picker__text-button" onClick={acceptManual}>{tx('Áp dụng')}</button>
          <p className="hn-date-picker__range-status">{props.policy !== 'business-exception' ? tx('Chọn từ {min} đến {max}; không chọn ngày tương lai.', {min:formatBusinessDate(minDate ?? '—', language),max:formatBusinessDate(maxDate ?? '—', language)}) : tx('Ngày theo quy tắc nghiệp vụ của trường này.')}</p>
          {draftError && !draftError.valid && <p className="hn-date-picker__error" role="alert">{message(draftError)}</p>}
        </div>
      </div>
      <div className="hn-date-picker__footer">
        {clearable && <button type="button" className="hn-date-picker__text-button" disabled={!acceptedText && !draftStart} onClick={clear}>{clearLabel}</button>}
        <button type="button" className="hn-date-picker__text-button hn-date-picker__close" aria-label={tx("Đóng lịch")} onClick={() => close(true)}>{tx("Đóng")}</button>
      </div>
      <p id={`${popupId}-help`} className="hn-date-picker__sr-only">{mode === 'range' && <>{tx('Chọn ngày bắt đầu, sau đó chọn ngày kết thúc bằng hoặc sau ngày bắt đầu.')} </>}{tx("Dùng phím mũi tên để di chuyển ngày; Home và End để đến đầu và cuối tuần; Page Up và Page Down để đổi tháng, giữ Shift để đổi năm. Enter hoặc phím cách để chọn. Escape để")}{' '}{mode === 'range' ? tx("hủy lựa chọn tạm và đóng lịch") : tx("đóng lịch")}{tx(". Tab để sang điều khiển tiếp theo.")}</p>
    </div>
  </div>;
}
