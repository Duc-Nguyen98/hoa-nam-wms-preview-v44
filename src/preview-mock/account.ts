import type { AccountRecord, AccountSession } from '../account/account-api-contract';
import { clearEmailPreferences, INITIAL_PROFILE, initialNotifications, normalizeProfile, NOTIFICATION_KEYS, validateProfileDraft } from '../account/account-center-model';
import { isRecord } from '../data/http/api-contract';
import { PreviewHttpError } from './errors';
import type { PreviewPersistence, PreviewSessionToken } from './storage';
import { startReadStorageDiagnostic } from '../data/read-diagnostics';

/** Public synthetic seed, never a warehouse credential or production authentication policy. */
export const PREVIEW_MOCK_CREDENTIALS = { username: 'ducquang', password: 'HoaNam@2026' } as const;
const SESSION_MS = 8 * 60 * 60 * 1000;
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const MAX_BODY_BYTES = 8 * 1024 * 1024;
interface MockSession { confirmed: boolean; expiresAt: number }
interface StoredAccount extends AccountRecord { passwordSalt: string; passwordHash: string }
interface BrowserMockState {
  loginRevision?: string;
  version: 1;
  mode: 'MOCK';
  passwordAlgorithm: 'PBKDF2-SHA256-120000';
  account: StoredAccount;
  sessions: Record<string, MockSession>;
  attempts: { count: number; since: number } | null;
}
export interface MockAccountOptions {
  credentialProfile?: PreviewCredentialProfile;
  persistence: PreviewPersistence;
  sessionToken: PreviewSessionToken;
  crypto?: Crypto;
  now?: () => number;
  namespace: string;
}
export interface PreviewCredentialProfile {
  revision: string;
  username: string;
  actorKey: string;
  passwordSalt: string;
  passwordHash: string;
}

const queues = new WeakMap<PreviewPersistence, Promise<unknown>>();
function serialized<T>(persistence: PreviewPersistence, namespace: string, task: () => Promise<T>): Promise<T> {
  const queue = startReadStorageDiagnostic('account.queue-wait');
  const execute = () => {
    queue.phase('queue.ready'); queue.finish();
    if (typeof navigator === 'undefined' || !navigator.locks) return task();
    const webLock = startReadStorageDiagnostic('account.web-lock-wait');
    webLock.phase('web-lock.request');
    try { return navigator.locks.request(`${namespace}:account`, () => { webLock.phase('web-lock.enter'); webLock.finish(); return task(); })
      .catch(error => { webLock.finish('failure'); throw error; }); }
    catch (error) { webLock.finish('failure'); throw error; }
  };
  const next = (queues.get(persistence) ?? Promise.resolve()).then(execute, execute);
  queues.set(persistence, next.catch(() => undefined));
  return next;
}
function toHex(bytes: Uint8Array) { return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join(''); }
function bytesFromHex(value: string) { return Uint8Array.from(value.match(/../g) ?? [], byte => Number.parseInt(byte, 16)); }
function validStoredState(value: unknown): value is BrowserMockState {
  if (!isRecord(value) || value.version !== 1 || value.mode !== 'MOCK' || value.passwordAlgorithm !== 'PBKDF2-SHA256-120000'
    || !isRecord(value.account) || !isRecord(value.sessions)) return false;
  const account = value.account;
  const { profile, identity, notifications } = account;
  if (!isRecord(profile) || !isRecord(identity) || !isRecord(notifications)
    || !['displayName', 'email', 'phone'].every(key => typeof profile[key] === 'string')
    || !['username', 'roleLabel', 'warehouseLabel', 'warehouseStatusLabel'].every(key => typeof identity[key] === 'string')
    || !(account.avatar === null || typeof account.avatar === 'string')
    || typeof account.passwordSalt !== 'string' || !/^[a-f0-9]{32}$/.test(account.passwordSalt)
    || typeof account.passwordHash !== 'string' || !/^[a-f0-9]{64}$/.test(account.passwordHash)
    || !NOTIFICATION_KEYS.every(key => isRecord(notifications[key]) && typeof notifications[key].inApp === 'boolean' && typeof notifications[key].email === 'boolean')) return false;
  if (!Object.entries(value.sessions).every(([key, session]) => /^[a-f0-9]{64}$/.test(key) && isRecord(session)
    && typeof session.confirmed === 'boolean' && typeof session.expiresAt === 'number' && Number.isFinite(session.expiresAt))) return false;
  return value.attempts === null || isRecord(value.attempts) && Number.isSafeInteger(value.attempts.count) && Number(value.attempts.count) >= 0 && typeof value.attempts.since === 'number';
}

