/** QA-local one-shot failure, with no persistence, command or recovery side effects. */
export function createCatalogReadProbe() {
  let armed = false;
  return {
    arm() { armed = true; },
    cancel() { armed = false; },
    isArmed() { return armed; },
    async read<T>(read: () => Promise<T>): Promise<T> {
      if (armed) {
        armed = false;
        throw Object.assign(new Error('QA simulated catalogue read failure'), { code: 'QA_SIMULATED_CATALOG_READ_FAILURE' });
      }
      return read();
    },
  };
}
