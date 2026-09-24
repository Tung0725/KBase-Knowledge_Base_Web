import React, { useEffect, useState } from 'react';
import { adminService, type AdminUser, type AdminProject } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search and Filter states
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');

  // Pagination states
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Transfer Ownership Modal states
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [userToTransferId, setUserToTransferId] = useState<string | null>(null);
  const [sharedProjectsToTransfer, setSharedProjectsToTransfer] = useState<AdminProject[]>([]);
  const [transferEmails, setTransferEmails] = useState<Record<string, string>>({});

  // Form states
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    phoneNumber: '',
    password: '',
    role: 'USER'
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user: currentUser } = useAuth();

  useEffect(() => {
    // Reset page when search, role, status, or sort changes
    setPage(0);
  }, [search, roleFilter, statusFilter, sortBy]);

  useEffect(() => {
    // Debounce fetch when states change
    const timer = setTimeout(() => {
      fetchUsers();
    }, 500);
    return () => clearTimeout(timer);
  }, [search, roleFilter, statusFilter, page, sortBy]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getUsers(search, roleFilter, statusFilter, page, 20, sortBy);
      setUsers(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi khi tải danh sách người dùng');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleLock = async (userId: string, currentLockedStatus: boolean) => {
    if (window.confirm(`Bạn có chắc chắn muốn ${currentLockedStatus ? 'MỞ KHÓA' : 'KHÓA'} tài khoản này?\nTài khoản bị khóa sẽ không thể đăng nhập, nhưng mọi dữ liệu và dự án của họ vẫn được giữ nguyên.`)) {
      // Optimistic update
      setUsers(prev => prev.map(u => u.id.toString() === userId ? { ...u, isLocked: !currentLockedStatus } : u));
      try {
        await adminService.toggleUserStatus(userId);
      } catch (err: any) {
        // Revert on error
        setUsers(prev => prev.map(u => u.id.toString() === userId ? { ...u, isLocked: currentLockedStatus } : u));
        alert(err.response?.data?.message || 'Có lỗi xảy ra');
      }
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('CẢNH BÁO AN TOÀN:\nBạn đang chọn XÓA (vô hiệu hóa) người dùng này.\n\nNgười dùng sẽ không thể đăng nhập nữa. Các dự án cá nhân của họ sẽ bị xóa sạch, nhưng các dự án chung sẽ được giữ nguyên (yêu cầu chuyển giao).\n\nBạn có chắc chắn muốn vô hiệu hóa tài khoản này?')) {
      try {
        const sharedProjects = await adminService.getSharedProjects(userId);
        if (sharedProjects.length > 0) {
          setSharedProjectsToTransfer(sharedProjects);
          setUserToTransferId(userId);
          setIsTransferModalOpen(true);
        } else {
          await adminService.deleteUser(userId);
          fetchUsers();
        }
      } catch (err: any) {
        alert(err.response?.data?.message || 'Có lỗi xảy ra khi kiểm tra dự án chung');
      }
    }
  };

  const handleTransferSingleProject = async (projectId: string) => {
    const email = transferEmails[projectId];
    if (!email) {
      alert('Vui lòng chọn người nhận cho dự án này');
      return;
    }
    
    try {
      await adminService.transferProjectOwner(projectId, email);
      // Remove from the list
      setSharedProjectsToTransfer(prev => prev.filter(p => p.id !== projectId));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi chuyển giao dự án');
    }
  };

  const handleFinalDelete = async () => {
    if (!userToTransferId) return;
    try {
      await adminService.deleteUser(userToTransferId);
      setIsTransferModalOpen(false);
      setUserToTransferId(null);
      fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Lỗi khi xóa người dùng');
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setFormData({ email: '', fullName: '', phoneNumber: '', password: '', role: 'USER' });
    setFormError(null);
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (user: AdminUser) => {
    setModalMode('edit');
    setSelectedUserId(user.id.toString());
    setFormData({ email: user.email, fullName: user.fullName, phoneNumber: user.phoneNumber || '', password: '', role: user.role });
    setFormError(null);
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});
    setIsSubmitting(true);

    try {
      if (modalMode === 'create') {
        if (!formData.password) {
          throw new Error('Vui lòng nhập mật khẩu cho người dùng mới');
        }
        await adminService.createUser(formData);
      } else {
        if (!selectedUserId) return;
        const updatePayload: any = {
          fullName: formData.fullName,
          role: formData.role,
          phoneNumber: formData.phoneNumber
        };
        if (formData.password) {
          updatePayload.password = formData.password;
        }
        await adminService.updateUser(selectedUserId, updatePayload);
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      if (err.response?.data?.data && typeof err.response.data.data === 'object' && Object.keys(err.response.data.data).length > 0) {
        setFieldErrors(err.response.data.data);
      } else {
        setFormError(err.response?.data?.message || err.message || 'Lỗi khi lưu thông tin');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex-1 w-full flex items-center gap-4">
          <div className="relative w-full max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-outline">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
            </span>
            <input
              type="text"
              placeholder="Tìm kiếm theo email, tên..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-surface-container-lowest border border-outline-variant/50 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
            />
          </div>
          <div className="w-48 relative">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full appearance-none bg-surface-container-lowest border border-outline-variant/50 px-4 py-2 pr-10 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
            >
              <option value="">Tất cả vai trò</option>
              <option value="ADMIN">Quản trị viên (ADMIN)</option>
              <option value="OWNER">Chủ sở hữu (OWNER)</option>
              <option value="USER">Người dùng (USER)</option>
            </select>
            <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-outline">
              <span className="material-symbols-outlined text-[18px]">expand_more</span>
            </span>
          </div>
          <div className="w-48 relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full appearance-none bg-surface-container-lowest border border-outline-variant/50 px-4 py-2 pr-10 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="locked">Bị khóa</option>
            </select>
            <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-outline">
              <span className="material-symbols-outlined text-[18px]">expand_more</span>
            </span>
          </div>
          <div className="w-48 relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full appearance-none bg-surface-container-lowest border border-outline-variant/50 px-4 py-2 pr-10 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
            >
              <option value="createdAt">Mới tham gia nhất</option>
              <option value="createdAtAsc">Tham gia cũ nhất</option>
              <option value="updatedAt">Cập nhật gần đây</option>
            </select>
            <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-outline">
              <span className="material-symbols-outlined text-[18px]">sort</span>
            </span>
          </div>
        </div>
        
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-primary-container hover:bg-blue-700 rounded-full shadow-sm hover:shadow-md transition-all shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>Thêm người dùng</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-error-container/20 text-error rounded-xl border border-error/20 flex items-center gap-3">
          <span className="material-symbols-outlined">error</span>
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 overflow-hidden shadow-sm">
        {isLoading && users.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-on-surface-variant">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
            <p className="text-sm">Đang tải danh sách...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <span className="material-symbols-outlined text-5xl mb-4 text-outline-variant">person_off</span>
            <h3 className="text-lg font-bold text-on-surface mb-2">Không tìm thấy người dùng</h3>
            <p className="text-on-surface-variant text-sm max-w-md mx-auto">
              Không có dữ liệu nào khớp với điều kiện tìm kiếm của bạn.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container/30 border-b border-outline-variant/30">
                  <th className="px-6 py-4 text-sm font-semibold text-on-surface-variant uppercase tracking-wider">Họ & Tên</th>
                  <th className="px-6 py-4 text-sm font-semibold text-on-surface-variant uppercase tracking-wider">Email</th>
                  <th className="px-6 py-4 text-sm font-semibold text-on-surface-variant uppercase tracking-wider">Cập nhật</th>
                  <th className="px-6 py-4 text-sm font-semibold text-on-surface-variant uppercase tracking-wider">Vai trò</th>
                  <th className="px-6 py-4 text-sm font-semibold text-on-surface-variant uppercase tracking-wider">Trạng thái</th>
                  <th className="px-6 py-4 text-sm font-semibold text-on-surface-variant uppercase tracking-wider text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-surface-container-low/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                          {u.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-on-surface text-sm">{u.fullName}</div>
                          {u.phoneNumber && <div className="text-xs text-on-surface-variant mt-0.5">{u.phoneNumber}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">
                      <div>{u.email}</div>
                      <div className="text-xs mt-0.5 opacity-70">Tham gia: {formatDate(u.createdAt)}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">
                      {formatDate(u.updatedAt)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        u.role === 'ADMIN' 
                          ? 'bg-primary-container/20 text-primary' 
                          : u.role === 'OWNER' 
                            ? 'bg-secondary/10 text-secondary' 
                            : 'bg-surface-container-high text-on-surface'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${u.isLocked ? 'bg-error-container/20 text-error' : 'bg-secondary/10 text-secondary'}`}>
                        {u.isLocked ? 'Bị khóa' : 'Hoạt động'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {/* Luôn hiển thị nút thay vì chờ hover */}
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(u)}
                          className="p-1.5 text-on-surface-variant hover:text-primary bg-surface-container-low hover:bg-primary/10 rounded-md transition-colors border border-outline-variant/30"
                          title="Sửa"
                        >
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        {currentUser?.userId !== u.id.toString() && (
                          <>
                            <button
                              onClick={() => handleToggleLock(u.id.toString(), u.isLocked)}
                              className={`p-1.5 rounded-md transition-colors border border-outline-variant/30 ${
                                u.isLocked 
                                  ? 'text-secondary bg-surface-container-low hover:bg-secondary/10' 
                                  : 'text-error bg-surface-container-low hover:bg-error/10'
                              }`}
                              title={u.isLocked ? 'Mở khóa' : 'Khóa tài khoản'}
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                {u.isLocked ? 'lock_open' : 'lock'}
                              </span>
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u.id.toString())}
                              className="p-1.5 text-on-surface-variant hover:text-error bg-surface-container-low hover:bg-error/10 rounded-md transition-colors border border-outline-variant/30"
                              title="Xóa (Vô hiệu hóa)"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {!isLoading && users.length > 0 && (
          <div className="px-6 py-4 border-t border-outline-variant/30 flex items-center justify-between bg-surface-container-lowest">
            <div className="text-sm text-on-surface-variant">
              Tổng số <span className="font-semibold text-on-surface">{totalElements}</span> người dùng
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
              </button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-colors ${page === i ? 'bg-primary-container text-white' : 'hover:bg-surface-container text-on-surface-variant'}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transfer Ownership Modal */}
      <AnimatePresence>
        {isTransferModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-surface-container-lowest rounded-3xl w-full max-w-3xl shadow-xl overflow-hidden border border-warning/30"
            >
              <div className="px-6 py-5 border-b border-warning/30 flex justify-between items-center bg-warning-container/30">
                <h2 className="text-xl font-bold tracking-tight text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-warning text-3xl">warning</span>
                  Yêu Cầu Chuyển Giao Chủ Sở Hữu
                </h2>
                <button 
                  onClick={() => { setIsTransferModalOpen(false); setUserToTransferId(null); }} 
                  className="text-on-surface-variant hover:text-on-surface transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                <p className="text-sm text-on-surface">
                  Tài khoản bạn đang xóa hiện là <strong>Chủ sở hữu (Owner) của một hoặc nhiều dự án có các thành viên khác đang tham gia</strong>.
                </p>
                <p className="text-sm text-on-surface-variant">
                  Để bảo vệ dữ liệu chung của nhóm, bạn phải chọn một người khác làm Chủ sở hữu mới cho các dự án này.
                </p>
                
                <div className="bg-surface-container p-4 rounded-xl border border-outline-variant/50 max-h-72 overflow-y-auto">
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-3">Danh sách Dự án cần chuyển giao</label>
                  {sharedProjectsToTransfer.length > 0 ? (
                    <div className="divide-y divide-outline-variant/30">
                      {sharedProjectsToTransfer.map(p => (
                        <div key={p.id} className="flex items-center gap-3 py-2 px-1 hover:bg-surface-container-low transition-colors">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm text-on-surface truncate" title={p.name}>{p.name}</div>
                          </div>
                          <div className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full shrink-0 font-medium">
                            {p.membersCount} Thành viên
                          </div>
                          <div className="w-64 shrink-0 relative">
                            <input
                              type="email"
                              placeholder="Nhập email chủ mới..."
                              value={transferEmails[p.id] || ''}
                              onChange={(e) => setTransferEmails({...transferEmails, [p.id]: e.target.value})}
                              className="w-full bg-surface-container-lowest border border-outline-variant/50 px-3 py-1.5 rounded-md text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                          </div>
                          <button
                            onClick={() => handleTransferSingleProject(p.id)}
                            disabled={!transferEmails[p.id]}
                            className="px-3 py-1.5 text-xs font-semibold bg-primary-container text-white rounded-md hover:bg-blue-700 transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Đổi
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-success font-semibold flex flex-col items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-4xl">check_circle</span>
                      <p>Đã chuyển giao toàn bộ dự án!</p>
                      <p className="text-xs text-on-surface-variant font-normal">Giờ đây bạn đã có thể an tâm xóa tài khoản này.</p>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex flex-col gap-3">
                  <button
                    onClick={handleFinalDelete}
                    disabled={sharedProjectsToTransfer.length > 0}
                    className="w-full px-6 py-3 text-sm font-semibold bg-error-container/20 text-error rounded-xl hover:bg-error-container hover:text-error transition-colors shadow-sm disabled:opacity-50 flex justify-center items-center gap-2 border border-error/30"
                  >
                    Xác nhận Xóa Tài Khoản
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-surface-container-lowest rounded-3xl w-full max-w-md shadow-xl overflow-hidden border border-outline-variant/30"
            >
              <div className="px-6 py-5 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-low/30">
                <h2 className="text-xl font-bold tracking-tight text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">
                    {modalMode === 'create' ? 'person_add' : 'edit_square'}
                  </span>
                  {modalMode === 'create' ? 'Thêm người dùng mới' : 'Chỉnh sửa thông tin'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-on-surface-variant hover:text-on-surface transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {formError && (
                  <div className="p-3 bg-error-container/20 text-error rounded-xl border border-error/20 text-sm flex items-start gap-2">
                    <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
                    <span>{formError}</span>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Email (Đăng nhập) *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      disabled={modalMode === 'edit'}
                      className={`w-full bg-surface border px-4 py-2.5 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50 disabled:bg-surface-container-high ${fieldErrors.email ? 'border-error focus:border-error' : 'border-outline-variant/50 focus:border-primary'}`}
                      required
                    />
                    {fieldErrors.email && (
                      <p className="text-error text-xs mt-1.5 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">error</span>
                        {fieldErrors.email}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Họ & Tên *</label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      className={`w-full bg-surface border px-4 py-2.5 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${fieldErrors.fullName ? 'border-error focus:border-error' : 'border-outline-variant/50 focus:border-primary'}`}
                      required
                    />
                    {fieldErrors.fullName && (
                      <p className="text-error text-xs mt-1.5 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">error</span>
                        {fieldErrors.fullName}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Số điện thoại</label>
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                      className={`w-full bg-surface border px-4 py-2.5 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${fieldErrors.phoneNumber ? 'border-error focus:border-error' : 'border-outline-variant/50 focus:border-primary'}`}
                      placeholder="Không bắt buộc"
                    />
                    {fieldErrors.phoneNumber && (
                      <p className="text-error text-xs mt-1.5 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">error</span>
                        {fieldErrors.phoneNumber}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">
                      {modalMode === 'create' ? 'Mật khẩu *' : 'Mật khẩu mới (Tùy chọn)'}
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      placeholder={modalMode === 'create' ? 'Tối thiểu 8 ký tự, có hoa, thường, số, ký tự đặc biệt' : 'Bỏ trống nếu không muốn đổi mật khẩu'}
                      className={`w-full bg-surface border px-4 py-2.5 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all ${fieldErrors.password ? 'border-error focus:border-error' : 'border-outline-variant/50 focus:border-primary'}`}
                      required={modalMode === 'create'}
                    />
                    {fieldErrors.password && (
                      <p className="text-error text-xs mt-1.5 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">error</span>
                        {fieldErrors.password}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">Vai trò *</label>
                    <div className="relative">
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                        className="w-full appearance-none bg-surface border border-outline-variant/50 px-4 py-2.5 pr-10 rounded-xl text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      >
                        <option value="USER">Người dùng (USER)</option>
                        <option value="OWNER">Chủ sở hữu (OWNER)</option>
                        <option value="ADMIN">Quản trị viên (ADMIN)</option>
                      </select>
                      <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-outline">
                        <span className="material-symbols-outlined text-[18px]">expand_more</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-6 mt-2 border-t border-outline-variant/30 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 text-sm font-semibold text-on-surface-variant hover:bg-surface-container rounded-full transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 text-sm font-semibold bg-primary-container text-white rounded-full hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                        Đang lưu...
                      </>
                    ) : 'Lưu thay đổi'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminUsers;
