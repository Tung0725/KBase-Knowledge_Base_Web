# Event Storming & Domain Model - KBase

## 1. Domain: Identity & Access Management (IAM)

### Aggregate Root: `User`
Thực thể gốc quản lý danh tính, mật khẩu và quyền hạn toàn cục.

- **Command:** `RegisterUser` (Đăng ký tài khoản)
  - **Actor:** Unregistered User
  - **Domain Event:** `UserRegistered` (Tài khoản được tạo thành công)
  - **Policy:** Gán mặc định Role là `USER`.
- **Command:** `AuthenticateUser` (Đăng nhập)
  - **Actor:** Registered User
  - **Domain Event:** `UserLoggedIn` (Đăng nhập thành công)
  - **Policy:** `GenerateJwtTokenPolicy` (Khởi tạo chuỗi token có thời hạn để truy cập API).

## 2. Domain: Project Workspace

### Aggregate Root: `Project`
Thực thể gốc trung tâm, quản lý ranh giới dự án, dung lượng lưu trữ (Quota) và danh sách thành viên.

- **Command:** `CreateProject` (Tạo dự án mới)
  - **Actor:** Project Owner
  - **Domain Event:** `ProjectCreated`
  - **Policy:** `InitializeProjectQuotaPolicy` (Gán mặc định Storage Quota = 5GB cho dự án mới tạo).
- **Command:** `InviteMember` (Mời thành viên vào dự án)
  - **Actor:** Project Owner
  - **Domain Event:** `MemberInvited`
- **Command:** `RemoveMember` (Xóa thành viên khỏi dự án)
  - **Actor:** Project Owner
  - **Domain Event:** `MemberRemoved`

## 3. Domain: Document & Media Storage

### Aggregate Root: `Document`
Thực thể gốc lưu trữ metadata của tệp tin. Mặc dù thuộc về `Project`, Document được tách thành Aggregate riêng biệt để tối ưu truy vấn vì số lượng file rất lớn.

- **Command:** `StartFileUpload` (Bắt đầu tải file)
  - **Actor:** Project Member
  - **Domain Event:** `FileUploadStarted`
  - **Policy:** `CheckStorageQuotaPolicy` (Hệ thống kiểm tra bộ đếm lưu lượng trong `Project` Aggregate. Nếu dung lượng file sắp tải làm vượt quá Quota -> Hủy giao dịch).
- **Command:** `CompleteFileUpload` (Hoàn tất tải file lên MinIO)
  - **Actor:** Project Member / System
  - **Domain Event:** `FileUploaded`
  - **Policy 1:** `AutoTaggingPolicy` (Hệ thống phân tích phần mở rộng của file để tự động gán Tag).
  - **Policy 2:** `UpdateQuotaPolicy` (Hệ thống cộng dồn kích thước file vừa tải vào thuộc tính đã sử dụng của `Project` Aggregate).
- **Command:** `RequestFileDownload` (Yêu cầu tải file)
  - **Actor:** Project Member
  - **Domain Event:** `FileDownloadRequested`
  - **Policy:** `GeneratePresignedUrlPolicy` (Gọi API MinIO để sinh URL an toàn có thời hạn).

## 4. Read Models (Dành riêng cho truy vấn)
- **ProjectDashboardView:** Dữ liệu rút gọn chỉ chứa Tên dự án, Vai trò (Role) của user hiện tại trong dự án đó và % Quota đã sử dụng. Dùng để render giao diện Dashboard.
- **DocumentBrowserView:** Dữ liệu chứa Metadata của file (Tên, Tag, Dung lượng, Người tải lên) dùng để hỗ trợ tính năng Filter/Tìm kiếm tốc độ cao.

---

## Quality Checklist (Definition of Done)
- [x] Are ALL Domain Events written in the past/passive tense?
- [x] Is every Command linked to a specific Actor or Policy?
- [x] Are Aggregate Roots clearly identified for data consistency?
