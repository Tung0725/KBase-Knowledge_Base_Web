# Agile Backlog - KBase
*Chiến lược: Code hoàn thiện trong 4 ngày đầu. 3 ngày cuối dành riêng cho Testing và Bug Fixing.*

## Day 1: Nền tảng & Xác thực (Foundation & IAM)

### [TASK-01] Khởi tạo Hạ tầng & Base Source
- **Type:** Infrastructure | **Priority:** High | **Estimate:** 4 Hrs | **Status:** [ ] Todo
- **User Story:** As a Dev, I want to set up Docker, Postgres, MinIO, Spring Boot, and React Vite so that the team has a working environment.
- **Acceptance Criteria (AC):**
  - [x] Chạy thành công `docker-compose up` khởi tạo DB và MinIO.
  - [x] Spring Boot kết nối thành công tới Postgres (có base Entity User).
  - [x] React Vite chạy thành công ở `localhost:5173`.
- **Status:** [x] Done

### [TASK-01.5] Ghép giao diện 3 trang Mockup (Portal, Auth, Hub)
- **Type:** Frontend | **Priority:** High | **Estimate:** 3 Hrs | **Status:** [x] Done
- **User Story:** As a Dev, I want to convert the HTML mockups for Portal, Auth, and Hub into React components with fully working Tailwind 4 Design Tokens and Dark Mode.
- **Acceptance Criteria (AC):**
  - [x] Tạo `PRODUCT.md` và `DESIGN.md` để đồng bộ Design System.
  - [x] Ghép trang `Portal.tsx` (Landing Page).
  - [x] Ghép trang `Auth.tsx` (Đăng nhập/Đăng ký) hỗ trợ đổi theme.
  - [x] Ghép trang `Hub.tsx` (Dashboard) fix chuẩn thẻ màu cho Dark Mode.
- **Status:** [x] Done

### [TASK-02] Đăng nhập & Đăng ký (Backend + Frontend)
- **Type:** Feature | **Priority:** High | **Estimate:** 4 Hrs | **Status:** [x] Done
- **User Story:** As a User, I want to sign up and log in so that I can securely access my workspace.
- **Acceptance Criteria (AC):**
  - [x] Backend: API `/api/auth/register`, `/api/auth/login` và `/api/auth/me`.
  - [x] Backend: Tích hợp Đăng nhập bằng Google (`/api/auth/google`).
  - [x] Backend: Tích hợp Xác thực Email qua Gửi Link Token (`/api/auth/verify`).
  - [x] Security: Chống Spam đăng ký (Rate Limiting) với Bucket4j và Dọn rác DB với `@Scheduled`.
  - [x] Frontend: Giao diện Auth (Login/Signup form). Có nút "Đăng nhập Google". Xử lý lưu JWT.
  - [x] Bắt lỗi: Email đã tồn tại, Sai mật khẩu, Link hết hạn, Spam.

## Day 2: Quản lý Dự án (Project Workspace)

### [TASK-03] Quản lý Dự án (Backend + Frontend)
- **Type:** Feature | **Priority:** High | **Estimate:** 5 Hrs | **Status:** [x] Done
- **User Story:** As a Project Owner, I want to create and view projects so that I can organize my team's work.
- **Acceptance Criteria (AC):**
  - [x] Backend: API Tạo Project (Gán default Quota = 5GB) & Lấy danh sách Project theo User.
  - [x] Frontend: Giao diện Project Dashboard (Danh sách dự án dưới dạng Grid/Card). Modal tạo Project mới.

### [TASK-03.5] Quản lý Cài đặt Dự án (Project Settings)
- **Type:** Feature | **Priority:** Medium | **Estimate:** 4 Hrs | **Status:** [x] Done
- **User Story:** As a Project Owner, I want to edit, delete, and set visibility of my project so that I can fully manage its lifecycle.
- **Acceptance Criteria (AC):**
  - [x] Backend: API Cập nhật thông tin dự án (Tên, Mô tả) và API Xóa dự án (xóa cả metadata và dọn dẹp file trên MinIO).
  - [x] Backend: Bổ sung trường `is_public` (boolean) cho dự án, API toggle trạng thái.
  - [x] Frontend: Menu "Cài đặt" trong Project Card/Details cho phép thao tác các tính năng trên, kèm Modal cảnh báo nguy hiểm khi Xóa dự án.

