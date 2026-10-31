# SAGSCXR-RNS – GitHub Pages

Website dự kiến: https://sagsdieuhanh-gif.github.io/SAGSCXR-RNS/

## Kiến trúc

- Frontend: HTML / CSS / JavaScript thuần trên GitHub Pages, không phụ thuộc Vercel.
- Backend: Supabase project `ivixjhwghprfxdtaupxc`, các Edge Functions `sagscxr-rns-*`.
- Lưu trữ văn bản và tệp: Google Drive; metadata và READ & SIGN nằm tại Supabase.
- Không đưa service role key, Google OAuth client secret, mật khẩu hoặc dữ liệu hồ sơ vào repository công khai.

## Phát hành GitHub Pages

- Repo đã có GitHub Pages hoạt động; publish từ `main` / `(root)` bằng cơ chế build tự động của GitHub Pages.
- `.github/workflows/pages.yml` chỉ kiểm tra cú pháp và tệp bắt buộc, không triển khai lần hai.
- Trong **Settings → Pages**, chọn **Deploy from a branch**, `main`, `/(root)` nếu cấu hình bị thay đổi.
- Xác minh bằng URL GitHub Pages chính thức sau khi GitHub báo build/deployment thành công.

## URL cấu hình Supabase Authentication

Trong **Supabase → Authentication → URL Configuration**, bổ sung Redirect URLs:

- `https://sagsdieuhanh-gif.github.io/SAGSCXR-RNS/secure.html`
- `https://sagsdieuhanh-gif.github.io/SAGSCXR-RNS/index.html`

Cập nhật Site URL sang `https://sagsdieuhanh-gif.github.io/SAGSCXR-RNS/` khi chuyển hẳn hệ thống sang GitHub Pages. Điều này quan trọng với email mời và đặt lại mật khẩu.

## Hướng dẫn xử lý khi nhân viên không nhận được email mời

- Vào **QUẢN LÝ TÀI KHOẢN**, chọn bộ lọc **CHỜ XÁC MINH**.
- Tìm đúng email đã gửi thư mời và bấm **LẤY LINK MỜI**.
- Xác nhận, sao chép đường dẫn xác minh và **chỉ gửi riêng** cho người nhận qua tin nhắn cá nhân (ví dụ Zalo). Không đăng lên nhóm chung, công khai hay ghi vào tài liệu.
- Nhân viên mở link để xác minh và tạo mật khẩu trên GitHub Pages; ADMIN tiếp tục **KÍCH HOẠT** tài khoản sau khi nhân viên hoàn tất xác minh.
- Đường dẫn là mã bảo mật có thời hạn; khi bị lộ, cần tạo mã khác. Không lưu link vào hệ thống hay gửi link qua nhóm.
- Nếu chức năng LẤY LINK MỜI bị lỗi, không lặp lại quá nhiều lần; kiểm tra nhật ký Supabase Edge Function `sagscxr-rns-manage` và trạng thái tài khoản.
- Nút **GỬI EMAIL MỜI** chỉ xác nhận Supabase đã tiếp nhận yêu cầu. Trạng thái thành công không chứng minh email đã đến Inbox; kiểm tra cả Spam và Promotions.
- SMTP đang dùng Gmail cá nhân, có thể ảnh hưởng độ tin cậy phát thư. Muốn có gửi email ổn định cho nhân viên cần cấu hình một dịch vụ SMTP giao dịch chuyên dụng và xác thực miền gửi (SPF/DKIM/DMARC nếu dùng miền riêng).

## Nghiệp vụ chính

- Thư viện văn bản, tra cứu theo hãng / năm, liên kết Google Drive.
- Tệp đính kèm: ADMIN upload và xóa có xác nhận, xóa chuyển tệp vào Thùng rác Drive.
- READ & SIGN: ADMIN giao việc, nhân viên mở từng tệp và xác nhận, lịch sử phiên bản, báo cáo CSV.
- Quản lý tài khoản: mời nhân viên, kích hoạt/khóa VIEWER, reset email hoặc mật khẩu tạm.
- Bắt buộc đổi mật khẩu khi đăng nhập nếu ADMIN cấp mật khẩu tạm.

**Lưu ý:** Đây là frontend thay thế viết lại theo API Supabase hiện tại vì bản triển khai Vercel bị khóa (`DEPLOYMENT_DISABLED`). Cần kiểm thử nghiệp vụ và quyền truy cập trên GitHub Pages trước khi cho toàn bộ nhân viên sử dụng.

