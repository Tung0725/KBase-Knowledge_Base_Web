import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';

/**
 * ForgotPasswordModal Component
 * Modal dialog enabling users to request a password reset email.
 *
 * @prop isOpen - Controls the modal visibility state
 * @prop onClose - Callback function to dismiss the modal
 */
interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      await authService.forgotPassword({ email });
      setIsSuccess(true);
      toast.success('Đã gửi email khôi phục mật khẩu!');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Có lỗi xảy ra khi gửi yêu cầu. Vui lòng thử lại sau.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    setEmail('');
    setIsSuccess(false);
    setErrorMessage('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Layer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md bg-surface-container-lowest dark:bg-[#1a1c1e] rounded-3xl p-6 sm:p-8 shadow-2xl border border-outline-variant/30 overflow-hidden"
          >
            {/* Header Section */}
            <div className="flex items-start justify-between mb-5">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-2">
                <span className="material-symbols-outlined text-[26px]">lock_reset</span>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="p-1.5 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors disabled:opacity-50"
                aria-label="Đóng cửa sổ"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Content & Form Section */}
            {isSuccess ? (
              /* Success Confirmation View */
              <div className="text-center py-2">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-4xl">mark_email_read</span>
                </div>
                <h2 className="text-xl font-bold text-on-surface tracking-tight mb-2">
                  Kiểm tra hộp thư của bạn
                </h2>
                <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
                  Nếu email <strong className="text-on-surface font-semibold">{email}</strong> đã đăng ký trên KBase, chúng tôi đã gửi đường liên kết đặt lại mật khẩu có hiệu lực trong 15 phút.
                </p>
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full py-3 px-6 rounded-full bg-primary text-on-primary font-semibold text-sm hover:shadow-md active:scale-[0.99] transition-all"
                >
                  Đã hiểu & Đóng
                </button>
              </div>
            ) : (
              /* Input Form View */
              <div>
                <h2 className="text-2xl font-bold text-on-surface tracking-tight mb-1.5">
                  Quên mật khẩu?
                </h2>
                <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
                  Đừng lo lắng! Nhập email tài khoản của bạn để nhận hướng dẫn và liên kết đặt lại mật khẩu an toàn.
                </p>

                {errorMessage && (
                  <div className="mb-4 p-3.5 bg-error-container/40 border border-error/20 rounded-xl text-error text-xs flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
                    <span>{errorMessage}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="forgotPasswordEmail" className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                      Email đăng ký
                    </label>
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3.5 text-[20px] text-outline">
                        mail
                      </span>
                      <input
                        id="forgotPasswordEmail"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="tenban@tochuc.edu.vn"
                        disabled={isLoading}
                        autoFocus
                        className="w-full pl-11 pr-4 py-3 bg-surface-container-low border border-outline-variant/70 rounded-xl text-on-surface text-sm placeholder:text-outline focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all shadow-2xs disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {/* Actions Section */}
                  <div className="pt-2 flex flex-col gap-2.5">
                    <button
                      type="submit"
                      disabled={isLoading || !email.trim()}
                      className="w-full py-3 px-6 rounded-full bg-primary text-on-primary font-semibold text-[14px] shadow-sm hover:shadow-md hover:bg-primary/90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? (
                        <>
                          <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                          <span>Đang gửi liên kết...</span>
                        </>
                      ) : (
                        <>
                          <span>Gửi liên kết đặt lại</span>
                          <span className="material-symbols-outlined text-[18px]">send</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isLoading}
                      className="w-full py-2.5 text-xs font-semibold text-on-surface-variant hover:text-on-surface transition-colors"
                    >
                      Quay lại đăng nhập
                    </button>
                  </div>
                </form>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
