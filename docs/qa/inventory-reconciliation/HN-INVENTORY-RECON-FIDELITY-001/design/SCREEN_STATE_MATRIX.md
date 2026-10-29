# Screen/state matrix and static coverage

Base9865a827. Source-only audit; no browser execution. Every registry route appears below, including auth. Dynamic state triggers and cohort selection need independent runtime injection before acceptance. Source hits, hashes and line numbers for every detected consumer are in STATIC_STATE_CONSUMERS.json. Wrapper use does not prove all six states reachable.

| Route | Label | State consumer files (direct/indirect family) | Coverage / safe migration |
|---|---|---|---|
|#/preview/S01|Tổng quan vận hành|src\features\S01\OverviewScreen.tsx|STATIC_INVENTORIED; NO_NEW_BROWSER_RESULT; Preserve existing shared primitives; state trigger/auth/scope audit before visual migration|
|#/preview/S02|Danh mục bệnh/lỗi|src\features\S02\DefectsScreen.tsx|STATIC_INVENTORIED; NO_NEW_BROWSER_RESULT; Preserve existing shared primitives; state trigger/auth/scope audit before visual migration|
|#/preview/S03|Danh mục sản phẩm|src\features\S03\CatalogProductsList.tsx<br>src\features\S03\ProductsScreen.tsx|STATIC_INVENTORIED; NO_NEW_BROWSER_RESULT; Preserve existing shared primitives; state trigger/auth/scope audit before visual migration|
|#/preview/S04|Danh mục SKU|src\features\S04\SkuCatalog.tsx<br>src\features\S04\SkusScreen.tsx|STATIC_INVENTORIED; NO_NEW_BROWSER_RESULT; Preserve existing shared primitives; state trigger/auth/scope audit before visual migration|
|#/preview/S05|Danh mục đại lý & nơi nhận|src\features\S05\RecipientCatalog.tsx<br>src\features\S05\RecipientsScreen.tsx|STATIC_INVENTORIED; NO_NEW_BROWSER_RESULT; Preserve existing shared primitives; state trigger/auth/scope audit before visual migration|
|#/preview/S06|Quản lý sản phẩm PV|src\features\S06\PvDemoCatalogue.tsx<br>src\features\S06\PvProductsScreen.tsx|STATIC_INVENTORIED; NO_NEW_BROWSER_RESULT; Preserve existing shared primitives; state trigger/auth/scope audit before visual migration|
|#/preview/S09|Quản lý hồ sơ bảo hành|src\features\S09\OperationalWarranty.tsx<br>src\features\S09\WarrantyCasesScreen.tsx|STATIC_INVENTORIED; NO_NEW_BROWSER_RESULT; Preserve existing shared primitives; state trigger/auth/scope audit before visual migration|
|#/preview/S10|Quản lý phiếu xuất linh kiện|src\features\S10\OperationalPartsIssues.tsx<br>src\features\S10\PartsSlipsScreen.tsx|STATIC_INVENTORIED; NO_NEW_BROWSER_RESULT; Preserve existing shared primitives; state trigger/auth/scope audit before visual migration|
|#/preview/S11|Danh sách khay|src\features\S11\OperationalTrays.tsx<br>src\features\S11\TraysScreen.tsx|STATIC_INVENTORIED; NO_NEW_BROWSER_RESULT; Preserve existing shared primitives; state trigger/auth/scope audit before visual migration|
|#/preview/S12|Danh sách phiếu nhập|src\features\S12\OperationalReceipts.tsx<br>src\features\S12\ReceiptsScreen.tsx|STATIC_INVENTORIED; NO_NEW_BROWSER_RESULT; Preserve existing shared primitives; state trigger/auth/scope audit before visual migration|
|#/preview/S13|Hàng chờ xếp khay|src\features\S13\OperationalPutawayQueue.tsx<br>src\features\S13\PutawayQueueScreen.tsx|STATIC_INVENTORIED; NO_NEW_BROWSER_RESULT; Preserve existing shared primitives; state trigger/auth/scope audit before visual migration|
|#/preview/S14|Lệnh xếp khay|src\features\S14\OperationalPutawayOrders.tsx<br>src\features\S14\PutawayOrdersScreen.tsx|STATIC_INVENTORIED; NO_NEW_BROWSER_RESULT; Preserve existing shared primitives; state trigger/auth/scope audit before visual migration|
|#/preview/S15|Phiếu xuất kho|src\features\S15\OperationalOutbounds.tsx<br>src\features\S15\OutboundSlipsScreen.tsx|STATIC_INVENTORIED; NO_NEW_BROWSER_RESULT; Preserve existing shared primitives; state trigger/auth/scope audit before visual migration|
|#/preview/S16|Tra cứu tồn & đối soát|src\features\S16\approved\InventoryDesignWorkspace.tsx<br>src\features\S16\InventoryScreen.tsx<br>src\features\S16\OperationalInventory.tsx|STATIC_INVENTORIED; NO_NEW_BROWSER_RESULT; Preserve existing shared primitives; state trigger/auth/scope audit before visual migration|
|#/preview/S17|Phiếu đảo tồn kho|src\features\S17\OperationalReversals.tsx<br>src\features\S17\ReversalSlipsScreen.tsx|STATIC_INVENTORIED; NO_NEW_BROWSER_RESULT; Preserve existing shared primitives; state trigger/auth/scope audit before visual migration|
|#/preview/S18|Báo cáo nhập kho|src\features\S18\InboundReportScreen.tsx<br>src\features\S18\OperationalInboundReport.tsx|STATIC_INVENTORIED; NO_NEW_BROWSER_RESULT; Preserve existing shared primitives; state trigger/auth/scope audit before visual migration|
|#/preview/S19|Báo cáo xuất kho|src\features\S19\OperationalOutboundReport.tsx<br>src\features\S19\OutboundReportScreen.tsx|STATIC_INVENTORIED; NO_NEW_BROWSER_RESULT; Preserve existing shared primitives; state trigger/auth/scope audit before visual migration|
|#/preview/S20|Lịch sử nhập - xuất - tồn kho|src\features\S20\MovementHistoryFeedback.tsx<br>src\features\S20\MovementHistoryScreen.tsx<br>src\features\S20\OperationalMovementLedger.tsx|STATIC_INVENTORIED; NO_NEW_BROWSER_RESULT; Preserve existing shared primitives; state trigger/auth/scope audit before visual migration|
|#/preview/S21|Báo cáo tồn kho & đối soát|src\features\S21\InventoryReportScreen.tsx<br>src\features\S21\OperationalStockReport.tsx|STATIC_INVENTORIED; NO_NEW_BROWSER_RESULT; Preserve existing shared primitives; state trigger/auth/scope audit before visual migration|
|#/preview/S22|Báo cáo bảo hành linh kiện|src\features\S22\OperationalWarrantyReport.tsx<br>src\features\S22\WarrantyPartsDetail.tsx<br>src\features\S22\WarrantyPartsReportScreen.tsx|STATIC_INVENTORIED; NO_NEW_BROWSER_RESULT; Preserve existing shared primitives; state trigger/auth/scope audit before visual migration|
|#/preview/S23|Nhãn, đóng gói & in lại|src\features\S23\LabelReportScreen.tsx|STATIC_INVENTORIED; NO_NEW_BROWSER_RESULT; Preserve existing shared primitives; state trigger/auth/scope audit before visual migration|
|#/preview/S24|Nhập liệu, đối chiếu & lỗi dữ liệu|src\features\S24\DataQualityScreen.tsx|STATIC_INVENTORIED; NO_NEW_BROWSER_RESULT; Preserve existing shared primitives; state trigger/auth/scope audit before visual migration|
|#/preview/S25|Xuất theo người nhận đại lý|src\features\S25\DealerExportScreen.tsx<br>src\features\S25\OperationalDetail.tsx<br>src\features\S25\OperationalRecipientReport.tsx|STATIC_INVENTORIED; NO_NEW_BROWSER_RESULT; Preserve existing shared primitives; state trigger/auth/scope audit before visual migration|
|#/preview/S26|Truy vết hàng hóa|src\features\S26\GoodsTraceScreen.tsx<br>src\features\S26\OperationalTrace.tsx|STATIC_INVENTORIED; NO_NEW_BROWSER_RESULT; Preserve existing shared primitives; state trigger/auth/scope audit before visual migration|
|#/preview/S27|Nhật ký hệ thống|src\features\S27\OperationalAudit.tsx<br>src\features\S27\OperationalDetail.tsx<br>src\features\S27\PvAudit.tsx<br>src\features\S27\SystemAuditScreen.tsx|STATIC_INVENTORIED; NO_NEW_BROWSER_RESULT; Preserve existing shared primitives; state trigger/auth/scope audit before visual migration|
|#/preview/S28|Cấu hình kho Hoa Nam|src\features\S28\WarehouseConfigScreen.tsx|STATIC_INVENTORIED; NO_NEW_BROWSER_RESULT; Preserve existing shared primitives; state trigger/auth/scope audit before visual migration|
|#/preview/S29|Người dùng & RBAC|src\features\S29\UsersRbacScreen.tsx|STATIC_INVENTORIED; NO_NEW_BROWSER_RESULT; Preserve existing shared primitives; state trigger/auth/scope audit before visual migration|
|#/preview/S07|Đăng nhập|No targeted shared state symbol in route family; preserve auth/custom flow|AUTH_FLOW_PRESERVE; Preserve existing shared primitives; state trigger/auth/scope audit before visual migration|
|#/preview/S08|Xác nhận phiên làm việc|No targeted shared state symbol in route family; preserve auth/custom flow|AUTH_FLOW_PRESERVE; Preserve existing shared primitives; state trigger/auth/scope audit before visual migration|

