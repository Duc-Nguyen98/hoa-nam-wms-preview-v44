import { createDefectsController } from './defects-controller';
import { createDefectsFixtureAdapter } from '../data/adapters/defects-fixture-adapter';
import { DEFECTS_RUNTIME_POLICY } from './defects-policy';
export { DEFECTS_RUNTIME_POLICY } from './defects-policy';

/** Composition point for a future confirmed API adapter; it currently reads fixture only. */
export const createDefectsRuntimeController = () => createDefectsController(createDefectsFixtureAdapter(DEFECTS_RUNTIME_POLICY));
