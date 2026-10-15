import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { authService } from '../services/authService';
import logoImg from '../assets/Logo_KBase.png';
import toast from 'react-hot-toast';

/**
 * ResetPassword Component
 * Page allowing users to set a new password via a verified one-time link token.
 *
 * Query Params:
 *  - token: Cryptographic one-time token issued via email
 *
 * Key States:
 *  - newPassword, confirmPassword: User input credentials
 *  - showPassword, showConfirmPassword: Toggles for field masking
 *  - isLoading, isSuccess, errorMessage: Submission and response lifecycle
 *  - countdown: Automatic redirect countdown timer on success
 */
const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [countdown, setCountdown] = useState(3);

  // Password policy criteria
  const hasMinLength = newPassword.length >= 8;
  const hasUpperCase = /[A-Z]/.test(newPassword);
  const hasLowerCase = /[a-z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const hasSpecialChar = /[@$!%*?&]/.test(newPassword);
  const isPasswordValid = hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
  const isMatch = newPassword.length > 0 && newPassword === confirmPassword;

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (isSuccess && countdown > 0) {
      timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    } else if (isSuccess && countdown === 0) {
      navigate('/auth');
    }
    return () => clearTimeout(timer);
  }, [isSuccess, countdown, navigate]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage('');

    if (!token) {
      setErrorMessage('Mã xác thực token không hợp lệ hoặc bị thiếu.');
      return;
    }

    if (!isPasswordValid) {
      setErrorMessage('Mật khẩu chưa đáp ứng đầy đủ các tiêu chuẩn bảo mật.');
      return;
    }

    if (!isMatch) {
      setErrorMessage('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    setIsLoading(true);

    try {
      await authService.resetPassword({
        token,
        newPassword,
        confirmPassword,
      });
      setIsSuccess(true);
      toast.success('Đặt lại mật khẩu thành công!');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Không thể đặt lại mật khẩu. Liên kết có thể đã hết hạn hoặc không hợp lệ.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-primary-fixed selection:text-primary">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-30 dark:opacity-20">
        <div className="absolute -top-[20%] -left-[10%] w-[500px] h-[500px] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[500px] h-[500px] rounded-full bg-tertiary/20 blur-[120px]" />
      </div>

      {/* Main Card Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md bg-surface-container-lowest dark:bg-[#1a1c1e] p-6 sm:p-8 rounded-3xl shadow-xl border border-outline-variant/40"
      >
        {/* Header Section */}
        <div className="flex flex-col items-center text-center mb-6">
          <Link to="/" className="inline-block mb-4 hover:opacity-80 transition-opacity">
            <img src={logoImg} alt="KBase Logo" width="48" height="48" className="w-12 h-12 object-contain" />
          </Link>

          <h1 className="text-2xl sm:text-[26px] font-bold text-on-surface tracking-tight">
            Thiết lập mật khẩu mới
          </h1>
          <p className="text-sm text-on-surface-variant mt-1.5 leading-relaxed">
            Nhập mật khẩu an toàn mới để đăng nhập lại vào tài khoản KBase của bạn.
          </p>
        </div>

        {/* Missing Token Warning State */}
        {!token ? (
          <div className="py-4 text-center">
            <div className="w-16 h-16 bg-error-container/40 text-error rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-4xl">link_off</span>
            </div>
            <h2 className="text-base font-semibold text-error mb-2">
              Liên kết không hợp lệ
            </h2>
            <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
              Không tìm thấy mã token xác thực trong đường dẫn. Vui lòng bấm vào liên kết trong email hoặc gửi lại yêu cầu quên mật khẩu.
            </p>
            <Link
              to="/auth"
              className="inline-flex w-full py-3 px-6 rounded-full bg-primary text-on-primary font-semibold text-sm justify-center hover:shadow-md transition-all"
            >
              Quay lại Đăng nhập
            </Link>
          </div>
        ) : isSuccess ? (
          /* Success State View */
          <div className="py-4 text-center">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-4xl">check_circle</span>
            </div>
            <h2 className="text-xl font-bold text-on-surface mb-2">
              Đổi mật khẩu thành công!
            </h2>
            <p className="text-sm text-on-surface-variant mb-6 leading-relaxed">
              Mật khẩu tài khoản của bạn đã được cập nhật. Bạn sẽ tự động được chuyển về trang đăng nhập sau{' '}
              <strong className="text-primary font-bold">{countdown}s</strong>.
            </p>
            <Link
              to="/auth"
              className="inline-flex w-full py-3 px-6 rounded-full bg-primary text-on-primary font-semibold text-sm justify-center hover:shadow-md active:scale-[0.99] transition-all"
            >
              Đăng nhập ngay
            </Link>
          </div>
        ) : (
          /* Form Section */
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3.5 bg-error-container/40 border border-error/20 rounded-xl text-error text-xs flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* New Password Field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="newPasswordInput" className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Mật khẩu mới
              </label>
              <div className="relative flex items-center">
                <input
                  id="newPasswordInput"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới"
                  disabled={isLoading}
                  className="w-full pl-4 pr-11 py-3 bg-surface-container-low border border-outline-variant/70 rounded-xl text-on-surface text-sm placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all shadow-2xs disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-outline hover:text-on-surface transition-colors p-0.5"
                  aria-label="Ẩn hiện mật khẩu"
                  tabIndex={-1}
                >
                  <span className="material-symbols-outlined text-[20px] mt-1">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="confirmPasswordInput" className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                Xác nhận mật khẩu mới
              </label>
              <div className="relative flex items-center">
                <input
                  id="confirmPasswordInput"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  disabled={isLoading}
                  className="w-full pl-4 pr-11 py-3 bg-surface-container-low border border-outline-variant/70 rounded-xl text-on-surface text-sm placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all shadow-2xs disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 text-outline hover:text-on-surface transition-colors p-0.5"
                  aria-label="Ẩn hiện xác nhận mật khẩu"
                  tabIndex={-1}
                >
                  <span className="material-symbols-outlined text-[20px] mt-1">
                    {showConfirmPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Password Policy Guidelines */}
            <div className="p-3 bg-surface-container/50 rounded-2xl border border-outline-variant/30 space-y-1.5 text-[11.5px]">
              <div className="font-semibold text-on-surface-variant mb-1">
                Yêu cầu độ bảo mật mật khẩu:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-outline'}`}>
                  <span className="material-symbols-outlined text-[15px]">
                    {hasMinLength ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                  <span>Tối thiểu 8 ký tự</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasUpperCase && hasLowerCase ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-outline'}`}>
                  <span className="material-symbols-outlined text-[15px]">
                    {hasUpperCase && hasLowerCase ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                  <span>Chữ hoa & chữ thường</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-outline'}`}>
                  <span className="material-symbols-outlined text-[15px]">
                    {hasNumber ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                  <span>Có ít nhất 1 chữ số</span>
                </div>
                <div className={`flex items-center gap-1.5 ${hasSpecialChar ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-outline'}`}>
                  <span className="material-symbols-outlined text-[15px]">
                    {hasSpecialChar ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                  <span>Ký tự đặc biệt (@$!%*?&)</span>
                </div>
              </div>
              {confirmPassword.length > 0 && (
                <div className={`flex items-center gap-1.5 pt-1 border-t border-outline-variant/20 mt-1.5 ${isMatch ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-error'}`}>
                  <span className="material-symbols-outlined text-[15px]">
                    {isMatch ? 'check_circle' : 'cancel'}
                  </span>
                  <span>{isMatch ? 'Mật khẩu xác nhận trùng khớp' : 'Mật khẩu xác nhận chưa khớp'}</span>
                </div>
              )}
            </div>

            {/* Actions Section */}
            <div className="pt-2 flex flex-col gap-2.5">
              <button
                type="submit"
                disabled={isLoading || !isPasswordValid || !isMatch}
                className="w-full py-3.5 px-6 rounded-full bg-primary text-on-primary font-semibold text-[14px] shadow-sm hover:shadow-md hover:bg-primary/90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                    <span>Đang cập nhật...</span>
                  </>
                ) : (
                  <>
                    <span>Cập nhật mật khẩu</span>
                    <span className="material-symbols-outlined text-[18px]">key</span>
                  </>
                )}
              </button>

              <Link
                to="/auth"
                className="w-full py-2 text-center text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors"
              >
                Hủy bỏ & Quay lại Đăng nhập
              </Link>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default ResetPassword;
