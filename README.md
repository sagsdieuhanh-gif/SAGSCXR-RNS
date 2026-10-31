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
