import { useCallback, useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { BasicSelect } from '../shared/controls';
import { revealControl, useKeyboardFocusReveal } from '../shared/focus';
import { Icon } from '../shared/Icon';
import type { IconName } from '../shared/Icon';
import { Button } from '../shared/primitives';
import { Notice, type NoticeFeedback } from '../shared/Notice';
import { parseShellLanguage, useShellPreferences } from '../shared/shell-preferences';
import { ACCOUNT_EN_COPY } from '../i18n/account-copy';
import { useUiCopy } from '../i18n/use-ui-copy';
import { accountErrorMessage, useAccountCenter } from './AccountCenterContext';
import { ApiRequestError } from '../data/http/api-client';
import { notificationDirty, profileDirty, validateProfileDraft } from './account-center-model';
import type { ProfileDraft } from './account-center-model';
import './account-center.css';

export type AccountCenterPanel = 'profile' | 'security' | 'settings' | 'notifications';
type AccountState = NonNullable<ReturnType<typeof useAccountCenter>>;

const PANELS: { key: AccountCenterPanel; label: string; icon: IconName; title: string; description: string }[] = [
  { key: 'profile', label: 'Hồ sơ', icon: 'user', title: 'Hồ sơ cá nhân', description: 'Thông tin liên hệ và không gian làm việc của bạn tại Hoa Nam.' },
  { key: 'security', label: 'Bảo mật', icon: 'lock', title: 'Bảo mật tài khoản', description: 'Quản lý mật khẩu và sử dụng tài khoản an toàn trong mỗi ca làm việc.' },
  { key: 'settings', label: 'Giao diện', icon: 'settings', title: 'Cài đặt giao diện', description: 'Chọn cách hiển thị phù hợp với thiết bị và thói quen làm việc của bạn.' },
  { key: 'notifications', label: 'Thông báo', icon: 'bell', title: 'Cài đặt thông báo', description: 'Lựa chọn các cập nhật công việc bạn muốn nhận và kênh nhận tương ứng.' },
];

function CardHeading({ icon, title, description }: { icon: IconName; title: string; description?: string }) {
  const tx = useUiCopy(ACCOUNT_EN_COPY);
  return <div className="account-card__heading">
    <span className="account-card__icon"><Icon name={icon} size={21} /></span>
    <div><h2>{tx(title)}</h2>{description && <p>{tx(description)}</p>}</div>
  </div>;
}

type AccountNoticeFeedback = NoticeFeedback & { languageValue?: ReturnType<typeof parseShellLanguage> };

function useAccountNotice() {
  const [notice, setNotice] = useState<AccountNoticeFeedback | null>(null);
  const sequence = useRef(0);
  const clearNotice = useCallback((expectedSequence?: number) => {
    setNotice(current => expectedSequence === undefined || current?.sequence === expectedSequence ? null : current);
  }, []);
  const showNotice = useCallback((message: string, tone: NoticeFeedback['tone'], origin: HTMLElement | null, languageValue?: AccountNoticeFeedback['languageValue']) => {
    setNotice({ message, tone, origin, languageValue, sequence: ++sequence.current, container: document.body });
  }, []);
  return { notice, clearNotice, showNotice };
}

function submitOrigin(event: FormEvent<HTMLFormElement>): HTMLElement | null {
  const submitter = (event.nativeEvent as SubmitEvent).submitter;
  if (submitter instanceof HTMLElement) return submitter;
  return document.activeElement instanceof HTMLElement && event.currentTarget.contains(document.activeElement)
    ? document.activeElement : event.currentTarget.querySelector<HTMLElement>('button[type="submit"]');
}

function AccountTransientNotice({ feedback, onClose }: { feedback: AccountNoticeFeedback | null; onClose: (sequence?: number) => void }) {
  const tx = useUiCopy(ACCOUNT_EN_COPY);
  if (!feedback) return null;
  // Translate the original event without creating a new sequence or lifetime.
  const message = feedback.languageValue
    ? `${tx('Ngôn ngữ giao diện:')} ${({ vi: tx('Tiếng Việt'), en: 'English', 'zh-CN': '简体中文' } as Readonly<Record<string, string>>)[feedback.languageValue]}.`
    : tx(feedback.message);
  return <Notice feedback={{ ...feedback, message }} onClose={() => onClose(feedback.sequence)} />;
}

function ProfilePanel({ account }: { account: AccountState }) {
  const tx = useUiCopy(ACCOUNT_EN_COPY);
  const [errors, setErrors] = useState<Partial<Record<keyof ProfileDraft, string>>>({});
  const { notice, clearNotice, showNotice } = useAccountNotice();
  const fieldRefs = useRef<Partial<Record<keyof ProfileDraft, HTMLInputElement | null>>>({});
  const avatarInput = useRef<HTMLInputElement>(null);
  const dirty = account.avatar.dirty || profileDirty(account.profileDraft, account.savedProfile);
  const canReset = dirty || account.avatar.pending || Boolean(account.avatar.error);
  const fields: { key: keyof ProfileDraft; label: string; type: string; autoComplete: string; placeholder?: string; help?: string }[] = [
    { key: 'displayName', label: 'Họ và tên', type: 'text', autoComplete: 'name' },
    { key: 'email', label: 'Email công việc', type: 'email', autoComplete: 'email', placeholder: 'Nhập email công việc', help: 'Dùng để lựa chọn kênh email trong phần Thông báo.' },
    { key: 'phone', label: 'Số điện thoại', type: 'tel', autoComplete: 'tel', placeholder: 'Nhập số điện thoại liên hệ' },
  ];

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!dirty || account.avatar.pending || account.pending.profile || account.pending.notifications) return;
    const nextErrors = validateProfileDraft(account.profileDraft);
    setErrors(nextErrors);
    const firstError = fields.find(field => nextErrors[field.key]);
    if (firstError) {
      clearNotice();
      fieldRefs.current[firstError.key]?.focus();
      return;
    }
    clearNotice();
    const origin = submitOrigin(event);
    try { if (await account.saveProfile()) showNotice('Đã lưu thông tin hồ sơ.', 'success', origin); }
    catch (error) { showNotice(accountErrorMessage(error), 'error', origin); }
  }

  function change(key: keyof ProfileDraft, value: string) {
    account.setProfileDraft({ [key]: value });
    clearNotice();
    if (errors[key]) setErrors(previous => ({ ...previous, [key]: undefined }));
  }

  return <div className="account-layout">
    <section className="account-card" aria-labelledby="account-profile-heading">
      <div className="account-profile-summary">
        <button type="button" className="account-avatar" data-hn-control="button" aria-label={tx('Chọn ảnh đại diện')} aria-describedby="account-avatar-help" onClick={() => avatarInput.current?.click()}>
          {account.avatar.draft ? <img src={account.avatar.draft} alt="" /> : <span aria-hidden="true">{account.profile.initials}</span>}
        </button>
        <div className="account-profile-summary__text"><h2 id="account-profile-heading">{account.profile.displayName}</h2><p>{tx('Tài khoản cá nhân · Hoa Nam WMS')}</p>
          <div className="account-avatar-actions">
            <Button variant="secondary" aria-describedby="account-avatar-help account-avatar-feedback" onClick={() => avatarInput.current?.click()}>{tx(account.avatar.draft ? 'Đổi ảnh' : 'Chọn ảnh')}</Button>
            <Button variant="ghost" aria-disabled={!account.avatar.draft && !account.avatar.pending} onClick={() => { if (!account.avatar.draft && !account.avatar.pending) return; account.avatar.remove(); clearNotice(); }}>{tx('Xóa ảnh')}</Button>
          </div>
          <p id="account-avatar-help" className="account-field-help">{tx('JPG, PNG hoặc WebP · Tối đa 5 MB. Chọn ảnh rồi bấm “Lưu thay đổi”.')}</p>
          <div id="account-avatar-feedback" role="status" aria-live="polite" className={account.avatar.error ? 'account-avatar-feedback account-field-error' : 'account-avatar-feedback'}>{tx(account.avatar.error || (account.avatar.pending ? 'Đang đọc ảnh…' : account.avatar.dirty ? 'Ảnh đại diện có thay đổi chưa lưu.' : ''))}</div>
        </div>
        <input ref={avatarInput} id="account-avatar-file" type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={event => {
          const file = event.currentTarget.files?.[0];
          event.currentTarget.value = '';
          if (file) { clearNotice(); void account.avatar.select(file); }
        }} />
      </div>
      <form className="account-form" noValidate onSubmit={submit}>
        <div className="account-section-heading"><h3>{tx('Thông tin liên hệ')}</h3><p>{tx('Cập nhật thông tin để đồng nghiệp dễ liên hệ khi xử lý công việc.')}</p></div>
        <div className="account-field-grid">
          {fields.map(field => <div className={`account-field${field.key === 'displayName' ? ' account-field--wide' : ''}`} key={field.key}>
            <label htmlFor={`account-${field.key}`}>{tx(field.label)}{field.key === 'displayName' ? <span className="account-required" aria-hidden="true"> *</span> : <span className="account-optional">{tx(' · Không bắt buộc')}</span>}</label>
            <input
              ref={element => { fieldRefs.current[field.key] = element; }}
              id={`account-${field.key}`} name={field.key} className="account-input" type={field.type}
              autoComplete={field.autoComplete} value={account.profileDraft[field.key]} required={field.key === 'displayName'}
              placeholder={field.placeholder ? tx(field.placeholder) : undefined} onChange={event => change(field.key, event.currentTarget.value)}
              aria-invalid={Boolean(errors[field.key]) || undefined}
              aria-describedby={[field.help ? `account-${field.key}-help` : '', errors[field.key] ? `account-${field.key}-error` : ''].filter(Boolean).join(' ') || undefined}
            />
            {field.help && <p id={`account-${field.key}-help`} className="account-field-help">{tx(field.help)}</p>}
            {errors[field.key] && <p className="account-field-error" id={`account-${field.key}-error`}>{tx(errors[field.key]!)}</p>}
          </div>)}
        </div>
        <div className="account-form-actions">
          <Button type="submit" loading={account.pending.profile} aria-disabled={!dirty || account.avatar.pending || account.pending.notifications} leadingIcon={<Icon name="save" size={18} />}>{tx('Lưu thay đổi')}</Button>
          <Button variant="secondary" aria-disabled={!canReset || account.pending.profile} onClick={() => { if (!canReset || account.pending.profile) return; account.resetProfile(); setErrors({}); clearNotice(); }}>{tx('Hoàn tác thay đổi')}</Button>
        </div>
        <AccountTransientNotice feedback={notice} onClose={clearNotice} />
      </form>
    </section>
    <aside className="account-aside" aria-label={tx('Thông tin công việc')}>
      <section className="account-card account-card--aside">
        <CardHeading icon="warehouse" title="Không gian làm việc" />
        <dl className="account-facts"><div><dt>{tx('Kho làm việc')}</dt><dd>Kho Hoa Nam</dd></div><div><dt>{tx('Quyền truy cập')}</dt><dd>{tx('Do quản trị viên cấp')}</dd></div></dl>
        <p className="account-aside-note">{tx('Liên hệ quản trị viên khi cần thay đổi kho làm việc hoặc quyền truy cập.')}</p>
      </section>
      <section className="account-card account-card--aside account-card--tint">
        <CardHeading icon="shield" title="Bảo vệ tài khoản" />
        <p>{tx('Giữ thông tin đăng nhập riêng tư, đặc biệt khi làm việc trên máy tính dùng chung tại kho.')}</p>
        <a className="account-text-link" href="#/account/security">{tx('Xem cài đặt bảo mật')} <Icon name="arrow-right" size={18} /></a>
      </section>
    </aside>
  </div>;
}

