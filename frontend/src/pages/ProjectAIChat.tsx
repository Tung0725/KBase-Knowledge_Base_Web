import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'react-router-dom';

interface DocumentInfo {
  id: string;
  fileName: string;
  fileType: string;
  tag: string;
  status: string;
}

const ProjectAIChat: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string, sources?: any[] }>>([
    {
      role: 'assistant',
      content: 'Chào bạn, tôi là trợ lý AI. Bạn có thể hỏi tôi bất kỳ thông tin nào về các tài liệu trong dự án này.\n\nVí dụ:\n- Tóm tắt tài liệu của dự án này...\n- Kiến trúc hệ thống được đề xuất là gì?\n- Có bao nhiêu loại tài khoản người dùng?'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Sources State
  const [sources, setSources] = useState<DocumentInfo[]>([]);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [sourceFilter, setSourceFilter] = useState('all');

  // Resize State
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isDragging, setIsDragging] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Lấy danh sách tài liệu từ Backend
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:8080/api/projects/${projectId}/documents`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const docs: DocumentInfo[] = data.data || [];
          setSources(docs);
          // Mặc định chọn tất cả
          setSelectedSourceIds(docs.map(d => d.id));
        }
      } catch (err) {
        console.error("Failed to fetch documents", err);
      }
    };

    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:8080/api/projects/${projectId}/chat/history`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const history = await res.json();
          if (history.length > 0) {
            setMessages(history);
          }
        }
      } catch (err) {
        console.error("Failed to fetch chat history", err);
      }
    };

    if (projectId) {
      fetchDocuments();
      fetchHistory();
    }
  }, [projectId]);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsDragging(false);
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (isDragging && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = e.clientX - containerRect.left;
      if (newWidth >= 200 && newWidth <= 600) {
        setSidebarWidth(newWidth);
      }
    }
  }, [isDragging]);

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    const userMessage = inputValue;
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInputValue('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/projects/${projectId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          message: userMessage,
          documentIds: selectedSourceIds // Chỉ cho AI đọc các file đang tích chọn
        })
      });

      if (!response.ok) {
        throw new Error('API Error');
      }

      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response, sources: data.sources }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Lỗi: Không thể kết nối đến AI. Hãy kiểm tra lại API Key hoặc mạng.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSources = sources.filter(src => sourceFilter === 'all' || src.tag === sourceFilter);
  const isAllFilteredSelected = filteredSources.length > 0 && filteredSources.every(src => selectedSourceIds.includes(src.id));

  const toggleSourceSelection = (id: string) => {
    setSelectedSourceIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleAllSources = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const newIds = new Set([...selectedSourceIds, ...filteredSources.map(s => s.id)]);
      setSelectedSourceIds(Array.from(newIds));
    } else {
      const filteredIds = filteredSources.map(s => s.id);
      setSelectedSourceIds(selectedSourceIds.filter(id => !filteredIds.includes(id)));
    }
  };

  const getIconForTag = (tag: string) => {
    switch (tag) {
      case '[Tài liệu]': return { icon: 'description', color: 'text-info' };
      case '[Ảnh]': return { icon: 'image', color: 'text-warning' };
      case '[Video]': return { icon: 'movie', color: 'text-error' };
      default: return { icon: 'draft', color: 'text-on-surface-variant' };
    }
  };

  const renderMessageContent = (text: string, msgSources?: any[]) => {
    if (!msgSources || msgSources.length === 0) return <>{text}</>;
    
    // Tách văn bản theo các [1], [2]...
    const parts = text.split(/(\[\d+\])/g);
    return parts.map((part, i) => {
      const match = part.match(/\[(\d+)\]/);
      if (match) {
        const sourceId = parseInt(match[1]);
        const source = msgSources.find(s => s.sourceId === sourceId);
        if (source) {
          return (
            <span 
              key={i} 
              className="inline-flex items-center justify-center w-5 h-5 mx-0.5 text-[11px] font-medium bg-secondaryContainer text-on-secondaryContainer border border-outline-variant/30 rounded-full cursor-pointer hover:bg-secondary hover:text-on-secondary transition-colors"
              title={`Nguồn: ${source.fileName}\n\n${source.text}`}
              onClick={() => alert(`Trích dẫn từ: ${source.fileName}\n\n${source.text}`)}
            >
              {sourceId}
            </span>
          );
        }
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="h-full flex gap-1 relative"
      ref={containerRef}
    >
      {/* Sidebar: Sources */}
      <AnimatePresence initial={false}>
        {isSidebarOpen && (
          <motion.div 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: sidebarWidth, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: isDragging ? 0 : 0.2 }}
            className="flex flex-col bg-surface-container-lowest border border-outline-variant/30 rounded-2xl overflow-hidden shrink-0"
          >
            <div className="p-4 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container/30">
              <h2 className="font-semibold text-on-surface whitespace-nowrap">
                Nguồn dữ liệu <span className="text-primary text-sm font-bold ml-1">({selectedSourceIds.length}/{sources.length})</span>
              </h2>
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors" 
                title="Ẩn Nguồn"
              >
                left_panel_close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-2 py-4 space-y-2">
              <div className="px-2 pb-2 border-b border-outline-variant/20 flex flex-col gap-3">
                <select 
                  className="bg-surface-container text-sm text-on-surface font-medium focus:outline-none hover:bg-surface-container-high transition-colors cursor-pointer py-1.5 px-2 rounded-lg w-full"
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                >
                  <option value="all">Tất cả định dạng</option>
                  <option value="[Tài liệu]">Tài liệu (PDF, DOCX...)</option>
                  <option value="[Ảnh]">Hình ảnh</option>
                  <option value="[Video]">Video</option>
                  <option value="[Khác]">Khác</option>
                </select>

                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs font-medium text-on-surface-variant">
                    Lọc: {filteredSources.length} tài liệu
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        const filteredIds = filteredSources.map(s => s.id);
                        setSelectedSourceIds(prev => Array.from(new Set([...prev, ...filteredIds])));
                      }}
                      className="text-[11px] font-medium text-primary hover:bg-primary/10 px-2 py-1 rounded transition-colors"
                    >
                      Chọn hết
                    </button>
                    <button 
                      onClick={() => {
                        const filteredIds = filteredSources.map(s => s.id);
                        setSelectedSourceIds(prev => prev.filter(id => !filteredIds.includes(id)));
                      }}
                      className="text-[11px] font-medium text-error hover:bg-error/10 px-2 py-1 rounded transition-colors"
                    >
                      Bỏ chọn
                    </button>
                  </div>
                </div>
              </div>
              
              {filteredSources.length === 0 ? (
                <div className="text-center text-xs text-on-surface-variant py-8">
                  Không có tài liệu nào phù hợp.
                </div>
              ) : (
                <div className="space-y-1 mt-2">
                  {filteredSources.map((src) => {
                    const { icon, color } = getIconForTag(src.tag);
                    return (
                      <label key={src.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-surface-container/50 transition-colors cursor-pointer group">
                        <span className={`material-symbols-outlined text-[20px] ${color}`}>
                          {icon}
                        </span>
                        <span className="text-sm text-on-surface truncate flex-1" title={src.fileName}>
                          {src.fileName}
                        </span>
                        <input 
                          type="checkbox" 
                          checked={selectedSourceIds.includes(src.id)}
                          onChange={() => toggleSourceSelection(src.id)}
                          className="rounded border-outline-variant bg-surface-container text-primary focus:ring-primary/20 accent-primary cursor-pointer w-4 h-4" 
                        />
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resize Handle */}
      {isSidebarOpen && (
        <div 
          className={`w-1 cursor-col-resize flex-shrink-0 rounded-full transition-colors ${isDragging ? 'bg-primary' : 'hover:bg-primary/50'}`}
          onMouseDown={startResizing}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-surface-container-lowest border border-outline-variant/30 rounded-2xl overflow-hidden relative min-w-[300px]">
        {/* Toggle Sidebar Button (When closed) */}
        {!isSidebarOpen && (
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="absolute top-4 left-4 z-20 flex items-center justify-center w-8 h-8 bg-surface-container/80 backdrop-blur border border-outline-variant/30 rounded-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all"
            title="Mở Nguồn"
          >
            <span className="material-symbols-outlined text-[18px]">left_panel_open</span>
          </button>
        )}

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex items-center justify-between mb-8">
            <h1 className={`text-lg font-semibold text-on-surface flex items-center gap-2 ${!isSidebarOpen ? 'ml-10' : ''}`}>
              Cuộc trò chuyện
            </h1>
            <div className="flex items-center gap-2 text-on-surface-variant">
              <button className="material-symbols-outlined hover:text-on-surface transition-colors text-[20px]" title="Tùy chỉnh">tune</button>
              <button className="material-symbols-outlined hover:text-on-surface transition-colors text-[20px]" title="Tùy chọn khác">more_vert</button>
            </div>
          </div>

          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl p-4 ${
                msg.role === 'user' 
                  ? 'bg-primary text-on-primary rounded-tr-sm' 
                  : 'bg-surface-container text-on-surface rounded-tl-sm'
              }`}>
                <div className="whitespace-pre-wrap text-sm leading-relaxed">{renderMessageContent(msg.content, msg.sources)}</div>
                {msg.role === 'assistant' && (
                  <div className="mt-3 flex items-center gap-2 text-on-surface-variant">
                    <button className="p-1 hover:bg-on-surface/10 rounded-full transition-colors flex items-center justify-center" title="Sao chép">
                      <span className="material-symbols-outlined text-[16px]">content_copy</span>
                    </button>
                    <button className="p-1 hover:bg-on-surface/10 rounded-full transition-colors flex items-center justify-center" title="Thích">
                      <span className="material-symbols-outlined text-[16px]">thumb_up</span>
                    </button>
                    <button className="p-1 hover:bg-on-surface/10 rounded-full transition-colors flex items-center justify-center" title="Không thích">
                      <span className="material-symbols-outlined text-[16px]">thumb_down</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-surface-container-lowest border-t border-outline-variant/30 flex flex-col gap-2">
          {/* Active Sources Indicator */}
          <div className="flex items-center justify-center gap-2">
            <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1 ${selectedSourceIds.length > 0 ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error'}`}>
              <span className="material-symbols-outlined text-[14px]">
                {selectedSourceIds.length > 0 ? 'library_books' : 'warning'}
              </span>
              {selectedSourceIds.length > 0 
                ? `AI sẽ suy luận dựa trên ${selectedSourceIds.length} tài liệu đã chọn`
                : 'Bạn phải chọn ít nhất 1 tài liệu để AI có thể đọc'}
            </span>
          </div>
          
          <div className="relative max-w-4xl mx-auto w-full">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Đặt câu hỏi hoặc tạo nội dung"
              className="w-full bg-surface-container py-3 pl-4 pr-12 rounded-full text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-1 focus:ring-primary/50 transition-shadow"
            />
            <button 
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading || selectedSourceIds.length === 0}
              title={selectedSourceIds.length === 0 ? "Vui lòng chọn ít nhất 1 nguồn" : "Gửi"}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface hover:bg-primary hover:text-on-primary transition-colors disabled:opacity-50 disabled:hover:bg-surface-container-highest disabled:hover:text-on-surface"
            >
              {isLoading ? (
                <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
              ) : (
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              )}
            </button>
          </div>
          <p className="text-center text-[10px] text-on-surface-variant mt-2">
            AI có thể đưa ra thông tin không chính xác nên hãy kiểm tra kỹ câu trả lời mà bạn nhận được.
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectAIChat;
