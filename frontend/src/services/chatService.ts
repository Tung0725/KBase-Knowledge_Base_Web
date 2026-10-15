import apiClient, { API_BASE_URL } from './apiClient';

const BASE_URL = API_BASE_URL;

export interface SourceCitation {
  sourceId: number;
  documentId: string;
  fileName: string;
  text: string;
}

export interface ChatSessionData {
  id: string;
  projectId: string;
  userId: string;
  title: string;
  pinned: boolean;
  pinnedAt?: string | null;
  lastActivityAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessageData {
  id?: string;
  sessionId?: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceCitation[];
  isStreaming?: boolean;
  isLoading?: boolean;
  error?: string;
  createdAt?: string;
}

export interface DocumentInfo {
  id: string;
  fileName: string;
  fileType: string;
  tag: string;
  status: string;
}

export interface StreamChatCallbacks {
  onSessionInfo?: (sessionId: string) => void;
  onSessionRenamed?: (sessionId: string, title: string) => void;
  onStatus?: (status: string) => void;
  onSources?: (sources: SourceCitation[]) => void;
  onToken?: (token: string) => void;
  onDone?: () => void;
  onError?: (err: string) => void;
}

async function handleSseResponse(response: Response, callbacks: StreamChatCallbacks): Promise<void> {
  if (!response.ok || !response.body) {
    throw new Error(`SSE HTTP error ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      let currentEvent = 'message';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
          currentEvent = 'message';
          continue;
        }

        if (trimmed.startsWith('event:')) {
          currentEvent = trimmed.substring(6).trim();
        } else if (trimmed.startsWith('data:')) {
          const rawData = trimmed.substring(5).trim();
          try {
            const parsed = JSON.parse(rawData);
            if (currentEvent === 'session_info') {
              callbacks.onSessionInfo?.(parsed.sessionId);
            } else if (currentEvent === 'session_renamed') {
              callbacks.onSessionRenamed?.(parsed.sessionId, parsed.title);
            } else if (currentEvent === 'sources') {
              callbacks.onSources?.(parsed);
            } else if (currentEvent === 'status') {
              callbacks.onStatus?.(parsed.message || parsed.step);
            } else if (currentEvent === 'token') {
              callbacks.onToken?.(parsed.delta || '');
            } else if (currentEvent === 'done') {
              callbacks.onDone?.();
            } else if (currentEvent === 'error') {
              callbacks.onError?.(parsed.error || 'Lỗi xử lý phản hồi');
            }
          } catch {
            if (rawData === '[DONE]') {
              callbacks.onDone?.();
            }
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export const chatService = {
  async getSessions(projectId: string): Promise<ChatSessionData[]> {
    const res = await apiClient.get<{ success: boolean; data: ChatSessionData[] }>(`/projects/${projectId}/chat/sessions`);
    return res.data.data || [];
  },

  async createSession(projectId: string, title?: string): Promise<ChatSessionData> {
    const res = await apiClient.post<{ success: boolean; data: ChatSessionData }>(`/projects/${projectId}/chat/sessions`, { title });
    return res.data.data;
  },

  async updateSession(projectId: string, sessionId: string, data: { title?: string; pinned?: boolean }): Promise<ChatSessionData> {
    try {
      const res = await apiClient.patch<{ success: boolean; data: ChatSessionData }>(`/projects/${projectId}/chat/sessions/${sessionId}`, data);
      return res.data.data;
    } catch {
      const res = await apiClient.put<{ success: boolean; data: ChatSessionData }>(`/projects/${projectId}/chat/sessions/${sessionId}`, data);
      return res.data.data;
    }
  },

  async deleteSession(projectId: string, sessionId: string): Promise<void> {
    await apiClient.delete(`/projects/${projectId}/chat/sessions/${sessionId}`);
  },

  async getSessionMessages(
    projectId: string,
    sessionId: string,
    page = 0,
    size = 20
  ): Promise<{ messages: ChatMessageData[]; hasMore: boolean; page: number; total: number }> {
    const res = await apiClient.get<{ success: boolean; data: any }>(
      `/projects/${projectId}/chat/sessions/${sessionId}/messages`,
      { params: { page, size } }
    );
    const data = res.data.data;
    if (Array.isArray(data)) {
      return { messages: data, hasMore: false, page: 0, total: data.length };
    }
    return {
      messages: data.content || [],
      hasMore: !data.last,
      page: data.pageNumber ?? page,
      total: data.totalElements ?? 0,
    };
  },

  async clearSessionMessages(projectId: string, sessionId: string): Promise<void> {
    await apiClient.delete(`/projects/${projectId}/chat/sessions/${sessionId}/messages`);
  },

  async getChatHistory(projectId: string): Promise<ChatMessageData[]> {
    const res = await apiClient.get<ChatMessageData[]>(`/projects/${projectId}/chat/history`);
    return res.data;
  },

  async getProjectDocuments(projectId: string): Promise<DocumentInfo[]> {
    const res = await apiClient.get<{ data: DocumentInfo[] }>(`/projects/${projectId}/documents`);
    return res.data.data || [];
  },

  async getDocumentContent(projectId: string, documentId: string): Promise<string> {
    const res = await apiClient.get<{ data: { content: string } }>(`/projects/${projectId}/documents/${documentId}/content`);
    return res.data.data?.content || '';
  },

  async getDocumentDownloadUrl(projectId: string, documentId: string): Promise<string> {
    const res = await apiClient.get<{ data: { downloadUrl: string } }>(`/projects/${projectId}/documents/${documentId}/download-url?preview=true`);
    return res.data.data?.downloadUrl || '';
  },

  async streamChatMessage(
    projectId: string,
    message: string,
    documentIds: string[],
    signal: AbortSignal,
    callbacks: StreamChatCallbacks,
    sessionId?: string
  ): Promise<void> {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/projects/${projectId}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message, documentIds, sessionId }),
        signal,
      });

      await handleSseResponse(response, callbacks);
    } catch (streamErr: any) {
      if (signal.aborted || streamErr.name === 'AbortError') {
        throw streamErr;
      }

      callbacks.onStatus?.('Đang chuyển sang kênh phản hồi trực tiếp...');
      const fallbackRes = await apiClient.post<{ response: string; sources?: SourceCitation[] }>(
        `/projects/${projectId}/chat`,
        { message, documentIds, sessionId },
        { signal }
      );
      if (fallbackRes.data.sources) {
        callbacks.onSources?.(fallbackRes.data.sources);
      }
      callbacks.onToken?.(fallbackRes.data.response);
      callbacks.onDone?.();
    }
  },

  async streamEditedMessage(
    projectId: string,
    sessionId: string,
    messageId: string,
    message: string,
    documentIds: string[],
    signal: AbortSignal,
    callbacks: StreamChatCallbacks
  ): Promise<void> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${BASE_URL}/projects/${projectId}/chat/sessions/${sessionId}/messages/${messageId}/edit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ message, documentIds }),
      signal,
    });

    await handleSseResponse(response, callbacks);
  }
};
