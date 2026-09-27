import React from 'react';
import PublicDocumentLayout from '../components/PublicDocumentLayout';

const Guide: React.FC = () => {
  return (
    <PublicDocumentLayout 
      title="Hướng dẫn sử dụng" 
      subtitle="Làm quen và làm chủ không gian KBase chỉ trong 5 phút"
      lastUpdated="27/09/2026"
    >
      <section>
        <h2 className="text-2xl font-semibold mb-3 text-primary">Bước 1: Xin cấp quyền & Khởi tạo (Dành cho Leader)</h2>
        <p className="text-on-surface-variant leading-relaxed mb-3">
          KBase là hệ thống đóng (tài khoản đăng ký mới mặc định chỉ có quyền Member để xem tài liệu). Nếu bạn là Trưởng nhóm muốn tạo dự án, hãy làm theo các bước sau:
        </p>
        <ol className="list-decimal pl-5 space-y-2 text-on-surface-variant leading-relaxed mb-3">
          <li>Đăng nhập vào hệ thống, tại màn hình Hub, nhấn vào nút <strong>Liên hệ Zalo Admin</strong> (hoặc Gửi Email) để xin cấp quyền Trưởng nhóm (PM).</li>
          <li>Sau khi Admin báo duyệt thành công, bạn làm mới (F5) trang Hub. Nút màu xanh <strong>"Tạo dự án ngay"</strong> sẽ xuất hiện.</li>
          <li>Nhấn vào nút và điền các thông tin cơ bản cho dự án.</li>
        </ol>
        <div className="bg-surface-container-high p-4 rounded-lg text-sm border-l-4 border-primary mt-4">
          💡 <strong>Mẹo đặt tên:</strong> Hãy đặt tên dự án theo cú pháp chuẩn của nhóm hoặc lớp học để Admin dễ dàng kiểm soát dung lượng. <br/>
          Ví dụ: <code className="bg-surface-container px-1 py-0.5 rounded font-mono text-primary mx-1">SP26_Group1_Capstone</code>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold mb-3 text-primary">Bước 2: Quản lý thư mục dự án</h2>
        <p className="text-on-surface-variant leading-relaxed mb-3">
          Click vào dự án vừa tạo để truy cập vào không gian lưu trữ (Workspace). Tại đây bạn có thể:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-on-surface-variant leading-relaxed mb-3">
          <li><strong>Tạo thư mục:</strong> Phân chia tài liệu theo từng giai đoạn (Sprint 1, Sprint 2...) hoặc từng bộ phận (Frontend, Backend, Design).</li>
          <li><strong>Tải lên tài liệu:</strong> Hỗ trợ các tệp tin cơ bản như PDF, DOCX, ZIP, hoặc video báo cáo cuộc họp.</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold mb-3 text-primary">Bước 3: Chia sẻ cho thành viên</h2>
        <p className="text-on-surface-variant leading-relaxed mb-3">
          Để đội ngũ có thể cùng làm việc, chủ dự án cần thêm các thành viên vào không gian:
        </p>
        <ol className="list-decimal pl-5 space-y-2 text-on-surface-variant leading-relaxed">
          <li>Tại menu dự án (icon dấu 3 chấm), chọn <strong>Cài đặt dự án</strong>.</li>
          <li>Nhập <strong>Email</strong> của thành viên mà bạn muốn mời (thành viên đó cần phải đăng ký tài khoản KBase trước).</li>
          <li>Thành viên sẽ ngay lập tức thấy dự án xuất hiện trong tab <strong>"Được chia sẻ với tôi"</strong> ở trang Hub.</li>
        </ol>
      </section>
    </PublicDocumentLayout>
  );
};

export default Guide;
