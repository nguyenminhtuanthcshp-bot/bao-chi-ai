# Bút Ký AI – Trợ lý cộng tác viên báo

Phần mềm web miễn phí giúp cộng tác viên báo (mảng Giáo dục & Chuyển đổi số, Công tác Đảng – Chính trị tư tưởng) soạn **bản thảo** bài báo từ tên bài, tư liệu, đường link, ảnh → xuất file **Word (.docx)** để chỉnh sửa trước khi gửi tòa soạn.

> AI chỉ tạo bản thảo. Người viết phải đọc duyệt, kiểm chứng mọi thông tin, xử lý các chỗ `[CẦN KIỂM CHỨNG]`. Không đưa tài liệu mật vào phần mềm.

## 1. Lấy khóa API Gemini miễn phí
1. Vào https://aistudio.google.com/apikey, đăng nhập tài khoản Google.
2. Bấm **Create API key** → sao chép khóa (bắt đầu bằng `AIza...`).
3. Mở phần mềm, dán vào mục ① → **Lưu khóa**. Khóa chỉ lưu trên trình duyệt máy mình.

## 2. Cách dùng (5 bước)
1. Nhập tên bài, chọn mảng, thể loại, số trang.
2. Dán ghi chú/dữ kiện; tải file .docx/.txt; dán link (mỗi dòng một link).
3. Chọn ảnh, gõ chú thích từng ảnh.
4. Bấm **Viết bài** → đọc, sửa bản thảo (tab Sửa / Xem trước).
5. Bấm **Xuất Word** → mở file, chỉnh sửa lần cuối rồi gửi tòa soạn.

## 3. Mở trên máy (không cần cài đặt)
Tải thư mục, nhấp đúp `index.html` (cần có Internet để gọi Gemini và tải thư viện).

## 4. Đăng lên GitHub Pages
Tạo repo công khai, đưa các file `index.html`, `style.css`, `app.js` lên nhánh `main` → Settings → Pages → Source: *Deploy from a branch*, `main` / `(root)` → Save. Sau 1–2 phút có địa chỉ `https://<tên>.github.io/<repo>/`.

## Giới hạn
- Gói miễn phí Gemini có giới hạn số lần gọi/phút/ngày; nếu báo lỗi hạn mức, đợi một lát rồi thử lại.
- Một số trang báo/Facebook chặn đọc link → dán nội dung trực tiếp vào ô ghi chú.
- File .pdf chưa hỗ trợ: hãy sao chép chữ dán vào ô ghi chú.