function plainAccount(account: StoredAccount): AccountRecord {
  const { profile, avatar, notifications, identity } = account;
  return structuredClone({ profile, avatar, notifications, identity });
}
function avatarValue(value: unknown): string | null {
  if (value === null) return null;
  if (typeof value !== 'string') throw new PreviewHttpError(422, 'INVALID_AVATAR', 'Chọn ảnh JPG, PNG hoặc WebP.');
  const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value);
  if (!match) throw new PreviewHttpError(422, 'INVALID_AVATAR', 'Ảnh đại diện không hợp lệ.');
  let decoded: string;
  try { decoded = atob(match[2]); } catch { throw new PreviewHttpError(422, 'INVALID_AVATAR', 'Ảnh đại diện không hợp lệ.'); }
  const bytes = Uint8Array.from(decoded, character => character.charCodeAt(0));
  if (!bytes.length || bytes.length > MAX_AVATAR_BYTES) throw new PreviewHttpError(422, 'INVALID_AVATAR', 'Ảnh đại diện phải có dung lượng không quá 5 MB.');
  const valid = match[1] === 'png' ? bytes.length >= 24 && [137,80,78,71,13,10,26,10].every((byte, index) => bytes[index] === byte)
    : match[1] === 'jpeg' ? bytes.length >= 4 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
    : bytes.length >= 16 && decoded.slice(0, 4) === 'RIFF' && decoded.slice(8, 12) === 'WEBP';
  if (!valid) throw new PreviewHttpError(422, 'INVALID_AVATAR', 'Tệp không phải ảnh hợp lệ hoặc đã hỏng.');
  if (match[1] === 'png') {
    const view = new DataView(bytes.buffer);
    const width = view.getUint32(16), height = view.getUint32(20);
    if (!width || !height || width > 8192 || height > 8192 || width * height > 24_000_000) {
      throw new PreviewHttpError(422, 'INVALID_AVATAR', 'Chọn ảnh tối đa 24 megapixel và mỗi cạnh không quá 8192 px.');
    }
  }
  return `data:image/${match[1]};base64,${btoa(decoded)}`;
}
export function readMockBody(data: unknown, contentType: unknown): Record<string, unknown> {
  if (typeof contentType !== 'string' || !contentType.toLowerCase().startsWith('application/json')) {
    throw new PreviewHttpError(415, 'INVALID_CONTENT_TYPE', 'Nội dung yêu cầu không hợp lệ.');
  }
  let raw: string;
  try { raw = typeof data === 'string' ? data : JSON.stringify(data); } catch { throw new PreviewHttpError(400, 'INVALID_JSON', 'Nội dung yêu cầu không hợp lệ.'); }
  if (typeof raw !== 'string') throw new PreviewHttpError(400, 'INVALID_JSON', 'Nội dung yêu cầu không hợp lệ.');
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) throw new PreviewHttpError(413, 'PAYLOAD_TOO_LARGE', 'Nội dung gửi lên vượt quá giới hạn.');
  let value: unknown;
  try { value = JSON.parse(raw); } catch { throw new PreviewHttpError(400, 'INVALID_JSON', 'Nội dung yêu cầu không hợp lệ.'); }
  if (!isRecord(value)) throw new PreviewHttpError(400, 'INVALID_JSON', 'Nội dung yêu cầu không hợp lệ.');
  return value;
}

