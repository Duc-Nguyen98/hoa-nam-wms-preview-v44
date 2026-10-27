# HN-S01-UIUX-004 — data consistency

BEFORE source tree `65ac25d235682469452f60d50664b3e6acb3a753`. All results MOCK unless identified QA_SYNTHETIC.

| Contract | Independent observation | Evidence | Result |
|---|---|---|---|
| September Kho Hoa Nam | Normal period controls apply full September; one warehouse option | clean browser results, KPI step | PASS |
|8in/8out/16documents | Source arithmetic, chart sum16, four pages cover16 distinct IDs; normal browser10+6 rows no duplicates | Node test1; browser pagination | PASS |
|Current warranty4 | Remains4 on September1 empty document day | Node test2; browser empty-day | PASS |
|Stock unknown | Modelnull/display—; actual KPI—, empty-day— | Node tests1/2; browser KPI/empty | PASS |
|3pending | Actual badge/source5; list shows3 | Node test1; browser KPI | SOURCE_CONFLICT if3 means total; PASS only visible3 |
|Activity scope | Type/status/search filter only table;8in,5postedin,5waiting; KPIs retained | browser filter/search; overview-detail tests | PASS |
|PX0007 identity | FullID/type/partner/qty/actor/date/status match source | browser detail; Node identity tests | PASS |
|Copy code andID | Clipboard exact PX-0007 and p12-stock-PX-0007 | browser detail | PASS |
|CTA/deep link | S15 carries fullID+snapshot; reload retains; missing target fails closed | browser CTA; existing16document tests | PASS |
|90days/no future | Vietnam lower bound2026-07-29, today2026-10-27; July28/future/reversed rejected | independent Node date test; browser manual submission alerts | PASS |
|Search folding | lan nguyen finds source Lan Nguyễn records; exact code search unique; no-match distinct | browser search | PASS |
|Pagination/default | BEFORE4; normal10+6 verified, sort resets page1 | browser pagination | FUNCTIONAL_PASS / default4 AUTHORITY_CONFLICT |
|Modal state/focus | ESC restores exact opener; Tab and ShiftTab remain inside modal | browser PX/i18n/a11y | PASS within tested scope |
|Theme/language | VI/EN/ZH-CN × light/dark ×1920/800; identity unchanged, modal contained | first-run six completed language/theme steps | PASS, not visual acceptance |
|Long/missing | Actual component derivative QA fixture; long body scroll start/middle/end; no undefined/null leakage | isolated state final, screenshots | PASS QA_SYNTHETIC |
|Session/permission | Existing mockaccount rejects no session401, unconfirmed403, expired401; rendered failure states independently | Node test4; isolated session/forbidden | PASS MOCK; production RBAC NOT_RUN |
|Offline | Actual local filter succeeds offline; injected networkerror renders genericerror with no fabricatedKPIs | browser offline; isolated offline | PASS MOCK behavior; REAL_API NOT_RUN |
|Notification identity regression | Existing exacttargets, mismatches, replay/actor fencing retained |27test Node log | PASS |

Do not infer real warehouse counts, stockzero, production endpoint permission mappings, or business-timezone bindings from this synthetic fixture.


## Final2 disposition (supersedes BEFORE paging/contrast findings)

| Contract | Final2 result/evidence |
|---|---|
|Normal10/options10,15,25,50/reject4 | PASS actual app and actualHTTPPreviewchain; final2browser +34Node tests; FQA-002closed |
|Originalsource16/8/8/4/5pending/unknown | PASS unchanged; normalapp and SOURCE_FIXTUREreference4 retain exactPXCTA |
|ApprovedDashboard QA3/13posted | PASS test-onlyQA_SYNTHETIC snapshot,16identities/8/8/4unknown, exactly2documentstatusderivations; no originalmutation |
|QA3CTAguard | PASS disabledUI/no routechange; guardnull for all16rows and mismatchedsnapshot even when provenance flag alone forged |
|ExactPXcopy/ID/CTA/focus | PASS newSHA actualnormalapp; initialround1copytimeout not reused as finalevidence |
|44CSSpx targets | PASS112normalappfilter/period/table/mobile measurements +20modalcontrols, light/dark×desktop/tablet; final2-accessibility-recovery |
|Pendingbadgecontrast | PASS4.714light/6.539dark; FQA-001closed |
|Sharedkeyboard/routes | PASS21auditgroups/errors[]; exactopenerESCreturn, reverseTabtrap, shellsearch/NC/drawer and S21/S26/S20 |
|Locale/long/empty | PASS final2targetedrecovery6checks/errors[]; fourblockedchecksresolved on exactsameSHA with actualheadercontrols; rawfailedattempts retained |

Actual productionAPI/RBAC remains NOT_RUN; synthetic renderer checks do not supply a backendpermissionmatrix.


## Final footer-only source qualification

Final commit e18305b1e3b09c4402317d507d7008967284341b / source edd34681bf20a5281188e9da49cdc91876a0845d changes only one desktop modal footer padding declaration. All data/fixture/query/QA3 files and tests are unchanged from f56e25c. Independent final Node regression34/34 and modal matrix12/12 PASS; prior unaffected29browser/21audit gates transfer by exact source comparison, not by claiming fresh full-suite execution. Desktop footer83px/reference82 remains a1px visual residual. See functional/final-footer-verification-summary.json and FUNCTIONAL_QA_REPORT.md final section.
