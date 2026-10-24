import { PREVIEW_TIME_ZONE } from '../shared/foundation';

export type MockNotificationId = 'MOCK-N01' | 'MOCK-N02' | 'MOCK-N03';
export type MockNotificationCopyKey = 'itemA' | 'itemB' | 'itemC';
export type NotificationHarnessScenario = 'ready' | 'loading' | 'empty' | 'error';

/** UI review fixtures only. There is no delivery, recipient or business target. */
export interface MockNotification {
  readonly id: MockNotificationId;
  readonly kind: 'mock-preview';
  readonly titleKey: MockNotificationCopyKey;
  readonly bodyKey: 'bodyA' | 'bodyB' | 'bodyC';
  readonly createdAt: string;
  readonly readAt: string | null;
  readonly target: null;
}

export const MOCK_READ_AT = '2026-10-18T02:00:00.000Z';
const FIXTURES: readonly MockNotification[] = Object.freeze([
  Object.freeze({ id: 'MOCK-N01', kind: 'mock-preview', titleKey: 'itemA', bodyKey: 'bodyA', createdAt: '2026-10-17T03:30:00.000Z', readAt: null, target: null }),
  Object.freeze({ id: 'MOCK-N02', kind: 'mock-preview', titleKey: 'itemB', bodyKey: 'bodyB', createdAt: '2026-10-17T02:15:00.000Z', readAt: null, target: null }),
  Object.freeze({ id: 'MOCK-N03', kind: 'mock-preview', titleKey: 'itemC', bodyKey: 'bodyC', createdAt: '2026-10-16T07:00:00.000Z', readAt: '2026-10-16T07:05:00.000Z', target: null }),
]);

export interface NotificationHarnessState {
  readonly scenario: NotificationHarnessScenario;
  readonly items: readonly MockNotification[];
  readonly selectedId: MockNotificationId | null;
}

export type NotificationHarnessAction =
  | { type: 'scenario'; scenario: NotificationHarnessScenario }
  | { type: 'open'; id: string }
  | { type: 'back' }
  | { type: 'read-all' }
  | { type: 'reset' | 'retry' };

/** A new mount/reset always starts with the same two unread mock items. */
export function createNotificationHarnessState(): NotificationHarnessState {
  return { scenario: 'ready', items: FIXTURES.map(item => ({ ...item })), selectedId: null };
}

export function unreadNotificationCount(items: readonly MockNotification[]): number {
  return items.filter(item => item.readAt === null).length;
}

export function reduceNotificationHarness(state: NotificationHarnessState, action: NotificationHarnessAction): NotificationHarnessState {
  if (action.type === 'reset' || action.type === 'retry') return createNotificationHarnessState();
  if (action.type === 'scenario') return action.scenario === 'ready'
    ? createNotificationHarnessState()
    : { scenario: action.scenario, items: [], selectedId: null };
  if (action.type === 'back') return { ...state, selectedId: null };
  if (state.scenario !== 'ready') return state;
  if (action.type === 'open') {
    const selected = state.items.find(item => item.id === action.id);
    if (!selected) return state;
    return {
      ...state,
      selectedId: selected.id,
      items: state.items.map(item => item.id === selected.id && item.readAt === null ? { ...item, readAt: MOCK_READ_AT } : item),
    };
  }
  if (action.type === 'read-all' && unreadNotificationCount(state.items)) {
    return { ...state, items: state.items.map(item => item.readAt === null ? { ...item, readAt: MOCK_READ_AT } : item) };
  }
  return state;
}

/** Preserve the approved dd/MM/yyyy and preview timezone in both UI languages. */
export function formatMockNotificationTime(value: string, language = 'vi'): string {
  if(language === 'zh-CN') return new Intl.DateTimeFormat('zh-CN',{timeZone:PREVIEW_TIME_ZONE,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(value));
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: PREVIEW_TIME_ZONE, day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(item => item.type === type)?.value ?? '';
  return `${part('day')}/${part('month')}/${part('year')} ${part('hour')}:${part('minute')}`;
}
