import { createSkusController } from './skus-controller';
import { createSkusFixtureAdapter } from '../data/adapters/skus-fixture-adapter';
import type { SkusDataAdapter } from '../contracts/skus';

export { SKUS_RUNTIME_POLICY } from './skus-policy';

/** Composition point for a future confirmed API adapter; current runtime reads the source fixture only. */
export const createSkusRuntimeController = (adapter: SkusDataAdapter = createSkusFixtureAdapter()) => createSkusController(adapter);
