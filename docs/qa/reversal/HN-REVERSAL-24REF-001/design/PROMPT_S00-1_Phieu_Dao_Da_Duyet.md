# S00#1 — NÂNG CẤP UI/UX PHIẾU ĐẢO THEO THIẾT KẾ ĐÃ DUYỆT

**Project:** S00_Hoa_Nam_Web  
**Target:** Tồn kho & Đối soát → Quản lý Danh sách phiếu đảo  
**Mode:** AUTONOMOUS IMPLEMENTATION & VERIFICATION  
**Priority:** P1 — UI/UX fidelity, workflow correctness  
**Baseline duyệt:** 24 ảnh cuối, gồm 12 màn/trạng thái × Desktop/Tablet dọc, ngày 29/10/2026.

## 1. Mục tiêu và quyền thực hiện

Tôi đã duyệt thiết kế. Hãy triển khai giao diện và tương tác theo bộ ảnh, tự khám phá repository, route, component, API và ứng dụng hiện tại; sửa, chạy, kiểm thử và chụp screenshot đối chiếu đến khi hoàn tất.

Không dừng ở kế hoạch, báo cáo phân tích hoặc chỉ sửa trang danh sách. Không yêu cầu tôi chụp hiện trạng, tìm selector hoặc chỉ đường component khi có thể tự tìm. Không giả định có đủ ảnh chỉ vì thấy nhiều file: kiểm kê đúng 12 cặp và chỉ dùng bản chỉnh cuối của mỗi màn, loại bản trung gian.

Đây là yêu cầu triển khai phần mềm, không phải tạo thêm ảnh mockup. Tôn trọng AGENTS.md và cấu trúc dự án. Giữ thay đổi hiện có của người khác; không reset hoặc ghi đè công việc ngoài phạm vi.

## 2. Nguồn đối chiếu và giới hạn nghiệp vụ

- Ảnh duyệt là chuẩn bố cục và hình thức cho phạm vi này.
- Hợp đồng nghiệp vụ/API hiện hành đã phê duyệt là chuẩn xử lý dữ liệu, quyền và giao dịch.
- Tài liệu BPD v1.12 từng được tham chiếu đang ở trạng thái review-ready, approval evidence pending; không tự coi đó là baseline nghiệp vụ đã phê duyệt.
- Audit ngày 01/10/2026 từng ghi nhận route /reverse?screen=REV-00. Đây chỉ là đầu mối khám phá, phải xác minh route hiện tại.
- Nếu ảnh có khác biệt nhỏ về chữ, icon, dữ liệu hoặc trạng thái, chọn bản chỉnh cuối; nếu vẫn mâu thuẫn nghiệp vụ, ghi rõ và xử lý theo hợp đồng đã xác minh. Không sao chép lỗi từ ảnh.
- Chín dòng trong ảnh danh sách là fixture phục vụ đối chiếu, không phải yêu cầu hardcode tổng số bản ghi hoặc giới hạn trang cho dữ liệu thật.

Nếu thiếu một ảnh tham chiếu, tiếp tục các màn đủ nguồn; nêu chính xác ảnh thiếu. Không tự vẽ lại rồi gọi là đúng ảnh duyệt.

## 3. Ma trận bắt buộc: 12 cặp Desktop/Tablet

| STT | Màn/trạng thái | Hành vi chính |
| --- | --- | --- |
| 01 | Danh sách phiếu đảo | Tìm kiếm, lọc, phân trang, xem chi tiết, tạo phiếu; fixture 9 phiếu |
| 02 | Tạo phiếu — chọn chứng từ | Chọn một chứng từ gốc hợp lệ, hiển thị lượng gốc/đã đảo/còn được đảo |
| 03 | Nhập nội dung / chỉnh sửa nháp | Lý do, ghi chú, số lượng từng dòng; lưu nháp |
| 04 | Kiểm tra và ghi sổ | Xem trước ảnh hưởng, kiểm tra điều kiện, xác nhận thao tác |
| 05 | Chi tiết đã ghi sổ | Chỉ đọc, liên kết nguồn, số lượng và thời điểm ghi sổ |
| 06 | Chi tiết chờ hàng trả về | Yêu cầu trả/đã nhận/đủ điều kiện cộng khả dụng rõ ràng |
| 07 | Chi tiết đã hủy | Lý do, người, thời điểm hủy; không phát sinh tác động tồn |
| 08 | Tác động tồn & truy vết | Giao dịch gốc, đảo, ảnh hưởng thuần và audit timeline |
| 09 | Bị chặn bởi giao dịch liên quan | Giữ trạng thái nháp, nêu giao dịch chặn và hướng xử lý |
| 10 | Validation | Lý do bắt buộc, số lượng vượt giới hạn; lỗi cạnh trường |
| 11 | Kết quả ghi sổ chưa xác định | Kiểm tra trạng thái yêu cầu; không tự gửi lại giao dịch |
| 12 | Ghi sổ thành công | Hiển thị kết quả xác thực, xem phiếu và chứng từ gốc |

