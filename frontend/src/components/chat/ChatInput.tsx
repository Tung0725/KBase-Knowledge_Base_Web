import React, { useRef } from 'react';

/**
 * ChatInput component
 * Handles user prompt typing with auto-resizing textarea, keyboard submission,
 * selected source scope badge, and instant stream cancellation button.
 *
 * @prop inputValue - Current text value of input prompt
 * @prop onInputChange - Text change handler
 * @prop onSendMessage - Send action trigger
 * @prop onStopStreaming - Cancel active SSE stream trigger
 * @prop isStreaming - Whether response streaming is actively running
 * @prop selectedSourcesCount - Number of documents included in context scope
 */
interface ChatInputProps {
  inputValue: string;
  onInputChange: (val: string) => void;
  onSendMessage: () => void;
  onStopStreaming?: () => void;
  isStreaming: boolean;
  selectedSourcesCount: number;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  inputValue,
  onInputChange,
  onSendMessage,
  onStopStreaming,
  isStreaming,
  selectedSourcesCount,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputValue.trim() && !isStreaming && selectedSourcesCount > 0) {
        onSendMessage();
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      }
    }
  };

  const handleSendClick = () => {
    if (isStreaming) {
      onStopStreaming?.();
      return;
    }
    if (inputValue.trim() && selectedSourcesCount > 0) {
      onSendMessage();
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  return (
    <div className="p-1 bg-surface-container-lowest flex flex-col border-t border-outline-variant/20">
      {/* Input Field Container */}
      <div className="relative max-w-4xl mx-auto w-full flex items-end bg-surface-container rounded-3xl border border-outline-variant/30 focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary transition-all shadow-sm">
        <textarea
          ref={textareaRef}
          rows={1}
          value={inputValue}
          onChange={(e) => {
            e.target.style.height = 'auto';
            e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
            onInputChange(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Đặt câu hỏi hoặc yêu cầu phân tích tài liệu..."
          className="flex-1 bg-transparent py-3 pl-4 pr-2 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none resize-none overflow-y-auto max-h-[150px] min-h-[44px]"
        />

        {/* Selected Sources Counter Badge */}
        <div className="flex-shrink-0 mr-2 mb-[10px] flex items-center">
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 border transition-colors ${
              selectedSourcesCount > 0
                ? 'bg-primary/10 text-primary border-primary/20'
                : 'bg-error/10 text-error border-error/20'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">
              {selectedSourcesCount > 0 ? 'library_books' : 'warning'}
            </span>
            {selectedSourcesCount > 0 ? `${selectedSourcesCount} nguồn` : 'Chưa chọn nguồn'}
          </span>
        </div>

        {/* Action Button: Send or Stop */}
        <button
          onClick={handleSendClick}
          disabled={!isStreaming && (!inputValue.trim() || selectedSourcesCount === 0)}
          title={
            isStreaming
              ? 'Dừng tạo câu trả lời'
              : selectedSourcesCount === 0
              ? 'Vui lòng chọn ít nhất 1 tài liệu'
              : 'Gửi câu hỏi'
          }
          className={`flex-shrink-0 mr-2 mb-[7px] w-8 h-8 rounded-full flex items-center justify-center transition-all ${
            isStreaming
              ? 'bg-error text-on-error hover:bg-error/90 animate-pulse shadow-md'
              : 'bg-primary text-on-primary hover:bg-primary/90 disabled:opacity-40 disabled:hover:bg-primary'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {isStreaming ? 'stop' : 'arrow_upward'}
          </span>
        </button>
      </div>

      {/* Footer Disclaimer */}
      <p className="text-center text-[11px] text-on-surface-variant mt-2 font-medium opacity-75">
        AI có thể đưa ra thông tin chưa đầy đủ, hãy đối chiếu với số nguồn trích dẫn tương ứng.
      </p>
    </div>
  );
};