type PasswordValues = { current: string; next: string; confirm: string };
const emptyPasswords = (): PasswordValues => ({ current: '', next: '', confirm: '' });
function validatePasswords(values: PasswordValues) {
  const errors: Partial<Record<keyof PasswordValues, string>> = {};
  if (!values.current) errors.current = 'Nhập mật khẩu hiện tại.';
  if (!values.next) errors.next = 'Nhập mật khẩu mới.';
  else if (values.next === values.current) errors.next = 'Mật khẩu mới cần khác mật khẩu hiện tại.';
  else if (values.next.length < 8) errors.next = 'Mật khẩu mới cần ít nhất 8 ký tự.';
  else if (values.next.length > 128) errors.next = 'Mật khẩu không quá 128 ký tự.';
  if (!values.confirm) errors.confirm = 'Nhập lại mật khẩu mới.';
  else if (values.confirm !== values.next) errors.confirm = 'Mật khẩu xác nhận chưa khớp.';
  return errors;
}
const passwordFields = [
  { key: 'current', label: 'Mật khẩu hiện tại' },
  { key: 'next', label: 'Mật khẩu mới' },
  { key: 'confirm', label: 'Xác nhận mật khẩu mới' },
] as const;

function SecurityPanel({ account }: { account: AccountState }) {
  const tx = useUiCopy(ACCOUNT_EN_COPY);
  const [values, setValues] = useState<PasswordValues>(emptyPasswords);
  const [visible, setVisible] = useState({ current: false, next: false, confirm: false });
  const [errors, setErrors] = useState<Partial<Record<keyof PasswordValues, string>>>({});
  const { notice, clearNotice, showNotice } = useAccountNotice();
  const [validated, setValidated] = useState(false);
  const canReset = Object.values(values).some(Boolean) || Object.values(errors).some(Boolean);
  const fieldRefs = useRef<Partial<Record<keyof PasswordValues, HTMLInputElement | null>>>({});

  useEffect(() => {
    const clear = () => { setValues(emptyPasswords()); setVisible({ current: false, next: false, confirm: false }); setErrors({}); clearNotice(); setValidated(false); };
    const conceal = () => setVisible({ current: false, next: false, confirm: false });
    const onVisibilityChange = () => { if (document.hidden) conceal(); };
    window.addEventListener('blur', conceal);
    window.addEventListener('pagehide', clear);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('blur', conceal);
      window.removeEventListener('pagehide', clear);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [clearNotice]);

  function reset() { if (!canReset || account.pending.password) return; setValues(emptyPasswords()); setVisible({ current: false, next: false, confirm: false }); setErrors({}); clearNotice(); setValidated(false); }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (account.pending.password) return;
    const nextErrors = validatePasswords(values);
    setValidated(true);
    setErrors(nextErrors);
    const firstError = passwordFields.find(field => nextErrors[field.key]);
    if (firstError) { clearNotice(); fieldRefs.current[firstError.key]?.focus(); return; }
    clearNotice();
    const origin = submitOrigin(event);
    setVisible({ current: false, next: false, confirm: false });
    try {
      if (await account.changePassword({ currentPassword: values.current, newPassword: values.next })) {
        setValues(emptyPasswords()); setValidated(false); setErrors({});
        showNotice('Đã đổi mật khẩu. Sử dụng mật khẩu mới cho lần đăng nhập tiếp theo.', 'success', origin);
      }
    } catch (error) {
      if (error instanceof ApiRequestError && error.code === 'WRONG_CURRENT_PASSWORD') {
        setErrors(previous => ({ ...previous, current: error.message })); fieldRefs.current.current?.focus();
      } else showNotice(accountErrorMessage(error), 'error', origin);
    }
  }

  return <div className="account-layout">
    <section className="account-card" aria-label={tx('Đổi mật khẩu')}>
      <CardHeading icon="lock" title="Đổi mật khẩu" description="Nhập mật khẩu hiện tại và mật khẩu mới để cập nhật tài khoản." />
      <form className="account-form" noValidate autoComplete="off" onSubmit={submit}>
        <div className="account-field-grid">
          {passwordFields.map(field => <div key={field.key} className={`account-field${field.key === 'current' ? ' account-field--wide account-field--current-password' : ''}`}>
            <label htmlFor={`account-password-${field.key}`}>{tx(field.label)}<span className="account-required" aria-hidden="true"> *</span></label>
            <div className="account-password-field">
              <input
                ref={element => { fieldRefs.current[field.key] = element; }}
                id={`account-password-${field.key}`} className="account-input" type={visible[field.key] ? 'text' : 'password'}
                value={values[field.key]} autoComplete="off" spellCheck={false} required readOnly={account.pending.password}
                onChange={event => {
                  const next = { ...values, [field.key]: event.currentTarget.value };
                  setValues(next); clearNotice();
                  // Cross-field rules must follow both of their inputs after validation.
                  if (validated) setErrors(validatePasswords(next));
                }}
                aria-invalid={Boolean(errors[field.key]) || undefined} aria-describedby={errors[field.key] ? `account-password-${field.key}-error` : undefined}
              />
              <Button variant="ghost" iconOnly className="account-password-toggle" aria-label={`${tx(visible[field.key] ? 'Ẩn' : 'Hiện')} ${tx(field.label).toLocaleLowerCase()}`} aria-controls={`account-password-${field.key}`} aria-pressed={visible[field.key]} onClick={() => setVisible(previous => ({ ...previous, [field.key]: !previous[field.key] }))}>
                <Icon name={visible[field.key] ? 'eye-off' : 'eye'} size={20} />
              </Button>
            </div>
            {errors[field.key] && <p id={`account-password-${field.key}-error`} className="account-field-error">{tx(errors[field.key]!)}</p>}
          </div>)}
        </div>
        <p className="account-field-help account-security-help"><Icon name="info" size={18} />{tx('Mật khẩu mới cần từ 8 đến 128 ký tự và khác mật khẩu hiện tại.')}</p>
        <div className="account-form-actions">
          <Button type="submit" loading={account.pending.password} leadingIcon={<Icon name="lock" size={18} />}>{tx('Đổi mật khẩu')}</Button>
          <Button variant="secondary" aria-disabled={!canReset || account.pending.password} onClick={reset}>{tx('Xóa nội dung nhập')}</Button>
        </div>
        <AccountTransientNotice feedback={notice} onClose={clearNotice} />
      </form>
    </section>
    <aside className="account-aside" aria-label={tx('Hướng dẫn bảo mật')}>
      <section className="account-card account-card--aside account-card--tint">
        <CardHeading icon="shield" title="Máy tính dùng chung" />
        <ul className="account-tip-list"><li>{tx('Đăng xuất khi kết thúc ca hoặc rời máy.')}</li><li>{tx('Không lưu mật khẩu trên máy tính dùng chung tại kho.')}</li><li>{tx('Liên hệ quản trị viên nếu phát hiện truy cập bất thường.')}</li></ul>
        <Button variant="secondary" tone="danger" leadingIcon={<Icon name="logout" size={18} />} onClick={event => account.requestLogout(event.currentTarget)}>{tx('Đăng xuất')}</Button>
      </section>
    </aside>
  </div>;
}

