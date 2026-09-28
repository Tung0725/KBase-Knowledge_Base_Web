import React from 'react';
import PublicDocumentLayout from '../components/PublicDocumentLayout';

const Terms: React.FC = () => {
  return (
    <PublicDocumentLayout 
      title="Điều khoản dịch vụ" 
      lastUpdated="27/09/2026"
    >
      <section>
        <h2 className="text-2xl font-semibold mb-3 text-primary">1. Quy định chung</h2>
        <p className="text-on-surface-variant leading-relaxed">
          KBase là nền tảng quản trị tri thức và lưu trữ biên bản dự án dành cho cá nhân và tổ chức. Việc đăng ký, đăng nhập hoặc sử dụng KBase đồng nghĩa với việc bạn đã đọc, hiểu và đồng ý tuân thủ toàn bộ Điều khoản dịch vụ này.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold mb-3 text-primary">2. Trách nhiệm của người dùng</h2>
        <ul className="list-disc pl-5 space-y-2 text-on-surface-variant leading-relaxed">
          <li><strong>Bảo mật tài khoản:</strong> Bạn hoàn toàn chịu trách nhiệm bảo vệ mật khẩu và tài khoản của mình. Mọi hoạt động xảy ra dưới tài khoản của bạn sẽ được quy trách nhiệm trực tiếp cho bạn.</li>
          <li><strong>Nội dung tải lên:</strong> Bạn cam kết không tải lên hệ thống các nội dung vi phạm pháp luật, vi phạm bản quyền hoặc chứa mã độc. KBase có quyền (nhưng không có nghĩa vụ) xóa bỏ bất kỳ nội dung nào vi phạm mà không cần báo trước.</li>
          <li><strong>Tôn trọng cộng đồng:</strong> Trong quá trình cộng tác, không được phép có các hành vi phá hoại dữ liệu chung, spam hoặc làm gián đoạn hoạt động của hệ thống.</li>
        </ul>
      </section>
      
      <section className="mt-8">
        <h2 className="text-2xl font-semibold mb-3 text-primary">3. Giới hạn trách nhiệm</h2>
        <p className="text-on-surface-variant leading-relaxed">
          KBase cung cấp dịch vụ dưới dạng "nguyên trạng". Mặc dù chúng tôi cam kết nỗ lực tối đa để bảo vệ an toàn dữ liệu và tính sẵn sàng của hệ thống, chúng tôi không chịu trách nhiệm bồi thường cho bất kỳ tổn thất dữ liệu, gián đoạn kinh doanh hay thiệt hại gián tiếp nào phát sinh trong quá trình bạn sử dụng nền tảng.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-2xl font-semibold mb-3 text-primary">4. Chấm dứt dịch vụ</h2>
        <p className="text-on-surface-variant leading-relaxed">
          KBase có toàn quyền vô hiệu hóa hoặc xóa vĩnh viễn tài khoản của bạn nếu phát hiện vi phạm nghiêm trọng các quy định trên, hoặc nếu hệ thống yêu cầu bảo trì, đóng cửa. Tuy nhiên, người dùng sẽ được thông báo trước một khoảng thời gian hợp lý để sao lưu dữ liệu.
        </p>
      </section>
    </PublicDocumentLayout>
  );
};

export default Terms;
