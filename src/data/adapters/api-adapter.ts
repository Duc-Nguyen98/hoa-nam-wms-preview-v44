import type { PreviewDataAdapter, ScreenId, SnapshotResult } from '../../contracts/preview';
import { createFixtureAdapter, UNCONFIGURED_API_BINDING } from './fixture-adapter';

/** Integration seam only. Configure confirmed backend mappings before replacing this stub. */
export function createUnconfiguredApiAdapter(): PreviewDataAdapter {
  async function notConfigured(screenId: ScreenId): Promise<SnapshotResult> {
    return { kind: 'not-configured', screenId, binding: UNCONFIGURED_API_BINDING };
  }
  return {
    kind: 'api-unconfigured',
    binding: UNCONFIGURED_API_BINDING,
    // Setup metadata is local; this does not fall back to fixture business results.
    setupHealth: () => createFixtureAdapter().setupHealth(),
    readSnapshot: notConfigured,
    readQuery: notConfigured,
  };
}
