import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authService } from '../services/authService';
import logoImg from '../assets/Logo_KBase.png';

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Đang xác thực email của bạn...');

  const hasFetched = React.useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Không tìm thấy mã xác thực. Vui lòng kiểm tra lại đường dẫn trong email.');
      return;
    }

    if (hasFetched.current) return;
    hasFetched.current = true;

    const verifyToken = async () => {
      try {
        const response = await authService.verifyEmail(token);
        setStatus('success');
        setMessage(response.message || 'Xác thực email thành công! Bạn có thể đăng nhập ngay bây giờ.');
      } catch (error: any) {
        setStatus('error');
        const errorMsg = error.response?.data?.message || 'Xác thực thất bại. Token có thể đã hết hạn hoặc không hợp lệ.';
        setMessage(errorMsg);
      }
    };

    verifyToken();
  }, [token]);

  return (
    <div className="bg-surface text-on-surface font-body-md text-body-md antialiased min-h-screen flex flex-col items-center justify-center p-6 selection:bg-primary-fixed selection:text-primary">
      <div className="max-w-md w-full bg-surface-container-lowest p-8 rounded-2xl shadow-sm border border-outline-variant/50 text-center">
        <div className="flex justify-center mb-6">
          <img src={logoImg} alt="KBase Logo" className="w-12 h-auto object-contain" />
        </div>
        
        <h1 className="font-headline-md text-2xl font-bold tracking-tight mb-4">
          Xác thực Email
        </h1>

        {status === 'loading' && (
          <div className="flex flex-col items-center justify-center gap-4 py-8">
            <span className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></span>
            <p className="text-on-surface-variant">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-6">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600 dark:text-emerald-400">
              <span className="material-symbols-outlined text-4xl">check_circle</span>
            </div>
            <p className="text-on-surface-variant mb-8">{message}</p>
            <Link 
              to="/auth" 
              className="inline-flex w-full py-3 px-6 rounded-full bg-primary text-on-primary font-headline-sm text-[15px] font-semibold justify-center hover:shadow-md transition-all"
            >
              Chuyển đến Đăng nhập
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="py-6">
            <div className="w-16 h-16 bg-error-container/50 rounded-full flex items-center justify-center mx-auto mb-4 text-error">
              <span className="material-symbols-outlined text-4xl">error</span>
            </div>
            <p className="text-error font-medium mb-8">{message}</p>
            <Link 
              to="/auth" 
              className="inline-flex w-full py-3 px-6 rounded-full bg-surface-container border border-outline-variant text-on-surface font-headline-sm text-[15px] font-semibold justify-center hover:bg-surface-container-high transition-all"
            >
              Quay lại Đăng nhập
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
