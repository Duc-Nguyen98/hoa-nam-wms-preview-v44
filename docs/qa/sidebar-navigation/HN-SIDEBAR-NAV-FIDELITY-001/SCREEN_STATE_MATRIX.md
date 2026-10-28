# Screen × state matrix and global migration report

| State | Sidebar/Drawer presentation | Evidence | Verdict |
|---|---|---|---|
| LOADING | Page-owned state; navigation remains shell-owned | source audit | NOT_RUN |
| EMPTY | Page/list contract-owned | source audit | NOT_RUN |
| NO_RESULT | Function search returns reduced navigation tree | local browser smoke | PASS |
| LOAD_ERROR | Feature/API-owned | source audit | NOT_RUN |
| FORBIDDEN | Feature/API-owned; no shared route guard | `RE_AUDIT.md` | BLOCKED |
| NOT_FOUND | App route fallback | source audit | NOT_RUN |

The previous Outbound Global State reference was not re-approved for a new sidebar illustration. No new global illustration was introduced. Track C is therefore `GLOBAL_STATE_REFERENCE_UNAVAILABLE` for new sidebar-specific states; existing page-owned state contracts remain unchanged.