## Other router entry points

| Entry | State owner / constraint | New browser status |
|---|---|---|
| Empty hash, #/, #/setup | App setup/auth PageState and S01; auth is evaluated before route content | NOT_RUN |
| #/account/profile, security, settings, notifications | AccountCenterScreen, global account auth gate; preserve account workflow | NOT_RUN |
| #/preview/S03?entityId=…; S04 equivalent | Canonical exact-ID catalog detail; malformed IDs stay unavailable | NOT_RUN |
| #/preview/S09?catalog=legacy; S10 equivalent | Explicit legacy catalog, distinct from operational cohort | NOT_RUN |
| S09/S11/S12/S15/S16/S23?source=notification&recordId=…&notificationId=…&snapshotId=… | NotificationSourceDocumentScreen; record-not-found for invalid source binding | NOT_RUN |
| S12/S15?source=overview&documentId=…&snapshotId=… | OverviewSourceDocumentScreen; source snapshot binding | NOT_RUN |
| ?inventoryDesign=20261029#/preview/S16?view=… | Candidate ten views/six fixture states; not canonical operational S16 or notification projection | NOT_RUN new task; prior actuals lineage only |
| #/preview/S14/history | PutawayHistoryScreen/PageState; PTW-01 protected | NOT_RUN |
| #/app/P04, P05, P09, P19 | OperationalAppPreview scanner Preview cohort; preserve stock/command semantics and inline feedback | NOT_RUN; no Web redesign |
| #/harness/notifications; #/harness/notifications-repository; #/harness/date-policy; #/qa/toasts; #/qa/operations | QA-only harnesses, not product-route coverage; Toast locked | NOT_RUN |
| Unknown route | App PageState route-not-found; preserve safe overview action/auth gate | NOT_RUN |