Đồng bộ bước tạo: **Chọn chứng từ → Nhập nội dung → Kiểm tra & ghi sổ**.
Không thêm các dòng hàng giả để lấp chỗ trống. Màn 2 dòng giữ đúng 2 dòng.

## 4. Quy tắc nghiệp vụ phải bảo toàn

### 4.1 Phiếu đảo và dữ liệu nguồn
- Phiếu đảo tạo giao dịch đối ứng có truy vết, không UPDATE/DELETE chứng từ hoặc movement đã ghi sổ.
- Chứng từ nguồn phải đã ghi sổ, đúng phạm vi quyền và còn lượng được đảo.
- Còn được đảo = lượng giao dịch gốc − lượng các phiếu đảo đã ghi sổ hợp lệ trước đó. Không trừ nháp, đã hủy hoặc một lần nữa vì retry.
- Chỉ chỉnh sửa khi trạng thái và quyền cho phép. Phiếu đã ghi sổ chỉ đọc, không sửa/xóa trực tiếp.
- Ngày tạo/ngày ghi sổ do hệ thống quản lý; không làm thành date picker chỉnh tùy ý.
- Kho, loại và chứng từ nguồn đã ràng buộc phải hiển thị nhất quán; không cho đổi làm sai chuỗi giao dịch.

### 4.2 Đảo nhập
- Phải kiểm tra giao dịch phát sinh sau và phạm vi hàng liên quan trước ghi sổ.
- Có giao dịch xuất/bảo hành/đảo liên quan ngăn cản thì chặn theo hợp đồng hiện hành.
- Hiển thị chứng từ chặn, thời điểm, dòng hàng/BOX và số lượng có liên quan.
- Không có nút ép ghi sổ hoặc bỏ qua guard. Chain ID không được dùng để vượt guard.
- Mã BOX là định danh BOX; không đổi nhãn thành vị trí kho.

### 4.3 Đảo xuất, hàng trả về
- Trạng thái chờ hàng trả về không đồng nghĩa đã cộng tồn khả dụng.
- Chỉ cộng khả dụng khi đã xác nhận điều kiện hàng có thể bán và giao dịch được ghi sổ thành công theo nghiệp vụ.
- Hàng lỗi/không đủ điều kiện bán phải phân biệt với hàng khả dụng.
- Không tự thêm nghiệp vụ nhận hàng, scan, camera hoặc NFC lên Web khi chưa xác minh boundary. Scanner thực thi hiện trường; Web quản trị, theo dõi và báo cáo.

### 4.4 Ghi sổ an toàn và kết quả chưa xác định
- Kiểm tra quyền backend; tên quyền inventory.reversal.post chỉ là đầu mối từ tài liệu, phải xác minh mapping hiện hành.
- Ghi sổ phải atomic, kiểm soát concurrency và idempotency tại backend.
- Vô hiệu nút khi đang gửi giúp UX nhưng không thay thế bảo vệ backend.
- Timeout hoặc mất mạng sau submit: hiển thị OUTCOME_UNKNOWN, ảnh hưởng tồn “Đang kiểm tra”; không đoán là 0 hoặc thành công.
- Kiểm tra trạng thái bằng request/idempotency key hiện có. Không sinh key mới hoặc tự POST lần nữa gây hiệu ứng kép.
- Khi lượng còn được đảo thay đổi do phiên khác, hiển thị conflict, tải dữ liệu mới và yêu cầu kiểm tra lại.
- Không dựng UI báo thành công khi API chưa xác nhận.

## 5. Chuẩn hình thức và responsive

