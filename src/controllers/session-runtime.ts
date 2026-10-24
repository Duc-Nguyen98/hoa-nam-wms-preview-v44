import { createSessionFixtureAdapter } from '../data/adapters/session-fixture-adapter';

/** One scenario context per preview document; a route remount cannot undo logout. */
export const sessionPreviewAdapter = createSessionFixtureAdapter();
