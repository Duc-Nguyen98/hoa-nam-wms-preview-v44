# Sidebar regression report

## Automated gates

- `npm run typecheck`: PASS
- `npm run quality:contract`: PASS (`13 states, 26 references, immutable source policy`)
- `npm run build`: PASS
- `git diff --check`: PASS

The build emitted the existing Vite large-chunk warning; it did not fail the build.

## Scope

Source changes are limited to `GlobalShell.tsx`, `s00-navigation.ts`, `s00-sidebar-tone.css`, and `shell-locale.ts`. No feature screen, business adapter, fixture, or API contract was changed. A full S01–S29 browser matrix and all shared-component consumers remain `NOT_RUN` and must not be inferred from the build.
