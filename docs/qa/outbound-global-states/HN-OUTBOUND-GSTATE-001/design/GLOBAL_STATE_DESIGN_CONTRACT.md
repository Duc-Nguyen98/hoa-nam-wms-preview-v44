# Global state design contract — HN-OUTBOUND-GSTATE-001

## State vocabulary

The UI must distinguish these states and preserve the associated action semantics:

| State | Trigger / meaning | Required presentation | Permitted action |
|---|---|---|---|
| `loading` | Initial read or modal read is in flight and no usable snapshot exists | Neutral loading title/description; skeleton or busy affordance may be used; keep shell and route context | None while busy; no destructive action |
| `empty` | Valid snapshot, zero outbounds, no active search/filter | Empty document icon, `Chưa có phiếu`, explanatory copy | `Đọc lại dữ liệu` |
| `no-results` | Valid snapshot but search/status filter returns zero | Search icon, `Không có kết quả`, filter-specific copy | `Xóa bộ lọc` |
| `error` | Read/command failed without a recoverable snapshot | Error tone/icon, retry explanation | `Thử lại`/`Đọc lại dữ liệu` when safe |
| `forbidden` | Actor lacks permission (`MOCK_COMMAND_FORBIDDEN` or equivalent) | Lock icon, permission copy; do not imply missing data | `Đóng` or return to authorized overview |
| `unauthorized` | Session expired (`SESSION_EXPIRED`) | Auth-expired copy; preserve no stale private data | Return to sign-in/overview |
| `stale` | Durable command outcome, session or snapshot cannot be trusted | Warning/reconcile copy; keep original request visible where safe | `Kiểm tra lại thao tác`, then refresh |
| `record-not-found` | Requested detail is absent from current snapshot | Not-found icon, record-specific copy | `Quay lại danh sách` |
| `ready/populated` | Valid snapshot with one or more rows | List/table or cards; status badges and actions follow business status | Search, filter, inspect, refresh |
| `detail` | Selected valid row | Modal via `GlobalModal`; status, recipient, lines and trace | Copy, refresh, close; receive/post only for eligible status |
| `confirm` | Receive/post intent opened | Confirmation modal with command-specific warning | Cancel or execute when fence and permission hold |

`error`, `forbidden`, `unauthorized`, `stale`, `empty` and `no-results` are never interchangeable. A `PageState` may be visually shared but its `kind`, accessible name, copy and action must remain distinct.

## Business status contract

S15 outbound statuses are `DRAFT`, `SCANNING`, `SUBMITTED`, `READY`, `POSTED`. The operational list maps them to `Nháp`, `Đang quét`, `Đã gửi từ App`, `Sẵn sàng xuất`, `Đã xuất kho`. `SUBMITTED` enables **Tiếp nhận phiếu**; `READY` enables **Xác nhận xuất kho**; `POSTED` is read-only. Receive does not reduce stock; post creates the outbound stock events. Never infer a command from visual color alone.

## Transition rules

- Initial `controller.resume()` restores durable recovery first, then reads catalog + operational snapshot.
- A successful read replaces the snapshot only when catalog and operational epochs/actor match and snapshot revisions converge.
- Search/status changes reset the local page to 1. Pagination and page-size controls are valid only for populated data.
- Opening a row stores the session fence (`epoch`, `scenarioId`, `generation`). If the fence or row version changes, detail actions fail closed as stale and require refresh.
- Confirmation remains modal-local; closing it returns to the selected detail/list context without mutating data.
- Unknown command outcomes expose reconcile (`Kiểm tra lại thao tác`) before another command; do not report success from an unverified response.

## Shared visual contract

Consume `src/shared/tokens.css` roles and `DESIGN_CONTRACT.md`; use `GlobalShell`, `GlobalModal`, `PageState`, `DataTable`, `Pagination`, `Button`, `FilterSelect`, `StatusBadge` and `Icon`. Minimum interactive target is 44 CSS px unless a scoped exception is documented. Preserve focus return, dialog semantics, keyboard operation, shell navigation and body scroll lock. REF-02/03 are the Tablet compact/expanded pair at one declared viewport, not separate CSS breakpoints.
