# Visual Before Report — HN-WARRANTY-PARTS-UIUX-001

**Scope:** S09 warranty cases and S10 warranty parts issue routes, before-source-change evidence.

**Runtime:** local Vite preview `http://127.0.0.1:5292`, Chromium Playwright, commit `93371f4`, VI/light, Desktop 1672×941 CSS and Tablet 992×1586 CSS (DPR 1 in this capture environment). No credentials are stored in this evidence folder.

The approved reference custody is preserved under [`screenshots/reference`](screenshots/reference). Actual captures are under [`screenshots`](screenshots), with machine measurements in [`metrics.json`](metrics.json) and returned-case measurements in [`returned-metrics.json`](returned-metrics.json).

## State coverage

| Approved state | Intended route/state | Actual evidence | Result |
|---|---|---|---|
| bh-01 | S09 returned detail / Desktop | `screenshots/bh-01-actual.png` | RUN — operational fixture transitioned to RETURNED |
| bh-02 | S09 checking detail / Desktop | `screenshots/bh-02-actual.png` | RUN — operational fixture |
| bh-03 | S10 parts list / Desktop | `screenshots/bh-03-actual.png` | RUN — operational fixture |
| bh-04 | S09 warranty list / Desktop | `screenshots/bh-04-actual.png` | RUN — operational fixture |
| bh-05 | S09 returned detail / Tablet | `screenshots/bh-05-actual.png` | RUN — operational fixture transitioned to RETURNED |
| bh-06 | S10 parts detail / Desktop | `screenshots/bh-06-actual.png` | RUN — operational fixture |
| bh-07 | S09 warranty list / Tablet | `screenshots/bh-07-actual.png` | RUN — operational fixture |
| bh-08 | S09 checking detail / Tablet | `screenshots/bh-08-actual.png` | RUN — operational fixture |
| bh-09 | S10 parts list / Tablet | `screenshots/bh-09-actual.png` | RUN — operational fixture |
| bh-10 | S10 parts detail / Desktop | `screenshots/bh-10-actual.png` | RUN — operational fixture |
| bh-11 | S10 parts detail / Tablet | `screenshots/bh-11-actual.png` | RUN — operational fixture |
| bh-12 | S09 warranty list / Tablet | `screenshots/bh-12-actual.png` | RUN — operational fixture |
| bh-13 | S10 parts detail / Tablet | `screenshots/bh-13-actual.png` | RUN — operational fixture |
| bh-14 | S09 warranty list / Tablet | `screenshots/bh-14-actual.png` | RUN — operational fixture |

The approved images represent the historical catalogue cohort (nine populated warranty/parts rows, filters and catalogue detail dialogs). The integrated preview defaults to the current-session operational cohort. The cohort switch is deliberately hidden by `src/shared/preview-ui.css`, so historical-cohort reproduction is **BLOCKED / NOT_RUN** in this pass; the operational captures are retained as the runnable before evidence rather than relabeled as historical matches.

## Runtime checks

- Console/page errors: 0; failed network requests: 0 in capture scripts.
- Document horizontal overflow: false at every captured viewport.
- Dialog bounds stayed within the viewport. Observed S09 checking modal: 960×754.78 Desktop and 944×754.78 Tablet; S10 detail: 960×893 Desktop and 944×1294.78 Tablet. Returned S09 modal: 960×808 Desktop and 944×808 Tablet.
- Interactive buttons measured at least 44 CSS px high. The 36 px item in the raw control list is the non-interactive Tablet logo link, not a control.
- Existing warranty UI smoke checks passed read-failure recovery, delayed-read focus fallback, stock/version/history invariance, diagnosis save and reset invalidation (`tests/warranty-ui/browser.mjs`, six checks, no errors).

These checks establish a clean runnable baseline while the cohort mismatch and visual defects below remain open.
