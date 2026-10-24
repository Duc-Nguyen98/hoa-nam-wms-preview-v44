import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import { apiClient, ApiRequestError } from '../data/http/api-client';
import { API_VERSION, isRecord } from '../data/http/api-contract';
import { NOTIFICATION_KEYS } from './account-center-model';
import type { AccountHttpApi, AccountRecord, AccountSession } from './account-api-contract';

function isAccount(value: unknown): value is AccountRecord {
  if (!isRecord(value) || !isRecord(value.profile) || !isRecord(value.identity) || !isRecord(value.notifications)) return false;
  const { profile, identity, notifications } = value;
  if (!['displayName', 'email', 'phone'].every(key => typeof profile[key] === 'string')
    || !['username', 'roleLabel', 'warehouseLabel', 'warehouseStatusLabel'].every(key => typeof identity[key] === 'string')
    || !(value.avatar === null || typeof value.avatar === 'string' && /^data:image\/(jpeg|png|webp);base64,/.test(value.avatar))) return false;
  return NOTIFICATION_KEYS.every(key => {
    const preference = notifications[key];
    return isRecord(preference) && typeof preference.inApp === 'boolean' && typeof preference.email === 'boolean';
  });
}
function isSession(value: unknown): value is AccountSession {
  return isRecord(value) && (value.state === 'signed-out'
    || ['confirmation-required', 'active'].includes(String(value.state)) && isAccount(value.account));
}
const isAcknowledged = (value: unknown): value is { completed: true } => isRecord(value) && value.completed === true;

export function createAccountHttpApi(client: AxiosInstance = apiClient): AccountHttpApi {
  async function request<T>(config: AxiosRequestConfig, validate: (value: unknown) => value is T): Promise<T> {
    const response = await client.request<unknown>({ ...config, withCredentials: true });
    const envelope = response.data;
    if (!isRecord(envelope) || envelope.apiVersion !== API_VERSION || typeof envelope.requestId !== 'string' || !validate(envelope.data)) {
      throw new ApiRequestError('INVALID_RESPONSE', 'Thông tin tài khoản trả về chưa hợp lệ. Vui lòng thử lại.', response.status);
    }
    return envelope.data;
  }
  return {
    session: signal => request({ method: 'GET', url: 'auth/session', signal }, isSession),
    login: (username, password, signal) => request({ method: 'POST', url: 'auth/login', data: { username, password }, signal }, isSession),
    confirm: signal => request({ method: 'POST', url: 'auth/confirm', data: {}, signal }, isSession),
    async logout(signal) { await request({ method: 'POST', url: 'auth/logout', data: {}, signal }, isAcknowledged); },
    profile: (value, signal) => request({ method: 'PUT', url: 'account/profile', data: value, signal }, isAccount),
    notifications: (value, signal) => request({ method: 'PUT', url: 'account/notifications', data: value, signal }, isAccount),
    async password(value, signal) { await request({ method: 'POST', url: 'account/password', data: value, signal }, isAcknowledged); },
  };
}
export const accountHttpApi = createAccountHttpApi();
