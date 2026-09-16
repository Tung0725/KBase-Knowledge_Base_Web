# KBase (Knowledge Base) - System Scenario & Problem Statement

## 1. Context & Problem (Bối cảnh & Vấn đề)
Trong các dự án làm việc nhóm hiện nay, việc lưu trữ và quản lý tài liệu (PDF, Word, Excel, Video họp...) thường diễn ra một cách tự phát và phân tán trên nhiều nền tảng khác nhau như Google Drive, Zalo, Slack. 
**Root Cause (Nguyên nhân gốc rễ):** Việc thiếu một trung tâm lưu trữ đồng nhất dẫn đến tình trạng:
- Thông tin bị thất lạc, khó tìm kiếm lại khi cần (đặc biệt là với các dự án kéo dài).
- Các thành viên mới gia nhập (onboarding) tốn rất nhiều thời gian để xin quyền truy cập và đọc hiểu các tài liệu, video cũ.
- Rủi ro về bảo mật thông tin khi tài liệu được chia sẻ vô tội vạ, không có cơ chế quản lý phân quyền theo cấu trúc dự án.

## 2. Proposed Solution (Giải pháp đề xuất)
Xây dựng **KBase (Knowledge Base)** - một Hub lưu trữ tập trung (Single Source of Truth) dành riêng cho các dự án. 
- **Nền tảng chính:** Web App (Thiết kế Responsive để có thể sử dụng tốt trên cả màn hình máy tính và thiết bị di động).
- **Giá trị mang lại (Core Value):** Cung cấp một môi trường chuyên nghiệp, mượt mà và bảo mật để lưu trữ mọi tài sản tri thức của dự án. Với cơ chế phân quyền chặt chẽ, người quản lý dễ dàng kiểm soát luồng thông tin, trong khi thành viên nhóm có thể upload, download và tìm kiếm tài liệu dự án một cách nhanh chóng, tránh tình trạng gián đoạn thông tin.

## 3. Actor-driven Features (Luồng tính năng theo Người dùng)

### 3.1. System Admin (Quản trị viên hệ thống)
*Hành trình người dùng:* Admin đóng vai trò là người giám sát tối cao của toàn bộ hệ thống KBase. Khi đăng nhập vào dashboard, Admin có cái nhìn tổng quan về mọi dự án đang chạy và toàn bộ tài khoản người dùng trong hệ thống. Admin có quyền tạo mới, khóa hoặc xóa tài khoản của người dùng khi có nhân sự nghỉ việc. Đồng thời, Admin có thể can thiệp vào bất kỳ dự án nào trong trường hợp cần hỗ trợ kỹ thuật hoặc giải quyết tranh chấp.

### 3.2. Project Owner (Quản lý dự án / PM)
*Hành trình người dùng:* Là người khởi tạo và chịu trách nhiệm chính về dự án. Sau khi tạo một "Project" mới trên KBase, Owner sẽ mời (invite) các thành viên vào không gian làm việc này. Owner là người xây dựng cấu trúc thư mục, tải lên các tài liệu quan trọng ban đầu. Xuyên suốt dự án, Owner quản lý quyền truy cập của các thành viên (thêm mới hoặc loại bỏ) và giám sát toàn bộ các tệp tin, video, văn bản được upload lên không gian của mình.

### 3.3. Project Member (Thành viên dự án)
*Hành trình người dùng:* Khi tham gia KBase, Member thấy được danh sách các dự án mà mình đã được Owner mời vào. Khi truy cập vào một dự án cụ thể, Member có thể upload các báo cáo, tài liệu thiết kế hoặc video liên quan đến công việc của mình. Nhờ tính năng phân quyền, Member được thoải mái xem, download và tìm kiếm toàn bộ tài liệu do những thành viên khác chia sẻ trong khuôn khổ dự án đó, đảm bảo luồng công việc diễn ra trôi chảy.

## 4. Management & Analytics (Quản trị & Báo cáo)
- **Quản lý không gian lưu trữ:** Hệ thống ghi nhận khối lượng tài liệu (dung lượng, số lượng file) cho từng dự án, phân loại theo định dạng (PDF, Image, Video).
- **Theo dõi hoạt động:** Dấu vết các hoạt động cơ bản (Audit log đơn giản) để biết ai đã upload tài liệu nào, thời gian tạo dự án hoặc thay đổi trạng thái của thành viên.

## 5. Out of Scope & Constraints (Phạm vi ngoài dự án & Ràng buộc)

### 5.1. Out of Scope (Không làm trong Phase 1)
- **AI Chatbot:** Tính năng AI tự động đọc hiểu tài liệu và trả lời câu hỏi sẽ KHÔNG được tập trung ở Phase 1 do quỹ thời gian 1 tuần giới hạn. (Đưa vào backlog cho Phase 2).
- **Chỉnh sửa tài liệu trực tuyến (Real-time collaboration):** Hệ thống chỉ tập trung vào việc lưu trữ (Upload/Download) tài liệu, KHÔNG hỗ trợ việc soạn thảo và chỉnh sửa văn bản trực tiếp trên trình duyệt như Google Docs.

### 5.2. Constraints (Ràng buộc phi chức năng)
- **Deadline:** Phát triển và triển khai hoàn thiện các tính năng cốt lõi trong đúng 1 tuần.
- **Tính phản hồi (Responsive):** Giao diện Web App bắt buộc phải hiển thị tốt trên các kích thước màn hình khác nhau (PC, Tablet, Mobile).
- **Độ ổn định:** Hoạt động trơn tru không phát sinh lỗi trong quá trình xác thực (Login/Signup) và tải file lớn (Video).

---

## Quality Checklist (Definition of Done)
- [x] Is the Context & Root Cause clearly analyzed?
- [x] Are all Actors explicitly defined with their specific journeys?
- [x] Are the expected outputs and core values explicit?
- [x] Are Out of Scope and Constraints explicitly mentioned?
