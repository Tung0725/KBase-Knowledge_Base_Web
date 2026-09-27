import React from 'react';
import PublicDocumentLayout from '../components/PublicDocumentLayout';

const Privacy: React.FC = () => {
  return (
    <PublicDocumentLayout 
      title="Chính sách & Bảo mật" 
      lastUpdated="27/09/2026"
    >
      <section>
        <h2 className="text-2xl font-semibold mb-3 text-primary">1. Phạm vi áp dụng</h2>
        <p className="text-on-surface-variant leading-relaxed">
          Chính sách này áp dụng cho toàn bộ người dùng (Sinh viên, giảng viên, khách) đang truy cập và lưu trữ dữ liệu tại nền tảng KBase.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold mb-3 text-primary">2. Thu thập dữ liệu</h2>
        <p className="text-on-surface-variant leading-relaxed mb-2">
          Hệ thống chỉ thu thập các thông tin tối thiểu để phục vụ tính năng xác thực và lưu trữ:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-on-surface-variant leading-relaxed">
          <li><strong>Thông tin tài khoản:</strong> Email đăng nhập, Tên hiển thị.</li>
          <li><strong>Dữ liệu hoạt động (Audit Logs):</strong> Lịch sử tạo thư mục, tải lên tài liệu nhằm giúp chủ dự án (Project Manager) kiểm soát bảo mật nội bộ.</li>
        </ul>
      </section>
      
      <section className="mt-8">
        <h2 className="text-2xl font-semibold mb-3 text-primary">3. Cơ chế bảo mật tài nguyên</h2>
        <p className="text-on-surface-variant leading-relaxed">
          Bảo mật là tiêu chí hàng đầu trong KBase nhằm chống thất thoát bí mật nghiên cứu khoa học:
        </p>
        <ul className="list-disc pl-5 mt-2 space-y-2 text-on-surface-variant leading-relaxed">
          <li>Xác thực phiên làm việc bằng <strong>Web JSON Token (JWT)</strong>. Hết phiên (24 tiếng), hệ thống sẽ tự động yêu cầu đăng nhập lại để đảm bảo an toàn.</li>
          <li>Cách ly dữ liệu độc lập. Dữ liệu của dự án A hoàn toàn vô hình với thành viên của dự án B, trừ khi được chia sẻ trực tiếp (Share link/invite).</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold mb-3 text-primary">4. Quyền sở hữu và Cam kết</h2>
        <p className="text-on-surface-variant leading-relaxed">
          Toàn bộ tài nguyên bạn tải lên thuộc sở hữu 100% của nhóm bạn. Hệ thống hoàn toàn không can thiệp, phân tích hoặc chia sẻ nội dung file cho bất kỳ bên thứ ba nào.<br/>
          Do đây là bản phát hành đầu tiên (Version 0.0.1), nếu xảy ra bất kỳ lỗi nào trong quá trình sử dụng, vui lòng liên hệ với Admin để được hỗ trợ.
        </p>
      </section>
    </PublicDocumentLayout>
  );
};

export default Privacy;
