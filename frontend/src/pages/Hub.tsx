import React, { useEffect, useState } from 'react';

const Hub: React.FC = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col font-sans">
      {/* Theme Toggle Button */}
      <button
        onClick={toggleTheme}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-primary-container text-on-primary-container rounded-full shadow-xl flex items-center justify-center hover:scale-105 transition-transform"
        title="Toggle Dark/Light Mode"
      >
        <span className="material-symbols-outlined">
          {isDark ? 'light_mode' : 'dark_mode'}
        </span>
      </button>


      <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur-md border-b border-outline-variant/80 px-6 py-3.5 transition-all">
        <div className="max-w-[1720px] mx-auto flex items-center justify-between">

          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-sm shadow-primary/20 text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-on-surface font-bold">KBase</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-surface-container-low text-on-surface-variant border border-outline-variant/60 hidden sm:inline-block">Hub Tri thức</span>
            </div>
          </div>

          <div className="hidden md:flex items-center flex-1 max-w-lg mx-8">
            <div className="relative w-full">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-outline">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                </svg>
              </span>
              <input className="w-full pl-10 pr-4 py-2 text-sm bg-surface-container-lowest border border-outline-variant rounded-full focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-outline" placeholder="Tìm kiếm dự án, tài liệu, video họp, kiến thức..." type="text" />
            </div>
          </div>

          <div className="flex items-center gap-3">

            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-on-surface-variant hover:text-on-surface font-bold hover:bg-surface-container-low rounded-full transition-colors border border-transparent hover:border-outline-variant">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
              <span className="hidden sm:inline">Cài đặt</span>
            </button>

            <span className="text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-surface-container-low text-on-surface-variant border border-outline-variant">PRO</span>

            <button className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded-full transition-colors" title="Ứng dụng liên kết">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 10c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm12-2c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-6 2c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 6c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-6 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm12 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"></path>
              </svg>
            </button>

            <div className="relative group cursor-pointer">
              <div className="w-9 h-9 rounded-full ring-2 ring-primary/30 overflow-hidden bg-surface-container flex items-center justify-center">
                <span className="text-xs font-semibold text-on-surface">PM</span>
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#f0fdf4] dark:bg-[#166534] dark:bg-surface-container/300 rounded-full border-2 border-white"></span>
            </div>
          </div>
        </div>
      </header>


      <main className="flex-1 max-w-[1720px] w-full mx-auto px-6 py-6">

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">

          <nav aria-label="Tabs" className="flex items-center gap-1.5 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
            <button className="px-4 py-2 rounded-full text-xs font-semibold bg-slate-900 text-white shadow-sm transition-all whitespace-nowrap">
              Tất cả dự án
            </button>
            <button className="px-4 py-2 rounded-full text-xs font-medium text-on-surface-variant hover:text-on-surface font-bold hover:bg-surface-container-low transition-all whitespace-nowrap">
              Sổ ghi chú của tôi
            </button>
            <button className="px-4 py-2 rounded-full text-xs font-medium text-on-surface-variant hover:text-on-surface font-bold hover:bg-surface-container-low transition-all inline-flex items-center gap-1.5 whitespace-nowrap">
              <svg className="w-3.5 h-3.5 text-on-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
              Khám phá
            </button>
            <button className="px-4 py-2 rounded-full text-xs font-medium text-on-surface-variant hover:text-on-surface font-bold hover:bg-surface-container-low transition-all whitespace-nowrap">
              Được chia sẻ với tôi
            </button>
            <button className="px-4 py-2 rounded-full text-xs font-medium text-on-surface-variant hover:text-on-surface font-bold hover:bg-surface-container-low transition-all whitespace-nowrap">
              Tuyển tập & Đóng gói
            </button>
          </nav>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">

            <button className="md:hidden p-2.5 rounded-full bg-surface-container-lowest border border-outline-variant text-on-surface-variant hover:bg-surface-container-lowest">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
            </button>

            <div className="flex items-center bg-surface-container-lowest border border-outline-variant/90 rounded-full p-1 shadow-2xs">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-low text-on-surface font-bold text-xs font-medium transition-all" title="Chế độ lưới">
                <svg className="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
                </svg>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4 4h4v4H4V4zm6 0h4v4h-4V4zm6 0h4v4h-4V4zM4 10h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4zM4 16h4v4H4v-4zm6 0h4v4h-4v-4zm6 0h4v4h-4v-4z"></path>
                </svg>
              </button>
              <button className="p-1.5 rounded-full text-on-surface-variant hover:text-on-surface font-bold transition-colors" title="Chế độ danh sách">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                </svg>
              </button>
            </div>

            <div className="relative">
              <button className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium bg-surface-container-lowest hover:bg-surface-container-lowest border border-outline-variant rounded-full text-on-surface transition-all shadow-2xs">
                <span className="">Gần đây nhất</span>
                <svg className="w-3.5 h-3.5 text-on-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                </svg>
              </button>
            </div>

            <button className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-black rounded-full shadow-sm hover:shadow transition-all">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M12 4v16m8-8H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
              </svg>
              <span className="">Tạo mới</span>
            </button>
          </div>
        </div>


        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <button className="p-1 text-on-surface-variant hover:text-on-surface font-bold rounded-full hover:bg-surface-container/60 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M10 19l-7-7m0 0l7-7m-7 7h18" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
              </svg>
            </button>
            <h2 className="text-lg font-semibold text-on-surface font-bold tracking-tight">Sổ ghi chú & Không gian gần đây</h2>
          </div>

          <div className="text-xs text-on-surface-variant">
            Hiển thị <span className="font-semibold text-on-surface">8</span> không gian hoạt động
          </div>
        </div>


        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">

          <article className="card-transition group relative bg-[#F6EEEC] dark:bg-surface-container hover:bg-[#F2E7E4] dark:bg-surface-container border border-[#E9DFDD] dark:border-outline-variant/20 rounded-2xl p-5 flex flex-col justify-between min-h-[220px] cursor-pointer shadow-xs" data-purpose="workspace-card">
            <div>

              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-surface-container-lowest/70 backdrop-blur-xs flex items-center justify-center text-2xl shadow-xs">
                  📝
                </div>
                <button className="text-outline hover:text-on-surface p-1 rounded-md transition-colors" title="Tùy chọn khác">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="5" r="1.5"></circle>
                    <circle cx="12" cy="12" r="1.5"></circle>
                    <circle cx="12" cy="19" r="1.5"></circle>
                  </svg>
                </button>
              </div>

              <h3 className="font-medium text-on-surface font-bold text-base leading-snug line-clamp-2-custom mb-2">
                FPT Talent Assessment Platform
              </h3>
            </div>

            <div className="pt-4 border-t border-slate-900/5 flex items-center justify-between text-xs text-on-surface-variant font-medium">
              <span className="">19 thg 8, 2026 • 3 nguồn</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface-container-lowest/60 text-on-surface-variant font-normal">Đánh giá</span>
            </div>
          </article>

          <article className="card-transition group relative bg-[#E8F2F3] dark:bg-surface-container hover:bg-[#DDECEE] dark:bg-surface-container border border-[#D5E4E6] dark:border-outline-variant/20 rounded-2xl p-5 flex flex-col justify-between min-h-[220px] cursor-pointer shadow-xs" data-purpose="workspace-card">
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-surface-container-lowest/70 backdrop-blur-xs flex items-center justify-center text-2xl shadow-xs">
                  🏢
                </div>
                <button className="text-outline hover:text-on-surface p-1 rounded-md transition-colors" title="Tùy chọn khác">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="5" r="1.5"></circle>
                    <circle cx="12" cy="12" r="1.5"></circle>
                    <circle cx="12" cy="19" r="1.5"></circle>
                  </svg>
                </button>
              </div>
              <h3 className="font-medium text-on-surface font-bold text-base leading-snug line-clamp-2-custom mb-2">
                FPT University OJT Student Internship System
              </h3>
            </div>
            <div className="pt-4 border-t border-slate-900/5 flex items-center justify-between text-xs text-on-surface-variant font-medium">
              <span className="">2 thg 6, 2026 • 22 nguồn</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface-container-lowest/60 text-on-surface-variant font-normal">OJT/Edu</span>
            </div>
          </article>

          <article className="card-transition group relative bg-[#F2EEF5] dark:bg-surface-container hover:bg-[#EAE4EF] dark:bg-surface-container border border-[#DFD8E5] dark:border-outline-variant/20 rounded-2xl p-5 flex flex-col justify-between min-h-[220px] cursor-pointer shadow-xs" data-purpose="workspace-card">
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-surface-container-lowest/70 backdrop-blur-xs flex items-center justify-center text-2xl shadow-xs">
                  🎓
                </div>
                <button className="text-outline hover:text-on-surface p-1 rounded-md transition-colors" title="Tùy chọn khác">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="5" r="1.5"></circle>
                    <circle cx="12" cy="12" r="1.5"></circle>
                    <circle cx="12" cy="19" r="1.5"></circle>
                  </svg>
                </button>
              </div>
              <h3 className="font-medium text-on-surface font-bold text-base leading-snug line-clamp-2-custom mb-2">
                UX Principles, Heuristic Evaluation & Design System
              </h3>
            </div>
            <div className="pt-4 border-t border-slate-900/5 flex items-center justify-between text-xs text-on-surface-variant font-medium">
              <span className="">12 thg 8, 2026 • 3 nguồn</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface-container-lowest/60 text-on-surface-variant font-normal">Thiết kế</span>
            </div>
          </article>

          <article className="card-transition group relative bg-[#EAF2EB] dark:bg-surface-container hover:bg-[#DFEBE1] dark:bg-surface-container border border-[#D5E3D8] dark:border-outline-variant/20 rounded-2xl p-5 flex flex-col justify-between min-h-[220px] cursor-pointer shadow-xs" data-purpose="workspace-card">
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-surface-container-lowest/70 backdrop-blur-xs flex items-center justify-center text-2xl shadow-xs">
                  🐞
                </div>
                <button className="text-outline hover:text-on-surface p-1 rounded-md transition-colors" title="Tùy chọn khác">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="5" r="1.5"></circle>
                    <circle cx="12" cy="12" r="1.5"></circle>
                    <circle cx="12" cy="19" r="1.5"></circle>
                  </svg>
                </button>
              </div>
              <h3 className="font-medium text-on-surface font-bold text-base leading-snug line-clamp-2-custom mb-2">
                SWT301 - Software Testing & QA Master Checklist
              </h3>
            </div>
            <div className="pt-4 border-t border-slate-900/5 flex items-center justify-between text-xs text-on-surface-variant font-medium">
              <span className="">3 thg 6, 2026 • 4 nguồn</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface-container-lowest/60 text-on-surface-variant font-normal">QA/QC</span>
            </div>
          </article>

          <article className="card-transition group relative bg-slate-900 rounded-2xl p-5 flex flex-col justify-between min-h-[220px] cursor-pointer shadow-md overflow-hidden text-white" data-purpose="workspace-card">

            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-blue-950 to-slate-950 z-0"></div>
            <div className="absolute -right-8 -bottom-10 w-44 h-44 rounded-full bg-primary text-on-primary/30 blur-2xl pointer-events-none"></div>
            <div className="absolute -left-8 -top-10 w-44 h-44 rounded-full bg-purple-600/20 blur-2xl pointer-events-none"></div>
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface-container-lowest/10 backdrop-blur-md border border-white/10 text-[11px] font-medium text-blue-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
                  Toàn cục (Public)
                </div>
                <button className="text-outline hover:text-white p-1 rounded-md transition-colors" title="Tùy chọn khác">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="5" r="1.5"></circle>
                    <circle cx="12" cy="12" r="1.5"></circle>
                    <circle cx="12" cy="19" r="1.5"></circle>
                  </svg>
                </button>
              </div>
              <h3 className="font-medium text-white text-base leading-snug line-clamp-2-custom mb-1 drop-shadow-sm">
                AI Research & Knowledge Graphs Whitepaper 2026
              </h3>
              <p className="text-xs text-outline">Tài liệu tham chiếu kiến trúc hệ thống</p>
            </div>
            <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-300">
              <span className="">27 thg 2, 2026 • 165 nguồn</span>
              <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
            </div>
          </article>

          <article className="card-transition group relative bg-[#F7F3EA] dark:bg-surface-container hover:bg-[#EFE9DC] dark:bg-surface-container border border-[#E7DFCE] dark:border-outline-variant/20 rounded-2xl p-5 flex flex-col justify-between min-h-[220px] cursor-pointer shadow-xs" data-purpose="workspace-card">
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-surface-container-lowest/70 backdrop-blur-xs flex items-center justify-center text-2xl shadow-xs">
                  🤖
                </div>
                <button className="text-outline hover:text-on-surface p-1 rounded-md transition-colors" title="Tùy chọn khác">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="5" r="1.5"></circle>
                    <circle cx="12" cy="12" r="1.5"></circle>
                    <circle cx="12" cy="19" r="1.5"></circle>
                  </svg>
                </button>
              </div>
              <h3 className="font-medium text-on-surface font-bold text-base leading-snug line-clamp-2-custom mb-2">
                SWP_Hệ thống quản lý tòa nhà & bãi giữ xe thông minh
              </h3>
            </div>
            <div className="pt-4 border-t border-slate-900/5 flex items-center justify-between text-xs text-on-surface-variant font-medium">
              <span className="">13 thg 5, 2026 • 24 tài liệu</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface-container-lowest/60 text-on-surface-variant font-normal">1.2 GB</span>
            </div>
          </article>

          <article className="card-transition group relative bg-[#EBF2F5] dark:bg-surface-container hover:bg-[#E0EBF0] dark:bg-surface-container border border-[#D5E3E9] dark:border-outline-variant/20 rounded-2xl p-5 flex flex-col justify-between min-h-[220px] cursor-pointer shadow-xs" data-purpose="workspace-card">
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-surface-container-lowest/70 backdrop-blur-xs flex items-center justify-center text-2xl shadow-xs">
                  🤖
                </div>
                <button className="text-outline hover:text-on-surface p-1 rounded-md transition-colors" title="Tùy chọn khác">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="5" r="1.5"></circle>
                    <circle cx="12" cy="12" r="1.5"></circle>
                    <circle cx="12" cy="19" r="1.5"></circle>
                  </svg>
                </button>
              </div>
              <h3 className="font-medium text-on-surface font-bold text-base leading-snug line-clamp-2-custom mb-2">
                SWE202c_Introduction to Software Engineering Spec
              </h3>
            </div>
            <div className="pt-4 border-t border-slate-900/5 flex items-center justify-between text-xs text-on-surface-variant font-medium">
              <span className="">10 thg 4, 2026 • 59 nguồn</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface-container-lowest/60 text-on-surface-variant font-normal">Kỹ thuật</span>
            </div>
          </article>

          <article className="card-transition group relative bg-[#F5EFEB] dark:bg-surface-container hover:bg-[#ECE4DC] dark:bg-surface-container border border-[#E3D9CE] dark:border-outline-variant/20 rounded-2xl p-5 flex flex-col justify-between min-h-[220px] cursor-pointer shadow-xs" data-purpose="workspace-card">
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-surface-container-lowest/70 backdrop-blur-xs flex items-center justify-center text-2xl shadow-xs">
                  👨‍🏫
                </div>
                <button className="text-outline hover:text-on-surface p-1 rounded-md transition-colors" title="Tùy chọn khác">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="5" r="1.5"></circle>
                    <circle cx="12" cy="12" r="1.5"></circle>
                    <circle cx="12" cy="19" r="1.5"></circle>
                  </svg>
                </button>
              </div>
              <h3 className="font-medium text-on-surface font-bold text-base leading-snug line-clamp-2-custom mb-2">
                Introduction to Java Web Application & Enterprise API
              </h3>
            </div>
            <div className="pt-4 border-t border-slate-900/5 flex items-center justify-between text-xs text-on-surface-variant font-medium">
              <span className="">13 thg 1, 2026 • 11 nguồn</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface-container-lowest/60 text-on-surface-variant font-normal">Backend</span>
            </div>
          </article>
        </div>


        <section className="mt-12 bg-surface-container-lowest border border-outline-variant/90 rounded-2xl p-6 shadow-xs" data-purpose="storage-overview">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

            <div className="flex-1 max-w-xl">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-primary text-on-primary"></span>
                <h4 className="text-sm font-semibold text-on-surface font-bold">Dung lượng Không gian Tri thức Dự án</h4>
              </div>
              <p className="text-xs text-on-surface-variant mb-3">Đã sử dụng <strong className="text-on-surface">14.5 GB</strong> trên tổng số 100 GB dung lượng KBase Pro (Đã lập chỉ mục 340 tệp tin, 28 video họp).</p>

              <div className="w-full h-2 bg-surface-container-low rounded-full overflow-hidden">
                <div className="h-full bg-primary text-on-primary rounded-full" style={{ width: '14.5%' }}></div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-on-surface">Chế độ nhóm KBase Pro</p>
                <p className="text-[11px] text-on-surface-variant">Quyền quản trị: Project Owner</p>
              </div>
              <button className="px-3.5 py-2 text-xs font-medium text-on-surface bg-surface-container-low hover:bg-surface-container/80 rounded-xl transition-colors">
                Nâng cấp gói
              </button>
              <button className="px-3.5 py-2 text-xs font-semibold text-white bg-primary text-on-primary hover:bg-blue-700 rounded-xl shadow-xs transition-colors">
                Tải lên tài liệu mới
              </button>
            </div>
          </div>
        </section>

      </main>


      <footer className="mt-auto border-t border-outline-variant/70 bg-surface-container-lowest py-4 px-6 text-xs text-on-surface-variant">
        <div className="max-w-[1720px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-on-surface">KBase Hub</span>
            <span className="">•</span>
            <span className="">Phiên bản 2.4.0-build</span>
            <span className="">•</span>
            <span className="">Môi trường: FPT Software Workspace</span>
          </div>
          <div className="flex items-center gap-4 text-on-surface-variant">
            <a className="hover:text-on-surface transition-colors" href="#">Trợ giúp & Tài liệu</a>
            <a className="hover:text-on-surface transition-colors" href="#">Chính sách bảo mật</a>
            <a className="hover:text-on-surface transition-colors" href="#">Phím tắt (Ctrl + K)</a>
          </div>
        </div>
      </footer>




    </div>
  );
};

export default Hub;
