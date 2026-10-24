import seed from '../fixtures/S07.seed.json';
import copy from '../fixtures/S07.copy.json';
import type { AuthAdapter } from '../../features/S07/auth-contract';

/** No transport, accepted credential pair, session, storage, delay or outcome invented. */
export function createAuthFixtureAdapter(): AuthAdapter {
  return {
    readDefault: () => ({
      initial: {
        username: seed.fixture.username,
        password: seed.fixture.password,
        passwordVisible: seed.fixture.passwordVisible,
      },
      copy: structuredClone(copy.content),
    }),
    // Never inspect, retain or log credentials. A future real adapter requires a confirmed contract.
    async submit() { return { kind: 'blocked', reason: 'MISSING_AUTH_OUTCOME' }; },
    recover() { return { kind: 'blocked', reason: 'MISSING_RECOVERY_FLOW' }; },
  };
}