function ThemePreview({ dark }: { dark: boolean }) {
  return <div className={`account-theme-preview${dark ? ' account-theme-preview--dark' : ''}`} aria-hidden="true"><div className="account-theme-preview__rail"><i /><b /><b /><b /></div><div className="account-theme-preview__body"><div className="account-theme-preview__bar" /><div className="account-theme-preview__stats"><i /><i /></div><div className="account-theme-preview__table"><i /><i /><i /></div></div></div>;
}

function SettingsPanel() {
  const tx = useUiCopy(ACCOUNT_EN_COPY);
  const { theme, setTheme, language, setLanguage } = useShellPreferences();
  const { notice, clearNotice, showNotice } = useAccountNotice();
  return <div className="account-layout">
    <section className="account-card" aria-label={tx('Giao diện và ngôn ngữ')}>
      <CardHeading icon="settings" title="Giao diện và ngôn ngữ" description="Các lựa chọn có hiệu lực ngay khi bạn thay đổi." />
      <fieldset className="account-theme-fieldset"><legend>{tx('Chế độ màu')}</legend><div className="account-theme-options">
        {(['light', 'dark'] as const).map(value => <label key={value} className="account-theme-option" data-selected={theme === value}>
          <div className="account-theme-option__label"><Icon name={value === 'light' ? 'sun' : 'moon'} size={21} /><span>{tx(value === 'light' ? 'Giao diện sáng' : 'Giao diện tối')}</span><input type="radio" name="account-theme" value={value} checked={theme === value} onChange={event => { setTheme(value); showNotice(value === 'light' ? 'Đang sử dụng giao diện sáng.' : 'Đang sử dụng giao diện tối.', 'info', event.currentTarget); }} /></div>
          <ThemePreview dark={value === 'dark'} />
        </label>)}
      </div></fieldset>
      <div className="account-settings-language account-field"><label htmlFor="account-language">{tx('Ngôn ngữ giao diện')}</label><BasicSelect id="account-language" value={language} onChange={event => { const next = parseShellLanguage(event.currentTarget.value); setLanguage(next); showNotice('Ngôn ngữ giao diện:', 'info', event.currentTarget, next); }} aria-describedby="account-language-help"><option value="vi">{tx('Tiếng Việt')}</option><option value="en">English</option><option value="zh-CN">简体中文</option></BasicSelect><p id="account-language-help" className="account-field-help">{tx('Ngôn ngữ áp dụng cho giao diện. Dữ liệu người dùng và mã nghiệp vụ được giữ nguyên.')}</p></div>
      <div className="account-autosave"><Icon name="circle-check" size={19} /><span>{tx('Tự lưu trên trình duyệt này.')}</span></div>
      <AccountTransientNotice feedback={notice} onClose={clearNotice} />
    </section>
    <aside className="account-aside" aria-label={tx('Phạm vi cài đặt giao diện')}><section className="account-card account-card--aside account-card--tint"><CardHeading icon="sun" title="Không gian làm việc của bạn" /><p>{tx('Chọn giao diện sáng cho nơi đủ ánh sáng, hoặc giao diện tối khi làm việc trong môi trường ít ánh sáng.')}</p><p className="account-aside-note">{tx('Lựa chọn được dùng lại khi bạn mở Hoa Nam WMS trên cùng trình duyệt.')}</p></section></aside>
  </div>;
}

