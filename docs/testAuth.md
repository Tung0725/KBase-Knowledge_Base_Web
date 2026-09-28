v# Kịch bản Kiểm thử Hệ thống Xác thực (Auth Test Plan)

Tài liệu này định nghĩa chi tiết các kịch bản kiểm thử (Test Cases) cho hệ thống Đăng nhập & Đăng ký của KBase. Dùng làm cơ sở để Manual Test và TDD (viết Unit Test).

## 1. Input Validation (Kiểm tra Dữ liệu Đầu vào)
*Áp dụng cho Form Đăng ký.*

| ID | Test Case | Dữ liệu Nhập (Input) | Kết quả Kỳ vọng (Expected Output) |
|---|---|---|---|
| VAL_01 | Bỏ trống các trường bắt buộc | Gửi form không có Email, Password, hoặc Full Name | Giao diện chặn không cho Submit (báo lỗi HTML5 required). Nếu gọi API bằng Postman, Backend trả về `400 Bad Request` với message lỗi Valid. |
| VAL_02 | Email sai định dạng | `hello_world`, `user@`, `user@com`, `nguyen1@gmail` | Giao diện báo lỗi định dạng email. Backend trả về lỗi `Email không hợp lệ`. |
| VAL_03 | Password quá yếu | `12345`, `weakpass` | Frontend chặn. Backend trả về lỗi yêu cầu mật khẩu ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt. |
| VAL_04 | Mật khẩu xác nhận không khớp | Pass: `123456`, Confirm: `1234567` | Frontend chặn ngay, hiện dòng chữ màu đỏ `Mật khẩu xác nhận không khớp`. |
| VAL_05 | Số điện thoại chứa chữ cái | `0987654abc`, `123ok` | Backend trả về lỗi `400 Bad Request` với message `Số điện thoại không hợp lệ` (chỉ được chứa số và dài 10-15 ký tự). |

## 2. Rate Limiting & Account Lockout (Chống Spam & Brute-force)
*Kiểm tra khả năng chặn bot tạo tài khoản hàng loạt và chống dò mật khẩu.*

### 2.1. Rate Limiting Đăng ký
| ID | Test Case | Hành động | Kết quả Kỳ vọng |
|---|---|---|---|
| RL_01 | Đăng ký bình thường | Đăng ký User 1 -> Đăng ký User 2 | Cả 2 lần đều báo thành công. |
| RL_02 | Đăng ký vượt quá giới hạn | Đăng ký User 3 (ngay sau User 2) | Backend chặn và trả về HTTP `429 Too Many Requests`. Giao diện hiện thông báo lỗi: `Thao tác quá nhanh. Vui lòng đợi 1 phút trước khi đăng ký lại.` |
| RL_03 | Hết thời gian chờ (Cooldown) | Chờ đúng 60 giây và đăng ký User 4 | Thành công, Quota của IP được reset. |

### 2.2. Login Lockout (Chống Dò Mật khẩu - Brute-force)
*Luật: Sai 5 lần khóa 3 phút. Sau đó cứ sai thêm 3 lần thì khóa 15 phút. Reset sau 24h.*

| ID | Test Case | Hành động | Kết quả Kỳ vọng |
|---|---|---|---|
| RL_LOG_01 | Nhập sai liên tục 5 lần | Đăng nhập sai pass 5 lần | Lần thứ 5 vẫn trả về `401 Unauthorized` (Sai mật khẩu). |
| RL_LOG_02 | Bị khóa sau 5 lần sai | Đăng nhập lần thứ 6 | Backend trả về `429 Too Many Requests` -> `Tài khoản tạm khóa 3 phút do đăng nhập sai nhiều lần.` |
| RL_LOG_03 | Nhập sai thêm 3 lần sau khi mở khóa | Đợi hết 3 phút, sau đó nhập sai thêm 3 lần (tổng 8 lần) | Lần thứ 8 (sai) vẫn trả 401. Lần 9 (dù sai hay đúng) trả về `429 Too Many Requests` -> `Tài khoản tạm khóa 15 phút do đăng nhập sai nhiều lần.` |
| RL_LOG_04 | Khóa liên tục 15 phút | Đợi hết 15p, nhập sai 3 lần tiếp | Lần 12 khóa tiếp 15 phút với thông báo tương tự. |
| RL_LOG_05 | Reset số lần sai | Đăng nhập đúng mật khẩu | Reset số lần sai về 0. |

