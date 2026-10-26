import { useReducer } from 'react';
import { Button, GlobalModal, GlobalShell, Icon, PageState } from '../shared';
import { S00_SHELL_NAVIGATION } from '../shared/s00-navigation';
import { useShellUi } from '../shared/shell-locale';
import { localeForLanguage } from '../shared/shell-preferences';
import { notificationCopy } from './notification-copy';
import { createNotificationHarnessState, formatMockNotificationTime, reduceNotificationHarness, unreadNotificationCount } from './notification-model';
import type { NotificationHarnessScenario } from './notification-model';
import './notifications.css';

const scenarios: readonly NotificationHarnessScenario[] = ['ready', 'loading', 'empty', 'error'];

/** Opt-in UI harness. The production header bell remains separate and unavailable. */
export function NotificationHarnessScreen() {
  const { language } = useShellUi();
  const copy = notificationCopy(language);
  const [state, dispatch] = useReducer(reduceNotificationHarness, undefined, createNotificationHarnessState);
  const unread = unreadNotificationCount(state.items);
  const selected = state.items.find(item => item.id === state.selectedId);
  const countAvailable = state.scenario === 'ready' || state.scenario === 'empty';

  return <GlobalShell title={copy.title} variant="wms" navigation={S00_SHELL_NAVIGATION}>
    <section className="hn-notification-harness" data-visual-variant="premium" data-notification-harness="mock-only" lang={localeForLanguage(language)}>
      <header className="hn-notification-heading">
        <p className="hn-notification-eyebrow">{copy.eyebrow}</p>
        <h1>{copy.title}</h1>
        <p>{copy.description}</p>
      </header>
      <fieldset className="hn-notification-scenarios">
        <legend>{copy.scenarios}</legend>
        <div className="hn-notification-scenario-actions">{scenarios.map(scenario => <Button key={scenario} variant="secondary" aria-pressed={state.scenario === scenario} onClick={() => dispatch({ type: 'scenario', scenario })}>{copy[scenario]}</Button>)}
          <Button variant="ghost" onClick={() => dispatch({ type: 'reset' })}>{copy.reset}</Button>
        </div>
      </fieldset>
      <section className="hn-notification-panel" aria-labelledby="hn-mock-notification-list-title">
        <div className="hn-notification-mock-label" role="note"><Icon name="info" size={20} /><div><strong>{copy.mockLabel}</strong><p>{copy.scope}</p></div></div>
        <div className="hn-notification-panel-header">
          <div><h2 id="hn-mock-notification-list-title">{copy.list}</h2><p role="status" aria-live="polite" aria-atomic="true" data-mock-unread-count={countAvailable ? unread : undefined}>{countAvailable ? `${unread} ${copy.unreadCount}` : copy.unavailableCount}</p></div>
          <Button variant="secondary" disabled={state.scenario !== 'ready' || unread === 0} onClick={() => dispatch({ type: 'read-all' })}>{copy.markAll}</Button>
        </div>
        {state.scenario === 'ready' ? <ul className="hn-notification-list">{state.items.map(item => <li key={item.id}>
          <button type="button" className="hn-notification-item" data-mock-id={item.id} data-unread={item.readAt === null} aria-haspopup="dialog" onClick={() => dispatch({ type: 'open', id: item.id })}>
            <span className="hn-notification-item-icon" aria-hidden="true"><Icon name="bell" size={20} /></span>
            <span className="hn-notification-item-copy"><strong>{copy[item.titleKey]}</strong><span>{copy[item.bodyKey]}</span><time dateTime={item.createdAt}>{formatMockNotificationTime(item.createdAt,language)}</time></span>
            <span className="hn-notification-read-status">{item.readAt === null ? copy.unread : copy.read}</span><Icon name="chevron-right" size={18} />
          </button>
        </li>)}</ul> : <div className="hn-notification-state-slot"><PageState className="hn-notification-state" kind={state.scenario}
          title={copy[`${state.scenario}Title`]} description={copy[`${state.scenario}Description`]}
          onRetry={state.scenario === 'error' ? () => dispatch({ type: 'retry' }) : undefined} retryLabel={copy.retry} /></div>}
      </section>
      <GlobalModal open={Boolean(selected)} title={selected ? copy[selected.titleKey] : copy.detail} closeLabel={copy.close}
        className="hn-notification-detail" lang={localeForLanguage(language)} onClose={() => dispatch({ type: 'back' })}
        footer={<Button variant="secondary" onClick={() => dispatch({ type: 'back' })}>{copy.back}</Button>}>
        {selected && <>
          <p className="hn-notification-detail-body">{copy[selected.bodyKey]}</p>
          <dl className="hn-notification-detail-meta">
            <div><dt>{copy.mockId}</dt><dd>{selected.id}</dd></div>
            <div><dt>{copy.createdAt}</dt><dd><time dateTime={selected.createdAt}>{formatMockNotificationTime(selected.createdAt,language)}</time></dd></div>
            <div><dt>{copy.status}</dt><dd>{selected.readAt === null ? copy.unread : copy.read}</dd></div>
          </dl>
          <p className="hn-notification-no-target">{copy.noTarget}</p>
        </>}
      </GlobalModal>
    </section>
  </GlobalShell>;
}
