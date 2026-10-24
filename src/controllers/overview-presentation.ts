import presentation from '../data/fixtures/S01.presentation.json';

/** Static presentation evidence, never a user/session permission contract. */
export const getOverviewPresentation = () => structuredClone(presentation);
