import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { projectService } from '../services/projectService';
import type { Project } from '../types/project';
import { toast } from 'react-hot-toast';

interface ProjectSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  project: Project | null;
}

const ProjectSettingsModal: React.FC<ProjectSettingsModalProps> = ({ isOpen, onClose, onSuccess, project }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (project && isOpen) {
      setName(project.name);
      setDescription(project.description || '');
      setError(null);
    }
  }, [project, isOpen]);
  const hasChanges = project ? (
    name !== project.name ||
    description !== (project.description || '')
  ) : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Tên dự án không được để trống');
      return;
    }

    if (!project) return;

    try {
      setIsSubmitting(true);
      await projectService.updateProject(project.id, { name, description });
      toast.success('Lưu thay đổi thành công!');
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật dự án';
      setError(msg);
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
            className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm"
            onClick={!isSubmitting ? onClose : undefined}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.1 }}
            className="relative w-full max-w-lg bg-surface-container-lowest rounded-2xl shadow-xl overflow-hidden border border-outline-variant/30"
          >
            <div className="p-6">
              <h2 className="text-xl font-bold text-on-surface mb-2">Cài đặt dự án</h2>
              <p className="text-sm text-on-surface-variant mb-6">
                Chỉnh sửa thông tin chung và quyền truy cập dự án.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-error-container/20 text-error rounded-xl text-sm font-medium border border-error/20">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-on-surface mb-1.5">
                    Tên dự án <span className="text-error">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setError(null);
                    }}
                    disabled={isSubmitting}
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-on-surface disabled:opacity-50"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-on-surface mb-1.5">
                    Mô tả (Tùy chọn)
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      setError(null);
                    }}
                    disabled={isSubmitting}
                    rows={4}
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-on-surface disabled:opacity-50 resize-none"
                  />
                </div>



                <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/30 mt-6">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="px-5 py-2 text-sm font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors rounded-full disabled:opacity-50"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !hasChanges || !!error}
                    className="px-5 py-2 text-sm font-semibold bg-primary-container text-white hover:bg-blue-700 transition-colors rounded-full shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
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

export default ProjectSettingsModal;
