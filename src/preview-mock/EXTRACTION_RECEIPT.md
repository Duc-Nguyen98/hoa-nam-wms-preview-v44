# Approved browser MOCK transport — 18 October 2026

This implementation follows the Owner-approved browser preview decision: synthetic fixtures may be bundled publicly; account state belongs to the current browser; there is no real account, backend API or RBAC claim. Original canonical sources were not modified.

## Integration

```ts
import { apiClient } from '../data/http/api-client';
import { installPreviewMock } from '../preview-mock';

const previewMock = installPreviewMock(apiClient);
// Install before React/provider requests begin.
// previewMock.mode === 'MOCK'
// await previewMock.reset() explicitly resets this browser's mock state.
```

Install on the canonical default client so account, business, admin, exports and the existing session-expiry listener share one transport. Installation is idempotent. `uninstall()` restores the previous adapter, but ordinary application requests never fall through to it. The root integration owns the visible MOCK notice and synthetic login help.

## Files and extraction boundary

`SOURCE_INVENTORY.json` records 100 transitive local source/fixture files, SHA-256 hashes and static import edges. The only external package is Axios. The browser closure has **zero Node imports and zero imports from the server `mock/` directory**. This is a static source inventory, not a production bundle manifest.

| Browser file | Source and treatment |
| --- | --- |
| `readers.ts` | Approved extraction of canonical `mock/baseline-readers.ts`; only relative import paths and its former server-only boundary comment changed. Resolves candidate fixture adapters, preserving candidate records and guards. |
| `query-validation.ts` | Exact canonical `mock/query-validation.ts` body with browser-relative imports. |
| `admin-data.ts` | Exact canonical `mock/admin-data.ts` body with browser-relative imports. These are existing synthetic local admin records. |
| `domain.ts` | Query decoder extracted from `mock/server.ts`, error class renamed; existing admin query routing semantics extracted from `mock/admin-routes.ts`. No warehouse generator or business writes. |
| `account.ts` | Browser port of canonical account route rules; existing account model normalization/validation is imported. Replaces Node filesystem, Buffer, scrypt and cookie mechanics with browser mechanisms described below. |
| `storage.ts` | New IndexedDB persistence and small localStorage session-token store. Explicit memory implementations exist only for injected tests; browser installation does not fall back to them. |
| `index.ts` | New Axios adapter/installer, envelopes/status/error conversion, cancellation/timeout, same-origin route check and MOCK metadata. |
| `errors.ts` | Internal typed status/code/message/detail errors. |

The three complete pure-module extractions were text-verified against their source after applying only the recorded import/comment transformations. Their source hashes and checks are in the inventory.

## Preserved behavior and intentional browser differences

- Domain reads are S01–S06 and S09–S26 from the candidate's own fixtures. The larger canonical warehouse synthetic scenario is not substituted. Four existing admin read endpoints are supported. Domain/admin writes return 405; unknown routes return 404; foreign-origin requests are unsupported. Existing blocked/missing-fixture results remain results. Errors do not substitute a fallback dataset.
- S02 keeps its candidate 15-row policy and review scenarios. S22 keeps candidate summary values and returns the already-defined `BLOCKED_SOURCE_CONFLICT` HTTP detail shape with null fixture/rows/total. It does not invent full detail rows or upgrade report coverage. Root owns later S22 reconciliation.
- Envelopes retain API version 1 and request IDs. Axios failure responses reject with their status and envelope, allowing the canonical `ApiRequestError` and 401 `SESSION_EXPIRED` handling to run. Every response identifies `X-Preview-Mode: MOCK`; health also identifies MOCK. Requests respect AbortSignal, legacy cancel tokens and configured timeouts.
- Account states remain signed-out, confirmation-required and active. Login normalization, validation codes, eight-hour expiry, ten failed attempts per minute, confirmation, logout, profile/avatar/preferences/password rules and invalidation of other sessions are retained. Current-password validation is not bypassed.
- The public seed `ducquang` / `HoaNam@2026` is a synthetic fixture. Browser state stores a salted WebCrypto PBKDF2 SHA-256 digest with 120,000 iterations, not a plaintext changed password. This replaces the Node mock's scrypt implementation; it is browser simulation storage, not an authentication security claim.
- IndexedDB holds account/avatar/session state. A localStorage mock token shares the current session within the browser origin, analogous only to the local cookie's lifecycle. State persists across reloads until reset/storage clearing; the existing eight-hour session expiry still applies. Mock login throttling is browser-local rather than the Node server's remote-address map. Other browser profiles/contexts have independent state.
- Account operations serialize within a runtime; browsers with Web Locks also serialize participating tabs. They read persisted state for each operation. A save resolves only after the IndexedDB transaction commits. Storage denial/quota errors produce an error; no false save acknowledgment or automatic memory fallback occurs. Existing corrupt state is preserved and reported instead of silently reinitialized.
- Avatar limits remain 5 MiB with existing JPEG/PNG/WebP magic checks and PNG dimension limits; body limit remains 8 MiB. Removing email clears email notification channels. Unsupported notification keys and password policies retain their existing error responses.

## Validation and remaining browser gate

`npm run typecheck` passed (`tsc --noEmit`, exit 0).

`npx tsx --test tests/preview-mock.test.ts` passed **11/11** focused tests. They cover the three account states and expiry event, profile/avatar/preferences reload behavior, password validation and other-session invalidation, throttling, all 24 domain defaults and four admin endpoints, S02 guards/scenarios, S22 summary/detail boundary, query errors and unsupported writes, malformed body/avatar rejection, storage failure, abort/timeout, corruption and explicit reset. Tests use explicitly injected memory storage; they do not assert real IndexedDB behavior.

Root still needs browser QA of the actual IndexedDB path, page reload, storage failure presentation, account controls, same-source exports and the exact online URL. Useful browser cases include a valid avatar near 5 MiB, refresh after profile/password change, a second tab/session, logout and session expiry. No build, server process, deployment or Git mutation was performed for this implementation.
