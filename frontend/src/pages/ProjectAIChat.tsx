import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const TypewriterMarkdown = ({ content, sources, onCitationClick, isTyping, onTypingComplete, onContentChange }: any) => {
  const [displayedLength, setDisplayedLength] = useState(isTyping ? 0 : content.length);
  const animFrameRef = useRef<number | null>(null);
  const lastScrollTime = useRef<number>(0);

  useEffect(() => {
    if (!isTyping) {
      setDisplayedLength(content.length);
      return;
    }

    setDisplayedLength(0);
    let currentIndex = 0;
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const delta = currentTime - lastTime;

      // Đồng bộ theo tần số khung hình (~60fps)
      if (delta >= 16) {
        // Tự động scale: text càng dài thì gõ càng nhanh
        const remaining = content.length - currentIndex;
        const step = Math.max(2, Math.min(8, Math.ceil(remaining / 35)));

        currentIndex = Math.min(currentIndex + step, content.length);
        setDisplayedLength(currentIndex);
        lastTime = currentTime;

        // Giảm tần suất gọi scroll (throttle ~50ms/lần)
        if (onContentChange && currentTime - lastScrollTime.current > 50) {
          onContentChange();
          lastScrollTime.current = currentTime;
        }
      }

      if (currentIndex < content.length) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        if (onTypingComplete) onTypingComplete();
        if (onContentChange) onContentChange();
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [content, isTyping]);

  const rawDisplayedText = useMemo(() => {
    return content.substring(0, displayedLength);
  }, [content, displayedLength]);

  const processedContent = useMemo(() => {
    return rawDisplayedText.replace(/\[(\d+)\]/g, (match: string, idStr: string) => {
      const id = parseInt(idStr);
      if (sources && sources.some((s: any) => s.sourceId === id)) {
        return `[${id}](#citation-${id})`;
      }
      return match;
    });
  }, [rawDisplayedText, sources]);

  return (
    <div className="prose prose-sm dark:prose-invert max-w-none break-words relative">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ node, href, children, ...props }: any) => {
            if (href?.startsWith('#citation-')) {
              const sourceId = parseInt(href.replace('#citation-', ''));
              const source = sources?.find((s: any) => s.sourceId === sourceId);
              if (source) {
                return (
                  <span
                    onClick={(e) => { e.preventDefault(); onCitationClick(source); }}
                    className="inline-flex items-center justify-center bg-primary/10 text-primary rounded-full px-1.5 py-0 text-[11px] cursor-pointer hover:bg-primary/20 mx-1 align-middle border border-primary/20 font-medium"
                    title={`Nguồn: ${source.fileName}`}
                  >
                    {children}
                  </span>
                );
              }
            }
            return <a href={href} className="text-primary hover:underline" target="_blank" {...props}>{children}</a>;
          },
          blockquote: ({ node, children, ...props }: any) => {
            const textContent = node.children?.[0]?.children?.[0]?.value || '';
            const isThinkingBlock = textContent.includes('Tư duy hệ thống') ||
              textContent.includes('Tư duy') ||
              (node.children && node.children.some((c: any) => c.children && c.children.some((cc: any) => cc.value?.includes('Tư duy'))));

            if (isThinkingBlock) {
              return (
                <div className="my-4 border border-outline-variant/30 bg-surface-container-low rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-surface-container-high px-4 py-2 text-xs font-semibold text-on-surface flex items-center gap-2 border-b border-outline-variant/30">
                    <span className="material-symbols-outlined text-[16px] text-primary">psychology</span>
                    Quá trình suy luận (Neurology)
                  </div>
                  <div className="p-4 text-sm text-on-surface-variant italic leading-relaxed">
                    {children}
                  </div>
                </div>
              );
            }
            return <blockquote className="border-l-4 border-primary pl-4 italic text-on-surface-variant my-4" {...props}>{children}</blockquote>;
          },
          code({ node, inline, className, children, ...props }: any) {
            return (
              <code className={inline ? "bg-surface-container-high px-1.5 py-0.5 rounded text-primary text-[13px]" : "block bg-surface-container-high p-3 rounded-lg text-[13px] overflow-x-auto text-on-surface"} {...props}>
                {children}
              </code>
            );
          }
        }}
      >
        {processedContent}
      </ReactMarkdown>

      {/* Con trỏ nhấp nháy mô phỏng đang gõ */}
      {isTyping && displayedLength < content.length && (
        <span className="inline-block w-1.5 h-4 ml-1 bg-primary align-middle animate-pulse" />
      )}
    </div>
  );
};

