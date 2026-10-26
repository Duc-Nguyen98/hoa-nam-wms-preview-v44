import { OperationResultToast } from '../../toast/OperationResultToast';
import { PreviewModeNotice } from '../../shared/PreviewModeNotice';
import { useEffect, useRef, useState } from 'react';
import { Button } from '../../shared/primitives';
import { Icon } from '../../shared/Icon';
import { StatusBadge } from '../../shared/controls';
import { revealControl, useKeyboardFocusReveal } from '../../shared/focus';
import { accountErrorMessage, useAccountCenter } from '../../account/AccountCenterContext';
import { sessionPresentation } from '../../controllers/auth-presentation';
import { ACCOUNT_EN_COPY, translateAccountAuthCopy } from '../../i18n/account-copy';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { AuthLayout } from '../../shared/AuthLayout';
import './session.css';

export function SessionScreen() {
  const tx = useUiCopy(ACCOUNT_EN_COPY);
  const account = useAccountCenter();
  const context = account?.sessionContext;
  const pending = account?.pending.confirm ?? false;
  const loading = account?.authStatus === 'loading';
  const logoutPending = account?.pending.logout ?? false;
  const [message, setMessage] = useState('');
  const feedback = message || account?.authError || '';
  const copy = {
    ...sessionPresentation,
    title: tx(sessionPresentation.title), instruction: tx(sessionPresentation.instruction),
    confirm: tx(sessionPresentation.confirm), logout: tx(sessionPresentation.logout),
    layout: translateAccountAuthCopy(sessionPresentation.layout, tx),
  };
  const revealFocus = useKeyboardFocusReveal();
  const formRef = useRef<HTMLFormElement>(null);
  const alive = useRef(true);
  const operation = useRef<'confirm' | 'logout' | null>(null);
  useEffect(() => {
    alive.current = true;
    let frame: number | null = null;
    const resize = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        frame = null;
        const target = document.activeElement;
        if (target instanceof HTMLElement && formRef.current?.contains(target) && target.matches(':focus-visible')) revealControl(target);
      });
    };
    window.addEventListener('resize', resize);
    return () => { alive.current = false; window.removeEventListener('resize', resize); if (frame !== null) cancelAnimationFrame(frame); };
  }, []);
  return <AuthLayout copy={copy.layout} variant="split-landscape" heroImageSrc="/assets/S07/bg_warehouse_main_4k_enhanced.jpg" headingId="s08-hero-heading">
    <form className="s08-session-card" aria-labelledby="s08-title" aria-busy={loading || pending || logoutPending} ref={formRef} onFocusCapture={revealFocus}
      onKeyDown={event => { if (event.key === 'Enter' && (event.repeat || event.nativeEvent.isComposing || event.keyCode === 229)) event.preventDefault(); }}
      onSubmit={async event => {
        event.preventDefault(); if (!account || !context || loading || pending || logoutPending || operation.current) return;
        setMessage('');
        operation.current = 'confirm';
        try {
          const accepted = await account.confirmSession();
          if (!accepted && alive.current) setMessage('Chưa thể bắt đầu phiên làm việc. Vui lòng thử lại.');
        } catch (error) { if (alive.current) setMessage(accountErrorMessage(error)); }
        finally { operation.current = null; }
      }}>
      <PreviewModeNotice authentication />
      <h2 id="s08-title">{copy.title}</h2>
      {!context || !account ? <>
        <p className="s08-feedback" role={feedback || !account ? 'alert' : 'status'}>{tx(feedback || (loading ? 'Đang kiểm tra phiên làm việc…' : 'Phiên làm việc chưa sẵn sàng. Vui lòng thử lại.'))}</p>
        {account && <Button variant="secondary" loading={loading} onClick={() => { setMessage(''); void account.refreshSession(); }}>{tx('Thử lại')}</Button>}
      </> : <>
      <div className="s08-account">
        <span className="s08-avatar" aria-hidden="true">{context.avatarText}</span>
        <div><strong>{context.displayName}</strong><p>{context.roleLabel}</p></div>
      </div>
      <div className="s08-warehouse"><Icon name="brand" size={36} /><strong>{context.warehouseLabel}</strong><StatusBadge tone="success"><svg className="s08-status-dot" width="7" height="7" viewBox="0 0 7 7" aria-hidden="true" focusable="false"><circle cx="3.5" cy="3.5" r="3.5" fill="currentColor" /></svg>{tx(context.warehouseStatusLabel)}</StatusBadge></div>
      <div className="s08-instruction"><Icon name="info" size={24} /><p>{copy.instruction}</p></div>
      <Button type="submit" className="s08-confirm" loading={pending || loading} aria-disabled={logoutPending} trailingIcon={<Icon name="arrow-right" />}
        onClick={event => { if (event.detail > 1) event.preventDefault(); }}>{copy.confirm}</Button>
      {feedback && <OperationResultToast eventKey={feedback} message={tx(feedback)} tone="error" />}
      <div className="s08-secondary"><Button variant="ghost" loading={logoutPending} aria-disabled={pending || loading} leadingIcon={<Icon name="logout" />} onClick={async () => {
        if (logoutPending || pending || loading || operation.current) return;
        setMessage('');
        operation.current = 'logout';
        try {
          const accepted = await account.logout();
          if (!accepted && alive.current) setMessage('Chưa thể đăng xuất. Vui lòng thử lại.');
        } catch (error) { if (alive.current) setMessage(accountErrorMessage(error)); }
        finally { operation.current = null; }
      }}>{copy.logout}</Button></div>
      </>}
    </form>
  </AuthLayout>;
}