Giữ phong cách ảnh đã duyệt: navy/teal, nền sáng, card trắng, đường viền mảnh, typography phân cấp rõ, bảng dữ liệu dễ đọc. Ưu tiên token/component hệ thống đang dùng; hợp nhất sai khác trong phạm vi này thay vì tạo hệ thiết kế mới.

Mốc bố cục để triển khai và đo thực tế:
- Desktop: sidebar khoảng 240px, gutter nội dung 32px, padding card 24px.
- Tablet dọc: shell gọn với menu, gutter khoảng 24px; bố trí lại thông tin, không thu nhỏ nguyên màn Desktop.
- Khoảng cách dùng nhịp 8/16/24/32px; các nhãn, input, icon và nút cùng hàng phải thẳng trục.
- Vùng chạm tối thiểu khoảng 44px trên Tablet. Focus nhìn thấy, tab order hợp lý.
- Giữ độ tương phản, chữ tiếng Việt có dấu, không cắt mã phiếu hoặc số lượng quan trọng.
- Căn phải số lượng, nhất quán đơn vị; tiền tố âm/dương và nhãn phải rõ ngữ nghĩa.
- Thanh hành động cuối trang không che nội dung; kiểm tra khi cuộn và khi bàn phím mở.
- Nếu bảng cần cuộn ngang, giới hạn trong vùng bảng, có dấu hiệu nhận biết; tránh cuộn ngang toàn trang.
- Màu trạng thái đi kèm chữ/icon: Nháp, Chờ hàng trả về, Đã ghi sổ, Đã hủy. Lỗi trang không thay cho trạng thái nghiệp vụ.
- Tách “Biến động dự kiến khi ghi sổ”, “Tác động tồn hiện tại” và “Ảnh hưởng thuần của chuỗi”.
- Ảnh hưởng thuần của một chuỗi không phải toàn bộ tồn hiện tại của SKU.

Không hardcode toàn bộ app theo một kích thước ảnh. Đọc kích thước ảnh thực tế rồi chụp cùng viewport để so sánh; kiểm tra thêm 1920×1080, 1440×900 và Tablet dọc 800×1280 CSS px. Phân biệt CSS pixel với kích thước ảnh xuất và device pixel ratio.

Giữ tương thích các contract toàn cục hiện có như ngôn ngữ, theme, notification và toast. Dùng component toast đã duyệt của hệ thống, không tạo mẫu riêng cho module này.

## 6. Fixture đối chiếu, không dùng làm dữ liệu production

- Danh sách: 9 phiếu = 4 đã ghi sổ + 2 nháp + 1 chờ hàng trả về + 2 đã hủy.
- REV-20261028-009: đảo nhập từ PN-20261020-001, 9 SKU, lượng gốc 90 Cái, đã đảo trước 0, đảo lần này 45, còn 45; biến động −45, ảnh hưởng thuần chuỗi +45. Giao dịch nhập gốc 20/10/2026 08:30; tạo/kiểm tra/ghi sổ phiếu đảo ở cùng phút 28/10/2026 14:25.
- REV-20261028-007: nháp từ PN-20261022-007, chỉ 2 SKU HN-DRV-001/Bộ điều khiển động cơ và HN-PSU-002/Bộ nguồn 24V. Mỗi dòng gốc 10, đã đảo 0, yêu cầu 2; tổng 4, dự kiến −4, hiện tại 0 khi còn nháp. Sau ghi sổ mỗi dòng còn 8.
- Với 007, ngày tạo 28/10/2026 11:15; tình huống submit/thành công sau đó ở 14:35. Các ảnh là nhiều thời điểm trong một luồng, không phải các trạng thái đồng thời.
- REV-20261028-008: đảo xuất 3 SKU, yêu cầu trả 6, đã nhận 0, cộng khả dụng 0.
- REV-20261027-005: đã hủy, 1 dòng/2 Cái, tác động 0.
- REV-20261025-002: nháp, chọn đảo 1 Cái của BOX-018-01; PX-20261024-015 đã xuất chính hàng liên quan, bị chặn, tác động hiện tại 0. Không đổi lượng toàn bộ chứng từ nhập gốc thành 1.
- Validation 007: lý do trống, dòng DRV nhập 12 trong khi tối đa 10; dòng PSU nhập 2 hợp lệ. Không cho tiếp tục.
- Kho minh họa HN01, người tạo Nguyễn Văn Nam. Fixture trạng thái và số liệu phải nhất quán giữa Desktop/Tablet.

