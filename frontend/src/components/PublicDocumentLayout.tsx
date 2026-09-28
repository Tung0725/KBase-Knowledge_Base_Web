import React from 'react';
import { motion } from 'framer-motion';
import { Link, NavLink } from 'react-router-dom';

import logoImg from '../assets/Logo_KBase.png';

interface PublicDocumentLayoutProps {
  title: string;
  subtitle?: string;
  lastUpdated?: string;
  children: React.ReactNode;
}

const PublicDocumentLayout: React.FC<PublicDocumentLayoutProps> = ({ title, subtitle, lastUpdated, children }) => {
  return (
    <div className="bg-surface text-on-surface font-body-md antialiased min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 bg-surface-container-lowest/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 max-w-[800px] mx-auto px-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors text-lg">arrow_back</span>
            <span className="font-label-md text-on-surface-variant group-hover:text-primary transition-colors">Về trang chủ</span>
          </Link>
          <div className="flex items-center gap-3">
             <img src={logoImg} alt="KBase Logo" className="h-7 w-auto object-contain" />
             <span className="font-headline-sm text-sm font-semibold tracking-tight">KBase</span>
          </div>
        </div>
        <div className="border-t border-outline-variant/20 bg-surface-container-lowest/80 backdrop-blur-xl overflow-x-auto">
          <div className="max-w-[800px] mx-auto px-6 flex gap-6">
            <NavLink to="/about" className={({isActive}) => `py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${isActive ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}>
              Giới thiệu dự án
            </NavLink>
            <NavLink to="/guide" className={({isActive}) => `py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${isActive ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}>
              Hướng dẫn sử dụng
            </NavLink>
            <NavLink to="/privacy" className={({isActive}) => `py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${isActive ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}>
              Chính sách & Bảo mật
            </NavLink>
            <NavLink to="/terms" className={({isActive}) => `py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${isActive ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}>
              Điều khoản dịch vụ
            </NavLink>
          </div>
        </div>
      </header>
      
      <main className="flex-1 w-full max-w-[800px] mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-4 text-on-surface leading-tight">{title}</h1>
          {subtitle && <p className="text-lg text-on-surface-variant mb-6">{subtitle}</p>}
          {lastUpdated && <p className="text-sm text-on-surface-variant mb-10 pb-6 border-b border-outline-variant/30">Cập nhật lần cuối: {lastUpdated}</p>}
          
          <div className="space-y-6">
            {children}
          </div>
        </motion.div>
      </main>
      
      <footer className="w-full bg-surface-container py-8 mt-12 border-t border-outline-variant/20">
        <div className="max-w-[800px] mx-auto px-6 text-center text-sm text-on-surface-variant">
          © 2026 Bản quyền thuộc Duy Tùng KBase. Sản xuất tại FPT University.
        </div>
      </footer>
    </div>
  );
};

export default PublicDocumentLayout;
