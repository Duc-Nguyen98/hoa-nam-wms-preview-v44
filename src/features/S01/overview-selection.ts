import type { OverviewModel, OverviewRow } from '../../contracts/overview';
import type { createOverviewRuntimeController } from '../../controllers/overview-runtime';

type Runtime = ReturnType<ReturnType<typeof createOverviewRuntimeController>['getState']>;
export interface AcceptedRowSelection {
  model: OverviewModel;
  row: OverviewRow;
  snapshotId: string;
  requestId: number;
  queryKey: string;
}
export function selectAcceptedOverviewRow(state: Runtime, id: string): AcceptedRowSelection | null {
  if (!state.model || state.loading || state.debouncing || state.error || state.blocker) return null;
  // One object may be in both projections. Conflicting objects with the same ID
  // are ambiguous and must not open the first match.
  const matches = [...new Set([...state.model.rows, ...(state.model.attention ?? [])])].filter(row => row.id === id);
  if (matches.length !== 1) return null;
  return { model: state.model, row: matches[0], snapshotId: state.model.source.snapshotId,
    requestId: state.requestId, queryKey: JSON.stringify(state.intendedQuery) };
}
export function resolveAcceptedOverviewRow(selection: AcceptedRowSelection | null, state: Runtime): OverviewRow | null {
  if (!selection || state.model !== selection.model || state.requestId !== selection.requestId
    || JSON.stringify(state.intendedQuery) !== selection.queryKey) return null;
  const current = selectAcceptedOverviewRow(state, selection.row.id);
  return current?.snapshotId === selection.snapshotId && current.row === selection.row ? current.row : null;
}
