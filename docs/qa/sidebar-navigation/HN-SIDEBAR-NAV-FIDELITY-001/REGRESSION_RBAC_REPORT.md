# Regression and RBAC report

- Static route registry: S01–S29 mapped; auth and QA routes remain outside production menu.
- Browser smoke: desktop 1440 and tablet 800 from `FUNCTIONAL_NAV_QA.md`; additional visual capture at 1672/992.
- Build/typecheck/contract gate: PASS on code candidate `a617604…`.
- Full S01–S29 browser matrix: NOT_RUN.
- Hosted CI result: NOT_RUN.
- REAL_API RBAC, capability filtering and warehouse scope: BLOCKED/NOT_RUN.
- No route identity, business permission, fixture or production data was changed.

The current shell still exposes the complete navigation tree after authentication; server-authoritative route capability policy remains an open release concern.
