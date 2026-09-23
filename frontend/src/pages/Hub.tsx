import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import logoImg from '../assets/Logo_KBase.png';
import type { Project } from '../types/project';
import { projectService } from '../services/projectService';
import CreateProjectModal from '../components/CreateProjectModal';
import ProjectSettingsModal from '../components/ProjectSettingsModal';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';

const Hub: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [dropdownOpenId, setDropdownOpenId] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'MINE' | 'SHARED'>('ALL');

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setDropdownOpenId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const data = await projectService.getMyProjects();
      setProjects(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Không thể tải danh sách dự án. Vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
  };

  const filteredProjects = projects.filter(project => {
    // Standard tab filter when not searching
    let matchesTab = true;
    if (activeTab === 'MINE') {
      matchesTab = project.ownerId === user?.userId;
    } else if (activeTab === 'SHARED') {
      matchesTab = project.ownerId !== user?.userId;
    }
    return matchesTab;
  });

  const searchResults = projects.filter(project => {
    return project.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
           (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()));
  });

  const myProjectsMatch = searchResults.filter(p => p.ownerId === user?.userId);
  const sharedProjectsMatch = searchResults.filter(p => p.ownerId !== user?.userId);

  const renderProjectGrid = (projectList: Project[]) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
      {projectList.map((project) => (
        <article 
          key={project.id} 
          onClick={() => navigate(`/projects/${project.id}`)}
          className="group relative bg-surface-container-lowest hover:bg-surface-container-lowest/80 border border-outline-variant/30 rounded-2xl p-5 flex flex-col justify-between min-h-[220px] cursor-pointer shadow-sm hover:shadow-md transition-all duration-300"
        >
          <div>
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xl font-bold font-display shadow-xs">
                {project.name.charAt(0).toUpperCase()}
              </div>
              <div className="relative">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setDropdownOpenId(dropdownOpenId === project.id ? null : project.id);
                  }}
                  className="text-outline hover:text-on-surface p-1 rounded-md transition-colors opacity-0 group-hover:opacity-100" 
                  title="Tùy chọn khác"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="5" r="1.5"></circle>
                    <circle cx="12" cy="12" r="1.5"></circle>
                    <circle cx="12" cy="19" r="1.5"></circle>
                  </svg>
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {dropdownOpenId === project.id && (
                    <motion.div
                      key="dropdown-menu"
                      initial={{ opacity: 0, scale: 0.95, y: -5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -5 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-1 w-36 bg-surface-container-lowest border border-outline-variant/30 rounded-md shadow-lg py-1.5 z-10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => {
                          setSelectedProject(project);
                          setIsSettingsModalOpen(true);
                          setDropdownOpenId(null);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-on-surface hover:bg-surface-container transition-colors flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[18px]">settings</span>
                        Cài đặt
                      </button>
                      <button
                        onClick={() => {
                          setSelectedProject(project);
                          setIsDeleteModalOpen(true);
                          setDropdownOpenId(null);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-error hover:bg-error-container/20 transition-colors flex items-center gap-2"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                        Xóa dự án
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <h3 className="font-bold text-on-surface text-[17px] leading-snug line-clamp-2 mb-2 font-display flex items-center gap-2">
              {project.name}
              {project.isPublic && (
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant" title="Công khai">public</span>
              )}
            </h3>
            {project.description && (
              <p className="text-sm text-on-surface-variant line-clamp-2">
                {project.description}
              </p>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-outline-variant/20 flex flex-col gap-2">
            <div className="flex items-center justify-between text-[11px] text-on-surface-variant font-medium">
              <span>Đã dùng: {formatBytes(project.usedStorageBytes)}</span>
              <span>Tối đa: {formatBytes(project.storageQuotaBytes)}</span>
            </div>
            <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary rounded-full transition-all" 
                style={{ width: `${Math.min(100, (project.usedStorageBytes / project.storageQuotaBytes) * 100)}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-xs text-on-surface-variant font-medium mt-1">
              <span>Tạo: {formatDate(project.createdAt)}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${project.ownerId === user?.userId ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'}`}>
                {project.ownerId === user?.userId ? 'Owner' : 'Shared'}
              </span>
            </div>
          </div>
        </article>
      ))}
    </div>
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-5 min-h-[200px] flex flex-col justify-between animate-pulse shadow-sm">
              <div>
                <div className="w-12 h-12 bg-surface-container rounded-xl mb-4"></div>
                <div className="h-5 bg-surface-container rounded w-3/4 mb-3"></div>
                <div className="h-4 bg-surface-container rounded w-full mb-2"></div>
                <div className="h-4 bg-surface-container rounded w-5/6"></div>
              </div>
              <div className="pt-4 mt-4 border-t border-outline-variant/20">
                <div className="h-3 bg-surface-container rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (searchQuery) {
      if (searchResults.length === 0) {
        return (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-surface-container-lowest rounded-3xl border border-outline-variant/30 border-dashed">
            <span className="material-symbols-outlined text-5xl mb-4 text-outline-variant">search_off</span>
            <h3 className="text-lg font-bold text-on-surface mb-2">Không tìm thấy kết quả nào</h3>
            <p className="text-on-surface-variant text-sm max-w-md mx-auto">
              Không có dự án nào khớp với từ khóa "{searchQuery}".
            </p>
          </div>
        );
      }

      return (
        <div className="flex flex-col gap-10">
          {myProjectsMatch.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
                Dự án của tôi <span className="bg-primary-container text-white text-xs px-2 py-0.5 rounded-full">{myProjectsMatch.length}</span>
              </h3>
              {renderProjectGrid(myProjectsMatch)}
            </div>
          )}
          {sharedProjectsMatch.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
                Được chia sẻ với tôi <span className="bg-secondary text-white text-xs px-2 py-0.5 rounded-full">{sharedProjectsMatch.length}</span>
              </h3>
              {renderProjectGrid(sharedProjectsMatch)}
            </div>
          )}
        </div>
      );
    }

    if (filteredProjects.length === 0 && !error) {
      if (activeTab !== 'ALL') {
        return (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-surface-container-lowest rounded-3xl border border-outline-variant/30 border-dashed">
            <span className="material-symbols-outlined text-5xl mb-4 text-outline-variant">folder_off</span>
            <h3 className="text-lg font-bold text-on-surface mb-2">Không có dự án nào</h3>
            <p className="text-on-surface-variant text-sm max-w-md mx-auto">
              Bạn chưa có dự án nào trong mục này.
            </p>
          </div>
        );
      }

      // Default empty state
      return (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-surface-container-lowest rounded-3xl border border-outline-variant/30 border-dashed">
          <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-4xl">folder_open</span>
          </div>
          <h3 className="text-xl font-bold text-on-surface mb-2">Bạn chưa có dự án nào</h3>
          <p className="text-on-surface-variant max-w-md mx-auto mb-8 text-sm">
            Tạo không gian làm việc đầu tiên của bạn để bắt đầu lưu trữ tài liệu, quản lý tri thức và chia sẻ cùng đội ngũ.
          </p>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-primary-container hover:bg-blue-700 rounded-full shadow-sm hover:shadow-md transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
            </svg>
            <span>Tạo dự án ngay</span>
          </button>
        </div>
      );
    }

    return renderProjectGrid(filteredProjects);
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col font-sans">

      {/* Header */}
      <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur-md border-b border-outline-variant/30 px-6 py-3.5 transition-all shadow-sm">
        <div className="max-w-[1720px] mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src={logoImg} alt="KBase Logo" className="w-9 h-auto object-contain" />
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-on-surface">KBase</span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-surface-container-low text-on-surface-variant border border-outline-variant/30 hidden sm:inline-block">Hub Tri thức</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center flex-1 max-w-lg mx-8">
            <div className="relative w-full">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-outline">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                </svg>
              </span>
              <input 
                className="w-full pl-10 pr-4 py-2 text-sm bg-surface-container-lowest border border-outline-variant/50 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-outline shadow-sm" 
                placeholder="Tìm kiếm dự án, mô tả..." 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group cursor-pointer" title={user?.email || "User Profile"}>
              <div className="w-9 h-9 rounded-full ring-2 ring-primary/20 overflow-hidden bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-surface"></span>
            </div>

            <button
              onClick={toggleTheme}
              className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary-container/20 rounded-full transition-colors flex items-center justify-center"
              title="Giao diện sáng/tối"
            >
              <span className="material-symbols-outlined text-[20px]">
                {isDark ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            <button 
              onClick={handleLogout}
              className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container/20 rounded-full transition-colors flex items-center justify-center" 
              title="Đăng xuất"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <motion.main initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }} className="flex-1 max-w-[1720px] w-full mx-auto px-6 py-8">
        {/* Actions Bar */}
        {!searchQuery && (
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
            <nav aria-label="Tabs" className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
              <button 
                onClick={() => setActiveTab('ALL')}
                className={`px-4 py-2 rounded-full text-sm transition-all whitespace-nowrap ${activeTab === 'ALL' ? 'font-semibold bg-primary-container text-white shadow-sm' : 'font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container'}`}
              >
                Tất cả dự án
              </button>
              <button 
                onClick={() => setActiveTab('MINE')}
                className={`px-4 py-2 rounded-full text-sm transition-all whitespace-nowrap ${activeTab === 'MINE' ? 'font-semibold bg-primary-container text-white shadow-sm' : 'font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container'}`}
              >
                Dự án của tôi
              </button>
              <button 
                onClick={() => setActiveTab('SHARED')}
                className={`px-4 py-2 rounded-full text-sm transition-all whitespace-nowrap ${activeTab === 'SHARED' ? 'font-semibold bg-primary-container text-white shadow-sm' : 'font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container'}`}
              >
                Được chia sẻ với tôi
              </button>
            </nav>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-primary-container hover:bg-blue-700 rounded-full shadow-sm hover:shadow-md transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
                </svg>
                <span>Dự án mới</span>
              </button>
            </div>
          </div>
        )}

        {/* Section Title */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-on-surface tracking-tight">
            {searchQuery 
              ? `Kết quả tìm kiếm cho "${searchQuery}"` 
              : activeTab === 'ALL' ? 'Tất cả dự án' : activeTab === 'MINE' ? 'Dự án của tôi' : 'Được chia sẻ với tôi'}
          </h2>
          <div className="text-sm text-on-surface-variant">
            Tìm thấy <span className="font-semibold text-on-surface">{searchQuery ? searchResults.length : filteredProjects.length}</span> dự án
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-8 p-4 bg-error-container/20 text-error rounded-xl border border-error/20 flex items-center gap-3">
            <span className="material-symbols-outlined">error</span>
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Content Grid */}
        {renderContent()}
      </motion.main>

      <footer className="mt-auto border-t border-outline-variant/30 bg-surface-container-lowest py-1 px-6 text-xs text-on-surface-variant">
        <div className="max-w-[1720px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-medium">
            <span className="font-bold text-on-surface">KBase Hub</span>
            <span>•</span>
            <span>Phiên bản 2.4.0</span>
          </div>
          <div className="flex items-center gap-5">
            <a className="hover:text-primary transition-colors font-medium" href="#">Tài liệu</a>
            <a className="hover:text-primary transition-colors font-medium" href="#">Bảo mật</a>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={loadProjects}
      />
      <ProjectSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onSuccess={loadProjects}
        project={selectedProject}
      />
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={loadProjects}
        project={selectedProject}
      />
    </div>
  );
};

export default Hub;
