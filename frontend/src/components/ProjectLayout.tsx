import React from 'react';
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import logoImg from '../assets/Logo_KBase.png';

interface ProjectLayoutProps {
  children: React.ReactNode;
  projectName?: string;
}

const ProjectLayout: React.FC<ProjectLayoutProps> = ({ children, projectName = 'Đang tải...' }) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { projectId } = useParams<{ projectId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const navItems = [
    { id: 'overview', label: 'Tổng quan', icon: 'dashboard', path: `/projects/${projectId}` },
    { id: 'documents', label: 'Tài liệu', icon: 'description', path: `/projects/${projectId}/documents` },
    { id: 'members', label: 'Thành viên', icon: 'group', path: `/projects/${projectId}/members` },
    { id: 'settings', label: 'Cài đặt', icon: 'settings', path: `/projects/${projectId}/settings` },
  ];

  return (
    <div className="flex h-screen bg-surface text-on-surface font-sans overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-64 bg-surface-container-lowest border-r border-outline-variant/30 flex flex-col transition-all flex-shrink-0 z-20">
        <div className="h-16 flex items-center px-6 border-b border-outline-variant/30">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src={logoImg} alt="KBase Logo" className="w-8 h-auto object-contain" />
            <span className="text-xl font-bold tracking-tight text-on-surface">KBase</span>
          </Link>
        </div>
        
        <div className="p-4 flex flex-col h-full overflow-y-auto">
          {/* Project Info */}
          <div className="mb-6 px-2">
            <div className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Dự án</div>
            <h2 className="font-bold text-on-surface text-lg leading-tight line-clamp-2">{projectName}</h2>
          </div>

          {/* Navigation */}
          <nav className="flex-1 flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (item.id === 'overview' && location.pathname === `/projects/${projectId}/`);
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium text-sm ${
                    isActive 
                      ? 'bg-primary-container/30 text-primary font-bold' 
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                  }`}
                >
                  <span className={`material-symbols-outlined text-[20px] ${isActive ? 'filled' : ''}`}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Quota Widget (Mock for now) */}
          <div className="mt-auto bg-surface-container-low rounded-2xl p-4 border border-outline-variant/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-on-surface-variant">Lưu trữ</span>
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">cloud</span>
            </div>
            <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden mb-1.5">
              <div className="h-full bg-primary rounded-full" style={{ width: '0%' }}></div>
            </div>
            <div className="text-[11px] text-on-surface-variant font-medium">
              Đang tính toán...
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-surface">
        {/* Header */}
        <header className="h-16 bg-surface/95 backdrop-blur-md border-b border-outline-variant/30 flex items-center justify-between px-6 z-10">
          
          {/* Breadcrumb / Global Search */}
          <div className="flex items-center gap-4 flex-1">
            <div className="flex items-center text-sm font-medium text-on-surface-variant">
              <Link to="/hub" className="hover:text-primary transition-colors">Hub</Link>
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

            <div className="relative group cursor-pointer" title={user?.email || "User Profile"}>
              <div className="w-8 h-8 rounded-full ring-2 ring-primary/20 overflow-hidden bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-surface"></span>
            </div>

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
        <main className="flex-1 overflow-auto p-6 md:p-8">
          <div className="max-w-[1400px] mx-auto w-full h-full">
            {children}
          </div>
        </main>
      </div>

    </div>
  );
};

export default ProjectLayout;
