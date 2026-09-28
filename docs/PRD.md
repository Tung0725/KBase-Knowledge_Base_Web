# Product Requirements Document (PRD) - KBase

## 1. Business Capabilities
Hệ thống KBase được chia thành 3 phân hệ (Domains) chính:
- **Identity & Access Management (IAM):** Quản lý đăng ký, đăng nhập và phân quyền hệ thống (System Roles: Admin, Owner, User).
- **Project Workspace Management:** Quản lý vòng đời dự án (tạo mới dành cho Owner/Admin, thêm/bớt thành viên) và thiết lập Storage Quota.
- **Document & Media Storage:** Xử lý nghiệp vụ tải lên, tải xuống, tự động dán nhãn (Auto-Tagging) và xem tệp tin an toàn.

## 2. Functional Requirements (User Stories)

### Epic 1: Identity & Access Management (IAM)
**US-1.1: Đăng ký tài khoản (Sign Up)**
- **User Story:** As an Unregistered User, I want to sign up with my email and password so that I can access the KBase platform.
- **Acceptance Criteria (AC):**
  - [ ] Hệ thống yêu cầu: Email hợp lệ (format check), Mật khẩu (tối thiểu 8 ký tự, 1 chữ hoa, 1 số).
  - [ ] *Happy Case:* Tài khoản tạo thành công, mặc định Role là `User`.
  - [ ] *Edge Case:* Nếu Email đã tồn tại, hiển thị lỗi "Email đã được sử dụng".

**US-1.2: Đăng nhập (Log In)**
- **User Story:** As a Registered User, I want to log in using my email and password so that I can view my projects.
- **Acceptance Criteria (AC):**
  - [ ] *Happy Case:* Đăng nhập thành công, trả về JWT Token và điều hướng vào Dashboard.
  - [ ] *Edge Case:* Nhập sai mật khẩu quá 5 lần sẽ khóa tài khoản trong 15 phút.

### Epic 2: Project Workspace Management
**US-2.1: Tạo dự án mới (Create Project)**
- **User Story:** As an Account Owner (System Role: OWNER) or System Admin, I want to create a new project so that my team has a dedicated workspace.
- **Acceptance Criteria (AC):**
  - [ ] *Pre-condition:* Tài khoản phải có System Role là `OWNER` hoặc `ADMIN`. Nếu là `USER`, API trả về 403 Forbidden và ẩn UI tạo dự án.
  - [ ] *Happy Case:* Form yêu cầu: Tên dự án (Bắt buộc), Mô tả. Hệ thống khởi tạo Project và gán mặc định Storage Quota là 5GB.
  - [ ] *Edge Case:* Trùng tên dự án (của cùng Owner) -> Báo lỗi "Tên dự án đã tồn tại".

**US-2.2: Quản lý thành viên (Manage Members)**
- **User Story:** As a Project Owner, I want to invite or remove members from my project to control data access.
- **Acceptance Criteria (AC):**
  - [ ] *Happy Case:* Tìm kiếm User theo Email và thêm vào dự án với Role `Member`.
  - [ ] *Edge Case:* Cố gắng thêm một người đã có trong dự án -> Nút Invite bị disable hoặc báo lỗi.

### Epic 3: Document & Media Storage
**US-3.1: Kéo thả Bulk Upload & Resume**
- **User Story:** As a Project Member, I want to drag and drop multiple files to upload them with a progress bar and auto-resume capability so that I can upload large videos reliably.
- **Acceptance Criteria (AC):**
  - [ ] *Happy Case:* Kéo thả 3 file cùng lúc, thanh UI Progress Bar hiển thị % tải lên từng file.
  - [ ] *Edge Case:* Nếu mạng đứt khi video đang tải ở 50%, khi có mạng lại hệ thống tiếp tục tải từ 50% (Resumable Upload).

**US-3.2: Tự động dán nhãn (Auto-Tagging)**
- **User Story:** As a Project Member, I want the system to automatically tag my files based on their extension so that I can easily filter them later.
- **Acceptance Criteria (AC):**
  - [ ] *Happy Case:* Upload file `.pdf`, hệ thống tự động gán tag `[Tài liệu]`. Upload file `.mp4`, tự động gán tag `[Media]`.
  - [ ] *Edge Case:* Định dạng file không xác định sẽ được gán tag `[Khác]`.

**US-3.3: Kiểm tra Storage Quota**
- **User Story:** As the System, I want to validate the project's remaining quota before allowing a file upload to prevent server overload.
- **Acceptance Criteria (AC):**
  - [ ] *Happy Case:* Dự án còn 2GB Quota, tải file 500MB -> Cho phép tải, cập nhật Quota còn 1.5GB.
  - [ ] *Edge Case:* Dự án còn 100MB Quota, thử tải file 500MB -> Báo lỗi "Vượt quá dung lượng dự án (Quota Exceeded)" và chặn upload.

**US-3.4: Tải xuống tài liệu (Download & View)**
- **User Story:** As a Project Member, I want to view and download files within my project to use them for work.
- **Acceptance Criteria (AC):**
  - [ ] *Happy Case:* Click vào file -> Hệ thống tạo Pre-signed URL từ MinIO để tải xuống an toàn.
  - [ ] *Edge Case:* Một User không thuộc dự án cố gắng truy cập URL tải file -> Trả về lỗi 403 Forbidden.

## 3. Non-Functional Requirements (NFRs)
- **NFR-1 (Performance):** Thời gian phản hồi API (Response Time) của các tác vụ non-stream (Login, CRUD Project) phải < 200ms ở phân vị 95th (P95).
- **NFR-2 (Availability):** Hệ thống đảm bảo thời gian hoạt động (Uptime) đạt 99.9% trong suốt vòng đời dự án.
- **NFR-3 (Scalability / Limits):** Kích thước tải lên tối đa là 1GB cho mỗi file.
- **NFR-4 (Security):** Toàn bộ API (ngoại trừ Login/Signup) yêu cầu xác thực bằng JWT Token hợp lệ. Mật khẩu lưu trữ trong Database phải được băm (hash) bằng thuật toán BCrypt.
- **NFR-5 (Cross-Browser & Responsiveness):** Web App hiển thị đúng và không vỡ layout trên Chrome (phiên bản >90), Safari và màn hình thiết bị di động (từ 375px trở lên).

---

## Quality Checklist (Definition of Done)
- [x] Does EVERY single User Story have clear Acceptance Criteria?
- [x] Are Non-Functional Requirements strictly quantified with numbers?
- [x] Does this PRD align 100% with the BRD's Scope?
