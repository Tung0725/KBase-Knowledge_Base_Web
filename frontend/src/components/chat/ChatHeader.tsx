import React from 'react';

/**
 * ChatHeader Component
 * Top navigation bar of the AI chat canvas.
 * Displays current conversation title, new conversation trigger,
 * knowledge base drawer reopen icon, and conversation history clock toggle.
 *
 * @prop title - Current chat session title or placeholder
 * @prop isSidebarOpen - State of the knowledge sources sidebar
 * @prop onOpenSidebar - Callback to reopen the knowledge sources sidebar
 * @prop isSessionsOpen - Whether history slide-over drawer is currently open
 * @prop onToggleSessions - Callback to toggle history slide-over drawer
 * @prop onNewChat - Callback to start a new chat session
 * @prop canCreateNewChat - Whether user has sent messages in the current session
 */
interface ChatHeaderProps {
  title?: string;
  isSidebarOpen: boolean;
  onOpenSidebar: () => void;
  isSessionsOpen: boolean;
  onToggleSessions: () => void;
  onNewChat: () => void;
  canCreateNewChat: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  title,
  isSidebarOpen,
  onOpenSidebar,
  isSessionsOpen,
  onToggleSessions,
  onNewChat,
  canCreateNewChat,
}) => {
  return (
    <div
      className={`px-4 py-1 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-low/40 relative z-10 ${
        !isSidebarOpen ? 'pl-14' : ''
      }`}
    >
      {/* Knowledge Sidebar Reopen Button (when hidden) */}
      {!isSidebarOpen && (
        <button
          onClick={onOpenSidebar}
          className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 bg-surface-container/90 backdrop-blur border border-outline-variant/30 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all shadow-sm"
          title="Mở bảng nguồn tri thức"
        >
          <span className="material-symbols-outlined text-[18px]">left_panel_open</span>
        </button>
      )}

      {/* Title Section */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="material-symbols-outlined text-[18px] text-primary shrink-0">chat_bubble</span>
        <h2 className="text-[14px] font-medium text-on-surface truncate">
          {title || 'Đoạn chat mới'}
        </h2>
      </div>

      {/* Action Buttons Section */}
      <div className="flex items-center gap-1.5">
        {/* New Chat Button */}
        <button
          onClick={onNewChat}
          disabled={!canCreateNewChat}
          className={`p-1.5 rounded-lg text-[13px] flex items-center gap-1.5 transition-all ${
            !canCreateNewChat
              ? 'opacity-40 cursor-not-allowed text-on-surface-variant'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
          }`}
          title={!canCreateNewChat ? 'Đoạn chat hiện tại chưa có tin nhắn nào' : 'Tạo đoạn chat mới'}
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span className="hidden sm:inline text-[12px] font-medium">Đoạn chat mới</span>
        </button>

        {/* History Clock Button */}
        <button
          onClick={onToggleSessions}
          className={`p-1.5 rounded-lg text-[13px] flex items-center gap-1.5 transition-all ${
            isSessionsOpen
              ? 'bg-primary text-on-primary shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
          }`}
          title="Lịch sử đoạn chat"
        >
          <span className="material-symbols-outlined text-[18px]">history</span>
          <span className="hidden sm:inline text-[12px] font-medium">Lịch sử</span>
        </button>
      </div>
    </div>
  );
};
