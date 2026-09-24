import React, { useEffect, useState } from 'react';
import { adminService, type AdminProject } from '../../services/adminService';
import { Link } from 'react-router-dom';

const AdminProjects: React.FC = () => {
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search and Filter states
  const [search, setSearch] = useState('');
  const [isPublicFilter, setIsPublicFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 30;

  // Quota Modal states
  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedQuotaGB, setSelectedQuotaGB] = useState<number>(1);
  const [quotaError, setQuotaError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProjects();
    }, 500);
    return () => clearTimeout(timer);
  }, [search, isPublicFilter, sortBy, currentPage]);

  const fetchProjects = async () => {
    try {
      setIsLoading(true);
      const isPublicParam = isPublicFilter === '' ? undefined : isPublicFilter === 'true';
      const data = await adminService.getProjects(search, isPublicParam, currentPage, pageSize, sortBy);
      setProjects(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi khi tải danh sách dự án');
    } finally {
      setIsLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    });
  };

  const handleToggleStatus = async (projectId: string, currentStatus: boolean) => {
    try {
      await adminService.updateProjectStatus(projectId, !currentStatus);
      fetchProjects();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi khi cập nhật trạng thái');
    }
  };

  const openQuotaModal = (projectId: string, currentQuotaBytes: number) => {
    setSelectedProjectId(projectId);
    const currentGB = Math.max(1, Math.min(10, Math.ceil(currentQuotaBytes / (1024 * 1024 * 1024))));
    setSelectedQuotaGB(currentGB);
    setQuotaError(null);
    setIsQuotaModalOpen(true);
  };

  const handleSaveQuota = async () => {
    if (!selectedProjectId) return;
    try {
      const bytes = selectedQuotaGB * 1024 * 1024 * 1024;
      await adminService.updateProjectQuota(selectedProjectId, bytes);
      setIsQuotaModalOpen(false);
      fetchProjects();
    } catch (err: any) {
      setQuotaError(err.response?.data?.message || 'Lỗi khi cập nhật quota');
    }
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
              placeholder="Tìm kiếm dự án (tên, mô tả, email tác giả)..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(0); }}
              className="w-full pl-10 pr-4 py-2 text-sm bg-surface-container-lowest border border-outline-variant/50 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
            />
          </div>
          <div className="w-48 relative">
            <select
              value={isPublicFilter}
              onChange={(e) => { setIsPublicFilter(e.target.value); setCurrentPage(0); }}
              className="w-full appearance-none bg-surface-container-lowest border border-outline-variant/50 px-4 py-2 pr-10 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="true">Công khai (Public)</option>
              <option value="false">Nội bộ (Private)</option>
            </select>
            <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-outline">
              <span className="material-symbols-outlined text-[18px]">expand_more</span>
            </span>
          </div>
          <div className="w-56 relative">
            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setCurrentPage(0); }}
              className="w-full appearance-none bg-surface-container-lowest border border-outline-variant/50 px-4 py-2 pr-10 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
            >
              <option value="createdAt">Mặc định (Ngày tạo)</option>
              <option value="usedStorageBytes">Dung lượng giảm dần</option>
            </select>
            <span className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-outline">
              <span className="material-symbols-outlined text-[18px]">sort</span>
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-error-container/20 text-error rounded-xl border border-error/20 flex items-center gap-3">
          <span className="material-symbols-outlined">error</span>
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 overflow-hidden shadow-sm">
        {isLoading && projects.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-on-surface-variant">
            <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4"></div>
            <p className="text-sm">Đang tải danh sách dự án...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <span className="material-symbols-outlined text-5xl mb-4 text-outline-variant">folder_off</span>
            <h3 className="text-lg font-bold text-on-surface mb-2">Không tìm thấy dự án</h3>
            <p className="text-on-surface-variant text-sm max-w-md mx-auto">
              Không có dữ liệu nào khớp với điều kiện tìm kiếm của bạn.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container/30 border-b border-outline-variant/30">
                  <th className="px-4 py-3 text-sm font-semibold text-on-surface-variant uppercase tracking-wider">Tên dự án</th>
                  <th className="px-4 py-3 text-sm font-semibold text-on-surface-variant uppercase tracking-wider">Tác giả</th>
                  <th className="px-4 py-3 text-sm font-semibold text-on-surface-variant uppercase tracking-wider text-center">Thành viên</th>
                  <th className="px-4 py-3 text-sm font-semibold text-on-surface-variant uppercase tracking-wider text-center min-w-[200px]">Lưu trữ</th>
                  <th className="px-4 py-3 text-sm font-semibold text-on-surface-variant uppercase tracking-wider text-center">Ngày tạo</th>
                  <th className="px-4 py-3 text-sm font-semibold text-on-surface-variant uppercase tracking-wider text-center">Trạng thái</th>
                  <th className="px-4 py-3 text-sm font-semibold text-on-surface-variant uppercase tracking-wider text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {projects.map(p => {
                  return (
                    <tr key={p.id} className="hover:bg-surface-container-low/50 transition-colors group">
                      <td className="px-4 py-2">
                        <div>
                          <div className="font-bold text-sm text-on-surface">{p.name}</div>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-sm text-on-surface-variant">{p.ownerEmail}</td>
                      <td className="px-4 py-2 text-sm font-semibold text-on-surface text-center">{p.membersCount}</td>
                      <td className="px-4 py-2 text-center text-sm">
                        <span className="font-medium text-on-surface">{formatBytes(p.usedStorageBytes)}</span>
                        <span className="text-on-surface-variant mx-1">/</span>
                        <span className="text-on-surface-variant">{formatBytes(p.storageQuotaBytes)}</span>
                      </td>
                      <td className="px-4 py-2 text-center text-sm text-on-surface-variant">{formatDate(p.createdAt)}</td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => handleToggleStatus(p.id, p.isPublic)}
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 transition-colors ${
                            p.isPublic 
                              ? 'bg-secondary/10 text-secondary hover:bg-secondary/20' 
                              : 'bg-surface-container-high text-on-surface hover:bg-surface-container-highest'
                          }`}
                          title="Bấm để đổi trạng thái"
                        >
                          <span className="material-symbols-outlined text-[14px]">
                            {p.isPublic ? 'public' : 'lock'}
                          </span>
                          {p.isPublic ? 'Public' : 'Private'}
                        </button>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openQuotaModal(p.id, p.storageQuotaBytes)}
                            className="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            title="Đổi dung lượng (Quota)"
                          >
                            <span className="material-symbols-outlined text-[18px]">hard_drive</span>
                          </button>
                          <Link
                            to={`/admin/projects/${p.id}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
                          >
                            Truy cập <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-outline-variant/30 flex items-center justify-between bg-surface-container-lowest/50">
            <span className="text-sm text-on-surface-variant">
              Hiển thị <span className="font-semibold text-on-surface">{projects.length}</span> trên tổng số <span className="font-semibold text-on-surface">{totalElements}</span> dự án
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                disabled={currentPage === 0}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container text-on-surface-variant disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_left</span>
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, idx) => {
                  if (
                    idx === 0 || 
                    idx === totalPages - 1 || 
                    (idx >= currentPage - 1 && idx <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={idx}
                        onClick={() => setCurrentPage(idx)}
                        className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium transition-colors ${
                          currentPage === idx 
                            ? 'bg-primary text-on-primary' 
                            : 'hover:bg-surface-container text-on-surface-variant'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  }
                  if (idx === currentPage - 2 || idx === currentPage + 2) {
                    return <span key={idx} className="text-on-surface-variant px-1">...</span>;
                  }
                  return null;
                })}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                disabled={currentPage === totalPages - 1}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container text-on-surface-variant disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quota Modal */}
      {isQuotaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-scrim/50 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl p-6 w-full max-w-md shadow-xl border border-outline-variant/30 flex flex-col">
            <h3 className="text-xl font-bold text-on-surface mb-4">Cập nhật dung lượng dự án</h3>
            
            {quotaError && (
              <div className="mb-4 p-3 bg-error-container/20 text-error rounded-lg text-sm border border-error/20">
                {quotaError}
              </div>
            )}
            
            <div className="space-y-4 mb-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-on-surface-variant">Dung lượng Quota</label>
                  <span className="text-lg font-bold text-primary">{selectedQuotaGB} GB</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={selectedQuotaGB}
                  onChange={(e) => setSelectedQuotaGB(parseInt(e.target.value))}
                  className="w-full h-2 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-on-surface-variant mt-1">
                  <span>1 GB</span>
                  <span>10 GB</span>
                </div>
              </div>
              <p className="text-xs text-on-surface-variant bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/30">
                <span className="material-symbols-outlined text-[14px] inline-block align-text-bottom mr-1">info</span>
                Lưu ý: Dung lượng mới được cấp không được nhỏ hơn mức dung lượng mà dự án này đang sử dụng thực tế.
              </p>
            </div>
            
            <div className="flex items-center justify-end gap-3 mt-auto">
              <button
                onClick={() => setIsQuotaModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-on-surface-variant hover:bg-surface-container rounded-full transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveQuota}
                className="px-4 py-2 text-sm font-medium bg-primary text-on-primary hover:bg-primary/90 rounded-full shadow-sm transition-colors"
              >
                Lưu thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProjects;
