import seed from '../fixtures/S08.seed.json';
import copy from '../fixtures/S08.copy.json';
import authCopy from '../fixtures/S07.copy.json';
import type { SessionAdapter, SessionContext } from '../../features/S08/session-contract';

/** P01 scenario bootstrap, not a login/authentication mechanism. No transport or storage. */
export function createSessionFixtureAdapter(): SessionAdapter {
  let context: SessionContext | null = {
    avatarText: seed.fixture.avatarText,
    displayName: seed.fixture.displayName,
    roleLabel: seed.fixture.roleLabel,
    warehouseLabel: seed.fixture.warehouseLabel,
    warehouseStatusLabel: seed.fixture.warehouseStatusLabel,
    verification: 'P01_CONTEXT_FIXTURE_ONLY',
  };
  return {
    readDefault: () => ({ context: structuredClone(context), copy: { ...copy.content, layout: structuredClone(authCopy.content) } }),
    async confirm() {
      // No target/outcome has been supplied. Never infer success from the P01 visual context.
      return { kind: 'blocked', reason: context ? 'MISSING_CONFIRMATION_TARGET' : 'MISSING_CONTEXT' };
    },
    reset() { context = null; },
  };
}
