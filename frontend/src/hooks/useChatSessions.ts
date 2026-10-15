import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { chatService, type ChatSessionData } from '../services/chatService';

/**
 * Helper sorting sessions:
 * - Pinned threads first, ordered by pinnedAt DESC (newest pinned session jumps directly to the top).
 * - Unpinned threads ordered by lastActivityAt (or updatedAt / createdAt) DESC (most recent activity jumps to the top).
 */
export const sortSessions = (list: ChatSessionData[]) => {
  return [...list].sort((a, b) => {
    const aPin = Boolean(a.pinned ?? (a as any).isPinned);
    const bPin = Boolean(b.pinned ?? (b as any).isPinned);

    if (aPin !== bPin) {
      return aPin ? -1 : 1;
    }

    if (aPin && bPin) {
      const aPinnedTime = new Date(a.pinnedAt || a.updatedAt || 0).getTime();
      const bPinnedTime = new Date(b.pinnedAt || b.updatedAt || 0).getTime();
      return bPinnedTime - aPinnedTime;
    }

    const aActivity = new Date(a.lastActivityAt || a.updatedAt || a.createdAt || 0).getTime();
    const bActivity = new Date(b.lastActivityAt || b.updatedAt || b.createdAt || 0).getTime();
    return bActivity - aActivity;
  });
};

/**
 * Custom Hook managing project AI conversation sessions.
 * Encapsulates thread state, creation, renaming, and session switching.
 */
export const useChatSessions = (projectId?: string, urlSessionId?: string | null) => {
  const [sessions, setSessions] = useState<ChatSessionData[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(urlSessionId || null);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);

  useEffect(() => {
    setCurrentSessionId(urlSessionId || null);
  }, [urlSessionId]);

  const fetchSessions = useCallback(async () => {
    if (!projectId) return;
    setIsLoadingSessions(true);
    try {
      const data = await chatService.getSessions(projectId);
      const sorted = sortSessions(data);
      setSessions(sorted);
    } catch (err) {
      console.error('Lỗi khi tải danh sách phiên trò chuyện:', err);
    } finally {
      setIsLoadingSessions(false);
    }
  }, [projectId]);

  const createNewSession = useCallback(async (title?: string): Promise<ChatSessionData | null> => {
    if (!projectId) return null;
    try {
      const newSession = await chatService.createSession(projectId, title);
      setSessions((prev) => [newSession, ...prev]);
      setCurrentSessionId(newSession.id);
      return newSession;
    } catch (err) {
      console.error('Lỗi khi tạo phiên trò chuyện mới:', err);
      return null;
    }
  }, [projectId]);

  const renameSession = useCallback(async (sessionId: string, newTitle: string): Promise<boolean> => {
    if (!projectId || !newTitle.trim()) return false;
    const trimmedTitle = newTitle.trim();
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, title: trimmedTitle } : s))
    );
    try {
      const updated = await chatService.updateSession(projectId, sessionId, { title: trimmedTitle });
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, ...updated, title: updated.title || trimmedTitle } : s))
      );
      return true;
    } catch (err) {
      console.error('Lỗi khi đổi tên phiên trò chuyện:', err);
      fetchSessions();
      toast.error('Không thể đổi tên cuộc trò chuyện');
      return false;
    }
  }, [projectId, fetchSessions]);

  const deleteSession = useCallback(async (sessionId: string) => {
    if (!projectId) return;
    try {
      await chatService.deleteSession(projectId, sessionId);
      setSessions((prev) => {
        const remaining = prev.filter((s) => s.id !== sessionId);
        if (currentSessionId === sessionId) {
          setCurrentSessionId(remaining.length > 0 ? remaining[0].id : null);
        }
        return remaining;
      });
    } catch (err) {
      console.error('Lỗi khi xóa phiên trò chuyện:', err);
    }
  }, [projectId, currentSessionId]);

  const updateSessionTitleLocally = useCallback((sessionId: string, title: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, title } : s))
    );
  }, []);

  const touchSessionActivityLocally = useCallback((sessionId: string) => {
    const now = new Date().toISOString();
    setSessions((prev) => {
      const updated = prev.map((s) =>
        s.id === sessionId ? { ...s, lastActivityAt: now, updatedAt: now } : s
      );
      return sortSessions(updated);
    });
  }, []);

  const togglePinSession = useCallback(async (sessionId: string, pinned: boolean): Promise<boolean> => {
    if (!projectId) return false;
    const now = new Date().toISOString();
    // Optimistic local update: sets pinnedAt when pinning, clears pinnedAt when unpinning.
    // Preserves lastActivityAt untouched so unpinning never scrambles historical order.
    setSessions((prev) => {
      const updated = prev.map((s) => {
        if (s.id !== sessionId) return s;
        return {
          ...s,
          pinned,
          pinnedAt: pinned ? now : null,
        };
      });
      return sortSessions(updated);
    });
    try {
      const updated = await chatService.updateSession(projectId, sessionId, { pinned });
      setSessions((prev) => {
        const next = prev.map((s) => {
          if (s.id !== sessionId) return s;
          return {
            ...s,
            ...updated,
            pinned: updated.pinned ?? pinned,
            pinnedAt: pinned ? (updated.pinnedAt || now) : null,
          };
        });
        return sortSessions(next);
      });
      return true;
    } catch (err) {
      console.error('Lỗi khi ghim/bỏ ghim phiên trò chuyện:', err);
      fetchSessions();
      toast.error('Không thể cập nhật trạng thái ghim');
      return false;
    }
  }, [projectId, fetchSessions]);

  return {
    sessions,
    setSessions,
    currentSessionId,
    setCurrentSessionId,
    isLoadingSessions,
    fetchSessions,
    createNewSession,
    renameSession,
    deleteSession,
    togglePinSession,
    updateSessionTitleLocally,
    touchSessionActivityLocally,
  };
};
