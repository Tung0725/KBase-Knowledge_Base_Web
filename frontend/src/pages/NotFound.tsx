import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * NotFound page — hiển thị khi người dùng truy cập đường dẫn không tồn tại.
 * Cung cấp nút điều hướng rõ ràng để không bao giờ bị "mắc kẹt".
 */
const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center px-6 relative overflow-hidden">

      {/* Background decorative blobs */}
      <div
        className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: 'var(--md-primary)' }}
      />
      <div
        className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ background: 'var(--md-tertiary)' }}
      />

      {/* Main card */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full">

        {/* Icon */}
        <div
          className="flex items-center justify-center w-24 h-24 rounded-full mb-6"
          style={{ background: 'var(--md-error-container)' }}
        >
          <span
            className="material-symbols-outlined text-5xl"
            style={{ color: 'var(--md-on-error-container)' }}
          >
            travel_explore
          </span>
        </div>

        {/* 404 number */}
        <h1
          className="text-8xl font-bold tracking-tight mb-2"
          style={{ color: 'var(--md-primary)' }}
        >
          404
        </h1>

        {/* Title */}
        <h2
          className="text-2xl font-semibold mb-3"
          style={{ color: 'var(--md-on-surface)' }}
        >
          Trang không tìm thấy
        </h2>

        {/* Description */}
        <p
          className="text-base leading-relaxed mb-8"
          style={{ color: 'var(--md-on-surface-variant)' }}
        >
          Đường dẫn bạn truy cập không tồn tại hoặc đã bị xóa. Hãy kiểm tra lại URL hoặc quay về trang chủ.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:opacity-80 active:scale-95"
            style={{
              background: 'var(--md-surface-container-high)',
              color: 'var(--md-on-surface)',
            }}
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            Quay lại
          </button>

          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:opacity-90 active:scale-95"
            style={{
              background: 'var(--md-primary)',
              color: 'var(--md-on-primary)',
            }}
          >
            <span className="material-symbols-outlined text-[20px]">home</span>
            Về trang chủ
          </button>
        </div>

        {/* Help hint */}
        <p
          className="mt-8 text-sm"
          style={{ color: 'var(--md-outline)' }}
        >
          Nếu bạn cho rằng đây là lỗi hệ thống, hãy liên hệ quản trị viên.
        </p>
      </div>
    </div>
  );
};

export default NotFound;