const NOTIFICATION_ROWS = [
  { key: 'assignments', title: 'Công việc kho được giao', description: 'Cập nhật về nhiệm vụ và công việc được giao cho bạn.', icon: 'documents' },
  { key: 'discrepancies', title: 'Chênh lệch tồn kho cần xử lý', description: 'Thông tin chênh lệch cần kiểm tra trong phạm vi công việc.', icon: 'alert-triangle' },
  { key: 'accountActivity', title: 'Hoạt động tài khoản', description: 'Các thay đổi liên quan đến hồ sơ và bảo mật tài khoản.', icon: 'shield' },
] as const;

function NotificationsPanel({ account }: { account: AccountState }) {
  const tx = useUiCopy(ACCOUNT_EN_COPY);
  const { notice, clearNotice, showNotice } = useAccountNotice();
  const dirty = notificationDirty(account.notificationDraft, account.savedNotifications);
  const hasEmail = Boolean(account.savedProfile.email.trim());
  return <div className="account-layout account-layout--notifications">
    <section className="account-card" aria-label={tx('Tùy chọn thông báo')}>
      <CardHeading icon="bell" title="Nội dung và kênh nhận" description="Chọn những cập nhật bạn muốn nhận trong ứng dụng và qua email." />
      <form className="account-form" onSubmit={async event => {
        event.preventDefault(); if (!dirty || account.pending.notifications || account.pending.profile) return;
        clearNotice();
        const origin = submitOrigin(event);
        try { if (await account.saveNotifications()) showNotice('Đã lưu tùy chọn thông báo.', 'success', origin); }
        catch (error) { showNotice(accountErrorMessage(error), 'error', origin); }
      }}>
        <div className="account-notification-list">
          <div className="account-notification-columns" aria-hidden="true"><span>{tx('Loại thông báo')}</span><span>{tx('Trong ứng dụng')}</span><span>{tx('Email')}</span></div>
          {NOTIFICATION_ROWS.map(row => <div className="account-notification-row" key={row.key} role="group" aria-labelledby={`account-notification-${row.key}`}>
            <div className="account-notification-description"><span className="account-notification-icon"><Icon name={row.icon} size={21} /></span><div><h3 id={`account-notification-${row.key}`}>{tx(row.title)}</h3><p>{tx(row.description)}</p></div></div>
            {(['inApp', 'email'] as const).map(channel => <label key={channel} className="account-notification-channel" data-disabled={channel === 'email' && !hasEmail}>
              <input type="checkbox" checked={account.notificationDraft[row.key][channel]} disabled={channel === 'email' && !hasEmail} aria-label={`${tx(row.title)} — ${tx(channel === 'inApp' ? 'Trong ứng dụng' : 'Email')}`} aria-describedby={channel === 'email' && !hasEmail ? 'account-notifications-email-help' : undefined} onChange={event => { account.setNotificationDraft(row.key, channel, event.currentTarget.checked); clearNotice(); }} />
              <span>{tx(channel === 'inApp' ? 'Trong ứng dụng' : 'Email')}</span>
            </label>)}
          </div>)}
        </div>
        {!hasEmail && <p className="account-email-help" id="account-notifications-email-help"><Icon name="info" size={19} /><span>{tx('Bổ sung và lưu email công việc trong')} <a href="#/account/profile">{tx('Hồ sơ')}</a> {tx('để chọn kênh email.')}</span></p>}
        <div className="account-form-actions"><Button type="submit" loading={account.pending.notifications} aria-disabled={!dirty || account.pending.profile} leadingIcon={<Icon name="save" size={18} />}>{tx('Lưu thay đổi')}</Button><Button variant="secondary" aria-disabled={!dirty || account.pending.notifications} onClick={() => { if (!dirty || account.pending.notifications) return; account.resetNotifications(); clearNotice(); }}>{tx('Hoàn tác thay đổi')}</Button></div>
        <AccountTransientNotice feedback={notice} onClose={clearNotice} />
      </form>
    </section>
    <aside className="account-aside" aria-label={tx('Kênh liên hệ')}><section className="account-card account-card--aside account-card--tint"><CardHeading icon="bell" title="Kênh nhận thông báo" /><dl className="account-facts"><div><dt>{tx('Trong ứng dụng')}</dt><dd>{tx('Trung tâm thông báo Hoa Nam')}</dd></div><div><dt>{tx('Email công việc')}</dt><dd>{hasEmail ? account.savedProfile.email : tx('Chưa bổ sung email')}</dd></div></dl><a className="account-text-link" href="#/account/profile">{tx('Cập nhật thông tin liên hệ')} <Icon name="arrow-right" size={18} /></a></section></aside>
  </div>;
}

