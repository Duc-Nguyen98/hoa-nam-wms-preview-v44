import { OperationResultToast } from '../../toast/OperationResultToast';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '../../shared/primitives';
import { Icon } from '../../shared/Icon';
import { revealControl, useKeyboardFocusReveal } from '../../shared/focus';
import { authPresentation } from '../../controllers/auth-presentation';
import { accountErrorMessage, useAccountCenter } from '../../account/AccountCenterContext';
import { ACCOUNT_EN_COPY, translateAccountAuthCopy } from '../../i18n/account-copy';
import { useUiCopy } from '../../i18n/use-ui-copy';
import { AuthLayout } from './AuthLayout';
import './login.css';

export function LoginScreen() {
  const tx = useUiCopy(ACCOUNT_EN_COPY);
  const account = useAccountCenter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});
  const [message, setMessage] = useState('');
  const [recovery, setRecovery] = useState('');
  const [recoverySequence, setRecoverySequence] = useState(0);
  const copy = translateAccountAuthCopy(authPresentation, tx);
  const pending = account?.pending.login ?? false;
  const loading = account?.authStatus === 'loading';
  const blocked = !account || loading || Boolean(account.pending.logout);
  const feedback = message || account?.authError || (!account ? 'Chưa thể đọc phiên làm việc. Vui lòng tải lại trang.' : '');
  const revealFocus = useKeyboardFocusReveal();
  const formRef = useRef<HTMLFormElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const alive = useRef(true);
  const submitting = useRef(false);
  useEffect(() => {
    alive.current = true;
    let frame: number | null = null;
    const revealAfterResize = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        frame = null;
        const target = document.activeElement;
        if (target instanceof HTMLElement && formRef.current?.contains(target) && target.matches(':focus-visible') && !document.querySelector('dialog[open]')) revealControl(target);
      });
    };
    const conceal = () => setPasswordVisible(false);
    const visibility = () => { if (document.hidden) conceal(); };
    const clear = () => { setPassword(''); conceal(); };
    window.addEventListener('resize', revealAfterResize);
    window.addEventListener('blur', conceal);
    window.addEventListener('pagehide', clear);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      alive.current = false;
      window.removeEventListener('resize', revealAfterResize);
      window.removeEventListener('blur', conceal);
      window.removeEventListener('pagehide', clear);
      document.removeEventListener('visibilitychange', visibility);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, []);
  async function submit(event: FormEvent) {
    event.preventDefault(); if (!account || blocked || pending || submitting.current) return;
    const nextErrors = { username: username.trim() ? undefined : 'Nhập tên đăng nhập.', password: password ? undefined : 'Nhập mật khẩu.' };
    setErrors(nextErrors); setMessage(''); setRecovery(''); setPasswordVisible(false);
    if (nextErrors.username || nextErrors.password) {
      (nextErrors.username ? usernameRef.current : passwordRef.current)?.focus(); return;
    }
    submitting.current = true;
    try {
      const accepted = await account.login(username.trim(), password);
      if (alive.current) {
        if (accepted) setPassword('');
        else setMessage('Chưa thể hoàn tất đăng nhập. Vui lòng thử lại.');
      }
    }
    catch (error) { if (alive.current) setMessage(accountErrorMessage(error)); }
    finally { submitting.current = false; }
  }
  return <AuthLayout copy={copy}>
    <form ref={formRef} className="s07-login-card" aria-label={copy.submit} aria-busy={pending || loading} autoComplete="off" noValidate onFocusCapture={revealFocus}
      onKeyDown={event => {
        if (event.key === 'Enter' && (event.repeat || event.nativeEvent.isComposing || event.keyCode === 229)) event.preventDefault();
      }} onSubmit={submit}>
      <div className="s07-field">
        <label htmlFor="s07-username">{copy.username}</label>
        <div className="s07-input-wrap">
          <Icon name="user" className="s07-field-icon" size={24} />
          <input ref={usernameRef} id="s07-username" type="text" autoComplete="username" autoCapitalize="none" spellCheck={false}
            value={username} placeholder={copy.usernamePlaceholder} readOnly={pending || blocked} maxLength={120}
            aria-invalid={Boolean(errors.username) || undefined} aria-describedby={errors.username ? 's07-username-error' : undefined}
            onChange={event => { setUsername(event.target.value); setErrors(previous => ({ ...previous, username: undefined })); setMessage(''); }} />
        </div>
        {errors.username && <p id="s07-username-error" className="s07-field-error">{tx(errors.username)}</p>}
      </div>
      <div className="s07-field">
        <label htmlFor="s07-password">{copy.password}</label>
        <div className="s07-input-wrap s07-input-wrap--password">
          <Icon name="lock" className="s07-field-icon" size={24} />
          <input ref={passwordRef} id="s07-password" type={passwordVisible ? 'text' : 'password'} autoComplete="current-password" autoCapitalize="none" autoCorrect="off"
            spellCheck={false} value={password} placeholder={copy.passwordPlaceholder} readOnly={pending || blocked} maxLength={128}
            aria-invalid={Boolean(errors.password) || undefined} aria-describedby={errors.password ? 's07-password-error' : undefined}
            onChange={event => { setPassword(event.target.value); setErrors(previous => ({ ...previous, password: undefined })); setMessage(''); }} />
          <Button variant="ghost" iconOnly className="s07-password-toggle" aria-label={passwordVisible ? copy.hidePassword : copy.showPassword}
            aria-controls="s07-password" aria-pressed={passwordVisible} onClick={() => setPasswordVisible(value => !value)}>
            <Icon name={passwordVisible ? 'eye-off' : 'eye'} size={24} />
          </Button>
        </div>
        {errors.password && <p id="s07-password-error" className="s07-field-error">{tx(errors.password)}</p>}
      </div>
      <p className="s07-public-demo">Demo công khai · Tài khoản: <strong>demo</strong> · Mật khẩu: <strong>HoaNamDemo@2026</strong><br />Dữ liệu thử nghiệm được lưu riêng trong trình duyệt của bạn.</p>
      <div className="s07-recovery"><Button variant="ghost" onClick={() => { setMessage(''); setRecoverySequence(value => value + 1); setRecovery('Liên hệ quản trị viên để được hỗ trợ đặt lại mật khẩu.'); }}>{copy.forgotPassword}</Button></div>
      <Button type="submit" className="s07-submit" loading={pending || loading} aria-disabled={blocked} trailingIcon={<Icon name="arrow-right" />}
        onClick={event => { if (event.detail > 1) event.preventDefault(); }}>{copy.submit}</Button>
      {loading && <p className="s07-feedback" role="status">{tx('Đang kiểm tra phiên làm việc…')}</p>}
      {feedback && <OperationResultToast eventKey={feedback} message={tx(feedback)} tone="error" />}
      {recovery && <OperationResultToast eventKey={`${recoverySequence}:${recovery}`} message={tx(recovery)} tone="info" />}
      <div className="s07-access"><Icon name="shield" size={30} /><div><strong>{copy.accessTitle}</strong><p>{copy.accessDescription}</p></div></div>
    </form>
  </AuthLayout>;
}
