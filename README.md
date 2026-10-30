# SAGSCXR-RNS – GitHub Pages

Website dự kiến: https://sagsdieuhanh-gif.github.io/SAGSCXR-RNS/

## Kiến trúc

- Frontend: HTML / CSS / JavaScript thuần trên GitHub Pages, không phụ thuộc Vercel.
- Backend: Supabase project `ivixjhwghprfxdtaupxc`, các Edge Functions `sagscxr-rns-*`.
- Lưu trữ văn bản và tệp: Google Drive; metadata và READ & SIGN nằm tại Supabase.
- Không đưa service role key, Google OAuth client secret, mật khẩu hoặc dữ liệu hồ sơ vào repository công khai.

## Kích hoạt GitHub Pages lần đầu

1. Vào **Settings → Pages** của repository.
2. Trong **Build and deployment → Source**, chọn **GitHub Actions** và lưu.
3. Mở **Actions → Publish SAGSCXR-RNS (GitHub Pages)** và chọn **Re-run jobs** nếu lượt đầu tiên lỗi vì Pages chưa được bật.
4. Chỉ dùng website sau khi workflow hoàn tất thành công và địa chỉ GitHub Pages trả mã HTTP 200.

Workflow tại `.github/workflows/pages.yml` kiểm tra cú pháp JavaScript và phát hành frontend.

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
