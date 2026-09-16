# Business Requirements Document (BRD) - KBase

## 1. Problem Statement
Trong các dự án làm việc nhóm hiện nay, việc lưu trữ và quản lý tài liệu (PDF, Word, Excel, Video họp...) thường diễn ra tự phát và phân tán trên nhiều nền tảng (Google Drive, Zalo, Slack). 
**Root Cause:** Sự thiếu hụt một "Single Source of Truth" dẫn đến:
- Thất thoát tri thức dự án và tốn kém hàng giờ đồng hồ mỗi khi cần tra cứu tài liệu cũ.
- Quy trình Onboarding thành viên mới kém hiệu quả do thông tin rời rạc.
- Khó khăn trong việc kiểm soát quyền truy cập và bảo mật dữ liệu, đặc biệt khi có sự thay đổi nhân sự.

## 2. Vision and Objectives
**Vision:** Xây dựng KBase trở thành Hub lưu trữ tri thức dự án tập trung, an toàn và mượt mà, giúp các team tăng tốc độ cộng tác và quản lý vòng đời tài liệu một cách chuyên nghiệp.

**SMART Objectives (Cho Phase 1 - Trong 1 tuần):**
1. **Specific & Measurable:** Hoàn thành và triển khai thành công 100% tính năng cốt lõi (Upload/Download, Phân quyền) lên môi trường Production trước ngày 27/09/2026.
2. **Achievable:** Tập trung toàn lực vào Web App Responsive, loại bỏ các tính năng phức tạp như AI Chatbot.
3. **Relevant:** Cung cấp chức năng Storage Quota cơ bản để ngăn chặn 100% các rủi ro sập server do tải lên Video dung lượng lớn vượt kiểm soát.
4. **Time-bound:** Đạt được phiên bản MVP có thể sử dụng thực tế (usable) trong vòng đúng 1 tuần phát triển.

## 3. Stakeholder Register
1. **System Admin (Quản trị viên):** Cần công cụ quản lý toàn cục (Users, Projects) để đảm bảo hệ thống vận hành đúng quy chuẩn và hỗ trợ kỹ thuật khi cần.
2. **Project Owner (Quản lý dự án/PM):** Cần một không gian biệt lập để tổ chức tài liệu dự án, kiểm soát chặt chẽ việc ai (Member nào) được phép xem/tải tài liệu.
3. **Project Member (Thành viên):** Cần giao diện dễ sử dụng để tải lên tài liệu báo cáo và tìm kiếm nhanh các tài liệu liên quan đến dự án đang tham gia.

## 4. Scope and Capabilities

### In-Scope (Phase 1)
- **Quản lý Tài khoản (User Accounts):** Đăng nhập/Đăng ký, Phân quyền cơ bản (Admin, Owner, User).
- **Quản lý Dự án (Project Workspace):** Tạo dự án mới, mời thành viên tham gia.
- **Lưu trữ Tài liệu (Document Storage):** Upload/Download đa định dạng (Docs, Images, Videos).
- **Quản lý Dung lượng (Storage Quota):** Thiết lập giới hạn dung lượng lưu trữ tối đa cho mỗi dự án để bảo vệ hạ tầng (đặc biệt khi upload Video).
- **Theo dõi Hoạt động (Simple Audit Log):** Lưu vết cơ bản (ai đã upload file nào, lúc nào) để dễ truy xuất.

### Out-of-Scope (Phase 1)
- **AI Chatbot:** Tính năng tìm kiếm thông minh bằng AI được đẩy sang Phase 2.
- **Chỉnh sửa trực tuyến (Real-time Collaboration):** Không hỗ trợ sửa file trực tiếp trên web như Google Docs.
- **Native Mobile App:** Không phát triển ứng dụng di động riêng, chỉ dùng Web App (Responsive).
- **Watermark/DRM:** Các cơ chế bảo vệ bản quyền phức tạp chưa được áp dụng.

## 5. Business Rules
- **BR-01:** Một tài khoản người dùng phải được gán ít nhất một Role (Admin, Owner, hoặc User).
- **BR-02:** Chỉ Project Owner hoặc System Admin mới có quyền mời/xóa thành viên khỏi một dự án.
- **BR-03:** Tổng dung lượng file được upload trong một dự án không được vượt quá Storage Quota đã thiết lập (vd: 5GB). Nếu vượt quá, hệ thống sẽ chặn upload.

## 6. Constraints, Assumptions, and Risks
- **Constraints (Ràng buộc):** Thời gian phát triển tối đa 1 tuần. Stack công nghệ bắt buộc: Java Spring Boot (Backend), React/Next.js (Frontend), PostgreSQL & MinIO/S3 (Storage).
- **Assumptions (Giả định):** Đội ngũ phát triển đã có sẵn môi trường Cloud (AWS/VPS) hoặc Docker để triển khai nhanh chóng.
- **Risks & Mitigation (Rủi ro & Giảm thiểu):** 
  - *Rủi ro:* Tính năng Upload Video file lớn bị timeout. 
  - *Giảm thiểu:* Backend cần thiết lập cấu hình `multipart/form-data` phù hợp và tăng thời gian timeout; kết hợp Storage Quota để tránh lạm dụng.

---

## Quality Checklist (Definition of Done)
- [x] Are all Objectives strictly SMART (quantifiable)?
- [x] Is the Root Cause thoroughly analyzed (not just symptoms)?
- [x] Is the Out-of-Scope boundary clearly defined?
