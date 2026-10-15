import { useState, useCallback } from 'react';
import { chatService, type DocumentInfo, type SourceCitation } from '../services/chatService';
import type { ActiveCitation } from '../components/chat/ChatSidebar';

/**
 * Custom Hook managing document inspection and citation previews.
 */
export const useChatCitations = (projectId?: string, sources: DocumentInfo[] = []) => {
  const [activeCitation, setActiveCitation] = useState<ActiveCitation | null>(null);

  const openCitation = useCallback(
    async (source: SourceCitation) => {
      if (!projectId) return;
      const matchedDoc = sources.find(
        (d) => d.fileName === source.fileName || d.id === source.documentId
      );

      const docId = matchedDoc?.id || source.documentId || sources[0]?.id;
      if (!docId) return;

      const fileName = matchedDoc?.fileName || source.fileName || sources[0]?.fileName || 'Tài liệu nguồn';
      const tag = matchedDoc?.tag || sources[0]?.tag || '[Tài liệu]';

      setActiveCitation({
        documentId: docId,
        fileName,
        chunkText: source.text || '',
        sourceId: source.sourceId,
        tag,
        isLoadingFullText: true,
      });

      try {
        const [fullText, mediaUrl] = await Promise.all([
          chatService.getDocumentContent(projectId, docId),
          tag === '[Ảnh]' || tag === '[Video]'
            ? chatService.getDocumentDownloadUrl(projectId, docId)
            : Promise.resolve(''),
        ]);

        setActiveCitation((prev) =>
          prev ? { ...prev, fullText, mediaUrl: mediaUrl || undefined, isLoadingFullText: false } : null
        );
      } catch {
        setActiveCitation((prev) => (prev ? { ...prev, isLoadingFullText: false } : null));
      }
    },
    [projectId, sources]
  );

  const openSource = useCallback(
    async (src: DocumentInfo) => {
      if (!projectId) return;

      setActiveCitation({
        documentId: src.id,
        fileName: src.fileName,
        chunkText: '',
        tag: src.tag,
        isLoadingFullText: true,
      });

      try {
        const [fullText, mediaUrl] = await Promise.all([
          chatService.getDocumentContent(projectId, src.id),
          src.tag === '[Ảnh]' || src.tag === '[Video]'
            ? chatService.getDocumentDownloadUrl(projectId, src.id)
            : Promise.resolve(''),
        ]);

        setActiveCitation((prev) =>
          prev ? { ...prev, fullText, mediaUrl: mediaUrl || undefined, isLoadingFullText: false } : null
        );
      } catch {
        setActiveCitation((prev) => (prev ? { ...prev, isLoadingFullText: false } : null));
      }
    },
    [projectId]
  );

  const clearCitation = useCallback(() => {
    setActiveCitation(null);
  }, []);

  return {
    activeCitation,
    openCitation,
    openSource,
    clearCitation,
  };
};
