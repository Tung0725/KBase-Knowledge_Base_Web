import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { projectService } from '../services/projectService';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Tên dự án không được để trống');
      return;
    }

    if (name.length < 3) {
      setError('Tên dự án phải có ít nhất 3 ký tự');
      return;
    }

    try {
      setIsSubmitting(true);
      await projectService.createProject({ name, description });
      setName('');
      setDescription('');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi tạo dự án');
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <h2 className="text-xl font-bold text-on-surface mb-2">Tạo dự án mới</h2>
              <p className="text-sm text-on-surface-variant mb-6">
                Khởi tạo một không gian làm việc mới để tổ chức tài liệu và quản lý tri thức cho đội ngũ của bạn.
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
                    onChange={(e) => setName(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-on-surface disabled:opacity-50"
                    placeholder="VD: KBase Project"
                    autoFocus
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-on-surface mb-1.5">
                    Mô tả (Tùy chọn)
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isSubmitting}
                    rows={4}
                    className="w-full px-4 py-2.5 bg-surface-container-low border border-outline-variant rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-on-surface disabled:opacity-50 resize-none"
                    placeholder="Mô tả ngắn gọn về mục tiêu của dự án..."
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
                    disabled={isSubmitting}
                    className="px-5 py-2 text-sm font-semibold bg-primary-container text-white hover:bg-blue-700 transition-colors rounded-full shadow-sm disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Đang tạo...
                      </>
                    ) : (
                      'Tạo dự án'
                    )}
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

export default CreateProjectModal;
