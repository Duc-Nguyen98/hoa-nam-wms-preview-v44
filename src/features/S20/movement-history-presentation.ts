import { formatBusinessTimestamp } from '../../i18n/format-business-timestamp';
import type { ShellLanguage } from '../../shared/shell-preferences';
import { type MovementQuery } from '../../contracts/movement-history';

/** View-only helpers; domain state stays in the controller. */
export function movementScrollEdges(left:number,width:number,total:number) {
  const maximum = Math.max(0, total - width);
  const position = Math.max(0, Math.min(left, maximum));
  return { left: maximum > 1 && position > 1, right: maximum > 1 && position < maximum - 1 };
}
export function movementFocusColumn(column?:string) { return column==='code'?'occurredAt':column==='performer'?'subject':column; }

export const movementSortOptions = [
  { key: 'occurredAt', label: 'Thời gian', orders: ['Cũ nhất', 'Mới nhất'] },
  { key: 'type', label: 'Loại', orders: ['A → Z', 'Z → A'] },
  { key: 'code', label: 'Mã phiếu', orders: ['A → Z', 'Z → A'] },
  { key: 'subject', label: 'Đối tượng', orders: ['A → Z', 'Z → A'] },
  { key: 'quantity', label: 'Số lượng', orders: ['Tăng dần', 'Giảm dần'] },
  { key: 'performer', label: 'Người thực hiện', orders: ['A → Z', 'Z → A'] },
] as const;

export function movementSortPatch(value: string): Pick<MovementQuery, 'sortKey' | 'sortDirection'> | null {
  for (const option of movementSortOptions) for (const direction of ['asc', 'desc'] as const) {
    if (value === `${option.key}:${direction}`) return { sortKey: option.key, sortDirection: direction };
  }
  return null;
}

/** Split the existing formatted value, preserving the contract timezone and instant. */
export function movementDisplayTime(instant: string, language: ShellLanguage = 'vi') {
  const [date, time] = formatBusinessTimestamp(instant, language).split(' · ');
  return { date, time };
}

/** Presentation only: preserve the entire source text and its original order. */
export function movementDisplaySubject(subject: string) {
  const separator = subject.indexOf(' · ');
  return separator < 0 ? { primary: subject, secondary: '' }
    : { primary: subject.slice(0, separator), secondary: subject.slice(separator + 3) };
}