## Exhaustive targeted consumer file inventory

| File | Symbols | Fresh source hash / coverage |
|---|---|---|
|src\app\App.tsx|PageState|70105d4e13c83fac9c7005956e42a7b58d06d4b464d3289b2264c90e16c76e23; STATIC_ONLY|
|src\features\documents\NotificationSourceDocumentScreen.tsx|PageState|cce725fbfd1af20f0fa5b0699552ae6df7e7a6ed9a13f5ee2214e6d2f27848ed; STATIC_ONLY|
|src\features\documents\OverviewSourceDocumentScreen.tsx|PageState|a23eacc10bea73a839e8a85d5a4378d255771bfe9cc05efbb97d0e9bd3859e4b; STATIC_ONLY|
|src\features\putaway\PutawayHistoryScreen.tsx|PageState, TrayEmpty|f405275e2168d8628e73febe49cc4f3c8f021ac06f851f9a04f3404a3310ac04; STATIC_ONLY|
|src\features\putaway\TrayUi.tsx|PageState, ReadState, TrayEmpty|d1375bc4b34af3f834d1a8ab58a781a966c23a5f7eaa37c13c76b6ea7b65b968; STATIC_ONLY|
|src\features\S01\OverviewScreen.tsx|emptyContent, InitialReadState, PageState|b68290c9a8951631e23cd7ce0257a88a4164b8d13a60d9ef97a209892273bca3; STATIC_ONLY|
|src\features\S02\DefectsScreen.tsx|emptyContent, PageState, ReadState|a7dcda4beefee8025a23df498dd92140b60f67bf01d54931e809bed04b557b03; STATIC_ONLY|
|src\features\S03\CatalogProductsList.tsx|emptyContent, emptyStateKind|c2659ffefd9d5ad43b64811289a18721d5f2733a11b846cb21569cddb541637d; STATIC_ONLY|
|src\features\S03\ProductsScreen.tsx|emptyContent, emptyStateKind, InitialReadState|2c055265eaab0c3a55bfa79f6158632bcab9bbcfcd3127cab75193c085594840; STATIC_ONLY|
|src\features\S04\SkuCatalog.tsx|emptyContent|417e66103844b9bac4cbe3a1e8f89690d18215764c76b01c12b92516c069cbae; STATIC_ONLY|
|src\features\S04\SkusScreen.tsx|emptyContent, emptyStateKind, InitialReadState|3ec8d55de6e47223a1f9781c0f1c2f823e750b5f12f3c01dff2006084ca3b427; STATIC_ONLY|
|src\features\S05\RecipientCatalog.tsx|emptyContent|d6b5e792a68aa7438c66dd6a77347b768e3737109aaa18af5a6a7f595666661a; STATIC_ONLY|
|src\features\S05\RecipientsScreen.tsx|emptyContent, emptyStateKind, InitialReadState|f64911c306bb8cfb63ee85301cf497a471ef008c2def817d940c203229cafe18; STATIC_ONLY|
|src\features\S06\PvDemoCatalogue.tsx|emptyContent, emptyStateKind|4bbdaa6e42716719015b903c24d7efb3158d09ce14052dd62163b828b86264b4; STATIC_ONLY|
|src\features\S06\PvProductsScreen.tsx|emptyContent, emptyStateKind, InitialReadState|e79f9b585e11bcd7187d3b7d749bd6ff1cf57acd34266d6908666870c7f29f8b; STATIC_ONLY|
|src\features\S09\OperationalWarranty.tsx|emptyContent, PageState, ReadState|85c5f528074c4d6d806ef1f54cba9ee1fccb984a939c39b8bc52813412e20389; STATIC_ONLY|
|src\features\S09\WarrantyCasesScreen.tsx|emptyContent, emptyStateKind, InitialReadState|d40571145cc2cd8f27e41c2346ea86af3c5c6e3096934d921232e2aa204f434a; STATIC_ONLY|
|src\features\S10\OperationalPartsIssues.tsx|emptyContent, PageState, ReadState|5322d8916e09f7f0364b8c70a584440e4e60317f7033e2da905bc5f445684e71; STATIC_ONLY|
|src\features\S10\PartsSlipsScreen.tsx|emptyContent, emptyStateKind, InitialReadState|3f3e1e0034bbea78d359c6b4e710690d4adcc3c08fe6c747cb9d6ede0e9be08e; STATIC_ONLY|
|src\features\S11\OperationalTrays.tsx|emptyContent, PageState, ReadState|b92b3a9b3d8bafafa1317fa1c48589ada4b924f8a7caa80c445f41b90f7f8f3b; STATIC_ONLY|
|src\features\S11\TraysScreen.tsx|emptyContent, emptyStateKind, InitialReadState|ded59528646ddbdfb194c913bfe4c78b3d1ac832ef62ae7ae1ffacddcab91719; STATIC_ONLY|
|src\features\S12\OperationalReceipts.tsx|emptyContent, PageState, ReadState|ac13b0f446e9bb2a7590f4dc2051cf9126244e17b9a55094fdbcd7278f196656; STATIC_ONLY|
|src\features\S12\ReceiptsScreen.tsx|emptyContent, InitialReadState|c904de2fa9f1b98fbea825f47452b943e014c3f8fe389e0e38294b1f61bcf53b; STATIC_ONLY|
|src\features\S13\OperationalPutawayQueue.tsx|PageState, ReadState, TrayEmpty|a7feb7a66d7d39c915486421f0ad1ee2b1f8b5f9b182357f4eb28459ab41d62d; STATIC_ONLY|
|src\features\S13\PutawayQueueScreen.tsx|emptyContent, InitialReadState|18a79693ad537bba7df0be1e5cc01cb6e230849af9abb8fe1fdeb0fd05073c57; STATIC_ONLY|
|src\features\S14\OperationalPutawayOrders.tsx|emptyContent, PageState, ReadState|30e25c5eb9b82cefa43cf580bd0eb5eb04c879d63d20248f8777c48aa4241ea6; STATIC_ONLY|
|src\features\S14\PutawayOrdersScreen.tsx|emptyContent, InitialReadState|7387a6796a80576212d17f227bc880b42a7cedd0c98d9fc378c172d68cff3dd5; STATIC_ONLY|
|src\features\S15\OperationalOutbounds.tsx|PageState|471218dab938b8febfa64df683071cf0a84265518eefaa422450f04bdc69a1d2; STATIC_ONLY|
|src\features\S15\OutboundSlipsScreen.tsx|emptyContent, emptyStateKind, InitialReadState|4c8c0aa04859806ab6704351a526fdb4d584eba639e8a072449cdf69fdf61782; STATIC_ONLY|
|src\features\S16\approved\InventoryDesignWorkspace.tsx|PageState|800441796a0b185d630d46ca99e2f16a6f1674b3fa07b3aabcfc94516e794285; STATIC_ONLY|
|src\features\S16\InventoryScreen.tsx|emptyContent, emptyStateKind, InitialReadState|d78a763e97ffe25e7b80d5801eee3367d7b394ca4fdd69f73e4a686ec544ac8e; STATIC_ONLY|
|src\features\S16\OperationalInventory.tsx|emptyContent, PageState, ReadState|5b6921e85f5fda593e2c3ce958304a8657f6844ea329cf5c26510ebf89db6383; STATIC_ONLY|
|src\features\S17\OperationalReversals.tsx|emptyContent, PageState, ReadState|c8b7026f07486f1abd66b2d55bd12a1aca32704b63e6872cf68f3cdd46250562; STATIC_ONLY|
|src\features\S17\ReversalSlipsScreen.tsx|emptyContent, emptyStateKind, InitialReadState|1311f540bad69f95185bd7543d7afac7a77a26e09ae73e830c4002b3efbf7874; STATIC_ONLY|
|src\features\S18\InboundReportScreen.tsx|emptyContent, PageState, ReportEmptyState|32cd1c7587a799fa17c850929588dc2bf8a934941f188e26b0b0f28905ae8695; STATIC_ONLY|
|src\features\S18\OperationalInboundReport.tsx|emptyContent, ReadState|3202cdb8d4cb1b63c48e2bac7c8afc9cfb38fbbe1bd6841274aa13a89161d819; STATIC_ONLY|
|src\features\S19\OperationalOutboundReport.tsx|emptyContent, ReadState|34307bd39073956deb8bcb8d3d1822f41573a535c9b5714ee44c3a289db92a94; STATIC_ONLY|
|src\features\S19\OutboundReportScreen.tsx|emptyContent, PageState, ReportEmptyState|8d317cba2d1775acda5a3d596b0ffdf988f722d5d5992606b650d1fad11ea681; STATIC_ONLY|
|src\features\S20\MovementHistoryFeedback.tsx|PageState|3859793d9c80cc7067a5636ac093f4653078c53eefa8cf7548631c8313bec036; STATIC_ONLY|
|src\features\S20\MovementHistoryScreen.tsx|emptyContent, ReportEmptyState|ce2c7887d8b928ae666a35e536e87f382328dd194172320f138727492cb44a16; STATIC_ONLY|
|src\features\S20\OperationalMovementLedger.tsx|emptyContent, ReadState|8722f0cce1c58e5e0c6d62fe1c34a52d823a8bccade0622d6c6c906520df1d32; STATIC_ONLY|
|src\features\S21\InventoryReportScreen.tsx|emptyContent, PageState, ReportEmptyState|494e6268f520b27a240cb7998650b2c5bb1b6fe5c351309cb350ca5d0f721e44; STATIC_ONLY|
|src\features\S21\OperationalStockReport.tsx|emptyContent, ReadState|a7e4b674e79702c4ade222b0e92a20f4621f63606e5e50bc3f451092c57fbc9a; STATIC_ONLY|
|src\features\S22\OperationalWarrantyReport.tsx|emptyContent, PageState, ReadState|da7ba7ce50cbe4e0ef55e28afe2f7a30e23efec4976def90e55179fac45e305b; STATIC_ONLY|
|src\features\S22\WarrantyPartsDetail.tsx|emptyContent, PageState, ReportEmptyState|00ff75e27946110a1031a7077c78b416c44f559a6c5e26abba836294a5bdd8f8; STATIC_ONLY|
|src\features\S22\WarrantyPartsReportScreen.tsx|PageState|6fdcc512c87834e40a7634835b646994a823cd3d22c0f2b2ece9ae594ff10c2b; STATIC_ONLY|
|src\features\S23\LabelReportScreen.tsx|emptyContent, PageState, ReportEmptyState|f089f22dc59b2974dfc164feb9ea466c6bf8e745c7ef7a7e24c5838f4aab57ed; STATIC_ONLY|
|src\features\S24\DataQualityScreen.tsx|emptyContent, PageState, ReportEmptyState|fe9489b881360be13506253cd928e100980999d07c5c5684cd28f584ea439bf2; STATIC_ONLY|
|src\features\S25\DealerExportScreen.tsx|emptyContent, PageState, ReportEmptyState|a436f313609e0d19a6d687743a7fb32c29f062cb11547a67716fc8cc5c998af4; STATIC_ONLY|
|src\features\S25\OperationalDetail.tsx|emptyContent|fe8b8233f6156c4925e5c92e3b6c96e8609f6ba78174f1d4551c21c1db7e1c4f; STATIC_ONLY|
|src\features\S25\OperationalRecipientReport.tsx|emptyContent, ReadState|9570b53848470f2961952940fd3d2a72384b1297735e3e19f9dbf74d28f9096b; STATIC_ONLY|
|src\features\S26\GoodsTraceScreen.tsx|emptyContent, PageState, ReportEmptyState|17aea054a5953ae86e9da56c6ee6d69fd06e53eaf0b162b4ae1f1a5b9e489c6f; STATIC_ONLY|
|src\features\S26\OperationalTrace.tsx|emptyContent, PageState, ReadState|3d029b7955d781c16ca02b17f6903ed8ef9d958d355c408a2cbefb9abddab335; STATIC_ONLY|
|src\features\S27\OperationalAudit.tsx|emptyContent, PageState, ReadState|8a0259589c7b3f4b5a7d4901eded32d8e0e2068dda6d89bf094c7b1122b53dce; STATIC_ONLY|
|src\features\S27\OperationalDetail.tsx|PageState, ReadState|7394a599b9f10f95fbc690bc53ea52c74427161d309b8ee4fad9acc2ec5d6dac; STATIC_ONLY|
|src\features\S27\PvAudit.tsx|emptyContent, emptyStateKind|655e29ef3dea9ef38e51054ec6c19bc58e0e1b76c20bdce5b83b4346f931d2fa; STATIC_ONLY|
|src\features\S27\SystemAuditScreen.tsx|emptyContent, PageState|29482ec0eee404e8053e0fb9d5d4e65e2fbf4a981d5a85de6da6672a9547d68f; STATIC_ONLY|
|src\features\S28\WarehouseConfigScreen.tsx|InitialReadState|78d9ea4d7ae7983ae5550b1c5292ee0adf948b791da17c579ccbe9b75f271d6a; STATIC_ONLY|
|src\features\S29\UsersRbacScreen.tsx|emptyContent, emptyStateKind, PageState|92f57820a71ff3a3859414bcaf8fbd055223c0d37d1cf6d0f608fb7935bdfb41; STATIC_ONLY|
|src\notifications\NotificationHarnessScreen.tsx|PageState|f737d1bd82360984130d5fa09821537d3fbddbe2965ec7939788a9c15fa3a0ce; STATIC_ONLY|
|src\notifications\PreviewNotificationCenter.tsx|PageState|554b4924b230348734a6327ae9cf7595cc1536771f07015d6a63a267a4ba66fa; STATIC_ONLY|
|src\shared\DataTable.tsx|emptyContent, emptyStateKind, PageState|06eb0e75e3a0734afc58943fc1b1566b2f2e73f9428144a4cfdb26d3bd40b2ea; STATIC_ONLY|
|src\shared\index.ts|InitialReadState, PageState, ReportEmptyState|70770eb855bc05febf4b118f33ef1ea089562e51392d3373683c228b85b5fae1; STATIC_ONLY|
|src\shared\InitialReadState.tsx|InitialReadState, PageState|2b5606aa0baff21208f88a74802d2fba21bf98fa99a8d545d270951cf6fa8f15; STATIC_ONLY|
|src\shared\PageState.tsx|hn-page-state, PageState|e966e1a4f52ed96046f5de32fb3fac2c4568f019e6e0ebc9d358bf4d0bfc267e; STATIC_ONLY|
|src\shared\read-failure-kind.ts|PageState|733720b8ccf144034410cb5e0ebd252506a316170db107be53cea203b5736aeb; STATIC_ONLY|
|src\shared\ReadState.tsx|PageState, ReadState|cc21cc62f30714b83e535017f8de8dfb950d4650d868fd9699f70c3fb9decb27; STATIC_ONLY|
|src\shared\report-status.tsx|PageState, ReportEmptyState|c1002d89cd99f003217105254d2403f45bfb09f112b9ab19ccba551ad10d5bef; STATIC_ONLY|
