> Patch hiện hành **HN_UI_SHARED_v1.1.2 / e2b9c3e08256**: [header backdrop](PATCH_NOTES_v1.1.2.md). Shared che/mờ vùng sau header khi cuộn, dùng fallback khi giảm độ trong suốt. Các quyết định khóa trước giữ nguyên; technical patch không tự duyệt visual hoặc nâng NOT_RUN.

> Patch hiện hành12/10/2026: **HN_UI_SHARED_v1.1.1 / 235481861ec6**. [Patch notes](PATCH_NOTES_v1.1.1.md) bổ sung focus reveal/scroll lock trong mẫu DEV và trình bày shared aria-disabled; nghiệp vụ/quyết định Owner R3 bên dưới giữ nguyên. Source/shared/manifest thực tế lấy từ UI_FOUNDATION_LOCK.json và [handoff patch](../../output/S00/POST_APPROVAL_UX_AUDIT_2026-10-12/HANDOFF.md). Không nâng các mục NOT_RUN hoặc visual ngoài phạm vi thành PASS.

# HN_UI_SHARED_v1.1.0 — quy chuẩn control dùng chung

Ngày: 12/10/2026. Chủ sở hữu: S00. Phạm vi: frontend preview, không phải contract API/DTO/RBAC.

## Quyết định và phiên bản

Owner đã xác nhận: “oke tôi xác nhận duyệt bản này, kiểm tra và áp dụng đồng loạt cho tôi các màn còn lại”. Phần trình bày và tương tác control của **HN_CONTROLS_R3** chuyển sang **OWNER_APPROVED**. Mốc được duyệt là source `f1274685c7f5f17d37165a7ff36b264123819b29090ff87cf0678f09bac4a736`, shared `392e08a09a158725d8d0fed2ef0b7febc1beda1520918f05fac372817973101e`, bundle `10bd2b7353d0ab7d311ee15cd6c48befeb6dad3e0ff593223b3b1dc027d4b8c1`.

Phiên bản kế thừa cho đợt triển khai là **HN_UI_SHARED_v1.1.0**. Các SHA trên định danh bản R3 được duyệt, **không thay SHA của release tích hợp mới**. Source/shared/bundle/manifest và kết quả phát hành cuối lấy từ lock, checkpoint và handoff của đợt `CONTROLS_ROLLOUT_2026-10-12`. Việc tạo tài liệu này không tự công bố READY hoặc PASS.

Bản này bổ sung phần control cho [contract v1.0](CONTRACT_UI_COMMON_v1.0.md), kế thừa Foundation **HN_UI_SHARED_v1.0.2 / 58aa9a6cb17f** cùng các quyết định nghiệp vụ đã khóa. Chỉ những quy tắc control tương ứng được thay bằng nội dung dưới đây. NOT_RUN, BLOCKED, N/A, thiếu nguồn và các visual ngoài phạm vi R3 vẫn giữ nguyên.

Hồ sơ đối chiếu R3: [handoff](../../output/S00/CONTROLS_UPGRADE_2026-10-12/HANDOFF.md), [phạm vi control từng màn](../../output/S00/CONTROLS_UPGRADE_2026-10-12/CONTROL_COVERAGE.md), [QA có giới hạn](../../output/S00/CONTROLS_UPGRADE_2026-10-12/QA_REPORT.md). Trạng thái chờ duyệt trong hồ sơ lịch sử được giữ để truy vết; quyết định Owner ở trên là cập nhật mới cho phần control R3.

## Thành phần và hình thức đã duyệt