export function AccountCenterScreen({ panel }: { panel: AccountCenterPanel }) {
  const tx = useUiCopy(ACCOUNT_EN_COPY);
  const account = useAccountCenter();
  const revealFocus = useKeyboardFocusReveal();
  const screenRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let frame: number | null = null;
    const onResize = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        frame = null;
        const target = document.activeElement;
        if (target instanceof HTMLElement && screenRef.current?.contains(target)
          && target.matches(':focus-visible') && !target.matches(':open')
          && !document.querySelector('dialog[open]')) revealControl(target);
      });
    };
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); if (frame !== null) cancelAnimationFrame(frame); };
  }, []);
  if (!account) return null;
  const current = PANELS.find(item => item.key === panel) ?? PANELS[0];
  return <div className="account-center" data-account-panel={panel} ref={screenRef} onFocusCapture={revealFocus}>
    <header className="account-page-heading"><p className="account-eyebrow">{tx('TÀI KHOẢN CÁ NHÂN')}</p><h1>{tx(current.title)}</h1><p>{tx(current.description)}</p></header>
    <nav className="account-tabs" aria-label={tx('Cài đặt tài khoản')}>{PANELS.map(item => <a key={item.key} href={`#/account/${item.key}`} aria-current={panel === item.key ? 'page' : undefined}><Icon name={item.icon} size={20} /><span>{tx(item.label)}</span></a>)}</nav>
    {panel === 'profile' && <ProfilePanel account={account} />}
    {panel === 'security' && <SecurityPanel account={account} />}
    {panel === 'settings' && <SettingsPanel />}
    {panel === 'notifications' && <NotificationsPanel account={account} />}
  </div>;
}
