import React, { useEffect, useState } from 'react';
import { adminService, type AdminDashboardStats } from '../../services/adminService';
import { Link } from 'react-router-dom';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminService.getStats();
        setStats(data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Lỗi khi tải dữ liệu thống kê');
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((n) => (
          <div key={n} className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-6 min-h-[160px] flex flex-col justify-between animate-pulse shadow-sm">
            <div className="h-4 bg-surface-container rounded w-1/2 mb-4"></div>
            <div className="h-10 bg-surface-container rounded w-1/3 mb-4"></div>
            <div className="h-3 bg-surface-container rounded w-1/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-8 p-4 bg-error-container/20 text-error rounded-xl border border-error/20 flex items-center gap-3">
        <span className="material-symbols-outlined">error</span>
        <p className="text-sm font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Users Card */}
        <div className="group bg-surface-container-lowest hover:bg-surface-container-lowest/80 border border-outline-variant/30 rounded-2xl p-6 flex flex-col shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold text-sm text-on-surface-variant uppercase tracking-wider">Người dùng</span>
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined">group</span>
            </div>
          </div>
          <span className="text-4xl font-bold tracking-tight text-on-surface mb-6">{stats?.totalUsers || 0}</span>
          <Link to="/admin/users" className="mt-auto text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1 group-hover:gap-2 transition-all">
            Quản lý chi tiết <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        </div>

        {/* Projects Card */}
        <div className="group bg-surface-container-lowest hover:bg-surface-container-lowest/80 border border-outline-variant/30 rounded-2xl p-6 flex flex-col shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold text-sm text-on-surface-variant uppercase tracking-wider">Dự án</span>
            <div className="w-10 h-10 rounded-full bg-secondary/10 text-secondary flex items-center justify-center">
              <span className="material-symbols-outlined">folder</span>
            </div>
          </div>
          <span className="text-4xl font-bold tracking-tight text-on-surface mb-6">{stats?.totalProjects || 0}</span>
          <Link to="/admin/projects" className="mt-auto text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1 group-hover:gap-2 transition-all">
            Quản lý chi tiết <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        </div>

        {/* Storage Card */}
        <div className="group bg-surface-container-lowest hover:bg-surface-container-lowest/80 border border-outline-variant/30 rounded-2xl p-6 flex flex-col shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold text-sm text-on-surface-variant uppercase tracking-wider">Lưu trữ</span>
            <div className="w-10 h-10 rounded-full bg-tertiary/10 text-tertiary flex items-center justify-center">
              <span className="material-symbols-outlined">cloud</span>
            </div>
          </div>
          <span className="text-4xl font-bold tracking-tight text-on-surface mb-6">{formatBytes(stats?.totalStorageUsedBytes || 0)}</span>
          <span className="mt-auto text-sm font-medium text-on-surface-variant">Tổng dung lượng đã sử dụng</span>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