| Thành phần | Quy chuẩn kế thừa |
|---|---|
| Foundation | Public Sans; brand `#0A3765`; control/focus `#004E74`; không tím; “Kho Hoa Nam” chỉ đọc; giữ shell và bố cục nghiệp vụ hiện hành. |
| Select | `BasicSelect` / `FilterSelect` trong `src/shared/controls.tsx`; dùng cho bộ lọc, lựa chọn hiện có và page size. Giữ native value/change/keyboard; menu option có trạng thái chọn, hover, focus, disabled và error nếu caller có. |
| Button | `Button` trong `src/shared/primitives.tsx`, CSS `control-buttons.css`; primary nền `#004E74`, hover `#0A3765`, chữ trắng rõ. Secondary và ghost giữ phân cấp đã duyệt. Không dùng màu disabled để trình bày nút đang khả dụng. |
| Loaders | `loading` phản ánh lifecycle thật của controller/adapter; một spinner, giữ kích thước và accessible name, không dịch card/form hoặc làm mất focus. |
| Icon | Dùng `Icon` / `IconName` chung, nguồn Tabler outline đã lưu trong repo và provenance/license. Nút chữ có `leadingIcon`/`trailingIcon`; `iconOnly` phải có nhãn truy cập rõ và vùng chạm tối thiểu 44×44. Logo Hoa Nam và SVG biểu đồ không bị thay bằng icon nghiệp vụ. |
| Focus | Mỗi control chỉ có một cơ chế hiển thị focus. `FilterInput`: wrapper sở hữu vòng focus, input con không vẽ thêm. `BasicSelect`: chính select sở hữu vòng focus, wrapper không thêm outline/shadow. Button có focus-visible rõ màu `#004E74`. Giữ error/disabled và reveal focus đã khóa. |
| Feedback | Không thêm badge kỹ thuật “Giả định minh họa”/“Thông báo minh họa” vào UI sản phẩm. Provenance/scenario nằm trong hồ sơ DEV; giữ badge nghiệp vụ, cảnh báo cần thiết và thông báo thiếu nguồn đúng nghĩa. Một sự kiện có một nơi phản hồi chính. |

Vuexy Basic Select, Button Loaders/Icon/Icon Only là tham chiếu đã đối chiếu trong R3; không sao chép mã Vuexy/Vuetify. `appearance: base-select` là enhancement theo engine; native fallback giữ semantics nhưng không được tuyên bố menu mở giống hệt khi chưa kiểm trên browser đó. Nguồn Tabler cố định tại commit `a4ce1404bc6d24d3c365afe7b258d6bf6f48d62d`; phải đối chiếu provenance trong source trước khi bổ sung tài sản mới.

## Hành vi và ranh giới nghiệp vụ

- **Submit có nguồn:** dùng loading cho Tạo/Lưu/Sửa/Xác nhận hoặc request đã được giao. Handler/controller phải chặn lặp cả click, Enter và đường gọi khác; loại phản hồi cũ sau reset/đổi context/unmount. Chỉ báo thành công khi outcome thực sự xác nhận. Không tự tạo kết quả auth/CRUD bằng timer hoặc vì field đã có chữ.
- **Query:** search/filter/sort/page/reset/refresh giữ controller/adapter và phạm vi fixture hiện hành. Adapter hoàn thành tức thời không cần trì hoãn để biểu diễn loader. Không thêm request thật.
- **Guard:** nút chưa có flow hoặc quyền triển khai vẫn giữ guard và thông báo nguồn; không biến thành form/confirm/submit sau khi đổi kiểu Button.
- **Local/navigation:** mở/đóng, hiện mật khẩu, cuộn, chọn dòng và route đã đăng ký giữ hành vi hiện có; không thêm spinner giả hoặc suy chọn dòng thành bulk nghiệp vụ.
- **Lỗi/không rõ outcome:** giữ dữ liệu người dùng và phản hồi đủ để xử lý trong state đã có nguồn. Không tự thêm Undo, retry ghi dữ liệu, xác nhận/hủy/đảo hoặc đường điều hướng mới.
- **Prototype:** mẫu form/dialog/drawer cách ly đã duyệt cách trình bày không tự cấp quyền CRUD cho S02 hoặc thay contract S07/S08/S12/S17. Màn chỉ đọc tiếp tục chỉ đọc.

## Quy tắc Foundation tiếp tục áp dụng

