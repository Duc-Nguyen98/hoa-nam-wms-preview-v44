import { PreviewHttpError } from './errors';
import { startReadStorageDiagnostic } from '../data/read-diagnostics';

export const BUSINESS_STORAGE_NAMESPACE = 'hoa-nam-wms-preview-business-v1';
export interface BusinessTransaction<T> { value: T; write?: unknown }
export interface BusinessPersistence {
  /** Callback must be synchronous: read, compare and write share one transaction. */
  transact<T>(change: (raw: unknown | null) => BusinessTransaction<T>, signal?: AbortSignal): Promise<T>;
}
const unavailable = () => new PreviewHttpError(503, 'MOCK_STORAGE_UNAVAILABLE', 'Không thể lưu dữ liệu xem trước trên trình duyệt.');

export function createIndexedDbBusinessPersistence(
  namespace = BUSINESS_STORAGE_NAMESPACE, factory: IDBFactory | undefined = globalThis.indexedDB,
): BusinessPersistence {
  if (namespace.startsWith('hoa-nam-wms-preview-mock-v1')) throw new Error('Business storage must not use the account namespace');
  let connection: Promise<IDBDatabase> | undefined;
  function open(): Promise<IDBDatabase> {
    if (!factory) return Promise.reject(unavailable());
    return connection ??= new Promise((resolve, reject) => {
      const request = factory.open(namespace, 1);
      let failed = false;
      const fail = () => { failed = true; connection = undefined; reject(unavailable()); };
      request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains('business')) request.result.createObjectStore('business'); };
      request.onerror = fail; request.onblocked = fail;
      request.onsuccess = () => {
        if (failed) { request.result.close(); return; }
        request.result.onversionchange = () => { request.result.close(); connection = undefined; };
        resolve(request.result);
      };
    });
  }
  return {
    async transact<T>(change: (raw: unknown | null) => BusinessTransaction<T>, signal?: AbortSignal): Promise<T> {
      signal?.throwIfAborted();
      const span = startReadStorageDiagnostic('business.idb.transaction');
      let db: IDBDatabase;
      span.phase('open.start');
      try { db = await open(); span.phase('open.end'); } catch { span.finish('failure'); throw unavailable(); }
      try { signal?.throwIfAborted(); } catch (error) { span.finish('failure'); throw error; }
      return new Promise<T>((resolve, reject) => {
        let transaction: IDBTransaction;
        try { span.phase('transaction.queued'); transaction = db.transaction('business', 'readwrite'); span.phase('transaction.create'); } catch { span.finish('failure'); reject(unavailable()); return; }
        let value: T, failure: unknown;
        const abort = () => { failure = signal?.reason; try { transaction.abort(); } catch { /* Completion owns an already committed outcome. */ } };
        const clean = () => signal?.removeEventListener('abort', abort);
        transaction.oncomplete = () => { clean(); span.phase('transaction.complete'); span.finish(); resolve(value); };
        transaction.onabort = () => { clean(); span.phase('transaction.abort'); span.finish('failure'); reject(failure ?? unavailable()); };
        transaction.onerror = () => { /* onabort reports the final transaction outcome. */ };
        signal?.addEventListener('abort', abort, { once: true });
        let store: IDBObjectStore;
        let request: IDBRequest<IDBCursorWithValue | null>;
        try { store = transaction.objectStore('business'); span.phase('cursor.request'); request = store.openCursor(IDBKeyRange.only('state')); }
        catch (error) { span.finish('failure'); reject(error); return; }
        request.onsuccess = () => {
          try {
            span.phase('cursor.result');
            signal?.throwIfAborted();
            // A missing key may be seeded; an explicitly stored null/undefined is corruption.
            if (request.result && request.result.value == null) throw new PreviewHttpError(503, 'MOCK_STATE_INVALID', 'Không thể đọc dữ liệu xem trước đã lưu.');
            span.phase('change.start');
            const result = change(request.result ? request.result.value : null);
            span.phase('change.end');
            signal?.throwIfAborted();
            if (!result || typeof result !== 'object' || !Object.hasOwn(result, 'value') || 'then' in result) throw new TypeError('Business transaction callback must return a synchronous value');
            span.phase('clone.start');
            value = structuredClone(result.value);
            if (Object.hasOwn(result, 'write')) store.put(structuredClone(result.write), 'state');
            span.phase('clone.end');
          } catch (error) {
            failure ??= error;
            span.finish('failure');
            try { transaction.abort(); } catch { /* A synchronous signal may already have aborted it. */ }
          }
        };
      });
    },
  };
}

/** Explicit test backing only. Browser installation never silently falls back to memory. */
export function createMemoryBusinessPersistence(initial: unknown | null = null): BusinessPersistence {
  let raw = structuredClone(initial), tail = Promise.resolve();
  return {
    transact<T>(change: (raw: unknown | null) => BusinessTransaction<T>, signal?: AbortSignal): Promise<T> {
      const run = tail.then(() => {
        signal?.throwIfAborted();
        const result = change(structuredClone(raw));
        if (!result || !Object.hasOwn(result, 'value') || 'then' in result) throw new TypeError('Synchronous transaction required');
        const value = structuredClone(result.value);
        const write = Object.hasOwn(result, 'write') ? structuredClone(result.write) : undefined;
        signal?.throwIfAborted();
        if (Object.hasOwn(result, 'write')) raw = write;
        return value;
      });
      tail = run.then(() => undefined, () => undefined);
      return run;
    },
  };
}
