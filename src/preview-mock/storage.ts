import { PreviewHttpError } from './errors';

export interface PreviewPersistence {
  read(): Promise<unknown | null>;
  write(value: unknown): Promise<void>;
  clear(): Promise<void>;
}
export interface PreviewSessionToken { read(): string; write(value: string): void }
export const PREVIEW_STORAGE_NAMESPACE = 'hoa-nam-wms-preview-mock-v1';

const storageError = () => new PreviewHttpError(503, 'MOCK_STORAGE_UNAVAILABLE', 'Không thể lưu dữ liệu MOCK trên trình duyệt. Vui lòng kiểm tra quyền lưu trữ và thử lại.');

/** IndexedDB holds the mock profile/avatar/digest; no real credentials or remote service. */
export function createIndexedDbPersistence(namespace = PREVIEW_STORAGE_NAMESPACE, factory: IDBFactory | undefined = globalThis.indexedDB): PreviewPersistence {
  let connection: Promise<IDBDatabase> | undefined;
  function database(): Promise<IDBDatabase> {
    if (!factory) return Promise.reject(storageError());
    return connection ??= new Promise<IDBDatabase>((resolve, reject) => {
      const request = factory.open(namespace, 1);
      let rejected = false;
      request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains('mock-state')) request.result.createObjectStore('mock-state'); };
      const fail = () => { rejected = true; connection = undefined; reject(storageError()); };
      request.onerror = fail;
      request.onblocked = fail;
      request.onsuccess = () => {
        if (rejected) { request.result.close(); return; }
        request.result.onversionchange = () => { request.result.close(); connection = undefined; };
        resolve(request.result);
      };
    });
  }
  async function transaction(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest): Promise<unknown> {
    try {
      const db = await database();
      return await new Promise((resolve, reject) => {
        const transaction = db.transaction('mock-state', mode);
        const request = action(transaction.objectStore('mock-state'));
        let result: unknown;
        request.onsuccess = () => { result = request.result; };
        request.onerror = () => reject(storageError());
        transaction.onabort = () => reject(storageError());
        transaction.onerror = () => reject(storageError());
        // A successful request is not a committed write. Resolve only after the transaction commits.
        transaction.oncomplete = () => resolve(result);
      });
    } catch { throw storageError(); }
  }
  return {
    async read() { return (await transaction('readonly', store => store.get('state'))) ?? null; },
    async write(value) { await transaction('readwrite', store => store.put(structuredClone(value), 'state')); },
    async clear() { await transaction('readwrite', store => store.delete('state')); },
  };
}

/** A small shared-browser token, analogous only to the mock cookie's lifecycle. Not a security boundary. */
export function createBrowserSessionToken(namespace = PREVIEW_STORAGE_NAMESPACE): PreviewSessionToken {
  const key = `${namespace}:session`;
  return {
    read() { try { return globalThis.localStorage.getItem(key) ?? ''; } catch { throw storageError(); } },
    write(value) { try { if (value) globalThis.localStorage.setItem(key, value); else globalThis.localStorage.removeItem(key); } catch { throw storageError(); } },
  };
}

/** Explicit test dependency. Production installation never falls back to memory. */
export function createMemoryPersistence(): PreviewPersistence {
  let state: unknown = null;
  return { async read() { return structuredClone(state); }, async write(value) { state = structuredClone(value); }, async clear() { state = null; } };
}
export function createMemorySessionToken(): PreviewSessionToken {
  let token = '';
  return { read: () => token, write(value) { token = value; } };
}