- Kiến trúc `UI → controller → adapter → fixture`; component không tự quyết định nghiệp vụ, lấy record fixture hoặc phát API thật.
- Search chuỗi con, không phân biệt hoa/thường/dấu, chuẩn hóa khoảng trắng và `đ/Đ → d`; debounce 250ms, chỉ trên field đã khai báo. Option áp dụng ngay, kết hợp AND; reset đúng phạm vi đã chốt.
- Option lấy từ danh mục nguồn hoặc unique toàn bộ fixture scenario theo contract; không lấy từ trang hiện tại/tập đã lọc.
- Basic một ngày; Range khoảng liên tục đủ hai đầu hợp lệ; Multiple chỉ khi có nghiệp vụ nguồn. Không thêm ngày hoặc khóa vì thiếu fixture; S04 datepicker N/A. Frontend `dd/MM/yyyy`, `Asia/Ho_Chi_Minh`, gồm cả hai đầu khoảng.
- Thiếu coverage giữ accepted query/control/kết quả và thông báo đúng; không trả 0/empty giả hoặc đặt dữ liệu cũ dưới kỳ mới.
- Search/filter → sort toàn bộ kết quả → paginate; mặc định 10, lựa chọn 10/15/25/50; đổi query/sort/size về trang 1. STT liên tục, không thay ID. Sort đúng kiểu/tiếng Việt/natural code, missing-last cả hai chiều, tie ổn định; không sort STT/checkbox/action.
- Giữ mapping sort, summary và tập detail riêng của từng màn. Không dùng tổng danh mục làm pagination total khi chưa có trang. Không suy quan hệ chứng từ/tồn kho hoặc biến dữ liệu thiếu thành 0.
- QA60 và scenario delay/error/unknown chỉ DEV, dữ liệu tái lập riêng, không trộn fixture hoặc thêm công tắc QA vào UI sản phẩm.

## Phân công và áp dụng cho màn sau

S00 là đầu mối duy nhất sửa shared/component/token/config, đóng băng phiên bản và bàn giao. Mỗi màn dùng trực tiếp `Button`, `BasicSelect`/`FilterSelect`, `Icon` và các wrapper chung; không sao chép component, spinner/icon hoặc thêm CSS focus/button/select riêng để che lỗi shared. Control chuyên biệt của bảng/lịch/biểu đồ giữ semantics riêng; việc import CSS không chứng minh mọi `<button>` đã chuyển thành Button.

Chủ màn giữ field, mapping, lifecycle và guard đã được giao. Màn mới phải đọc bản quy chuẩn này cùng [hướng dẫn tích hợp](CONTROLS_INTEGRATION_v1.1.md), dùng shared version của release và kiểm trực tiếp runtime của mình. Không cần hỏi Owner lại về các quyết định đã duyệt; xung đột nghiệp vụ/field/role/API hoặc ngoại lệ mới phải báo trước khi thay đổi phần liên quan.

Ghi issue, lưu ảnh/computed CSS, dẫn đường dẫn và đưa vào handoff S00 đã được phép. Gộp lỗi cùng nguyên nhân, giữ liên kết báo cáo màn. Chỉ nói đã chuyển/đã nhận khi có receipt; nếu không nhắn trực tiếp thì dùng hồ sơ project. Không sửa chồng feature đang do chat khác xử lý.

## Bằng chứng và điều kiện nghiệm thu

Tách bốn mức: đối chiếu source, harness chung, runtime từng màn và Owner duyệt visual. Owner duyệt R3 không chuyển kiểm thử chưa chạy thành PASS hoặc nghiệm thu tất cả workflow.

Đợt R3 có giới hạn còn mở: zoom thật 125%/200%; DPR2/PNG1600×2560; thiết bị cảm ứng thực; native select fallback; hiệu năng trên thiết bị Owner và toàn bộ state từng màn; outcome nguồn auth S07/S08 cùng coverage riêng S11–S15. Chỉ kết quả mới có bằng chứng trên bản rollout mới được cập nhật phạm vi tương ứng. Entry DEV S18 của R3 không tự chứng minh route chính đã tích hợp.

Mỗi handoff phải có mốc source/shared/bundle, file đổi, route, viewport/browser, state/case thực sự chạy, ảnh và NOT_RUN/BLOCKED/N/A còn lại. Không suy “hết lag toàn hệ thống” từ một ca đo hoặc chỉ từ unit/build. Không sửa production, deploy hoặc thay stack trong đợt này.

