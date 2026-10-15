import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  chatService,
  type DocumentInfo,
  type SourceCitation,
} from '../services/chatService';
import { useChatSessions } from '../hooks/useChatSessions';
import { useChatMessages } from '../hooks/useChatMessages';
import { useChatStreaming } from '../hooks/useChatStreaming';
import { useResizableSidebar } from '../hooks/useResizableSidebar';
import { useChatCitations } from '../hooks/useChatCitations';
import { ChatHeader } from '../components/chat/ChatHeader';
import { ChatWelcome } from '../components/chat/ChatWelcome';
import { ChatSessionList } from '../components/chat/ChatSessionList';
import { ChatSidebar } from '../components/chat/ChatSidebar';
import { ChatMessageItem } from '../components/chat/ChatMessageItem';
import { ChatInput } from '../components/chat/ChatInput';

const SCROLL_THRESHOLD_PX = 100;
const INFINITE_SCROLL_UP_THRESHOLD_PX = 60;

/**
 * ProjectAIChat Page Component
 * Main user interface for AI-assisted knowledge base chat.
 * Integrates URL-synced conversation sessions, paginated message history with
 * upwards infinite scrolling, real-time SSE streaming, and grounded document citations.
 */
const ProjectAIChat: React.FC = () => {
  const { projectId, sessionId } = useParams<{ projectId: string; sessionId?: string }>();
  const navigate = useNavigate();

  const {
    sessions,
    currentSessionId,
    fetchSessions,
    renameSession,
    deleteSession,
    togglePinSession,
    updateSessionTitleLocally,
    touchSessionActivityLocally,
  } = useChatSessions(projectId, sessionId);

  const containerRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isAutoScrollingRef = useRef(true);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (chatContainerRef.current) {
      requestAnimationFrame(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTo({
            top: chatContainerRef.current.scrollHeight,
            behavior,
          });
        }
      });
    }
  }, []);

  const {
    messages,
    setMessages,
    hasMore,
    isLoadingInitial,
    isLoadingMore,
    isChatReady,
    loadOlderMessages,
    skipNextSessionFetch,
  } = useChatMessages({
    projectId,
    sessionId: currentSessionId,
    chatContainerRef,
    scrollToBottom,
  });

  const [sources, setSources] = useState<DocumentInfo[]>([]);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  const [sourceFilter, setSourceFilter] = useState('all');
  const [isSessionsOpen, setIsSessionsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const { sidebarWidth, isDragging, startResizing } = useResizableSidebar(containerRef);
  const { activeCitation, openCitation, openSource, clearCitation } = useChatCitations(projectId, sources);

  const handleNewSessionCreated = useCallback(
    (newSessionId: string) => {
      navigate(`/projects/${projectId}/chat/${newSessionId}`, { replace: true });
    },
    [projectId, navigate]
  );

  const {
    isStreaming,
    handleSendMessage,
    handleEditMessage,
    handleStopStreaming,
  } = useChatStreaming({
    projectId,
    currentSessionId,
    selectedSourceIds,
    messages,
    setMessages,
    touchSessionActivityLocally,
    updateSessionTitleLocally,
    fetchSessions,
    skipNextSessionFetch,
    scrollToBottom,
    isAutoScrollingRef,
    onNewSessionCreated: handleNewSessionCreated,
  });

  const currentSession = useMemo(() => {
    return sessions.find((s) => s.id === currentSessionId);
  }, [sessions, currentSessionId]);

  const globalSources = useMemo(() => {
    const map = new Map<number, SourceCitation>();
    messages.forEach((msg) => {
      msg.sources?.forEach((src) => {
        map.set(src.sourceId, src);
      });
    });
    return Array.from(map.values());
  }, [messages]);

  const handleScroll = useCallback(() => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < SCROLL_THRESHOLD_PX;
      setShowScrollButton(!isAtBottom);
      isAutoScrollingRef.current = isAtBottom;

      if (
        scrollTop < INFINITE_SCROLL_UP_THRESHOLD_PX &&
        hasMore &&
        !isLoadingMore &&
        !isLoadingInitial &&
        !isStreaming
      ) {
        loadOlderMessages();
      }
    }
  }, [hasMore, isLoadingMore, isLoadingInitial, isStreaming, loadOlderMessages]);

  useEffect(() => {
    if (!projectId) return;

    const initData = async () => {
      try {
        const docs = await chatService.getProjectDocuments(projectId);
        setSources(docs);
        setSelectedSourceIds(docs.map((d) => d.id));
        await fetchSessions();
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu khởi tạo:', err);
      }
    };

    initData();
  }, [projectId, fetchSessions]);

  const handleCreateNewChat = () => {
    if (messages.length === 0) {
      toast('Đoạn chat hiện tại chưa có tin nhắn nào', { icon: 'ℹ️' });
      return;
    }
    if (isStreaming) handleStopStreaming();
    setIsSessionsOpen(false);
    navigate(`/projects/${projectId}/chat`);
  };

  const handleDeleteSession = async (id: string) => {
    await deleteSession(id);
    if (currentSessionId === id) {
      navigate(`/projects/${projectId}/chat`);
    }
  };

  const onSubmitMessage = () => {
    const text = inputValue;
    setInputValue('');
    handleSendMessage(text);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full flex gap-0 relative"
      ref={containerRef}
    >
      {/* Knowledge Base Sources Sidebar */}
      <AnimatePresence initial={false}>
        {isSidebarOpen && (
          <ChatSidebar
            isSidebarOpen={isSidebarOpen}
            sidebarWidth={sidebarWidth}
            isDragging={isDragging}
            sources={sources}
            selectedSourceIds={selectedSourceIds}
            sourceFilter={sourceFilter}
            activeCitation={activeCitation}
            onCloseSidebar={() => setIsSidebarOpen(false)}
            onFilterChange={setSourceFilter}
            onToggleSelectSource={(id) =>
              setSelectedSourceIds((prev) =>
                prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
              )
            }
            onSelectAllSources={(checked) => {
              const filteredIds = sources
                .filter((s) => sourceFilter === 'all' || s.tag === sourceFilter)
                .map((s) => s.id);
              setSelectedSourceIds((prev) =>
                checked
                  ? Array.from(new Set([...prev, ...filteredIds]))
                  : prev.filter((id) => !filteredIds.includes(id))
              );
            }}
            onOpenSource={openSource}
            onBackFromCitation={clearCitation}
          />
        )}
      </AnimatePresence>

      {/* Resize Handle Divider */}
      {isSidebarOpen && (
        <div
          className={`w-1 cursor-col-resize flex-shrink-0 rounded-full transition-colors ${
            isDragging ? 'bg-primary' : 'hover:bg-primary/50'
          }`}
          onMouseDown={startResizing}
        />
      )}

      {/* Main Chat Canvas Area */}
      <div className="flex-1 flex flex-col bg-surface-container-lowest rounded-2xl overflow-hidden relative min-w-[300px] border border-outline-variant/30">
        {/* Sliding History Drawer */}
        <AnimatePresence>
          {isSessionsOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setIsSessionsOpen(false)}
                className="absolute inset-0 bg-black/35 backdrop-blur-[2px] z-30"
              />

              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 26, stiffness: 280 }}
                className="absolute top-0 bottom-0 right-0 z-40 w-[280px] max-w-[85%] shadow-2xl overflow-hidden"
              >
                <ChatSessionList
                  sessions={sessions}
                  currentSessionId={currentSessionId}
                  onSelectSession={(id) => {
                    if (isStreaming) handleStopStreaming();
                    setIsSessionsOpen(false);
                    navigate(`/projects/${projectId}/chat/${id}`);
                  }}
                  onRenameSession={(id, title) => renameSession(id, title)}
                  onDeleteSession={handleDeleteSession}
                  onTogglePinSession={(id, pinned) => togglePinSession(id, pinned)}
                  onClose={() => setIsSessionsOpen(false)}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Top Header Navigation Bar */}
        <ChatHeader
          title={currentSession?.title}
          isSidebarOpen={isSidebarOpen}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          isSessionsOpen={isSessionsOpen}
          onToggleSessions={() => setIsSessionsOpen(!isSessionsOpen)}
          onNewChat={handleCreateNewChat}
          canCreateNewChat={messages.length > 0 && !isStreaming}
        />

        {/* Message Thread History */}
        <div
          ref={chatContainerRef}
          onScroll={handleScroll}
          className={`flex-1 overflow-y-auto relative py-6 px-6 transition-opacity duration-300 ${
            isChatReady ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="max-w-[800px] mx-auto w-full h-full flex flex-col">
            {isLoadingInitial ? (
              <div className="flex-1 flex items-center justify-center">
                <span className="material-symbols-outlined text-[28px] animate-spin text-primary">
                  progress_activity
                </span>
              </div>
            ) : messages.length === 0 ? (
              <ChatWelcome />
            ) : (
              <div className="space-y-6 pt-2">
                {/* Older Messages Loading Indicator / Trigger */}
                {hasMore && (
                  <div className="flex justify-center py-2">
                    {isLoadingMore ? (
                      <div className="flex items-center gap-2 text-[12px] text-on-surface-variant bg-surface-container/60 px-3 py-1.5 rounded-full border border-outline-variant/30 shadow-xs">
                        <span className="material-symbols-outlined text-[16px] animate-spin text-primary">
                          progress_activity
                        </span>
                        <span>Đang tải tin nhắn cũ hơn...</span>
                      </div>
                    ) : (
                      <button
                        onClick={loadOlderMessages}
                        className="text-[12px] text-primary hover:underline font-medium py-1 px-3 rounded-full hover:bg-surface-container-high transition-colors"
                      >
                        Tải thêm tin nhắn cũ hơn
                      </button>
                    )}
                  </div>
                )}

                {messages.map((msg, idx) => (
                  <ChatMessageItem
                    key={msg.id || idx}
                    msg={msg}
                    index={idx}
                    globalSources={globalSources}
                    onCitationClick={openCitation}
                    onEditMessage={handleEditMessage}
                  />
                ))}
              </div>
            )}

            {isStreaming && <div className="h-[50vh] shrink-0 pointer-events-none" />}
          </div>
        </div>

        {/* Floating Quick Scroll to Bottom Button */}
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
              className="absolute bottom-24 left-1/2 z-20 flex items-center justify-center w-9 h-9 bg-surface-container-high border border-outline-variant/40 rounded-full text-on-surface shadow-md hover:bg-surface-container-highest transition-colors"
              title="Cuộn xuống dưới cùng"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Chat Prompt Input Section */}
        <ChatInput
          inputValue={inputValue}
          onInputChange={setInputValue}
          onSendMessage={onSubmitMessage}
          onStopStreaming={handleStopStreaming}
          isStreaming={isStreaming}
          selectedSourcesCount={selectedSourceIds.length}
        />
      </div>
    </motion.div>
  );
};

export default ProjectAIChat;