import { useState, useRef, useCallback } from 'react';
import { chatService, type ChatMessageData } from '../services/chatService';

interface UseChatStreamingProps {
  projectId?: string;
  currentSessionId: string | null;
  selectedSourceIds: string[];
  messages: ChatMessageData[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessageData[]>>;
  touchSessionActivityLocally: (id: string) => void;
  updateSessionTitleLocally: (id: string, title: string) => void;
  fetchSessions: () => Promise<void>;
  skipNextSessionFetch: (id: string) => void;
  scrollToBottom: (behavior?: ScrollBehavior) => void;
  isAutoScrollingRef: React.MutableRefObject<boolean>;
  onNewSessionCreated?: (newSessionId: string) => void;
}

/**
 * Custom Hook managing SSE streaming lifecycle for user prompts and edited messages.
 */
export const useChatStreaming = ({
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
  onNewSessionCreated,
}: UseChatStreamingProps) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleStopStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
  }, []);

  const handleSendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming || !projectId) return;

      const userText = text.trim();
      setIsStreaming(true);

      if (currentSessionId) {
        touchSessionActivityLocally(currentSessionId);
      }

      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      const userMsgIndex = messages.length;

      setMessages((prev) => [
        ...prev,
        { role: 'user', content: userText },
        { role: 'assistant', content: '', sources: [], isLoading: true, isStreaming: true },
      ]);

      setTimeout(() => {
        const userMessageEl = document.getElementById(`message-${userMsgIndex}`);
        if (userMessageEl) {
          userMessageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (isAutoScrollingRef.current) {
          scrollToBottom('smooth');
        }
      }, 150);

      try {
        await chatService.streamChatMessage(
          projectId,
          userText,
          selectedSourceIds,
          abortController.signal,
          {
            onSessionInfo: (newSessionId) => {
              if (!currentSessionId) {
                skipNextSessionFetch(newSessionId);
                fetchSessions();
                onNewSessionCreated?.(newSessionId);
              }
            },
            onSessionRenamed: (renamedSessionId, newTitle) => {
              updateSessionTitleLocally(renamedSessionId, newTitle);
            },
            onSources: (incomingSources) => {
              setMessages((prev) => {
                const updated = [...prev];
                const lastIdx = updated.length - 1;
                if (updated[lastIdx]) {
                  updated[lastIdx] = { ...updated[lastIdx], sources: incomingSources };
                }
                return updated;
              });
            },
            onToken: (token) => {
              setMessages((prev) => {
                const updated = [...prev];
                const lastIdx = updated.length - 1;
                if (updated[lastIdx]) {
                  updated[lastIdx] = {
                    ...updated[lastIdx],
                    content: updated[lastIdx].content + token,
                    isLoading: false,
                    isStreaming: true,
                  };
                }
                return updated;
              });
            },
            onDone: () => {
              setMessages((prev) => {
                const updated = [...prev];
                const lastIdx = updated.length - 1;
                if (updated[lastIdx]) {
                  updated[lastIdx] = { ...updated[lastIdx], isLoading: false, isStreaming: false };
                }
                return updated;
              });
              setIsStreaming(false);
            },
            onError: (errMsg) => {
              setMessages((prev) => {
                const updated = [...prev];
                const lastIdx = updated.length - 1;
                if (updated[lastIdx]) {
                  updated[lastIdx] = { ...updated[lastIdx], error: errMsg, isLoading: false, isStreaming: false };
                }
                return updated;
              });
              setIsStreaming(false);
            },
          },
          currentSessionId || undefined
        );
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setMessages((prev) => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            if (updated[lastIdx]) {
              updated[lastIdx] = {
                ...updated[lastIdx],
                error: err?.message || 'Không thể kết nối đến máy chủ AI.',
                isLoading: false,
                isStreaming: false,
              };
            }
            return updated;
          });
        }
        setIsStreaming(false);
      }
    },
    [
      isStreaming,
      projectId,
      currentSessionId,
      messages.length,
      selectedSourceIds,
      touchSessionActivityLocally,
      setMessages,
      scrollToBottom,
      isAutoScrollingRef,
      skipNextSessionFetch,
      fetchSessions,
      onNewSessionCreated,
      updateSessionTitleLocally,
    ]
  );

  const handleEditMessage = useCallback(
    async (index: number, newContent: string) => {
      if (!projectId || !currentSessionId || isStreaming) return;
      const targetMsg = messages[index];
      if (!targetMsg || !targetMsg.id) return;

      setIsStreaming(true);
      touchSessionActivityLocally(currentSessionId);
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const truncated = messages.slice(0, index);
      setMessages([
        ...truncated,
        { ...targetMsg, content: newContent },
        { role: 'assistant', content: '', sources: [], isLoading: true, isStreaming: true },
      ]);

      try {
        await chatService.streamEditedMessage(
          projectId,
          currentSessionId,
          targetMsg.id,
          newContent,
          selectedSourceIds,
          abortController.signal,
          {
            onSources: (incomingSources) => {
              setMessages((prev) => {
                const updated = [...prev];
                const lastIdx = updated.length - 1;
                if (updated[lastIdx]) {
                  updated[lastIdx] = { ...updated[lastIdx], sources: incomingSources };
                }
                return updated;
              });
            },
            onToken: (token) => {
              setMessages((prev) => {
                const updated = [...prev];
                const lastIdx = updated.length - 1;
                if (updated[lastIdx]) {
                  updated[lastIdx] = {
                    ...updated[lastIdx],
                    content: updated[lastIdx].content + token,
                    isLoading: false,
                    isStreaming: true,
                  };
                }
                return updated;
              });
            },
            onDone: () => {
              setMessages((prev) => {
                const updated = [...prev];
                const lastIdx = updated.length - 1;
                if (updated[lastIdx]) {
                  updated[lastIdx] = { ...updated[lastIdx], isLoading: false, isStreaming: false };
                }
                return updated;
              });
              setIsStreaming(false);
            },
            onError: (errMsg) => {
              setMessages((prev) => {
                const updated = [...prev];
                const lastIdx = updated.length - 1;
                if (updated[lastIdx]) {
                  updated[lastIdx] = { ...updated[lastIdx], error: errMsg, isLoading: false, isStreaming: false };
                }
                return updated;
              });
              setIsStreaming(false);
            },
          }
        );
      } catch {
        setIsStreaming(false);
      }
    },
    [
      projectId,
      currentSessionId,
      isStreaming,
      messages,
      selectedSourceIds,
      touchSessionActivityLocally,
      setMessages,
    ]
  );

  return {
    isStreaming,
    handleSendMessage,
    handleEditMessage,
    handleStopStreaming,
  };
};
