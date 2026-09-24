import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import logoImg from '../../assets/Logo_KBase.png';
import { motion, AnimatePresence } from 'framer-motion';

const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('adminSidebarCollapsed');
    return saved === 'true';
  });

  const toggleSidebar = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    localStorage.setItem('adminSidebarCollapsed', String(newState));
  };

  const handleLogout = () => {
    logout();
  };

  const navItems = [
    { name: 'Tổng quan', path: '/admin', icon: 'dashboard' },
    { name: 'Quản lý Người dùng', path: '/admin/users', icon: 'group' },
    { name: 'Quản lý Dự án', path: '/admin/projects', icon: 'folder' },
  ];

  return (
    <div className="min-h-screen bg-surface flex text-on-surface font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className={`bg-surface-container-lowest border-r border-outline-variant/30 flex flex-col z-40 transition-all duration-300 flex-shrink-0 relative ${isSidebarCollapsed ? 'w-[72px]' : 'w-64'}`}>
        <div className={`h-14 shrink-0 flex items-center border-b border-outline-variant/30 ${isSidebarCollapsed ? 'justify-center px-0' : 'px-6'}`}>
          <Link to="/hub" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src={logoImg} alt="KBase Logo" className="w-8 h-auto object-contain shrink-0" />
            {!isSidebarCollapsed && <span className="text-xl font-bold tracking-tight text-on-surface">KBase Admin</span>}
          </Link>
        </div>
        <nav className={`flex-1 flex flex-col gap-1 mt-2 overflow-y-auto ${isSidebarCollapsed ? 'px-2' : 'px-4'} py-2`}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                title={isSidebarCollapsed ? item.name : undefined}
                className={`flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-4'} py-2.5 rounded-xl transition-all font-medium text-sm ${
                  isActive 
                    ? 'bg-primary-container/30 text-primary font-bold' 
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
              >
                <span className={`material-symbols-outlined text-[20px] ${isActive ? 'filled' : ''}`}>{item.icon}</span>
                {!isSidebarCollapsed && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-surface-container-low/30 min-w-0">
        {/* Header */}
        <header className="h-14 shrink-0 bg-surface/95 backdrop-blur-md border-b border-outline-variant/30 flex items-center justify-between px-6 z-30 relative">
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
            <h2 className="text-lg font-bold tracking-tight text-on-surface hidden md:block">
              {navItems.find(i => i.path === location.pathname)?.name || 'Hệ thống Quản trị'}
            </h2>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary-container/20 rounded-full transition-colors flex items-center justify-center"
              title="Giao diện sáng/tối"
            >
              <span className="material-symbols-outlined text-[20px]">
                {isDark ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
            
            <Link to="/profile" className="flex items-center gap-3 bg-surface-container-lowest px-2 py-1 rounded-full border border-outline-variant/30 hover:bg-surface-container transition-colors">
              <span className="text-sm font-medium text-on-surface-variant hidden md:block pl-2">{user?.email}</span>
              <div className="w-7 h-7 rounded-full bg-primary-container text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                {user?.email?.charAt(0).toUpperCase()}
              </div>
            </Link>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-error bg-error-container/10 hover:bg-error-container/30 border border-error/20 rounded-full transition-colors shrink-0"
              title="Đăng xuất"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              
            </button>
          </div>
        </header>

        {/* Page Content */}
        <motion.main 
          key={location.pathname}
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.4, ease: "easeOut" }} 
          className="flex-1 overflow-y-auto p-8"
        >
          <div className="max-w-[1720px] mx-auto">
            <Outlet />
          </div>
        </motion.main>
      </div>
    </div>
  );
};

export default AdminLayout;
