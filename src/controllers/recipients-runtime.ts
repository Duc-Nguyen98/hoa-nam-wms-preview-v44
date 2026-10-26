import { createRecipientsController } from './recipients-controller';
import { createRecipientsFixtureAdapter } from '../data/adapters/recipients-fixture-adapter';
import type { RecipientsDataAdapter } from '../contracts/recipients';
/** Replace the adapter here only after backend contract/permissions are confirmed. */
export const createRecipientsRuntimeController = (adapter: RecipientsDataAdapter = createRecipientsFixtureAdapter()) => createRecipientsController(adapter);
