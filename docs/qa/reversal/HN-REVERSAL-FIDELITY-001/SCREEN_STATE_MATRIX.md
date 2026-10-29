# Screen and state coverage matrix

Fresh static lexical scan of S01–S29 at baseline 71cfa02; list of files, hashes and matched symbols in [STATIC_ROUTE_CONSUMERS.json](design/STATIC_ROUTE_CONSUMERS.json). A symbol hit does not prove a route reaches a component or all states. In this task only S17 Candidate 12 design scenarios were browser-captured as BEFORE; shared semantic state injection for every route is NOT_RUN. Earlier 48-case shell regression is inherited a75ded0 evidence for shell/layout, not proof of 29 routes × all state semantics.

| Route | Fresh static state-family evidence | Current-task runtime state coverage |
|---|---|---|
| S01 | OverviewScreen.tsx | NOT_RUN for state semantics |
| S02 | DefectsScreen.tsx | NOT_RUN for state semantics |
| S03 | CatalogProductsList.tsx, ProductsScreen.tsx | NOT_RUN for state semantics |
| S04 | SkusScreen.tsx | NOT_RUN for state semantics |
| S05 | RecipientsScreen.tsx | NOT_RUN for state semantics |
| S06 | PvDemoCatalogue.tsx, PvProductsScreen.tsx | NOT_RUN for state semantics |
| S07 | Auth/custom flow; preserve | NOT_RUN for state semantics |
| S08 | Auth/custom flow; preserve | NOT_RUN for state semantics |
| S09 | OperationalWarranty.tsx, WarrantyCasesScreen.tsx | NOT_RUN for state semantics |
| S10 | OperationalPartsIssues.tsx, PartsSlipsScreen.tsx | NOT_RUN for state semantics |
| S11 | OperationalTrays.tsx, TraysScreen.tsx | NOT_RUN for state semantics |
| S12 | OperationalReceipts.tsx, ReceiptsScreen.tsx | NOT_RUN for state semantics |
| S13 | OperationalPutawayQueue.tsx, PutawayQueueScreen.tsx | NOT_RUN for state semantics |
| S14 | OperationalPutawayOrders.tsx, PutawayOrdersScreen.tsx | NOT_RUN for state semantics |
| S15 | OperationalOutbounds.tsx, OutboundSlipsScreen.tsx | NOT_RUN for state semantics |
| S16 | InventoryScreen.tsx, OperationalInventory.tsx, InventoryDesignWorkspace.tsx | NOT_RUN for state semantics |
| S17 | OperationalReversals.tsx, ReversalSlipsScreen.tsx, ReversalDesignWorkspace.tsx | 12 Candidate scenarios captured, MOCK; no semantic permission proof |
| S18 | InboundReportScreen.tsx, OperationalInboundReport.tsx | NOT_RUN for state semantics |
| S19 | OperationalOutboundReport.tsx, OutboundReportScreen.tsx | NOT_RUN for state semantics |
| S20 | MovementHistoryFeedback.tsx, MovementHistoryScreen.tsx, OperationalMovementLedger.tsx | NOT_RUN for state semantics |
| S21 | InventoryReportScreen.tsx, OperationalStockReport.tsx | NOT_RUN for state semantics |
| S22 | OperationalWarrantyReport.tsx, WarrantyPartsDetail.tsx, WarrantyPartsReportScreen.tsx | NOT_RUN for state semantics |
| S23 | LabelReportScreen.tsx | NOT_RUN for state semantics |
| S24 | DataQualityScreen.tsx | NOT_RUN for state semantics |
| S25 | DealerExportScreen.tsx, OperationalRecipientReport.tsx | NOT_RUN for state semantics |
| S26 | GoodsTraceScreen.tsx, OperationalTrace.tsx | NOT_RUN for state semantics |
| S27 | OperationalAudit.tsx, OperationalDetail.tsx, PvAudit.tsx, SystemAuditScreen.tsx | NOT_RUN for state semantics |
| S28 | WarehouseConfigScreen.tsx | NOT_RUN for state semantics |
| S29 | UsersRbacScreen.tsx | NOT_RUN for state semantics |

Other entries: `#/account/profile`, security, settings and notifications use AccountCenter/auth gates; empty hash, setup and unknown routes are App/auth paths; notification/overview document projections, S14 history, scanner `#/app/P04/P05/P09/P19`, and QA harnesses are separate cohorts. Static lineage is in the prior [route matrix](../../inventory-reconciliation/HN-INVENTORY-RECON-FIDELITY-001/design/SCREEN_STATE_MATRIX.md); no new browser semantic-state result for these entries. Preserve auth, session, notification, Toast and PTW-01.

The state contract distinguishes loading, empty, no-results, read-error, forbidden, record-not-found, unauthorized/session-expired, stale/offline and unknown transaction outcome. Missing verified triggers or backend permissions are BLOCKED, not a pass.

## Final S17 capture continuation

Final `e7b145f` has 12 S17 local MOCK scenarios at each of three profiles, 36/36 captured; see [receipt](visual/after-e7b145f-receipt.json) and [visual verdict](visual/VISUAL_QA_REPORT.md). This updates S17 visual coverage only. Every other route's fresh runtime semantic-state disposition above remains NOT_RUN; captured fixtures do not establish production permission or audit semantics.