const ChatMessage = React.memo(({ msg, idx, openCitation, setMessages }: any) => {
  return (
    <div id={`message-${idx}`} className={`scroll-mt-6 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
     <div 
  style={msg.minHeight ? { minHeight: `${msg.minHeight}px` } : undefined}
  className={`max-w-[85%] rounded-2xl transition-all duration-300 ${
    msg.role === 'user'
      ? 'bg-primary text-on-primary rounded-tr-sm p-4'
      : msg.isLoading
        ? 'bg-transparent text-on-surface py-2'
        : 'bg-surface-container text-on-surface rounded-tl-sm p-4'
  }`}
>

        {msg.role === 'assistant' ? (
          <div className="text-sm leading-relaxed">
            {msg.isLoading ? (
              <div className="flex items-center gap-2 py-2 text-on-surface-variant">
                <span className="material-symbols-outlined text-[18px] animate-spin text-primary">progress_activity</span>
                <span className="text-xs italic">Đang suy nghĩ...</span>
              </div>
            ) : (
              <TypewriterMarkdown
                content={msg.content}
                sources={msg.sources}
                onCitationClick={openCitation}
                isTyping={msg.isTyping}
                onContentChange={() => {
                  // Giữ nguyên vị trí để người dùng thoải mái theo dõi từ đầu
                }}
                onTypingComplete={() => {
                  setMessages((prev: any) => {
                    const newMsg = [...prev];
                    if (newMsg[idx]) newMsg[idx].isTyping = false;
                    return newMsg;
                  });
                }}
              />
            )}
          </div>
        ) : (
          <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</div>
        )}

        {msg.role === 'assistant' && !msg.isLoading && (
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
  );
});

interface DocumentInfo {
  id: string;
  fileName: string;
  fileType: string;
  tag: string;
  status: string;
}

const ProjectAIChat: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string, sources?: any[], isTyping?: boolean, isLoading?: boolean, minHeight?: number }>>([
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

  const [activeCitation, setActiveCitation] = useState<{
    documentId?: string;
    fileName: string;
    chunkText: string;
    fullText?: string;
    mediaUrl?: string;
    isLoadingFullText?: boolean;
    tag?: string;
  } | null>(null);

  // Resize State
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isDragging, setIsDragging] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Scrolling State
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const isAutoScrollingRef = useRef(true);
  const isFirstLoadRef = useRef(true);
  const [isChatReady, setIsChatReady] = useState(false);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (chatContainerRef.current) {
      requestAnimationFrame(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTo({
            top: chatContainerRef.current.scrollHeight,
            behavior
          });
        }
      });
    }
  }, []);

  const handleScroll = useCallback(() => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isAtBottom);
      isAutoScrollingRef.current = isAtBottom;
    }
  }, []);

  // Xử lý cuộn thông minh: đẩy tin nhắn user vừa gửi lên trên cùng
  useEffect(() => {
  if (!isFirstLoadRef.current && messages.length > 0) {
    const timer = setTimeout(() => {
      const lastIndex = messages.length - 1;
      const lastMsg = messages[lastIndex];

      // Nhịp 1: Khi vừa gửi & đang suy nghĩ -> cuộn xuống đáy, KHÔNG tạo minHeight -> nằm im, vuốt không lên
      if (lastMsg.role === 'assistant' && lastMsg.isLoading) {
        scrollToBottom('smooth');
      } 
      // Nhịp 2: Khi CÓ KẾT QUẢ từ Backend -> LÚC NÀY MỚI NỞ CHIỀU CAO để hất tin nhắn lên góc
      else if (lastMsg.role === 'assistant' && !lastMsg.isLoading && lastMsg.isTyping) {
        const userMsgIndex = lastIndex - 1;
        const userEl = document.getElementById(`message-${userMsgIndex}`);
        const container = chatContainerRef.current;

        if (userEl && container) {
          // Tính chiều cao còn thiếu để vừa khít màn hình
          const availableHeight = container.clientHeight - userEl.offsetHeight - 48;
          const calculatedMinHeight = Math.max(120, availableHeight);

          if (lastMsg.minHeight !== calculatedMinHeight) {
            setMessages((prev: any) => {
              const updated = [...prev];
              if (updated[lastIndex]) {
                updated[lastIndex] = { ...updated[lastIndex], minHeight: calculatedMinHeight };
              }
              return updated;
            });
          }

          // Hất tin nhắn lên sát nóc rồi DỪNG LẠI
          container.scrollTo({
            top: userEl.offsetTop - 20,
            behavior: 'smooth'
          });
        }
      }
    }, 60);

    return () => clearTimeout(timer);
  }
}, [messages, scrollToBottom]); // Nhớ để dependency là [messages, scrollToBottom]

  // Đặt lại cờ khi đổi dự án
  useEffect(() => {
    isFirstLoadRef.current = true;
    isAutoScrollingRef.current = true;
    setIsChatReady(false);
  }, [projectId]);

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
      } finally {
        setTimeout(() => {
          scrollToBottom('auto');
          setIsChatReady(true);
          isFirstLoadRef.current = false;
        }, 300);
      }
    };

    if (projectId) {
      fetchDocuments();
      fetchHistory();
    }
  }, [projectId, scrollToBottom]);

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

  // Fetch full text / media URL khi activeCitation thay đổi
  useEffect(() => {
    const fetchFullText = async () => {
      if (!activeCitation || !activeCitation.documentId) return;

      try {
        const token = localStorage.getItem('token');

        let fullText = activeCitation.fullText;
        if (!fullText) {
          const res = await fetch(`http://localhost:8080/api/projects/${projectId}/documents/${activeCitation.documentId}/content`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            fullText = data.data.content;
          }
        }

        let mediaUrl = activeCitation.mediaUrl;
        if ((activeCitation.tag === '[Ảnh]' || activeCitation.tag === '[Video]') && !mediaUrl) {
          const res = await fetch(`http://localhost:8080/api/projects/${projectId}/documents/${activeCitation.documentId}/download-url?preview=true`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            mediaUrl = data.data.downloadUrl;
          }
        }

        setActiveCitation(prev => prev ? { ...prev, fullText, mediaUrl, isLoadingFullText: false } : null);
      } catch (err) {
        console.error("Failed to fetch full text or media", err);
        setActiveCitation(prev => prev ? { ...prev, isLoadingFullText: false } : null);
      }
    };

    if (activeCitation && activeCitation.isLoadingFullText) {
      fetchFullText();
    }
  }, [activeCitation, projectId]);

  // Highlight chunk auto-scroll
  useEffect(() => {
    if (activeCitation && activeCitation.fullText && !activeCitation.isLoadingFullText) {
      const timer = setTimeout(() => {
        const el = document.getElementById('highlight-chunk');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [activeCitation?.fullText, activeCitation?.isLoadingFullText]);

  // Gửi tin nhắn và kích hoạt cuộn ngay lập tức
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue;
    setInputValue('');
    setIsLoading(true);

    // Đẩy cả tin nhắn user và placeholder của AI vào cùng lúc
    setMessages(prev => [
      ...prev,
      { role: 'user', content: userMessage },
      { role: 'assistant', content: '', isTyping: true, isLoading: true }
    ]);

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
          documentIds: selectedSourceIds
        })
      });

      if (!response.ok) {
        throw new Error('API Error');
      }

      const data = await response.json();

      // Cập nhật lại nội dung khi Backend phản hồi
      setMessages(prev => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        updated[lastIndex] = {
          role: 'assistant',
          content: data.response,
          sources: data.sources,
          isTyping: true,
          isLoading: false
        };
        return updated;
      });
    } catch (error) {
      setMessages(prev => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        updated[lastIndex] = {
          role: 'assistant',
          content: 'Lỗi: Không thể kết nối đến AI. Hãy kiểm tra lại API Key hoặc mạng.',
          isTyping: false,
          isLoading: false
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSources = sources.filter(src => sourceFilter === 'all' || src.tag === sourceFilter);
  const toggleSourceSelection = (id: string) => {
    setSelectedSourceIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const getIconForTag = (tag: string) => {
    switch (tag) {
      case '[Tài liệu]': return { icon: 'description', color: 'text-info' };
      case '[Ảnh]': return { icon: 'image', color: 'text-warning' };
      case '[Video]': return { icon: 'movie', color: 'text-error' };
      default: return { icon: 'draft', color: 'text-on-surface-variant' };
    }
  };

  const openCitation = useCallback((source: any) => {
    const matchedDoc = sources.find(d => d.fileName === source.fileName || d.id === source.documentId);

    setActiveCitation({
      documentId: matchedDoc?.id || source.documentId,
      fileName: source.fileName,
      chunkText: source.text,
      tag: matchedDoc?.tag || '[Tài liệu]',
      isLoadingFullText: true
    });
    setIsSidebarOpen(true);
  }, [sources]);

  const openSource = (src: any) => {
    setActiveCitation({
      documentId: src.id,
      fileName: src.fileName,
      chunkText: '',
      tag: src.tag,
      isLoadingFullText: true
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
            {activeCitation ? (
              <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-200">
                <div className="p-4 flex justify-between items-start">
                  <div className="flex flex-col gap-1 overflow-hidden">
                    <div className="flex items-center gap-2 text-xs text-on-surface-variant cursor-pointer hover:text-on-surface transition-colors" onClick={() => setActiveCitation(null)}>
                      <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                      Nguồn
                    </div>
                    <h2 className="text-lg font-semibold text-on-surface truncate mt-2" title={activeCitation.fileName}>
                      {activeCitation.fileName}
                    </h2>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 pb-6">
                  {activeCitation.isLoadingFullText ? (
                    <div className="flex flex-col items-center justify-center h-32 gap-3 text-on-surface-variant">
                      <span className="material-symbols-outlined animate-spin text-[32px] text-primary">refresh</span>
                      <span className="text-sm">Đang tải dữ liệu...</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activeCitation.tag === '[Ảnh]' && activeCitation.mediaUrl && (
                        <div className="rounded-sm overflow-hidden border border-outline-variant/30 bg-surface-container flex justify-center">
                          <img src={activeCitation.mediaUrl} alt={activeCitation.fileName} className="max-h-64 object-contain" />
                        </div>
                      )}

                      {activeCitation.tag === '[Video]' && activeCitation.mediaUrl && (
                        <div className="rounded-xl overflow-hidden border border-outline-variant/30 bg-black flex justify-center">
                          <video src={activeCitation.mediaUrl} controls className="w-full max-h-64 object-contain" />
                        </div>
                      )}

                      {activeCitation.fullText ? (
                        <div className="text-[14.5px] text-on-surface leading-[1.7] whitespace-pre-wrap font-sans p-3 bg-surface-container/30 rounded-xl border border-outline-variant/20">
                          {(() => {
                            const chunk = activeCitation.chunkText.trim();
                            let index = activeCitation.fullText!.indexOf(chunk);

                            if (index === -1) {
                              const smallChunk = chunk.substring(0, Math.min(chunk.length, 50));
                              index = activeCitation.fullText!.indexOf(smallChunk);
                            }

                            if (index === -1) {
                              return activeCitation.fullText;
                            }

                            const before = activeCitation.fullText!.substring(0, index);
                            const highlight = activeCitation.fullText!.substring(index, index + chunk.length);
                            const after = activeCitation.fullText!.substring(index + chunk.length);

                            return (
                              <>
                                {before}
                                <mark id="highlight-chunk" className="bg-primary/30 text-on-surface px-1 py-0.5 rounded shadow-sm">
                                  {highlight}
                                </mark>
                                {after}
                              </>
                            );
                          })()}
                        </div>
                      ) : (
                        <div className="text-[14.5px] text-on-surface leading-[1.7] whitespace-pre-wrap font-sans p-3 bg-surface-container/30 rounded-xl border border-outline-variant/20">
                          <span className="bg-primary/20 text-on-surface px-1 py-0.5 rounded inline-block">
                            {activeCitation.chunkText}
                          </span>
                          {activeCitation.tag !== '[Video]' && activeCitation.tag !== '[Ảnh]' && (
                            <p className="text-xs text-error mt-4 italic text-center opacity-80">
                              * Không thể tải văn bản gốc cho tài liệu này.
                              Có thể do tài liệu được tải lên trước khi hệ thống hỗ trợ trích xuất Full Text.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full">
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
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <span className="text-xs font-medium text-on-surface">Tất cả</span>
                        <input
                          type="checkbox"
                          checked={filteredSources.length > 0 && filteredSources.every(s => selectedSourceIds.includes(s.id))}
                          onChange={(e) => {
                            const filteredIds = filteredSources.map(s => s.id);
                            if (e.target.checked) {
                              setSelectedSourceIds(prev => Array.from(new Set([...prev, ...filteredIds])));
                            } else {
                              setSelectedSourceIds(prev => prev.filter(id => !filteredIds.includes(id)));
                            }
                          }}
                          className="rounded border-outline-variant bg-surface-container text-primary focus:ring-primary/20 accent-primary cursor-pointer w-4 h-4"
                        />
                      </label>
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
                          <div
                            key={src.id}
                            onClick={() => openSource(src)}
                            className="flex items-center gap-2 p-2 rounded-lg hover:bg-surface-container/50 transition-colors cursor-pointer group"
                          >
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
                              onClick={(e) => e.stopPropagation()}
                              className="rounded border-outline-variant bg-surface-container text-primary focus:ring-primary/20 accent-primary cursor-pointer w-4 h-4 shrink-0"
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {isSidebarOpen && (
        <div
          className={`w-1 cursor-col-resize flex-shrink-0 rounded-full transition-colors ${isDragging ? 'bg-primary' : 'hover:bg-primary/50'}`}
          onMouseDown={startResizing}
        />
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-surface-container-lowest rounded-2xl overflow-hidden relative min-w-[300px]">
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
        <div
          ref={chatContainerRef}
          onScroll={handleScroll}
          className={`flex-1 overflow-y-auto relative py-6 pr-6 ${!isSidebarOpen ? 'pl-16' : 'pl-6'} transition-opacity duration-300 ${isChatReady ? 'opacity-100' : 'opacity-0'}`}
        >
          <div className="max-w-5xl mx-auto w-full space-y-6">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-lg font-semibold text-on-surface flex items-center gap-2">
                Cuộc trò chuyện
              </h1>
              <div className="flex items-center gap-2 text-on-surface-variant">
                <button className="material-symbols-outlined hover:text-on-surface transition-colors text-[20px]" title="Tùy chỉnh">tune</button>
                <button className="material-symbols-outlined hover:text-on-surface transition-colors text-[20px]" title="Tùy chọn khác">more_vert</button>
              </div>
            </div>

            {messages.map((msg, idx) => (
              <ChatMessage
                key={idx}
                msg={msg}
                idx={idx}
                openCitation={openCitation}
                setMessages={setMessages}
              />
            ))}
          </div>
        </div>

        {/* Scroll to bottom button */}
        <AnimatePresence>
          {showScrollButton && (
            <motion.button
              initial={{ opacity: 0, y: 10, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: 10, x: '-50%' }}
              onClick={() => {
                isAutoScrollingRef.current = true;
                scrollToBottom();
              }}
              className="absolute bottom-24 left-1/2 z-30 flex items-center justify-center w-10 h-10 bg-surface-container-high border border-outline-variant/30 rounded-full text-on-surface shadow-md hover:bg-surface-container-highest transition-colors"
              title="Cuộn xuống dưới cùng"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_downward</span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Input Area */}
        <div className="p-4 bg-surface-container-lowest flex flex-col">
          <div className="relative max-w-4xl mx-auto w-full flex items-end bg-surface-container rounded-3xl focus-within:ring-1 focus-within:ring-primary/50 transition-shadow">
            <textarea
              rows={1}
              value={inputValue}
              onChange={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 150)}px`;
                setInputValue(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (inputValue.trim() && !isLoading && selectedSourceIds.length > 0) {
                    handleSendMessage();
                    e.currentTarget.style.height = 'auto';
                  }
                }
              }}
              placeholder="Đặt câu hỏi hoặc tạo nội dung"
              className="flex-1 bg-transparent py-3 pl-4 pr-2 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none resize-none overflow-y-auto max-h-[150px] min-h-[44px]"
            />

            <div className="flex-shrink-0 mr-2 mb-[10px] flex items-center">
              <span className={`text-[11px] font-medium px-2 py-1 rounded-full flex items-center gap-1 ${selectedSourceIds.length > 0 ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error'}`}>
                {selectedSourceIds.length > 0
                  ? `${selectedSourceIds.length} nguồn`
                  : 'Chưa chọn nguồn'}
              </span>
            </div>

            <button
              onClick={() => {
                handleSendMessage();
                const textarea = document.querySelector('textarea');
                if (textarea) textarea.style.height = 'auto';
              }}
              disabled={!inputValue.trim() || isLoading || selectedSourceIds.length === 0}
              title={selectedSourceIds.length === 0 ? "Vui lòng chọn ít nhất 1 nguồn" : "Gửi"}
              className="flex-shrink-0 mr-2 mb-[6px] w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface hover:bg-primary hover:text-on-primary transition-colors disabled:opacity-50 disabled:hover:bg-surface-container-highest disabled:hover:text-on-surface"
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