import { createProductsController } from './products-controller';
import { createProductsFixtureAdapter } from '../data/adapters/products-fixture-adapter';

export { PRODUCTS_RUNTIME_POLICY } from './products-policy';

/** Composition point for a future confirmed API adapter; current runtime reads the source fixture only. */
export const createProductsRuntimeController = () => createProductsController(createProductsFixtureAdapter());
