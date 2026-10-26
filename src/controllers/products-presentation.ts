import presentation from '../data/fixtures/S03.presentation.json';

/** Presentation observed in the five verified S03 references; not an authenticated identity or permission. */
export const getProductsPresentation = () => structuredClone(presentation);
