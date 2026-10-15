import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import type { ChatSessionData } from '../../services/chatService';

/**
 * ChatSessionList Component
 * Overlay drawer listing AI conversation threads sliding from the right.
 * Features a 3-dots action menu with Pin, Rename Modal, and Delete Confirm Modal.
 *
 * @prop sessions - List of active chat sessions
 * @prop currentSessionId - Currently selected session ID
 * @prop onSelectSession - Session click callback
 * @prop onRenameSession - Rename title submit handler
 * @prop onDeleteSession - Delete thread confirmation callback
 * @prop onTogglePinSession - Pin/unpin thread callback
 * @prop onClose - Close drawer callback
 */
interface ChatSessionListProps {
  sessions: ChatSessionData[];
  currentSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, newTitle: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onTogglePinSession?: (sessionId: string, pinned: boolean) => void;
  onClose: () => void;
}

export const ChatSessionList: React.FC<ChatSessionListProps> = ({
  sessions,
  currentSessionId,
  onSelectSession,
  onRenameSession,
  onDeleteSession,
  onTogglePinSession,
  onClose,
}) => {
  const [activeMenuSessionId, setActiveMenuSessionId] = useState<string | null>(null);
  const [renamingSession, setRenamingSession] = useState<ChatSessionData | null>(null);
  const [renameInput, setRenameInput] = useState('');
  const [deletingSession, setDeletingSession] = useState<ChatSessionData | null>(null);

  // Close dropdown menu when clicking outside
  useEffect(() => {
    const handleDocumentClick = () => setActiveMenuSessionId(null);
    if (activeMenuSessionId) {
      window.addEventListener('click', handleDocumentClick);
    }
    return () => window.removeEventListener('click', handleDocumentClick);
  }, [activeMenuSessionId]);

  const isSessionPinned = (s: ChatSessionData) => Boolean(s.pinned ?? (s as any).isPinned);

  interface SessionGroup {
    id: string;
    label: string;
    isPinnedGroup?: boolean;
    sessions: ChatSessionData[];
  }

  const groupedSessions = useMemo(() => {
    const pinned: ChatSessionData[] = [];
    const today: ChatSessionData[] = [];
    const yesterday: ChatSessionData[] = [];
    const last7Days: ChatSessionData[] = [];
    const last30Days: ChatSessionData[] = [];
    const olderMap = new Map<string, ChatSessionData[]>();

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
    const startOf7Days = startOfToday - 6 * 24 * 60 * 60 * 1000;
    const startOf30Days = startOfToday - 29 * 24 * 60 * 60 * 1000;

    sessions.forEach((s) => {
      if (isSessionPinned(s)) {
        pinned.push(s);
        return;
      }

      const time = new Date(s.lastActivityAt || s.updatedAt || s.createdAt || 0).getTime();

      if (time >= startOfToday) {
        today.push(s);
      } else if (time >= startOfYesterday) {
        yesterday.push(s);
      } else if (time >= startOf7Days) {
        last7Days.push(s);
      } else if (time >= startOf30Days) {
        last30Days.push(s);
      } else {
        const itemDate = new Date(time);
        const monthKey = `${itemDate.getFullYear()}-${itemDate.getMonth() + 1}`;
        if (!olderMap.has(monthKey)) {
          olderMap.set(monthKey, []);
        }
        olderMap.get(monthKey)!.push(s);
      }
    });

    const groups: SessionGroup[] = [];

    if (pinned.length > 0) {
      groups.push({
        id: 'pinned',
        label: 'Đã ghim',
        isPinnedGroup: true,
        sessions: pinned,
      });
    }

    if (today.length > 0) {
      groups.push({
        id: 'today',
        label: 'Gần đây',
        sessions: today,
      });
    }

    if (yesterday.length > 0) {
      groups.push({
        id: 'yesterday',
        label: 'Hôm qua',
        sessions: yesterday,
      });
    }

    if (last7Days.length > 0) {
      groups.push({
        id: '7days',
        label: '7 ngày trước',
        sessions: last7Days,
      });
    }

    if (last30Days.length > 0) {
      groups.push({
        id: '30days',
        label: '30 ngày trước',
        sessions: last30Days,
      });
    }

    olderMap.forEach((monthSessions, monthKey) => {
      if (monthSessions.length > 0) {
        const monthNum = monthKey.split('-')[1];
        groups.push({
          id: `month-${monthKey}`,
          label: `Tháng ${monthNum}`,
          sessions: monthSessions,
        });
      }
    });

    return groups;
  }, [sessions]);

  const handleOpenRenameModal = (session: ChatSessionData, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuSessionId(null);
    setRenamingSession(session);
    setRenameInput(session.title);
  };

  const handleConfirmRename = () => {
    if (!renamingSession || !renameInput.trim()) return;
    onRenameSession(renamingSession.id, renameInput.trim());
    toast.success('Đã đổi tên cuộc trò chuyện');
    setRenamingSession(null);
  };

  const handleOpenDeleteModal = (session: ChatSessionData, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuSessionId(null);
    setDeletingSession(session);
  };

  const handleConfirmDelete = () => {
    if (!deletingSession) return;
    onDeleteSession(deletingSession.id);
    toast.success('Đã xóa cuộc trò chuyện');
    setDeletingSession(null);
  };

  const handleTogglePin = (session: ChatSessionData, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuSessionId(null);
    if (onTogglePinSession) {
      const currentlyPinned = isSessionPinned(session);
      const nextPinned = !currentlyPinned;
      onTogglePinSession(session.id, nextPinned);
      toast.success(nextPinned ? 'Đã ghim cuộc trò chuyện' : 'Đã bỏ ghim cuộc trò chuyện');
    }
  };

  const renderSessionItem = (session: ChatSessionData) => {
    const isActive = session.id === currentSessionId;
    const isMenuOpen = activeMenuSessionId === session.id;
    const pinned = isSessionPinned(session);

    return (
      <div
        key={session.id}
        onClick={() => onSelectSession(session.id)}
        className={`group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer text-[13px] transition-all ${
          isActive
            ? 'bg-surface-container-highest text-primary font-medium shadow-xs'
            : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
        }`}
      >
        {/* Leading Icon */}
        <span className="material-symbols-outlined text-[18px] shrink-0 opacity-70">
          chat_bubble
        </span>

        {/* Title */}
        <span className="flex-1 truncate" title={session.title}>
          {session.title}
        </span>

        {/* Action Button: Pinned shows pin icon, unpinned shows 3-dots */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setActiveMenuSessionId(isMenuOpen ? null : session.id);
          }}
          className={`w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-container transition-all shrink-0 ${
            pinned
              ? 'text-primary opacity-90 hover:opacity-100'
              : isMenuOpen
              ? 'opacity-100 bg-surface-container text-on-surface'
              : 'opacity-40 group-hover:opacity-100 text-on-surface-variant hover:text-on-surface'
          }`}
          title={pinned ? 'Tùy chọn (Đã ghim)' : 'Tùy chọn'}
        >
          <span className="material-symbols-outlined text-[18px]">
            {pinned ? 'push_pin' : 'more_vert'}
          </span>
        </button>

        {/* Action Dropdown Menu */}
        {isMenuOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute right-2 top-9 z-30 w-[190px] py-1.5 rounded-2xl bg-surface-container-highest/95 backdrop-blur-md border border-outline-variant/30 shadow-2xl text-[13px] text-on-surface animate-in fade-in zoom-in-95 duration-100"
          >
            <button
              onClick={(e) => handleTogglePin(session, e)}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-on-surface/8 transition-colors text-left"
            >
              <span className="material-symbols-outlined text-[18px] opacity-80">
                push_pin
              </span>
              <span>{pinned ? 'Bỏ ghim' : 'Ghim'}</span>
            </button>

            <button
              onClick={(e) => handleOpenRenameModal(session, e)}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-on-surface/8 transition-colors text-left"
            >
              <span className="material-symbols-outlined text-[18px] opacity-80">edit</span>
              <span>Đổi tên</span>
            </button>

            <button
              onClick={(e) => handleOpenDeleteModal(session, e)}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-error/10 text-error transition-colors text-left"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
              <span>Xoá</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full w-full flex flex-col bg-surface-container-low border-l border-outline-variant/30 select-none shadow-2xl relative">
      {/* Header Section */}
      <div className="p-3 border-b border-outline-variant/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-primary">history</span>
          <span className="text-[13px] font-medium text-on-surface">Lịch sử trò chuyện</span>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors"
          title="Đóng lịch sử"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      {/* Conversation Sessions List Grouped by Timeline */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {sessions.length === 0 ? (
          <div className="text-center py-10 text-on-surface-variant/60 text-[13px]">
            Chưa có phiên trò chuyện nào
          </div>
        ) : (
          groupedSessions.map((group, groupIdx) => (
            <div key={group.id} className="space-y-1">
              {/* Group Section Header */}
              {group.isPinnedGroup ? (
                <div className="flex items-center gap-1.5 px-2.5 pt-1.5 pb-1 text-[11px] font-semibold text-primary uppercase tracking-wider">
                  <span className="material-symbols-outlined text-[13px]">push_pin</span>
                  <span>{group.label}</span>
                </div>
              ) : (
                <div
                  className={`px-2.5 pb-1 text-[11px] font-semibold text-on-surface-variant/70 uppercase tracking-wider ${
                    groupIdx === 0 ? 'pt-1.5' : 'pt-3'
                  }`}
                >
                  <span>{group.label}</span>
                </div>
              )}

              {/* Group Items */}
              {group.sessions.map(renderSessionItem)}

              {/* Subtle divider after pinned group if other groups follow */}
              {group.isPinnedGroup && groupIdx < groupedSessions.length - 1 && (
                <div className="my-2 border-b border-outline-variant/15 mx-1" />
              )}
            </div>
          ))
        )}
      </div>

      {/* Rename Session Modal */}
      {renamingSession && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setRenamingSession(null)}
        >
          <div
            className="w-full max-w-[400px] bg-surface-container-high border border-outline-variant/30 rounded-2xl p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-primary mb-3">
              <span className="material-symbols-outlined text-[20px]">edit</span>
              <h3 className="text-[16px] font-semibold text-on-surface">Đổi tên cuộc trò chuyện</h3>
            </div>
            <input
              type="text"
              value={renameInput}
              onChange={(e) => setRenameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleConfirmRename();
                if (e.key === 'Escape') setRenamingSession(null);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-surface-container-lowest text-on-surface border border-outline-variant/40 focus:border-primary focus:outline-none text-[14px] mb-5"
              placeholder="Nhập tên cuộc trò chuyện"
              autoFocus
            />
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setRenamingSession(null)}
                className="px-4 py-2 rounded-xl text-[13px] font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmRename}
                disabled={!renameInput.trim()}
                className="px-4 py-2 rounded-xl text-[13px] font-medium bg-primary text-on-primary hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingSession && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setDeletingSession(null)}
        >
          <div
            className="w-full max-w-[400px] bg-surface-container-high border border-outline-variant/30 rounded-2xl p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 text-error mb-2">
              <span className="material-symbols-outlined text-[22px]">delete</span>
              <h3 className="text-[16px] font-semibold text-on-surface">Xóa cuộc trò chuyện?</h3>
            </div>
            <p className="text-[13px] text-on-surface-variant leading-relaxed mb-5">
              Thao tác này sẽ xóa vĩnh viễn cuộc trò chuyện <span className="font-medium text-on-surface">"{deletingSession.title}"</span> cùng toàn bộ tin nhắn bên trong.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingSession(null)}
                className="px-4 py-2 rounded-xl text-[13px] font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl text-[13px] font-medium bg-error text-on-error hover:bg-error/90 transition-colors"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
