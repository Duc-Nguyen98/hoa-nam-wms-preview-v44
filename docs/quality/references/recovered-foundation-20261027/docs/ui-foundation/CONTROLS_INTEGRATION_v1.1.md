> Shared hiện hành **v1.1.2 / e2b9c3e08256**. [Patch header](PATCH_NOTES_v1.1.2.md) kế thừa mọi control API; nhận delta s00-shell.css, không copy override DEV hoặc CSS từng màn.

> Phiên bản tích hợp hiện hành: **HN_UI_SHARED_v1.1.1**, kế thừa API v1.1.0 dưới đây. Nhận delta [patch notes](PATCH_NOTES_v1.1.1.md) và [handoff](../../output/S00/POST_APPROVAL_UX_AUDIT_2026-10-12/HANDOFF.md); không dùng hash4441/v1.1.0 thay bản4451. Kiểm aria-disabled/guard và trạng thái loading riêng; không tạo CSS riêng trên màn.

# Tích hợp HN_UI_SHARED_v1.1.0

Áp dụng cho màn hiện có và màn mới. Owner đã duyệt phần control **HN_CONTROLS_R3 / f1274685c7f5** và cho triển khai đồng loạt; đọc [contract v1.1](CONTRACT_UI_COMMON_v1.1.md). Kết quả kỹ thuật/mốc release cuối lấy từ lock và handoff của `CONTROLS_ROLLOUT_2026-10-12`, không lấy SHA R3 làm SHA bản tích hợp mới.

## Nhận đúng phiên bản

1. Đọc manifest/file changes, checkpoint, báo cáo kỹ thuật và handoff rollout. Đối chiếu source, shared và bundle riêng; port giống nhau không chứng minh cùng bản.
2. Nhận theo danh sách file đã bàn giao vào workspace màn; không restore toàn snapshot đè thay đổi đang làm. S00 sở hữu shared/token/config; chủ màn giữ contract/controller/adapter/fixture.
3. Giữ React/Vite/TypeScript và dependencies hiện có. Entry app dùng CSS chung theo release; entry DEV độc lập phải nhận `control-buttons.css` sau CSS legacy/unified và font Public Sans hiện có. Không cài thư viện hoặc copy CSS control vào màn.
4. Đối chiếu action: submit, query, guard, local, navigation. Nối pending vào request được phép; không mở workflow phía sau một nút guard.
5. Kiểm đúng màn/route/state trên bundle tích hợp, ghi kết quả và hash trong checkpoint màn. Chỉ đóng phần issue đã có bằng chứng.

## API thực tế

| API | Kiểu và cách dùng |
|---|---|
| `Button` | Import từ `src/shared/primitives.tsx`; `ButtonProps` kế thừa `ButtonHTMLAttributes<HTMLButtonElement>`. `variant?: 'primary' \| 'secondary' \| 'ghost'`; `tone?: 'default' \| 'danger'`; `loading?: boolean`; `leadingIcon?`/`trailingIcon?: ReactNode`. `type` mặc định `button`. |
| `iconOnly` | Union type bắt buộc `'aria-label': string` khi `iconOnly: true`. CSS giữ 44×44. Nhãn nói đúng hành động/đối tượng; tooltip không thay accessible name. |
| `BasicSelect` | Import từ `src/shared/controls.tsx`; props là `SelectHTMLAttributes<HTMLSelectElement>`. Giữ native `value`, `onChange`, `name`, `id`, `required`, `disabled`, ARIA và `<option>`. |
| `FilterSelect` | Cùng file; `FilterSelectProps = SelectHTMLAttributes<HTMLSelectElement> & { label: string; children: ReactNode }`. Tự nối label/id và bọc BasicSelect. |
| `FilterInput` | Cùng file; `FilterInputProps = InputHTMLAttributes<HTMLInputElement> & { label: string; icon?: IconName }`. Dùng cho search theo pattern màn. |
| `Icon` | Import từ `src/shared/Icon.tsx`; nhận `SVGProps<SVGSVGElement> & { name: IconName; size?: number }`, mặc định 20. Chọn tên có trong union; không truyền tên Tabler bất kỳ khi mapping chưa có. |

Ví dụ API dưới đây minh họa cách nối **state/callback đã có**; không bổ sung quyền Lưu cho màn chưa được giao form:

```tsx
import { Button } from '../../shared/primitives';
import { FilterSelect } from '../../shared/controls';
import { Icon } from '../../shared/Icon';

<FilterSelect label="Trạng thái" value={status} onChange={onStatusChange}>
  {statusOptions.map(option =>
    <option key={option.value} value={option.value}>{option.label}</option>
  )}
</FilterSelect>

<Button type="submit" loading={pending} leadingIcon={<Icon name="save" />}>
  Lưu
</Button>

<Button variant="ghost" iconOnly aria-label="Đóng" onClick={onClose}>
  <Icon name="close" />
</Button>
```

`event.currentTarget.value` của select vẫn là string. Chuyển sang số/enum tại caller/controller theo schema nguồn, không thay ID hoặc suy enum mới. Page size tiếp tục qua `Pagination` dùng BasicSelect, không tạo select page size riêng.

## Pending và focus

