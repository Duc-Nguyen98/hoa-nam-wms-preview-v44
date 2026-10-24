import { useMemo, useState } from 'react';
import { serializeQaDiagnostic, type QaSerializationScope } from '../data/read-diagnostics';
import { Button } from '../shared';
import { useShellPreferences } from '../shared/shell-preferences';

/** Large QA payloads are inspected explicitly; closed panels do not create a
 * multi-megabyte text node while authority/storage reads are still settling. */
export function QaJsonDetails({ label, value, scope, observation = false }: {
  label: string; value: unknown; scope: QaSerializationScope; observation?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);
  const { language } = useShellPreferences(), en = language === 'en';
  const text = useMemo(() => open ? serializeQaDiagnostic(value, scope) : undefined, [open, value, scope]);
  const size = 50_000, length = text?.length ?? 0;
  const lastPage = Math.max(0, Math.ceil(length / size) - 1), currentPage = Math.min(page, lastPage);
  const from = currentPage * size, complete = length <= size;
  function download() {
    if (text === undefined) return;
    const url = URL.createObjectURL(new Blob([text], { type: 'application/json;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `HoaNam-QA-${scope}.json`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <details onToggle={event => setOpen(event.currentTarget.open)}>
    <summary>{label}</summary>
    {open && <>
      <p>{en ? 'Characters shown' : 'Ký tự đang hiển thị'}: {length ? from + 1 : 0}–{Math.min(from + size, length)} / {length}.
        {!complete && (en ? ' This is one part; download the full JSON for complete evidence.' : ' Đây là một phần; tải JSON đầy đủ để kiểm tra toàn bộ bằng chứng.')}</p>
      <div className="op-actions">
        {!complete && <><Button disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>{en ? 'Previous part' : 'Phần trước'}</Button>
          <Button disabled={currentPage === lastPage} onClick={() => setPage(currentPage + 1)}>{en ? 'Next part' : 'Phần sau'}</Button></>}
        <Button disabled={text === undefined} onClick={download}>{en ? 'Download full JSON' : 'Tải JSON đầy đủ'}</Button>
      </div>
      <pre data-qa-json-chunk data-qa-observation={observation && complete ? '' : undefined}>{text?.slice(from, from + size)}</pre>
    </>}
  </details>;
}
