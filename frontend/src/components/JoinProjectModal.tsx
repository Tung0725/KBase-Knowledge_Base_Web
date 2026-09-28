import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface JoinProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const JoinProjectModal: React.FC<JoinProjectModalProps> = ({ isOpen, onClose }) => {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const val = inputValue.trim();
    if (!val) {
      setError('Vui lòng nhập link hoặc mã mời');
      return;
    }

    let code = val;
    // Extract code if it's a full URL
    try {
      if (val.includes('/join/')) {
        const parts = val.split('/join/');
        code = parts[parts.length - 1].split('?')[0].split('/')[0];
      }
    } catch {
      // Ignored, fallback to full string
    }

    if (!code) {
      setError('Link mời không hợp lệ');
      return;
    }

    onClose();
    navigate(`/join/${code}`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-surface-container-lowest w-full max-w-md rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="p-6 border-b border-outline-variant/30 flex items-center justify-between">
              <h2 className="text-xl font-bold text-on-surface">Tham gia dự án</h2>
              <button
                onClick={() => { onClose(); setError(null); setInputValue(''); }}
                className="text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleJoin} className="p-6 flex flex-col gap-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-on-surface">Link hoặc Mã mời</label>
                <input
                  type="text"
                  required
                  value={inputValue}
                  onChange={e => { setInputValue(e.target.value); setError(null); }}
                  placeholder="https://.../join/abc-xyz hoặc abc-xyz"
                  className="w-full px-4 py-3 rounded-xl bg-surface-container text-on-surface border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                />
                <p className="text-xs text-on-surface-variant mt-1">
                  Hãy dán link mời bạn nhận được vào đây.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-error-container/20 text-error rounded-xl text-sm font-medium border border-error/20">
                  {error}
                </div>
              )}

              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => { onClose(); setError(null); setInputValue(''); }}
                  className="flex-1 py-3 px-4 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-xl font-semibold transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!inputValue.trim()}
                  className="flex-1 py-3 px-4 bg-primary hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Tham gia
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default JoinProjectModal;