- `loading` đặt aria-busy/aria-disabled, hiển thị một spinner và chặn click, đồng thời giữ button focusable. `disabled` là native disabled riêng cho điều kiện không khả dụng; không dùng nó thay pending nếu cần giữ focus.
- Form `onSubmit` và controller vẫn phải guard lặp. Shared Button không chặn được request gọi từ đường khác hoặc quyết định outcome. Không coi aria-disabled tự động vô hiệu hóa mọi handler.
- Giữ text và icon slot trong layout khi pending; không thay label làm đổi chiều rộng. Không chèn pending banner mới khiến form/card tăng chiều cao. Dùng một nơi feedback chính và nhãn trạng thái truy cập được nếu màn đã có.
- Request cũ không được ghi đè query/context mới. Giữ cancellation/sequence/epoch guard hiện hành, kiểm reset/unmount/đổi context theo state có nguồn.
- Lỗi giữ input; retry hoặc kiểm tra trạng thái chỉ theo contract hiện có. Không tự gửi lại khi outcome chưa rõ và không bịa thành công bằng delay của UI.
- Select sở hữu vòng focus; wrapper không vẽ thêm. Search `FilterInput` dùng wrapper làm focus owner. Button chỉ báo focus-visible riêng. Không reset outline toàn cục hoặc override trong CSS màn.
- Escape đóng picker đang mở trước vùng filter/dialog cha; giữ focus về control kích hoạt khi đóng vùng theo contract. Kiểm cả Tab/Shift+Tab và mouse focus.

## Kiểm lại tại từng màn

| Nhóm | Bằng chứng cần ghi |
|---|---|
| Select | Nghỉ, hover, menu mở, selected/keyboard/Escape, option dài; disabled/error nếu có; không double focus, cắt menu hoặc tràn trang. Ghi engine/base-select/fallback thực tế. |
| Button | Primary/secondary/ghost, icon+text/icon-only, hover/focus/disabled; tên truy cập và vùng chạm44px; kích thước không đổi lúc pending. |
| Request | Một loader/một request khi click/Enter lặp; focus giữ; outcome đúng nguồn; retry/reset/stale response chỉ theo capability đã có. |
| Query | Search/filter/sort/page size/trang/reset/refresh hoạt động đúng phạm vi adapter. Giữ summary/detail/accepted query và giới hạn thiếu nguồn. |
| Responsive | Desktop1920×1080, Tablet ngang1280×800, Tablet dọc logical800×1280 theo contract; zoom125%/200%, focus reveal, overflow và long content. DPR2/ảnh1600×2560 chỉ ghi đạt khi công cụ thực sự xác minh. |
| Nghiệp vụ | Guard tiếp tục guard; route/context đúng; không thêm CRUD/auth/đảo tồn từ thiết kế control. S04 datepicker N/A. |
| Dữ liệu | Fixture tham chiếu không đổi. QA60 có tổng riêng; size50/trang2/STT51 là bằng chứng cơ chế QA, không phải trang2 của dữ liệu nguồn nhỏ. |

Không tạo state/record/field để lấp checklist. Không có state trong phạm vi ghi N/A; chưa chạy ghi NOT_RUN; không đủ nguồn để thực thi ghi BLOCKED với lý do. Source scan, typecheck, unit, harness và runtime không thay thế nhau. Ghi đo hiệu năng theo phạm vi thật, không gọi một mẫu không có long task là toàn hệ thống hết lag.

## Phạm vi kế thừa theo nhóm màn

- S01–S06: shared toolbar/search/select/table/pagination/refresh; giữ tổng nguồn và khác biệt dashboard/catalogue/PV. Nút Thêm/Sửa/Xem còn guard không thành CRUD.
- S07–S08: shared AuthLayout/Button/Icon và pending controller. Duyệt button không giải quyết outcome/context thiếu nguồn hoặc cho phép bỏ qua S08.
- S09–S17: giữ read/query/selection/navigation và mapping đã được giao; dùng chung control. Không biến S11–S15 thiếu coverage thành query giả; không thêm submit xác nhận/hủy/đảo/xếp khay.
- S18: R3 trước duyệt dùng entry DEV. Main route/menu phải được tiếp nhận từ nguồn S18 có receipt và kiểm trên release mới; không coi checklist này là bằng chứng đã tích hợp.
- S19 trở đi: chỉ tích hợp khi có source/contract và phạm vi được giao. Tự kế thừa chuẩn control trong chức năng hợp lệ; không thêm màn hoặc workflow vì số thứ tự tiếp theo.

Các nút chuyên biệt trong lịch, header sort, biểu đồ hoặc navigation có semantics riêng; tiếp tục sử dụng component chung tương ứng. Không bọc tất cả `<button>` bằng Button một cách cơ học nếu làm thay đổi keyboard hoặc geometry. Nếu cần ngoại lệ trình bày mới, ghi vấn đề/ảnh/tác động để S00 đối chiếu trước.

## Bàn giao lỗi và màn mới

Mỗi issue gồm màn/route/device, source/shared/bundle, bước tái hiện, state, expected/actual, ảnh/computed CSS, severity và owner. Gộp cùng nguyên nhân ở S00, giữ link issue màn. Các màn được phép ghi và chuyển lỗi shared trong phạm vi đã giao mà không hỏi Owner lại; chỉ xác nhận đã gửi/nhận khi có receipt.

Handoff màn mới phải tham chiếu **HN_UI_SHARED_v1.1.0**, [contract](CONTRACT_UI_COMMON_v1.1.md), manifest release thực tế và kết quả kiểm riêng. Không sao chép selector focus/select/button, Icon assets hoặc dựng wrapper thay shared. Nghiệp vụ ngoài quy chuẩn vẫn cần nguồn/duyệt tương ứng; các giới hạn kiểm thử kế thừa tiếp tục mở cho tới khi có evidence mới.
