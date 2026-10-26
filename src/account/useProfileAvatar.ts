import { useEffect, useRef, useState } from 'react';

const MAX_BYTES = 5 * 1024 * 1024;
const FORMATS = new Set(['image/jpeg', 'image/png', 'image/webp']);

/** Validate locally; the caller owns the temporary display URL. */
function readAvatar(file: File, signal: AbortSignal): Promise<string> {
  if (!FORMATS.has(file.type)) return Promise.reject(new Error('Chọn ảnh JPG, PNG hoặc WebP.'));
  if (!file.size) return Promise.reject(new Error('Tệp ảnh trống. Vui lòng chọn ảnh khác.'));
  if (file.size > MAX_BYTES) return Promise.reject(new Error('Ảnh vượt quá 5 MB. Vui lòng chọn ảnh nhỏ hơn.'));
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    let settled = false;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal.removeEventListener('abort', abort);
      image.onload = null; image.onerror = null;
      if (error) { image.src = ''; URL.revokeObjectURL(url); reject(error); }
      else resolve(url);
    };
    const abort = () => finish(new DOMException('Cancelled', 'AbortError'));
    const timer = window.setTimeout(() => finish(new Error('Không đọc được ảnh. Vui lòng chọn ảnh khác.')), 15000);
    image.onload = () => {
      const { naturalWidth: width, naturalHeight: height } = image;
      if (!width || !height) finish(new Error('Không đọc được ảnh. Vui lòng chọn ảnh khác.'));
      else if (width > 8192 || height > 8192 || width * height > 24000000) finish(new Error('Kích thước ảnh quá lớn. Chọn ảnh tối đa 24 megapixel và mỗi cạnh không quá 8192 px.'));
      else finish();
    };
    image.onerror = () => finish(new Error('Tệp không phải ảnh hợp lệ hoặc đã hỏng. Vui lòng chọn ảnh khác.'));
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) abort(); else image.src = url;
  });
}

export function useProfileAvatar() {
  const [draft, setDraft] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const request = useRef<AbortController | null>(null);
  const urls = useRef(new Set<string>());
  const files = useRef(new Map<string, File>());

  useEffect(() => {
    for (const url of urls.current) {
      if (url !== draft && url !== saved) { URL.revokeObjectURL(url); urls.current.delete(url); files.current.delete(url); }
    }
  }, [draft, saved]);
  useEffect(() => () => {
    request.current?.abort(); request.current = null;
    for (const url of urls.current) URL.revokeObjectURL(url);
    urls.current.clear();
    files.current.clear();
  }, []);

  function cancel() { request.current?.abort(); request.current = null; setPending(false); setError(''); }
  async function select(file: File) {
    cancel();
    const controller = new AbortController(); request.current = controller;
    setPending(true);
    try {
      const url = await readAvatar(file, controller.signal);
      if (controller.signal.aborted || request.current !== controller) { URL.revokeObjectURL(url); return; }
      urls.current.add(url); files.current.set(url, file); setDraft(url);
    } catch (failure) {
      if (!controller.signal.aborted && request.current === controller) setError(failure instanceof Error ? failure.message : 'Không đọc được ảnh. Vui lòng chọn ảnh khác.');
    } finally {
      if (request.current === controller) { request.current = null; setPending(false); }
    }
  }
  return {
    draft, saved, pending, error, dirty: draft !== saved, select,
    save() { if (!pending) { setSaved(draft); setError(''); } },
    async serialize(signal?: AbortSignal): Promise<string | null> {
      if (!draft || draft.startsWith('data:')) return draft;
      const file = files.current.get(draft);
      if (!file) throw new Error('Không đọc được ảnh đã chọn. Vui lòng chọn lại ảnh.');
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        const abort = () => reader.abort();
        const finish = (failure?: Error) => {
          signal?.removeEventListener('abort', abort);
          if (failure) reject(failure); else resolve(String(reader.result));
        };
        reader.onload = () => finish();
        reader.onerror = () => finish(new Error('Không đọc được ảnh đã chọn. Vui lòng thử lại.'));
        reader.onabort = () => finish(new DOMException('Cancelled', 'AbortError'));
        signal?.addEventListener('abort', abort, { once: true });
        if (signal?.aborted) { signal.removeEventListener('abort', abort); reject(new DOMException('Cancelled', 'AbortError')); return; }
        reader.readAsDataURL(file);
      });
    },
    hydrate(value: string | null) { cancel(); setDraft(value); setSaved(value); },
    commit(value: string | null, submittedDraft: string | null) {
      setSaved(value); setDraft(current => current === submittedDraft ? value : current); setError('');
    },
    reset() { cancel(); setDraft(saved); },
    remove() { cancel(); setDraft(null); },
    clear() { cancel(); setDraft(null); setSaved(null); },
  };
}