## 7. Trạng thái và tương tác cần hoàn thiện

Ngoài 12 cặp ảnh, dùng state contract toàn cục cho loading, empty, no result, load error, forbidden, not found, session expired, submitting, conflict và outcome unknown khi có liên quan.

Nút/link phải có tác dụng thật: tìm, xóa lọc, đổi trang, mở nguồn, về danh sách, lưu nháp, xem trước, xác nhận ghi sổ, kiểm tra trạng thái. Hủy nháp phải có xác nhận và lý do nếu hợp đồng yêu cầu; thao tác hủy và quyền phải bám API hiện hành. Không bổ sung chức năng hàng loạt không có trong phạm vi duyệt.

Lỗi gắn với trường và có hướng sửa; giữ dữ liệu đã nhập khi lỗi. Cảnh báo giao dịch chặn dẫn được đến chứng từ liên quan. Không dùng alert trình duyệt thay dialog hệ thống.

## 8. Cách thực hiện và kiểm chứng

1. Kiểm kê ảnh, route, component, API, quyền và trạng thái; lập mapping 12 màn × 2 viewport.
2. Chạy ứng dụng, chụp hiện trạng thực tế và xác định chênh lệch.
3. Sửa component dùng chung trong phạm vi cần thiết rồi hoàn thiện các màn và tương tác.
4. Chụp lại đúng viewport và trạng thái của ảnh duyệt; dùng đặt cạnh hoặc overlay để kiểm tra lề, padding, hàng/cột, font, icon, màu, nội dung và điểm gãy responsive.
5. Sửa chênh lệch, chạy lại kiểm tra phù hợp sau mỗi thay đổi có ảnh hưởng.
6. Kiểm tra trình duyệt: cuộn, focus, bàn phím, dropdown/dialog, loading và lỗi; không chỉ kiểm tra bằng đọc source.
7. Chạy lint/typecheck/build và các test sẵn có phù hợp. Bổ sung kiểm thử có ý nghĩa cho guard, validation, idempotency/concurrency nếu thay đổi logic; không viết test chỉ sao chép implementation.
8. Xác minh API thật khi môi trường cho phép. Nếu chỉ kiểm tra bằng mock/fixture, ghi rõ; không báo API integrated hoặc nghiệp vụ PASS.

Không công bố pixel-perfect chỉ từ cảm nhận. Báo số đo, screenshot và sai khác còn lại. Không dùng screenshot mockup làm bằng chứng ứng dụng đã chạy.

Nếu phạm vi nhiệm vụ hiện hành đã cho phép cập nhật preview, cập nhật đúng URL đã dùng:
https://hoa-nam-wms-wave4-preview.ducnin1998.chatgpt.site/
và xác minh revision thực tế. Nếu quyền phát hành chưa có hoặc gate chưa đạt, hoàn tất bản chạy và bằng chứng cục bộ, nêu blocker phát hành; không phát hành vượt quyền và không báo URL đã cập nhật khi chưa xác minh.

## 9. Bàn giao và điều kiện hoàn tất

Báo cáo ngắn, có:
- Route/component thay đổi và revision.
- Ma trận 12 cặp: đã triển khai, đã chụp, đã kiểm tra tương tác, API thật/mock, sai khác còn lại.
- Screenshot Desktop/Tablet từ ứng dụng sau sửa và đường dẫn mở bản chạy.
- Kết quả kiểm tra margin/padding thực tế, overflow và vùng chạm.
- Kết quả lint/typecheck/build/test; blocker và giới hạn bằng chứng.
- Các kiểm tra nghiệp vụ: chỉ sửa nháp; guard giao dịch; chờ hàng về chưa cộng khả dụng; source bất biến; không ghi sổ trùng; unknown outcome kiểm tra trạng thái; conflict được xử lý.

Chỉ đánh dấu hoàn tất khi giao diện, tương tác và bằng chứng trong phạm vi đều đạt. Nếu một gate chưa đạt, báo đúng phần chưa đạt và tiếp tục phần có thể làm, không dùng “đã xử lý triệt để/100%” khi chưa có chứng cứ.

