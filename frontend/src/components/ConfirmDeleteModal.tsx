import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { projectService } from '../services/projectService';
import type { Project } from '../types/project';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  project: Project | null;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({ isOpen, onClose, onSuccess, project }) => {
  const [confirmName, setConfirmName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    
    if (confirmName !== project.name) {
      setError('Tên xác nhận không khớp');
      return;
    }

    try {
      setIsSubmitting(true);
      await projectService.deleteProject(project.id);
      onSuccess();
      setConfirmName('');
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi xóa dự án');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!project) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-inverse-surface/60 backdrop-blur-sm"
            onClick={!isSubmitting ? onClose : undefined}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.1 }}
            className="relative w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-xl overflow-hidden border border-error/20"
          >
            <div className="p-6">
              <div className="flex items-center gap-3 text-error mb-4">
                <span className="material-symbols-outlined text-3xl">warning</span>
                <h2 className="text-xl font-bold">Xóa dự án vĩnh viễn</h2>
              </div>
              
              <p className="text-sm text-on-surface mb-4">
                Bạn đang chuẩn bị xóa dự án <strong>{project.name}</strong>. Hành động này không thể hoàn tác, toàn bộ dữ liệu, tài liệu và thiết lập sẽ bị xóa vĩnh viễn.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-error-container/20 text-error rounded-xl text-sm font-medium border border-error/20">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="confirmName" className="block text-sm font-medium text-on-surface mb-2">
                    Vui lòng nhập <span className="font-bold font-mono bg-surface-container px-1 py-0.5 rounded">{project.name}</span> để xác nhận:
                  </label>
                  <input
                    id="confirmName"
                    type="text"
                    value={confirmName}
                    onChange={(e) => {
                      setConfirmName(e.target.value);
                      setError(null);
                    }}
                    disabled={isSubmitting}
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-error/20 focus:border-error transition-all text-on-surface disabled:opacity-50"
                    placeholder={project.name}
                    autoComplete="off"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/30 mt-6">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="px-5 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container transition-colors rounded-full disabled:opacity-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || confirmName !== project.name}
                    className="px-5 py-2 text-sm font-semibold bg-error text-white hover:bg-red-700 transition-colors rounded-full shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Đang xóa...' : 'Xóa vĩnh viễn'}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmDeleteModal;