## 3. Quản lý Rác (Garbage Collector)
*Kiểm tra khả năng tự dọn dẹp hệ thống của Spring Boot (Cron Job: 3h sáng mỗi ngày).*

| ID | Test Case | Hành động mô phỏng | Kết quả Kỳ vọng |
|---|---|---|---|
| GC_01 | Xóa Token hết hạn | Set Token A có `expiry_date` là ngày hôm qua, gọi `CleanupService`. | Token A biến mất khỏi Database. |
| GC_02 | Xóa User rác | User B tạo từ hôm qua, chưa Verify (`is_verified=false`), gọi `CleanupService`. | User B và toàn bộ dữ liệu liên quan biến mất khỏi Database. |
| GC_03 | Giữ nguyên dữ liệu hợp lệ | User C tạo hôm qua đã Verify. Token D mới tạo được 1 tiếng. | Không có dữ liệu nào của C và D bị xóa. |

## 4. Kịch bản Đăng ký & Xác thực (Registration & Verification)

| ID | Test Case | Dữ liệu Nhập | Kết quả Kỳ vọng |
|---|---|---|---|
| REG_01 | Trùng lặp Email | Đăng ký Email đã tồn tại trong DB | Backend trả về `400 Bad Request` -> `Email này đã được sử dụng`. |
| REG_02 | Đăng ký thành công | Form hợp lệ | Backend tạo User (is_verified = false). Sinh VerificationToken. Gửi Email. Trả về `201 Created`. Frontend báo "Kiểm tra email". |
| VER_01 | Bấm link hợp lệ | Tham số `token=chuoi_hop_le` | Backend check Token đúng, cập nhật `is_verified = true`, **xóa Token**. Trả về `200 OK`. |
| VER_02 | Bấm link sai / hết hạn | Tham số `token=chuoi_sai` | Backend trả về `400 Bad Request` -> `Link xác thực không hợp lệ hoặc đã hết hạn.` |

## 5. Kịch bản Đăng nhập (Local & Google Login)

| ID | Test Case | Hành động | Kết quả Kỳ vọng |
|---|---|---|---|
| LOG_01 | Chưa xác thực Email | Đăng nhập tài khoản ở REG_02 khi chưa bấm Link | Backend trả về `403 Forbidden` hoặc `401 Unauthorized` -> `Tài khoản chưa được xác thực. Vui lòng kiểm tra email.` |
| LOG_02 | Đăng nhập sai Pass | Nhập Email đúng, Pass sai | Backend trả về `401 Unauthorized` -> `Email hoặc mật khẩu không chính xác.` |
| LOG_03 | Đăng nhập thành công | Tài khoản đã Verify, nhập đúng Pass | Backend trả về `200 OK` + JWT Token. Frontend lưu Token, chuyển hướng tới `/hub`. |
| GGL_01 | Google Login (Lần đầu) | Gửi Google Token hợp lệ của `google@gmail.com` | Backend tự động tạo User mới (Provider=GOOGLE, is_verified=true). Trả về JWT. |
| GGL_02 | Google Login (Lần sau) | Gửi lại Google Token của `google@gmail.com` | Backend tìm thấy User cũ. Trả về JWT. |
| GGL_03 | Google Token Fake | Gửi Token rác | Backend gọi verify với Google thất bại. Trả về `401 Unauthorized`. |