### [TASK-04] Quản lý Thành viên (Mời tham gia)
- **Type:** Feature | **Priority:** High | **Estimate:** 3 Hrs | **Status:** [x] Done
- **User Story:** As a Project Owner, I want to invite members to my project via email and set their roles (Editor/Viewer) so that my team can collaborate.
- **Acceptance Criteria (AC):**
  - [x] Backend: API thêm Member trực tiếp bằng Email (Direct Add).
  - [x] Backend: API cho phép tạo Link Chia Sẻ (Shareable Link) để người dùng tự join.
  - [x] Frontend: Giao diện Modal quản lý Thành viên trong Project Workspace.
  - [x] Frontend: Xử lý luồng Join qua Link (Đăng ký xong tự động vào dự án).
- **Status:** [x] Done

## Day 3: Lưu trữ Dữ liệu - Backend Core (Document & MinIO)

### [TASK-05] Tích hợp MinIO & API Sinh Pre-signed URL
- **Type:** Backend Core | **Priority:** High | **Estimate:** 5 Hrs | **Status:** [ ] Todo
- **User Story:** As the System, I want to generate secure upload URLs so that clients can upload files directly without crashing the backend.
- **Acceptance Criteria (AC):**
  - [ ] Config `MinioClient` trong Spring Boot.
  - [ ] API `POST /request-upload`: Kiểm tra Quota hiện tại. Nếu OK, tạo bản ghi `Document (PENDING)` và trả về URL tải lên.
  - [ ] API `GET /download-url`: Trả về URL tải xuống an toàn.

### [TASK-06] API Xác nhận Upload & Auto-Tagging
- **Type:** Backend Core | **Priority:** High | **Estimate:** 3 Hrs | **Status:** [ ] Todo
- **User Story:** As the System, I want to process the uploaded file metadata so that Quota is updated and files are tagged automatically.
- **Acceptance Criteria (AC):**
  - [ ] API `POST /confirm-upload`: Cập nhật trạng thái file thành `UPLOADED`.
  - [ ] Policy: Đọc đuôi file sinh Tag (`[Tài liệu]`, `[Media]`, `[Khác]`).
  - [ ] Policy: Trừ số byte vừa tải vào `Project.used_storage_bytes`.

## Day 4: Trải nghiệm Lưu trữ (Frontend UI)

### [TASK-07] Giao diện Drag & Drop Upload
- **Type:** Frontend Core | **Priority:** High | **Estimate:** 5 Hrs | **Status:** [x] Done
- **User Story:** As a Project Member, I want to drag and drop files with a progress bar so that I can upload large videos reliably.
- **Acceptance Criteria (AC):**
  - [x] UI Component kéo thả file (hỗ trợ chọn nhiều file).
  - [x] Trình tự gọi API đúng chuẩn Option B: Xin Pre-signed URL -> PUT file lên MinIO -> Báo Confirm Upload thành công.
  - [x] Hiển thị thanh Progress bar cho từng file khi PUT lên MinIO.

### [TASK-08] Danh sách File & Download
- **Type:** Feature | **Priority:** High | **Estimate:** 3 Hrs | **Status:** [x] Done
- **User Story:** As a Project Member, I want to view and download files so that I can access shared knowledge.
- **Acceptance Criteria (AC):**
  - [x] Giao diện danh sách file theo dạng List/Table. Có icon theo định dạng (PDF, Video). Hiển thị Tag.
  - [x] Click vào file -> Gọi API `download-url` -> Tải file về máy.
  - [x] UI cảnh báo Quota (vd: Progress bar hiển thị `Đã dùng 1GB/5GB`).

## Day 5 - Day 7: Testing & Bug Fixing

### [TASK-09] End-to-End Testing & Bug Fixing
- **Type:** QA | **Priority:** High | **Estimate:** 3 Days | **Status:** [ ] Todo
- **User Story:** As a QA/Dev, I want to test all features so that the system is stable for production.
- **Acceptance Criteria (AC):**
  - [ ] Test luồng Role: User không thuộc dự án KHÔNG thể tải file dự án.
  - [ ] Test Quota: Cố tình upload file làm vượt dung lượng 5GB -> Phải bị chặn chuẩn xác.
  - [ ] Test Mobile/Tablet: Giao diện Drag & Drop không bị vỡ layout trên điện thoại.
  - [ ] Khắc phục toàn bộ Bug phát sinh. Deploy.

---

## Quality Checklist (Definition of Done)
- [x] Does every Task follow the specified template (Type, Priority, Estimate, User Story, AC)?
- [x] Are the tasks correctly grouped by vertical-slice development phases (e.g., MVP vs Enhancements)?
