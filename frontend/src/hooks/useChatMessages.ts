import { useState, useEffect, useCallback, useRef } from 'react';
import { chatService, type ChatMessageData } from '../services/chatService';

interface UseChatMessagesProps {
  projectId?: string;
  sessionId: string | null;
  chatContainerRef: React.RefObject<HTMLDivElement | null>;
  scrollToBottom: (behavior?: ScrollBehavior) => void;
}

/**
 * Custom Hook managing message history for the active chat session.
 * Supports initial paginated batch loading and seamless infinite scrolling upwards.
 */
export const useChatMessages = ({
  projectId,
  sessionId,
  chatContainerRef,
  scrollToBottom,
}: UseChatMessagesProps) => {
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isChatReady, setIsChatReady] = useState(false);

  const skipFetchRef = useRef<string | null>(null);

  const skipNextSessionFetch = useCallback((id: string) => {
    skipFetchRef.current = id;
  }, []);

  useEffect(() => {
    if (!projectId || !sessionId) {
      setMessages([]);
      setHasMore(false);
      setPage(0);
      setIsChatReady(true);
      return;
    }

    if (skipFetchRef.current === sessionId) {
      skipFetchRef.current = null;
      setPage(0);
      setIsChatReady(true);
      return;
    }

    let isMounted = true;
    setIsChatReady(false);
    setIsLoadingInitial(true);

    const loadInitialMessages = async () => {
      try {
        const res = await chatService.getSessionMessages(projectId, sessionId, 0, 20);
        if (isMounted) {
          setMessages(res.messages);
          setHasMore(res.hasMore);
          setPage(0);
        }
      } catch (err) {
        console.error('Lỗi khi tải tin nhắn phiên:', err);
      } finally {
        if (isMounted) {
          setIsLoadingInitial(false);
          setTimeout(() => {
            scrollToBottom('auto');
            setIsChatReady(true);
          }, 100);
        }
      }
    };

    loadInitialMessages();

    return () => {
      isMounted = false;
    };
  }, [projectId, sessionId, scrollToBottom]);

  const loadOlderMessages = useCallback(async () => {
    if (!projectId || !sessionId || isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);

    const container = chatContainerRef.current;
    const prevScrollHeight = container ? container.scrollHeight : 0;
    const prevScrollTop = container ? container.scrollTop : 0;

    try {
      const nextPage = page + 1;
      const res = await chatService.getSessionMessages(projectId, sessionId, nextPage, 20);
      if (res.messages.length > 0) {
        setMessages((prev) => [...res.messages, ...prev]);
        setPage(nextPage);
      }
      setHasMore(res.hasMore);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (container) {
            const newScrollHeight = container.scrollHeight;
            container.scrollTop = newScrollHeight - prevScrollHeight + prevScrollTop;
          }
        });
      });
    } catch (err) {
      console.error('Lỗi khi tải thêm tin nhắn cũ:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [projectId, sessionId, page, isLoadingMore, hasMore, chatContainerRef]);

  return {
    messages,
    setMessages,
    hasMore,
    isLoadingInitial,
    isLoadingMore,
    isChatReady,
    loadOlderMessages,
    skipNextSessionFetch,
  };
};
