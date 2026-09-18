# Changelog

## 2026-09-17
- [TASK-01.5] Ghép giao diện 3 trang Mockup (Portal, Auth, Hub) thành React components hoàn chỉnh.
- Thiết lập hệ thống Design Tokens (Tailwind v4) trong `index.css`.
- Áp dụng Dark Mode và Light Mode thành công qua `PRODUCT.md` và `DESIGN.md`.
- [TASK-02] (Backend) Triển khai hoàn tất hệ thống Authentication với Spring Security & JWT. Áp dụng chuẩn OWASP cho mật khẩu, phân tách DTO và sử dụng Wrapper Pattern cho UserDetails.

# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- **[TASK-02] Frontend Authentication**: 
  - Integrated `authService.ts` for communicating with backend `/api/auth/login` and `/api/auth/register`.
  - Added global `AuthContext` to manage user state globally (with JWT stored in `localStorage`).
  - Added `ProtectedRoute` to secure `/hub` and other private routes.
  - Updated `Auth.tsx` to include loading states, error handling (Toasts), and automatic redirection.
- **[TASK-01] (Completed)**: Initialized the full project foundation. 
  - Setup Docker Compose for PostgreSQL 15 (port 5433) and MinIO (port 9000/9001).
  - Scaffolded Spring Boot 3 + Maven backend architecture with Clean Architecture packages.
  - Implemented core Entities (`User`, `Project`, `ProjectMember`, `Document`) and Enums.
  - Auto-generated schema successfully via Hibernate.
  - Scaffolded React Vite + TypeScript frontend with Tailwind CSS v4.
  - Set up Clean Architecture folders for Frontend (`pages`, `components`, `services`, etc.) and basic Axios `apiClient`.
