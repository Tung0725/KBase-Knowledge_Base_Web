import React, { useState } from 'react';
import type { ChatMessageData, SourceCitation } from '../../services/chatService';
import { MarkdownRenderer } from './MarkdownRenderer';

/**
 * ChatMessageItem component
 * Displays a single chat message (User or Assistant) with markdown rendering,
 * source citations, copy-to-clipboard functionality, inline editing for user prompts,
 * and interactive status icons.
 *
 * @prop msg - Chat message object containing content, role, sources, loading states
 * @prop index - Index of message in history list
 * @prop globalSources - List of all citations accumulated across conversation
 * @prop onCitationClick - Callback when a citation pill is clicked
 * @prop onEditMessage - Callback when user submits an edited prompt
 */
interface ChatMessageItemProps {
  msg: ChatMessageData;
  index: number;
  globalSources: SourceCitation[];
  onCitationClick: (source: SourceCitation) => void;
  onEditMessage?: (index: number, newContent: string) => void;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = React.memo(({
  msg,
  index,
  globalSources,
  onCitationClick,
  onEditMessage,
}) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(msg.content);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isUser = msg.role === 'user';

  const handleStartEdit = () => {
    setEditText(msg.content);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditText(msg.content);
  };

  const handleSaveEdit = () => {
    if (editText.trim() && onEditMessage) {
      onEditMessage(index, editText.trim());
      setIsEditing(false);
    }
  };

  return (
    <div id={`message-${index}`} className={`scroll-mt-6 flex w-full group ${isUser ? 'justify-end' : 'justify-start'}`}>
      
      {/* Sparkle Icon for AI */}
      {!isUser && (
        <div className="shrink-0 mr-4 mt-1">
          <img 
            src="https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg" 
            className="w-7 h-7" 
            alt="Gemini" 
          />
        </div>
      )}

      {/* Message Content Container */}
      <div
        className={`transition-all duration-300 relative ${
          isUser
            ? isEditing
              ? 'w-full max-w-[85%] rounded-[20px] bg-surface-container-high text-on-surface p-4 shadow-sm'
              : 'max-w-[85%] rounded-[24px] bg-surface-container-high text-on-surface px-5 py-3.5'
            : 'flex-1 min-w-0 bg-transparent text-on-surface'
        }`}
      >
        {isUser ? (
          isEditing ? (
            /* User Message Inline Edit Form */
            <div className="space-y-3">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSaveEdit();
                  } else if (e.key === 'Escape') {
                    handleCancelEdit();
                  }
                }}
                className="w-full bg-surface-container-lowest text-on-surface rounded-xl p-3 text-[14px] leading-relaxed border border-primary/40 focus:outline-none focus:border-primary resize-none min-h-[80px]"
                autoFocus
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-3 py-1.5 rounded-lg text-[13px] text-on-surface-variant hover:bg-surface-container transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="px-3.5 py-1.5 rounded-lg text-[13px] font-medium bg-primary text-on-primary hover:bg-primary/90 shadow-xs transition-colors"
                >
                  Lưu & Tạo lại
                </button>
              </div>
            </div>
          ) : (
            /* User Message Text & Edit Trigger */
            <div className="flex items-start gap-2">
              <div className="whitespace-pre-wrap text-[15px] leading-relaxed font-sans flex-1">
                {msg.content}
              </div>
              {onEditMessage && (
                <button
                  onClick={handleStartEdit}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-surface-container-highest rounded-md text-on-surface-variant hover:text-on-surface transition-opacity shrink-0 ml-1"
                  title="Chỉnh sửa yêu cầu"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                </button>
              )}
            </div>
          )
        ) : (
          /* Assistant Message Content */
          <div className="text-[15px] leading-relaxed">
            {msg.isLoading ? (
              <div className="flex items-center gap-3 py-2 text-primary font-medium">
                <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                <span className="text-[15px]">Đang suy nghĩ...</span>
              </div>
            ) : msg.error ? (
              <div className="flex items-center gap-2 text-error text-sm p-3 bg-error/10 rounded-2xl">
                <span className="material-symbols-outlined text-[20px]">error</span>
                <span>{msg.error}</span>
              </div>
            ) : (
              <MarkdownRenderer
                content={msg.content}
                sources={msg.sources && msg.sources.length > 0 ? msg.sources : globalSources}
                onCitationClick={onCitationClick}
                isStreaming={msg.isStreaming}
              />
            )}
          </div>
        )}

        {/* Action Toolbar for Assistant Messages */}
        {!isUser && !msg.isLoading && !msg.error && (
          <div className="mt-3 flex items-center gap-1 text-on-surface-variant">
            <button
              onClick={handleCopy}
              className="p-2 hover:bg-on-surface/5 rounded-full transition-colors flex items-center justify-center gap-1.5"
              title="Sao chép"
            >
              <span className="material-symbols-outlined text-[18px]">
                {copied ? 'check' : 'content_copy'}
              </span>
              {copied && <span className="text-[12px] font-medium text-primary">Đã chép</span>}
            </button>
            <button className="p-2 hover:bg-on-surface/5 rounded-full transition-colors flex items-center justify-center" title="Câu trả lời tốt">
              <span className="material-symbols-outlined text-[18px]">thumb_up</span>
            </button>
            <button className="p-2 hover:bg-on-surface/5 rounded-full transition-colors flex items-center justify-center" title="Câu trả lời không tốt">
              <span className="material-symbols-outlined text-[18px]">thumb_down</span>
            </button>
            <button className="p-2 hover:bg-on-surface/5 rounded-full transition-colors flex items-center justify-center" title="Chia sẻ">
              <span className="material-symbols-outlined text-[18px]">share</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
