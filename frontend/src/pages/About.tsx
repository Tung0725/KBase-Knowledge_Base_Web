import React from 'react';
import PublicDocumentLayout from '../components/PublicDocumentLayout';

const About: React.FC = () => {
  return (
    <PublicDocumentLayout 
      title="Giới thiệu dự án KBase" 
      subtitle="Nền tảng Quản trị Tri thức và Tài nguyên (Knowledge Base) chuyên biệt dành cho tổ chức nhỏ và các nhóm sinh viên."
    >
      <section>
        <h2 className="text-2xl font-semibold mb-4 text-primary">1. Bối cảnh ra đời & Thách thức</h2>
        <p className="text-on-surface-variant leading-relaxed mb-4">
          Trong quá trình triển khai các đồ án tốt nghiệp (Capstone Project), các dự án nghiên cứu khoa học hoặc là lưu trữ tài liệu của tổ chức, cá nhân thường xuyên phải đối mặt với một vấn đề mang tính hệ thống: <strong>Sự phân mảnh thông tin nghiêm trọng</strong>.
        </p>
        <div className="bg-surface-container-low p-5 rounded-xl border border-outline-variant/30 mb-4">
          <h3 className="font-semibold text-on-surface mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-error text-[20px]">warning</span>
            Các vấn đề nhức nhối hiện tại:
          </h3>
          <ul className="list-disc pl-5 space-y-2 text-on-surface-variant">
            <li>Tài liệu quy cách (Specs), báo cáo tiến độ nằm rải rác trên Google Drive, Zalo, Messenger.</li>
            <li>Source code lưu trên GitHub, tài liệu thiết kế nằm trên Figma, nhưng không có một <em>nơi trung tâm</em> để gắn kết chúng lại với nhau.</li>
            <li>Khi có thành viên mới tham gia (hoặc người cũ rời đi), quá trình bàn giao (handover) diễn ra thủ công, mất nhiều thời gian và thường xuyên bị thất lạc tài liệu cũ.</li>
            <li>Giảng viên hướng dẫn gặp khó khăn trong việc theo dõi tiến độ tổng thể của nhiều nhóm cùng lúc.</li>
          </ul>
        </div>
        <p className="text-on-surface-variant leading-relaxed">
          KBase ra đời như một giải pháp thiết thực nhằm giải quyết bài toán trên, cung cấp một hệ sinh thái lưu trữ tập trung, chuẩn hóa và bảo mật.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold mb-4 text-primary">2. Tầm nhìn & Sứ mệnh</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/30 shadow-sm">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[24px]">visibility</span>
            </div>
            <h3 className="text-lg font-bold text-on-surface mb-2">Tầm nhìn (Vision)</h3>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              Trở thành nền tảng lõi (core platform) mặc định cho mọi đồ án và dự án sinh viên tại trường đại học, nơi mọi tri thức được kế thừa và không bao giờ bị lãng quên.
            </p>
          </div>
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/30 shadow-sm">
            <div className="w-12 h-12 bg-secondary/10 text-secondary rounded-full flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[24px]">flag</span>
            </div>
            <h3 className="text-lg font-bold text-on-surface mb-2">Sứ mệnh (Mission)</h3>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              Cung cấp một <em>Single Source of Truth</em> (Nguồn chân lý duy nhất) giúp các nhóm làm việc hiệu quả hơn, giảm thiểu thời gian tìm kiếm tài liệu và tối đa hóa thời gian nghiên cứu.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold mb-4 text-primary">3. Giá trị cốt lõi mang lại</h2>
        <p className="text-on-surface-variant leading-relaxed mb-4">
          KBase không bắt bạn phải học cách sử dụng một công nghệ phức tạp mới. KBase tập trung vào việc giải quyết triệt để những "nỗi đau" thường trực khi làm việc nhóm.
        </p>
        <ul className="space-y-4">
          <li className="flex gap-4">
            <div className="w-10 h-10 shrink-0 bg-surface-container-high rounded-lg flex items-center justify-center text-on-surface">
              <span className="material-symbols-outlined">bolt</span>
            </div>
            <div>
              <h4 className="font-semibold text-on-surface">Tiết kiệm thời gian tìm kiếm</h4>
              <p className="text-sm text-on-surface-variant leading-relaxed">Không còn cảnh lục lọi tin nhắn cũ từ tháng trước hay xin cấp quyền Google Drive mòn mỏi. Mọi tài liệu đều nằm đúng chỗ của nó, ai cũng có thể tự tìm thấy thứ mình cần trong 5 giây.</p>
            </div>
          </li>
          <li className="flex gap-4">
            <div className="w-10 h-10 shrink-0 bg-surface-container-high rounded-lg flex items-center justify-center text-on-surface">
              <span className="material-symbols-outlined">shield_lock</span>
            </div>
            <div>
              <h4 className="font-semibold text-on-surface">Bảo vệ chất xám tuyệt đối</h4>
              <p className="text-sm text-on-surface-variant leading-relaxed">Chất xám nghiên cứu là tài sản vô giá. KBase ngăn chặn hoàn toàn việc chia sẻ nhầm link công khai. Chỉ những thành viên thực sự nằm trong dự án mới có thể mở và xem file.</p>
            </div>
          </li>
          <li className="flex gap-4">
            <div className="w-10 h-10 shrink-0 bg-surface-container-high rounded-lg flex items-center justify-center text-on-surface">
              <span className="material-symbols-outlined">handshake</span>
            </div>
            <div>
              <h4 className="font-semibold text-on-surface">Bàn giao (Handover) siêu tốc</h4>
              <p className="text-sm text-on-surface-variant leading-relaxed">Khi có sinh viên mới tham gia dự án, bạn không cần phải tốn 3 ngày ngồi gửi lại từng file tài liệu cũ. Chỉ cần add Email của họ vào dự án, họ sẽ tự nắm bắt được toàn cảnh công việc ngay lập tức.</p>
            </div>
          </li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold mb-4 text-primary">4. Trải nghiệm được may đo riêng</h2>
        <div className="border-l-2 border-primary/30 pl-4 space-y-4">
          <div>
            <h4 className="text-on-surface font-semibold">Dành cho Trưởng nhóm & Giảng viên (PM / Mentor)</h4>
            <p className="text-sm text-on-surface-variant">Bao quát tiến độ nhiều nhóm cùng lúc một cách trực quan. Nắm rõ được ai vừa cập nhật tài liệu nào, dự án nào đang phình to dung lượng báo cáo quá mức cho phép.</p>
          </div>
          <div>
            <h4 className="text-on-surface font-semibold">Dành cho Kỹ sư & Thành viên (Member)</h4>
            <p className="text-sm text-on-surface-variant">Một không gian yên tĩnh, không bị trôi tin nhắn hay làm phiền bởi thông báo rác. Hỗ trợ xem trước (preview) nhanh các file tài liệu hoặc phát video cuộc họp ngay trên trình duyệt mà không tốn công tải về máy.</p>
          </div>
        </div>
      </section>

      <section className="mt-10 pt-8 border-t border-outline-variant/20">
        <p className="text-center text-on-surface-variant italic">
          "KBase không chỉ là một ổ đĩa trên mạng, nó là trung tâm thần kinh của toàn bộ dự án."
        </p>
      </section>
    </PublicDocumentLayout>
  );
};

export default About;
