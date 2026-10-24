import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { AccountCenterProvider } from './account/AccountCenterContext';
import { recordUnresolvedAction } from './app/review-diagnostics';
import { ShellActionProvider } from './shared/ShellActionContext';
import type { ShellAction } from './shared/ShellActionContext';
import { initializeBrowserPreview } from './preview-mock/browser-runtime';
import { ShellPreferencesRuntime } from './shared/ShellPreferencesRuntime';
import { GlobalToastProvider } from './toast/GlobalToastProvider';
import './shared/styles.css';
import './app/setup.css';
import './shared/unified.css';
import './shared/components.css';
import './shared/premium.css';
import './shared/wave4-presentation.css';
import './shared/auth-layout.css';
import './features/S07/login.css';
import './features/S08/session.css';
import './shared/header-controls.css';
import './shared/dark-theme.css';
import './shared/premium-dark.css';
import './shared/table-presentation.css';

function reportShellAction({ key, screenKey }: ShellAction) {
  // Preserve existing review-harness keys at the app boundary; this is not RBAC.
  recordUnresolvedAction(screenKey === 'S03' ? `S03:${key}` : key);
}

initializeBrowserPreview();
createRoot(document.getElementById('root')!).render(<StrictMode><ShellPreferencesRuntime><GlobalToastProvider><ShellActionProvider onAction={reportShellAction}><AccountCenterProvider><App /></AccountCenterProvider></ShellActionProvider></GlobalToastProvider></ShellPreferencesRuntime></StrictMode>);
