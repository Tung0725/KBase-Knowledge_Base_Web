# Architecture Design Document (ADD) - KBase

## 1. Technology Stack
- **Frontend:** React.js (Vite), TypeScript, Tailwind CSS.
- **Backend:** Java 17+, Spring Boot 3 (Spring Web MVC, Spring Data JPA, Spring Security).
- **Database:** PostgreSQL (Lưu trữ quan hệ).
- **Object Storage:** MinIO (S3-Compatible) để lưu trữ tệp nhị phân (PDF, Video).
- **Infrastructure:** Docker & Docker Compose.

## 2. Architecture Components (Backend N-Tier)
Toàn bộ logic Backend được chia thành các Layer tiêu chuẩn:
- **Controller Layer:** Hứng các HTTP Request từ React, Validate input payload (dùng `@Valid`, `BindingResult`), trả về thống nhất `ApiResponse<T>`.
- **Service Layer:** Chứa lõi Business Logic. Các thao tác thay đổi dữ liệu phải được bọc trong `@Transactional`. Là nơi gọi các Service ngoại vi (như `MinioService` để sinh Pre-signed URL).
- **Repository Layer:** Các interface extends `JpaRepository` để thao tác với PostgreSQL. Không chứa logic nghiệp vụ.

## 3. Domain Entities & ERD (Database Schema)

### Entity: `User` (Bảng `users`)
- `id` (UUID, PK)
- `email` (String, Unique, Not Null)
- `password` (String, BCrypt Hashed)
- `role` (Enum: `ADMIN`, `OWNER`, `USER`)
- **Relationships:** `@OneToMany` với `Project` (Một owner có nhiều project), `@OneToMany` với `ProjectMember`.

### Entity: `Project` (Bảng `projects`)
- `id` (UUID, PK)
- `name` (String, Not Null)
- `description` (Text)
- `storage_quota_bytes` (Long, Mặc định: 5368709120 - 5GB)
- `used_storage_bytes` (Long, Mặc định: 0)
- `owner_id` (UUID, FK tới `users`)
- **Relationships:** `@ManyToOne` với `User` (Owner), `@OneToMany` với `ProjectMember`, `@OneToMany` với `Document`.

### Entity: `ProjectMember` (Bảng `project_members`)
- `id` (UUID, PK)
- `project_id` (UUID, FK)
- `user_id` (UUID, FK)
- `joined_at` (Timestamp)
- **Relationships:** Bảng mapping N-N giữa `users` và `projects` nhưng có thêm metadata (`joined_at`). `@ManyToOne` tới `Project` và `User`.

### Entity: `Document` (Bảng `documents`)
- `id` (UUID, PK)
- `project_id` (UUID, FK)
- `uploaded_by` (UUID, FK)
- `file_name` (String)
- `object_key` (String, Unique - Khóa lưu trên MinIO)
- `file_size_bytes` (Long)
- `file_type` (String)
- `tag` (String - Được AutoTagging gán)
- `status` (Enum: `PENDING`, `UPLOADED` - Dùng cho luồng Option B)
- **Relationships:** `@ManyToOne` tới `Project` và `User`.

## 4. Architecture Decisions (ADR)

### ADR-1: Luồng tải lên tệp tin lớn (Direct Client-to-MinIO Upload)
- **Context:** Hệ thống cho phép tải lên Video (kích thước lên tới 1GB). Nếu để Backend làm proxy tải file, Backend sẽ tốn băng thông và RAM, dễ bị crash (OOM) nếu nhiều user tải cùng lúc.
- **Options:** 
  - (A) Backend Proxy (Client -> Spring Boot -> MinIO).
  - (B) Direct Upload via Pre-signed URL (Client -> MinIO).
- **Decision:** Chọn **Option B**. Client gọi Backend để xin Pre-signed URL, tải trực tiếp lên MinIO bằng lệnh PUT. Sau đó gọi lại Backend (`/api/projects/{id}/documents/confirm`) để xác nhận tải thành công và trừ Quota.
- **Consequences:** Backend được tối ưu tải 100%. Đổi lại, Client phải xử lý luồng gọi 2 API (Request URL và Confirm) thay vì 1 API. Có khả năng rác MinIO nếu Client xin URL nhưng không up (cần config MinIO Lifecycle tự động dọn rác).

## 5. Interface Contracts (API Design)
*Tất cả API trả về chuẩn HTTP Status (200 OK, 201 Created, 400 Bad Request, 403 Forbidden, 404 Not Found, 500 Internal Error).*

### IAM APIs
- `POST /api/auth/register` (Body: email, password) -> 201 Created
- `POST /api/auth/login` (Body: email, password) -> 200 OK (Trả về JWT)

### Project APIs
- `POST /api/projects` (Header: Bearer Token, Body: name, description) -> 201 Created
- `GET /api/projects` -> 200 OK (Danh sách dự án của user hiện tại)
- `POST /api/projects/{id}/members` (Body: email) -> 200 OK

### Document APIs (Luồng Upload Option B)
- `POST /api/projects/{id}/documents/request-upload` 
  - Body: `{ fileName, fileSize }`
  - *Logic:* Backend check `fileSize + used_storage_bytes <= storage_quota_bytes`. Tạo bản ghi `Document` với status `PENDING`.
  - Response (200 OK): `{ documentId, presignedUploadUrl }`
- `POST /api/projects/{id}/documents/{docId}/confirm-upload`
  - *Logic:* Đổi status thành `UPLOADED`, trigger `UpdateQuotaPolicy` và `AutoTaggingPolicy`.
  - Response (200 OK): Success.
- `GET /api/projects/{id}/documents/{docId}/download-url`
  - Response (200 OK): `{ presignedDownloadUrl }`

---

## Quality Checklist (Definition of Done)
- [x] Are Database Schema entities, relationships (1-N, N-N), and constraints clearly defined according to the chosen Tech Stack?
- [x] Do all APIs follow RESTful standards with correct HTTP Methods and Status Codes?
- [x] Is the Architecture Decision Record (ADR) logically justified?