## Chuyển hẳn URL hoạt động sang GitHub Pages (31/10/2026)

- Website production: https://sagsdieuhanh-gif.github.io/SAGSCXR-RNS/ (đã kiểm tra trang chính và secure.html tải thành công).
- Toàn bộ giao diện đang phục vụ từ GitHub Pages; không phụ thuộc runtime Vercel. GitHub Pages chỉ lưu file tĩnh, không lưu thông tin đăng nhập.
- Supabase Auth là nơi quản lý tài khoản, gửi email mời, phiên đăng nhập và quyền truy cập; Supabase Database lưu metadata nghiệp vụ/READ & SIGN; Google Drive tiếp tục lưu tệp gốc. Các thao tác cần bí mật Google hoặc quyền quản trị dùng Supabase Edge Functions đã triển khai sẵn (không được đưa service role key ra JavaScript công khai).
- Cần xác nhận trong Supabase Dashboard **Authentication → URL Configuration**: `Site URL` bằng `https://sagsdieuhanh-gif.github.io/SAGSCXR-RNS/`, `Redirect URLs` có `https://sagsdieuhanh-gif.github.io/SAGSCXR-RNS/secure.html` và `https://sagsdieuhanh-gif.github.io/SAGSCXR-RNS/index.html`.
- Email mời trước đây trỏ về Vercel không tự chuyển địa chỉ: ADMIN phải gửi lại email mời/tạo mật khẩu cho các tài khoản còn chờ xác minh sau khi cập nhật Redirect URLs. Không chia sẻ nguyên đường dẫn mời có token.
- Mã HTML/CSS/JS của bản GitHub là bản frontend độc lập đã được viết lại; cần kiểm thử đầy đủ các quy trình với tài khoản được cấp quyền trước khi bỏ hẳn phương án dự phòng.

## Cập nhật 31/10/2026 – Email mời không đến Inbox
- Nút **GỬI EMAIL MỜI QUA SUPABASE** chỉ phản ánh việc Auth tiếp nhận yêu cầu, không phải xác nhận thư đã phát/giao đến hộp thư.
- Khi đã tạo lời mời, trên giao diện hiển thị ngay nút **LẤY LINK MỜI ĐỂ GỬI QUA EMAIL / ZALO** cho tài khoản CHỜ XÁC MINH.
- Cửa sổ LINK MỜI bổ sung nút **MỞ EMAIL ĐỂ GỬI LINK MỜI**. Nút này tạo bản nháp trong ứng dụng email mặc định (mailto:); ADMIN phải tự kiểm tra người nhận và bấm GỬI. Không được mô tả là email đã tự động gửi.
- Link mời chứa token một lần, có thời hạn. Không lưu link lên server/browser storage, không đưa vào log, không chia sẻ lên nhóm. Chỉ gửi riêng đúng email.
- Luồng mời nhân viên mới từ BAOCAOMANAGERONDUTY/Radar đã đổi redirect khỏi Vercel cũ sang `https://sagsdieuhanh-gif.github.io/SAGSCXR-RNS/secure.html` (Edge Function `sagscxr-radar-register` V3).
- Để email **tự động** đến mọi địa chỉ cần kiểm tra **Supabase → Authentication → SMTP Settings** và nhật ký của nhà cung cấp SMTP; xác minh Sender, SPF/DKIM/DMARC và tình trạng bounce/suppression. Không dùng thao tác tạo link để khẳng định SMTP đã được sửa.

## Tạo tài khoản trực tiếp trong RNS và Manager (31/10/2026)
- ADMIN RNS mở **QUẢN LÝ TÀI KHOẢN → TẠO TÀI KHOẢN TRỰC TIẾP**, nhập email, họ tên, quyền RNS VIEWER/EDITOR, quyền Manager. Quản trị viên phải đồng thời là ADMIN Manager mới cấp được quyền nghiệp vụ Manager.
- Edge Function `sagscxr-rns-manage` action `create` tạo duy nhất 01 tài khoản Supabase Auth và ghi cả `sags_docs_members` lẫn `ops_members`.
- Không cấp ADMIN trong form tạo nhanh, không tự ghi đè tài khoản trùng email; tạo quyền thất bại sẽ rollback user mới nếu có thể và thông báo kiểm tra trước khi thử lại.
- Mật khẩu tạm 20 ký tự sinh trên máy chủ, chỉ hiện một lần cho ADMIN, không lưu bản rõ trên database hay thiết bị. Nhân viên đăng nhập RNS đổi mật khẩu bắt buộc trước khi sử dụng Manager.
