import presentation from '../data/fixtures/S02.presentation.json';

/** Observed presentation only; never a live identity or permission claim. */
export const getDefectsPresentation = () => structuredClone(presentation);
