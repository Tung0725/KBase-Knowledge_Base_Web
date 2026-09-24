import React, { useState } from 'react';
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import logoImg from '../assets/Logo_KBase.png';
import type { ProjectOverviewResponse } from '../types/project';

interface ProjectLayoutProps {
  children: React.ReactNode;
  projectName?: string;
  overview?: ProjectOverviewResponse | null;
}

const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const ProjectLayout: React.FC<ProjectLayoutProps> = ({ children, projectName = 'Đang tải...', overview }) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { projectId } = useParams<{ projectId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Persist sidebar state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });

  const toggleSidebar = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', String(newState));
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const isAdminRoute = location.pathname.startsWith('/admin/');
  const basePath = isAdminRoute ? `/admin/projects/${projectId}` : `/projects/${projectId}`;

  const navItems = [
    { id: 'overview', label: 'Tổng quan', icon: 'dashboard', path: `${basePath}` },
    { id: 'documents', label: 'Tài liệu', icon: 'description', path: `${basePath}/documents` },
    { id: 'members', label: 'Thành viên', icon: 'group', path: `${basePath}/members` },
    { id: 'settings', label: 'Cài đặt', icon: 'settings', path: `${basePath}/settings` },
  ];

  return (
    <div className="flex h-screen bg-surface text-on-surface font-sans overflow-hidden">
      
      {/* Sidebar */}
      <aside className={`bg-surface-container-lowest border-r border-outline-variant/30 flex flex-col transition-all duration-300 flex-shrink-0 z-20 ${isSidebarCollapsed ? 'w-[72px]' : 'w-64'}`}>
        <div className={`h-14 shrink-0 flex items-center border-b border-outline-variant/30 ${isSidebarCollapsed ? 'justify-center px-0' : 'px-6'}`}>
          <Link to={isAdminRoute ? "/admin/projects" : "/hub"} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src={logoImg} alt="KBase Logo" className="w-8 h-auto object-contain shrink-0" />
            {!isSidebarCollapsed && <span className="text-xl font-bold tracking-tight text-on-surface">KBase</span>}
          </Link>
        </div>
        
        <div className={`p-4 flex flex-col h-full overflow-y-auto ${isSidebarCollapsed ? 'px-2' : ''} overflow-x-hidden`}>
          {/* Project Info */}
          {!isSidebarCollapsed && (
            <div className="mb-6 px-2">
              <div className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Dự án</div>
              <h2 className="font-bold text-on-surface text-lg leading-tight line-clamp-2">{projectName}</h2>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 flex flex-col gap-1 mt-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (item.id === 'overview' && location.pathname === `${basePath}/`);
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  title={isSidebarCollapsed ? item.label : undefined}
                  className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-xl transition-all font-medium text-sm ${
                    isActive 
                      ? 'bg-primary-container/30 text-primary font-bold' 
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`}
                >
                  <span className={`material-symbols-outlined text-[20px] ${isActive ? 'filled' : ''}`}>
                    {item.icon}
                  </span>
                  {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Quota Widget */}
          {isSidebarCollapsed ? (
            <div 
              className="mt-auto flex flex-col items-center justify-center py-4 text-on-surface-variant hover:text-primary transition-colors cursor-help shrink-0" 
              title={`Lưu trữ: ${overview ? formatBytes(overview.usedStorageBytes) : '...'}`}
            >
              <span className="material-symbols-outlined">cloud</span>
              {overview && (
                <span className="text-[10px] font-bold mt-1 text-primary">
                  {Math.round((overview.usedStorageBytes / overview.storageQuotaBytes) * 100)}%
                </span>
              )}
            </div>
          ) : (
            <div className="mt-auto bg-surface-container-low rounded-2xl p-4 border border-outline-variant/30 shrink-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-on-surface-variant">Lưu trữ</span>
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant">cloud</span>
              </div>
              <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden mb-1.5">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-500" 
                  style={{ width: overview ? `${Math.min(100, (overview.usedStorageBytes / overview.storageQuotaBytes) * 100)}%` : '0%' }}
                ></div>
              </div>
              <div className="text-[11px] text-on-surface-variant font-medium">
                {overview 
                  ? `${formatBytes(overview.usedStorageBytes)} / ${formatBytes(overview.storageQuotaBytes)}`
                  : 'Đang tính toán...'}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-surface">
        {/* Header */}
        <header className="h-14 shrink-0 bg-surface/95 backdrop-blur-md border-b border-outline-variant/30 flex items-center justify-between px-6 z-10">
          
          {/* Breadcrumb / Global Search */}
          <div className="flex items-center gap-4 flex-1">
            <button 
              onClick={toggleSidebar} 
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container hover:text-primary text-on-surface-variant transition-colors"
              title={isSidebarCollapsed ? "Mở rộng menu" : "Thu gọn menu"}
            >
              <span className="material-symbols-outlined text-[20px]">
                {isSidebarCollapsed ? 'right_panel_open' : 'left_panel_close'}
              </span>
            </button>

            <div className="flex items-center text-sm font-medium text-on-surface-variant">
              {isAdminRoute ? (
                <Link to="/admin/projects" className="hover:text-primary transition-colors">Admin</Link>
              ) : (
                <Link to="/hub" className="hover:text-primary transition-colors">Hub</Link>
              )}
              <span className="material-symbols-outlined text-[18px] mx-1">chevron_right</span>
              <span className="text-on-surface font-semibold max-w-[200px] truncate">{projectName}</span>
            </div>

            <div className="hidden md:block relative w-64 ml-8">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-outline">
                <span className="material-symbols-outlined text-[18px]">search</span>
              </span>
              <input 
                className="w-full pl-9 pr-4 py-1.5 text-sm bg-surface-container-lowest border border-outline-variant/50 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-outline shadow-sm" 
                placeholder="Tìm kiếm nội dung..." 
                type="text" 
              />
            </div>
          </div>

          {/* User Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors"
              title="Giao diện sáng/tối"
            >
              <span className="material-symbols-outlined text-[20px]">
                {isDark ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            <Link to="/profile" className="flex items-center gap-3 bg-surface-container-lowest px-2 py-1 rounded-full border border-outline-variant/30 hover:bg-surface-container transition-colors" title={user?.email || "User Profile"}>
              <span className="text-sm font-medium text-on-surface-variant hidden md:block pl-2">{user?.email}</span>
              <div className="w-7 h-7 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
            </Link>

            <button 
              onClick={handleLogout}
              className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-error-container/20 hover:text-error transition-colors ml-1" 
              title="Đăng xuất"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 md:p-4">
          <div className="max-w-[1400px] mx-auto w-full h-full">
            {children}
          </div>
        </main>
      </div>

    </div>
  );
};

export default ProjectLayout;