export function createMockAccount(options: MockAccountOptions) {
  const now = options.now ?? Date.now;
  const webCrypto = options.crypto ?? globalThis.crypto;
  function randomHex(length: number): string {
    if (!webCrypto?.subtle) throw new PreviewHttpError(503, 'MOCK_CRYPTO_UNAVAILABLE', 'Trình duyệt chưa hỗ trợ lưu mật khẩu MOCK.');
    return toHex(webCrypto.getRandomValues(new Uint8Array(length)));
  }
  async function passwordDigest(value: string, salt: string) {
    if (!webCrypto?.subtle) throw new PreviewHttpError(503, 'MOCK_CRYPTO_UNAVAILABLE', 'Trình duyệt chưa hỗ trợ lưu mật khẩu MOCK.');
    const key = await webCrypto.subtle.importKey('raw', new TextEncoder().encode(value), 'PBKDF2', false, ['deriveBits']);
    const digest = await webCrypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: bytesFromHex(salt), iterations: 120_000 }, key, 256);
    return toHex(new Uint8Array(digest));
  }
  async function correctPassword(account: StoredAccount, password: string) {
    const actual = await passwordDigest(password, account.passwordSalt);
    let difference = actual.length ^ account.passwordHash.length;
    for (let index = 0; index < actual.length; index++) difference |= actual.charCodeAt(index) ^ account.passwordHash.charCodeAt(index);
    return difference === 0;
  }
  async function loadState(signal: AbortSignal, span: ReturnType<typeof startReadStorageDiagnostic>): Promise<BrowserMockState> {
    span.phase('load.read.start');
    const value = await options.persistence.read(); signal.throwIfAborted();
    span.phase('load.read.end');
    if (value !== null) {
      if (!validStoredState(value)) throw new PreviewHttpError(500, 'INVALID_MOCK_STATE', 'Dữ liệu MOCK đã lưu chưa hợp lệ. Hãy đặt lại bản xem thử.');
      const profile = options.credentialProfile;
      if (profile && value.loginRevision !== profile.revision) {
        const migrated: BrowserMockState = { ...value, loginRevision: profile.revision, sessions: {}, attempts: null,
          account: { ...value.account, identity: { ...value.account.identity, username: profile.username },
            passwordSalt: profile.passwordSalt, passwordHash: profile.passwordHash } };
        signal.throwIfAborted();
        await options.persistence.write(migrated);
        options.sessionToken.write('');
        signal.throwIfAborted();
        return migrated;
      }
      return value;
    }
    const passwordSalt = randomHex(16);
    const state: BrowserMockState = {
      version: 1, mode: 'MOCK', passwordAlgorithm: 'PBKDF2-SHA256-120000', sessions: {}, attempts: null,
      account: { profile: { ...INITIAL_PROFILE }, avatar: null, notifications: initialNotifications(),
        identity: { username: PREVIEW_MOCK_CREDENTIALS.username, roleLabel: 'Nhân viên kho', warehouseLabel: 'Kho Hoa Nam', warehouseStatusLabel: 'Đang hoạt động' },
        passwordSalt, passwordHash: await passwordDigest(PREVIEW_MOCK_CREDENTIALS.password, passwordSalt) },
    };
    if (options.credentialProfile) {
      const profile = options.credentialProfile;
      state.loginRevision = profile.revision;
      state.account.identity.username = profile.username;
      state.account.passwordSalt = profile.passwordSalt;
      state.account.passwordHash = profile.passwordHash;
    }
    signal.throwIfAborted(); await options.persistence.write(state); signal.throwIfAborted();
    return state;
  }
  async function load(signal: AbortSignal): Promise<BrowserMockState> {
    const span = startReadStorageDiagnostic('account.load');
    try { const value = await loadState(signal, span); span.finish(); return value; }
    catch (error) { span.finish('failure'); throw error; }
  }
  function current(state: BrowserMockState): MockSession | null {
    const token = options.sessionToken.read(), session = state.sessions[token];
    if (session && session.expiresAt > now()) return session;
    if (token) delete state.sessions[token];
    return null;
  }
  function needSession(state: BrowserMockState, active = true) {
    const session = current(state);
    if (!session) throw new PreviewHttpError(401, 'SESSION_EXPIRED', 'Phiên đăng nhập đã kết thúc. Vui lòng đăng nhập lại.');
    if (active && !session.confirmed) throw new PreviewHttpError(403, 'CONFIRMATION_REQUIRED', 'Vui lòng xác nhận phiên làm việc trước khi tiếp tục.');
    return session;
  }
  function snapshot(state: BrowserMockState, session: MockSession | null): AccountSession {
    return session ? { state: session.confirmed ? 'active' : 'confirmation-required', account: plainAccount(state.account) } : { state: 'signed-out' };
  }
  async function persist(state: BrowserMockState, signal: AbortSignal, onCommitted?: () => void) {
    signal.throwIfAborted(); await options.persistence.write(state);
    // A canceled response cannot undo a durable session transition. Update its
    // local token before reporting cancellation, so recovery fences see it.
    onCommitted?.(); signal.throwIfAborted();
  }
  return {
    /** Opaque internal comparison; the mock token never leaves this closure. */
    captureRecoveryReadFence() {
      const token = options.sessionToken.read();
      return () => {
        if (!token || options.sessionToken.read() !== token) throw new PreviewHttpError(401, 'RECOVERY_ACTOR_MISMATCH', 'Phiên làm việc đã thay đổi.');
      };
    },
    /** Recovery identity only. Existing confirmed mock session is the source;
     * this is not a business capability binding or production authorization. */
    async recoveryActor() {
      return serialized(options.persistence, options.namespace, async () => {
        const state = await load(new AbortController().signal), session = current(state);
        if (!session) return null;
        return { key: options.credentialProfile?.actorKey ?? `preview:${state.account.identity.username}`, confirmed: session.confirmed, expiresAt: session.expiresAt };
      });
    },
    async reset() {
      return serialized(options.persistence, options.namespace, async () => { await options.persistence.clear(); options.sessionToken.write(''); });
    },
    async route(method: string, path: string, data: unknown, contentType: unknown, signal: AbortSignal): Promise<{ handled: true; data: unknown } | { handled: false }> {
      return serialized(options.persistence, options.namespace, async () => {
        signal.throwIfAborted();
        const state = await load(signal), route = `${method} ${path}`;
        const done = (value: unknown) => ({ handled: true as const, data: value });
        if (route === 'GET /api/v1/auth/session') return done(snapshot(state, current(state)));
        if (route === 'POST /api/v1/auth/login') {
          const body = readMockBody(data, contentType);
          if (typeof body.username !== 'string' || typeof body.password !== 'string' || !body.username.trim() || !body.password) throw new PreviewHttpError(422, 'REQUIRED_FIELDS', 'Nhập tên đăng nhập và mật khẩu.');
          if (body.username.length > 120 || body.password.length > 128) throw new PreviewHttpError(422, 'INVALID_CREDENTIALS', 'Tên đăng nhập hoặc mật khẩu không đúng.');
          const attempt = state.attempts;
          if (attempt && now() - attempt.since < 60_000 && attempt.count >= 10) throw new PreviewHttpError(429, 'TOO_MANY_ATTEMPTS', 'Đăng nhập chưa thành công nhiều lần. Vui lòng thử lại sau một phút.');
          if (body.username.trim().toLocaleLowerCase('vi') !== state.account.identity.username || !await correctPassword(state.account, body.password)) {
            state.attempts = attempt && now() - attempt.since < 60_000 ? { ...attempt, count: attempt.count + 1 } : { count: 1, since: now() };
            await persist(state, signal);
            throw new PreviewHttpError(401, 'INVALID_CREDENTIALS', 'Tên đăng nhập hoặc mật khẩu không đúng.');
          }
          state.attempts = null;
          delete state.sessions[options.sessionToken.read()];
          const token = randomHex(32), session = { confirmed: false, expiresAt: now() + SESSION_MS };
          state.sessions[token] = session; await persist(state, signal, () => options.sessionToken.write(token));
          return done(snapshot(state, session));
        }
        if (route === 'POST /api/v1/auth/logout') {
          readMockBody(data, contentType); delete state.sessions[options.sessionToken.read()];
          await persist(state, signal, () => options.sessionToken.write('')); return done({ completed: true });
        }
        if (route === 'POST /api/v1/auth/confirm') {
          readMockBody(data, contentType); const session = needSession(state, false); session.confirmed = true;
          await persist(state, signal); return done(snapshot(state, session));
        }
        if (route === 'GET /api/v1/account') { needSession(state); return done(plainAccount(state.account)); }
        if (route === 'PUT /api/v1/account/profile') {
          needSession(state); const body = readMockBody(data, contentType);
          if (!['displayName', 'email', 'phone'].every(key => typeof body[key] === 'string') || !Object.hasOwn(body, 'avatar')) throw new PreviewHttpError(422, 'INVALID_PROFILE', 'Thông tin hồ sơ chưa đầy đủ.');
          const profile = normalizeProfile({ displayName: body.displayName as string, email: body.email as string, phone: body.phone as string });
          const errors = validateProfileDraft(profile);
          if (Object.keys(errors).length) throw new PreviewHttpError(422, 'INVALID_PROFILE', Object.values(errors)[0]!, errors);
          const avatar = avatarValue(body.avatar);
          state.account = { ...state.account, profile, avatar, notifications: profile.email ? state.account.notifications : clearEmailPreferences(state.account.notifications) };
          await persist(state, signal); return done(plainAccount(state.account));
        }
        if (route === 'PUT /api/v1/account/notifications') {
          needSession(state); const body = readMockBody(data, contentType);
          if (Object.keys(body).length !== NOTIFICATION_KEYS.length || !NOTIFICATION_KEYS.every(key => {
            const row = body[key]; return isRecord(row) && typeof row.inApp === 'boolean' && typeof row.email === 'boolean';
          })) throw new PreviewHttpError(422, 'INVALID_PREFERENCES', 'Tùy chọn thông báo chưa hợp lệ.');
          state.account.notifications = Object.fromEntries(NOTIFICATION_KEYS.map(key => {
            const row = body[key] as { inApp: boolean; email: boolean };
            if (row.email && !state.account.profile.email) throw new PreviewHttpError(422, 'EMAIL_REQUIRED', 'Bổ sung email công việc trước khi chọn kênh email.');
            return [key, { inApp: row.inApp, email: row.email }];
          })) as AccountRecord['notifications'];
          await persist(state, signal); return done(plainAccount(state.account));
        }
        if (route === 'POST /api/v1/account/password') {
          needSession(state); const body = readMockBody(data, contentType);
          if (typeof body.currentPassword !== 'string' || typeof body.newPassword !== 'string' || !body.currentPassword || !body.newPassword) throw new PreviewHttpError(422, 'REQUIRED_PASSWORDS', 'Nhập mật khẩu hiện tại và mật khẩu mới.');
          if (body.currentPassword.length > 128 || body.newPassword.length > 128) throw new PreviewHttpError(422, 'INVALID_PASSWORD', 'Mật khẩu không quá 128 ký tự.');
          if (!await correctPassword(state.account, body.currentPassword)) throw new PreviewHttpError(422, 'WRONG_CURRENT_PASSWORD', 'Mật khẩu hiện tại không đúng.');
          if (body.newPassword === body.currentPassword) throw new PreviewHttpError(422, 'SAME_PASSWORD', 'Mật khẩu mới cần khác mật khẩu hiện tại.');
          if (body.newPassword.length < 8) throw new PreviewHttpError(422, 'SHORT_PASSWORD', 'Mật khẩu mới cần ít nhất 8 ký tự.');
          const passwordSalt = randomHex(16);
          state.account = { ...state.account, passwordSalt, passwordHash: await passwordDigest(body.newPassword, passwordSalt) };
          const currentToken = options.sessionToken.read();
          for (const token of Object.keys(state.sessions)) if (token !== currentToken) delete state.sessions[token];
          await persist(state, signal); return done({ completed: true });
        }
        if (path.startsWith('/api/v1/auth/') || path === '/api/v1/account' || path.startsWith('/api/v1/account/')) throw new PreviewHttpError(404, 'NOT_FOUND', 'Không tìm thấy thao tác yêu cầu.');
        if (path.startsWith('/api/v1/') && path !== '/api/v1/health') needSession(state);
        return { handled: false as const };
      });
    },
  };
}
