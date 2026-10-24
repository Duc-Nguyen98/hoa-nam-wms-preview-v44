/** Additive exact-ID links. Callers must opt in only after the screen consumer is installed. */
export function resolveCanonicalPreviewSelection(hash: string): { screen: 'S03' | 'S04'; entityId: string } | null {
  const match = /^#\/preview\/(S03|S04)\?([^#]*)$/.exec(hash);
  if (!match) return null;
  const params = new URLSearchParams(match[2]);
  if (!params.has('entityId') || [...params.keys()].some(key => key !== 'entityId')) return null;
  const values = params.getAll('entityId');
  // An explicit empty/ambiguous selection stays unavailable; never select the
  // source cohort or an arbitrary row. Decode once and leave identity exact.
  return { screen: match[1] as 'S03' | 'S04', entityId: values.length === 1 ? values[0] : '' };
}
