import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { authService } from '../services/authService';
import logoImg from '../assets/Logo_KBase.png';

/**
 * VerifyEmail Component
 * Handles email verification flow when users follow the confirmation link sent to their mailbox.
 *
 * Query Params:
 *  - token: One-time verification token
 *
 * Key States:
 *  - status: 'loading' | 'success' | 'error'
 *  - message: Detailed descriptive message explaining the outcome
 *  - countdown: Automatic redirect countdown timer on verification success
 */
const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(() => (token ? 'loading' : 'error'));
  const [message, setMessage] = useState(() => (
    token
      ? 'Đang tiến hành xác thực tài khoản của bạn...'
      : 'Không tìm thấy mã xác thực hợp lệ trong đường dẫn. Vui lòng kiểm tra lại email bạn đã nhận.'
  ));
  const [countdown, setCountdown] = useState(4);

  const hasFetched = useRef(false);

  useEffect(() => {
    if (!token) return;

    if (hasFetched.current) return;
    hasFetched.current = true;

    const verifyToken = async () => {
      try {
        const response = await authService.verifyEmail(token);
        setStatus('success');
        setMessage(response.message || 'Xác thực email thành công! Tài khoản của bạn đã được kích hoạt.');
      } catch (error: any) {
        setStatus('error');
        const errorMsg = error.response?.data?.message || 'Liên kết xác thực đã hết hạn hoặc không còn hiệu lực. Vui lòng thử đăng ký lại.';
        setMessage(errorMsg);
      }
    };

    verifyToken();
  }, [token]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (status === 'success' && countdown > 0) {
      timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    } else if (status === 'success' && countdown === 0) {
      navigate('/auth');
    }
    return () => clearTimeout(timer);
  }, [status, countdown, navigate]);

  return (
    <div className="relative min-h-screen bg-surface text-on-surface flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden selection:bg-primary-fixed selection:text-primary">
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-35 dark:opacity-25">
        <div className="absolute -top-[15%] -left-[10%] w-[550px] h-[550px] rounded-full bg-primary/25 blur-[130px]" />
        <div className="absolute -bottom-[15%] -right-[10%] w-[550px] h-[550px] rounded-full bg-emerald-500/20 blur-[130px]" />
      </div>

      {/* Main Card Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 18 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md bg-surface-container-lowest/95 dark:bg-[#1a1c1e]/95 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-2xl border border-outline-variant/35 text-center"
      >
        {/* Header Branding Section */}
        <div className="flex flex-col items-center mb-6">
          <Link to="/" className="inline-block mb-3.5 group">
            <div className="p-2.5 rounded-2xl bg-surface-container-high/60 group-hover:bg-surface-container-highest transition-colors">
              <img src={logoImg} alt="KBase Logo" width="40" height="40" className="w-10 h-10 object-contain transition-transform group-hover:scale-105 duration-200" />
            </div>
          </Link>
          <span className="text-xs uppercase font-bold tracking-widest text-primary/80">
            Hệ tri thức KBase
          </span>
        </div>

        {/* Dynamic State Views */}
        <AnimatePresence mode="wait">
          {status === 'loading' && (
            /* Loading State View */
            <motion.div
              key="loading-view"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="py-4"
            >
              <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <span className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping opacity-30" />
                <span className="absolute inset-0 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[24px]">mark_email_unread</span>
                </div>
              </div>

              <h1 className="text-2xl font-bold text-on-surface tracking-tight mb-2">
                Đang kích hoạt tài khoản
              </h1>
              <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
                {message}
              </p>

              <div className="w-full bg-surface-container-high rounded-full h-1.5 overflow-hidden">
                <motion.div
                  className="bg-primary h-full rounded-full"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
                />
              </div>
            </motion.div>
          )}

          {status === 'success' && (
            /* Success State View */
            <motion.div
              key="success-view"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="py-2"
            >
              <div className="w-20 h-20 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-8 ring-emerald-500/10 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-500/10">
                <span className="material-symbols-outlined text-4xl">check_circle</span>
              </div>

              <h1 className="text-2xl sm:text-[26px] font-bold text-on-surface tracking-tight mb-2">
                Xác thực thành công!
              </h1>
              <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
                {message}
              </p>

              {/* Countdown Card */}
              <div className="p-3 bg-surface-container/60 rounded-2xl border border-outline-variant/30 text-xs text-on-surface-variant mb-6 flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">timelapse</span>
                <span>Tự động chuyển về trang đăng nhập sau <strong className="text-primary font-bold text-sm">{countdown}s</strong></span>
              </div>

              {/* Action Button */}
              <Link
                to="/auth"
                className="inline-flex w-full py-3.5 px-6 rounded-full bg-primary text-on-primary font-semibold text-sm justify-center items-center gap-2 shadow-sm hover:shadow-md hover:bg-primary/90 active:scale-[0.99] transition-all"
              >
                <span>Đăng nhập ngay</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
            </motion.div>
          )}

          {status === 'error' && (
            /* Error State View */
            <motion.div
              key="error-view"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="py-2"
            >
              <div className="w-20 h-20 rounded-full bg-error-container/40 text-error ring-8 ring-error/10 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-error/10">
                <span className="material-symbols-outlined text-4xl">link_off</span>
              </div>

              <h1 className="text-2xl font-bold text-on-surface tracking-tight mb-2">
                Xác thực không thành công
              </h1>
              <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
                {message}
              </p>

              {/* Notice Card */}
              <div className="p-3.5 bg-surface-container/50 rounded-2xl border border-outline-variant/30 text-left text-xs text-on-surface-variant space-y-1 mb-6">
                <div className="font-semibold text-on-surface flex items-center gap-1.5 mb-1">
                  <span className="material-symbols-outlined text-[16px] text-amber-500">info</span>
                  <span>Nguyên nhân thường gặp:</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-outline">
                  <li>Liên kết đã quá thời hạn hiệu lực (1 giờ).</li>
                  <li>Tài khoản đã được xác thực trước đó.</li>
                  <li>Đường link bị ngắt quãng khi sao chép từ email.</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2.5">
                <Link
                  to="/auth"
                  className="inline-flex w-full py-3.5 px-6 rounded-full bg-primary text-on-primary font-semibold text-sm justify-center items-center gap-2 shadow-sm hover:shadow-md hover:bg-primary/90 active:scale-[0.99] transition-all"
                >
                  <span>Quay lại trang Đăng nhập</span>
                  <span className="material-symbols-outlined text-[18px]">login</span>
                </Link>

                <Link
                  to="/"
                  className="w-full py-2 text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  Trở về Trang chủ
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
