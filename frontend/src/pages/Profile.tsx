import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

const Profile: React.FC = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  // Tab State
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  // Profile Form State
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!fullName.trim()) {
      setError('Họ tên không được để trống');
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedUser = await authService.updateProfile({ fullName, phoneNumber });
      setUser({ ...user, ...updatedUser } as any);
      setSuccessMessage('Cập nhật hồ sơ thành công!');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật hồ sơ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu xác nhận không khớp');
      return;
    }

    setIsSubmittingPassword(true);
    try {
      await authService.changePassword({ currentPassword, newPassword, confirmPassword });
      setPasswordSuccess(user?.hasPassword ? 'Đổi mật khẩu thành công!' : 'Tạo mật khẩu thành công!');
      if (!user?.hasPassword) {
        setUser({ ...user, hasPassword: true } as any);
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || 'Có lỗi xảy ra khi xử lý mật khẩu');
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center py-8 md:py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-[1000px] bg-surface-container-lowest rounded-3xl shadow-sm border border-outline-variant/30 overflow-hidden flex flex-col md:flex-row min-h-[600px]">
        
        {/* Sidebar Settings Navigation */}
        <div className="w-full md:w-72 bg-surface-container-low border-b md:border-b-0 md:border-r border-outline-variant/30 p-6 md:p-8 flex flex-col shrink-0">
          <div className="mb-8">
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-sm font-medium text-on-surface-variant hover:text-primary transition-colors mb-6"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Quay lại
            </button>
            <h1 className="text-2xl font-bold text-on-surface tracking-tight">Cài đặt</h1>
            <p className="text-sm text-on-surface-variant mt-1">Quản lý tài khoản của bạn</p>
          </div>

          <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0 scrollbar-hide">
            <button 
              onClick={() => setActiveTab('profile')}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === 'profile' 
                  ? 'bg-primary text-on-primary shadow-md scale-[1.02]' 
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">person</span>
              Thông tin cá nhân
            </button>
            <button 
              onClick={() => setActiveTab('security')}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === 'security' 
                  ? 'bg-primary text-on-primary shadow-md scale-[1.02]' 
                  : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">shield_lock</span>
              Bảo mật & Mật khẩu
            </button>
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 md:p-10 bg-surface overflow-y-auto">
          
          {/* ============================== */}
          {/* TAB 1: THÔNG TIN CÁ NHÂN */}
          {/* ============================== */}
          {activeTab === 'profile' && (
            <div className="max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8">
                <h2 className="text-xl font-bold text-on-surface">Thông tin cá nhân</h2>
                <p className="text-sm text-on-surface-variant mt-1">Cập nhật thông tin định danh của bạn trên hệ thống</p>
              </div>

              <div className="flex items-center gap-6 mb-8 pb-8 border-b border-outline-variant/30">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-4xl shadow-sm ring-4 ring-surface-container">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-not-allowed backdrop-blur-sm">
                    <span className="material-symbols-outlined text-white text-[24px]">photo_camera</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-on-surface">{user?.fullName || 'Người dùng'}</h3>
                  <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-surface-container-high text-on-surface">
                    <span className="material-symbols-outlined text-[14px] text-primary">
                      {user?.role === 'ADMIN' ? 'admin_panel_settings' : 'badge'}
                    </span>
                    {user?.role === 'ADMIN' ? 'Quản trị viên' : 'Người dùng'}
                  </div>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-error-container/20 border border-error/30 rounded-xl text-error text-sm flex items-start gap-3">
                  <span className="material-symbols-outlined text-[20px] shrink-0">error</span>
                  <p>{error}</p>
                </div>
              )}

              {successMessage && (
                <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-600 dark:text-green-400 text-sm flex items-start gap-3">
                  <span className="material-symbols-outlined text-[20px] shrink-0">check_circle</span>
                  <p>{successMessage}</p>
                </div>
              )}

              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-on-surface mb-2">
                    Địa chỉ Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      id="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full pl-4 pr-10 py-3 bg-surface-container border border-outline-variant/30 rounded-xl text-on-surface-variant focus:outline-none cursor-not-allowed opacity-70"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-[20px]">lock</span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant mt-1.5 ml-1">Email được dùng để đăng nhập và không thể thay đổi.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-semibold text-on-surface mb-2">
                      Họ và tên
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/50 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-outline"
                      placeholder="Nhập họ và tên"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-semibold text-on-surface mb-2">
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      id="phoneNumber"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/50 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-outline"
                      placeholder="Nhập số điện thoại"
                    />
                  </div>
                </div>

                <div className="pt-6 flex justify-end gap-3 border-t border-outline-variant/30 mt-8">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-full text-sm font-semibold bg-primary text-on-primary hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                        Đang lưu...
                      </>
                    ) : (
                      'Lưu thay đổi'
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ============================== */}
          {/* TAB 2: BẢO MẬT & MẬT KHẨU */}
          {/* ============================== */}
          {activeTab === 'security' && (
            <div className="max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-8">
                <h2 className="text-xl font-bold text-on-surface">
                  {user?.hasPassword ? 'Đổi mật khẩu' : 'Tạo mật khẩu'}
                </h2>
                <p className="text-sm text-on-surface-variant mt-1">
                  {user?.hasPassword 
                    ? 'Bảo vệ tài khoản của bạn bằng cách sử dụng mật khẩu mạnh.' 
                    : 'Thiết lập mật khẩu để có thể đăng nhập bằng Email ngoài việc dùng Google.'}
                </p>
              </div>

              {passwordError && (
                <div className="mb-6 p-4 bg-error-container/20 border border-error/30 rounded-xl text-error text-sm flex items-start gap-3">
                  <span className="material-symbols-outlined text-[20px] shrink-0">error</span>
                  <p>{passwordError}</p>
                </div>
              )}

              {passwordSuccess && (
                <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-green-600 dark:text-green-400 text-sm flex items-start gap-3">
                  <span className="material-symbols-outlined text-[20px] shrink-0">check_circle</span>
                  <p>{passwordSuccess}</p>
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} className="space-y-5">
                {user?.hasPassword && (
                  <div className="mb-6 pb-6 border-b border-outline-variant/30">
                    <label htmlFor="currentPassword" className="block text-sm font-semibold text-on-surface mb-2">
                      Mật khẩu hiện tại
                    </label>
                    <input
                      type="password"
                      id="currentPassword"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/50 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-outline"
                      placeholder="Nhập mật khẩu bạn đang sử dụng"
                      required
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-semibold text-on-surface mb-2">
                    Mật khẩu mới
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/50 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-outline"
                    placeholder="Mật khẩu mới"
                    required
                  />
                  <ul className="mt-2 text-[11px] text-on-surface-variant space-y-1 ml-1 list-disc pl-4">
                    <li>Ít nhất 8 ký tự</li>
                    <li>Bao gồm chữ hoa, chữ thường và số</li>
                    <li>Có ít nhất 1 ký tự đặc biệt (VD: @, $, !)</li>
                  </ul>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-on-surface mb-2">
                    Xác nhận mật khẩu
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant/50 rounded-xl text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-outline"
                    placeholder="Nhập lại mật khẩu mới"
                    required
                  />
                </div>

                <div className="pt-6 mt-6">
                  <button
                    type="submit"
                    disabled={isSubmittingPassword || (user?.hasPassword ? !currentPassword : false) || !newPassword || !confirmPassword}
                    className="w-full md:w-auto px-8 py-3 rounded-full text-sm font-semibold bg-primary text-on-primary hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                  >
                    {isSubmittingPassword ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                        Đang xử lý...
                      </>
                    ) : (
                      user?.hasPassword ? 'Đổi mật khẩu' : 'Tạo mật khẩu'
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
