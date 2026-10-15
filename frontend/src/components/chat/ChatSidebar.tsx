import React, { useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { DocumentInfo } from '../../services/chatService';

export interface ActiveCitation {
  documentId?: string;
  fileName: string;
  chunkText: string;
  sourceId?: number;
  fullText?: string;
  mediaUrl?: string;
  isLoadingFullText?: boolean;
  tag?: string;
}

/**
 * ChatSidebar component
 * Displays the project knowledge sources panel, format filtering, document checkboxes,
 * and detailed citation inspection drawer with real-time text highlight and media previews.
 *
 * @prop isSidebarOpen - Controls sidebar visibility
 * @prop sidebarWidth - Current user-resized sidebar width in pixels
 * @prop isDragging - Whether user is currently dragging the resize divider
 * @prop sources - List of available project documents
 * @prop selectedSourceIds - Set of document IDs included in retrieval scope
 * @prop sourceFilter - Current tag filter (all, [Tài liệu], [Ảnh], [Video], [Khác])
 * @prop activeCitation - Inspected citation excerpt details
 */
interface ChatSidebarProps {
  isSidebarOpen: boolean;
  sidebarWidth: number;
  isDragging: boolean;
  sources: DocumentInfo[];
  selectedSourceIds: string[];
  sourceFilter: string;
  activeCitation: ActiveCitation | null;
  onCloseSidebar: () => void;
  onFilterChange: (filter: string) => void;
  onToggleSelectSource: (id: string) => void;
  onSelectAllSources: (checked: boolean) => void;
  onOpenSource: (src: DocumentInfo) => void;
  onBackFromCitation: () => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  sidebarWidth,
  isDragging,
  sources,
  selectedSourceIds,
  sourceFilter,
  activeCitation,
  onCloseSidebar,
  onFilterChange,
  onToggleSelectSource,
  onSelectAllSources,
  onOpenSource,
  onBackFromCitation,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLElement>(null);

  const scrollToHighlight = useCallback(() => {
    if (highlightRef.current) {
      highlightRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, []);

  useEffect(() => {
    if (activeCitation && !activeCitation.isLoadingFullText && activeCitation.fullText) {
      const timer = setTimeout(() => {
        scrollToHighlight();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [activeCitation, scrollToHighlight]);

  const filteredSources = sources.filter(
    (src) => sourceFilter === 'all' || src.tag === sourceFilter
  );

  const getIconForTag = (tag: string) => {
    switch (tag) {
      case '[Tài liệu]':
        return { icon: 'description', color: 'text-info' };
      case '[Ảnh]':
        return { icon: 'image', color: 'text-warning' };
      case '[Video]':
        return { icon: 'movie', color: 'text-error' };
      default:
        return { icon: 'draft', color: 'text-on-surface-variant' };
    }
  };

  const findMatchRange = (fullText: string, rawChunk: string): [number, number] | null => {
    if (!fullText || !rawChunk) return null;

    let chunk = rawChunk.replace(/^\[Tài liệu:[^\]]*\](?:\s*>[^\n]*)?\s*/i, '').trim();
    if (!chunk) chunk = rawChunk.trim();

    // 1. Direct match
    let idx = fullText.indexOf(chunk);
    if (idx !== -1) return [idx, idx + chunk.length];

    const lowerFull = fullText.toLowerCase();
    const lowerChunk = chunk.toLowerCase();
    idx = lowerFull.indexOf(lowerChunk);
    if (idx !== -1) return [idx, idx + chunk.length];

    // 2. Full chunk regex with normalized whitespace (no arbitrary length truncation)
    try {
      const escapedFull = chunk.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
      const regFull = new RegExp(escapedFull, 'i');
      const matchFull = regFull.exec(fullText);
      if (matchFull) {
        return [matchFull.index, matchFull.index + matchFull[0].length];
      }
    } catch {}

    // 3. Start-to-End Boundary Anchor Match (covers the full span from start to end of the citation)
    const words = chunk.split(/\s+/).filter((w) => w.length > 2);
    if (words.length >= 6) {
      const startPhrase = words.slice(0, 4).join(' ');
      const endPhrase = words.slice(-4).join(' ');

      const startIdx = lowerFull.indexOf(startPhrase.toLowerCase());
      if (startIdx !== -1) {
        const searchFrom = startIdx + startPhrase.length;
        const endIdx = lowerFull.indexOf(endPhrase.toLowerCase(), searchFrom);
        if (endIdx !== -1 && endIdx - startIdx < chunk.length * 1.5) {
          const matchEnd = endIdx + endPhrase.length;
          let finalStart = startIdx;
          while (finalStart > 0 && !/\s/.test(fullText[finalStart - 1])) finalStart--;
          let finalEnd = matchEnd;
          while (finalEnd < fullText.length && !/\s/.test(fullText[finalEnd])) finalEnd++;
          return [finalStart, finalEnd];
        }
      }
    }

    // 4. Match longest matching sentence, snapped to word boundaries
    const sentences = chunk
      .split(/[\n\r]+/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 20);

    for (const sentence of sentences) {
      idx = lowerFull.indexOf(sentence.toLowerCase());
      if (idx !== -1) {
        let s = idx;
        while (s > 0 && !/\s/.test(fullText[s - 1])) s--;
        let e = idx + sentence.length;
        while (e < fullText.length && !/\s/.test(fullText[e])) e++;
        return [s, e];
      }
    }

    // 5. Fallback phrase match, snapped to word boundaries
    if (words.length >= 4) {
      const phrase = words.slice(0, Math.min(words.length, 8)).join(' ');
      idx = lowerFull.indexOf(phrase.toLowerCase());
      if (idx !== -1) {
        let s = idx;
        while (s > 0 && !/\s/.test(fullText[s - 1])) s--;
        let e = idx + phrase.length;
        while (e < fullText.length && !/\s/.test(fullText[e])) e++;
        return [s, e];
      }
    }

    return null;
  };

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: sidebarWidth, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: isDragging ? 0 : 0.2 }}
      className="flex flex-col bg-surface-container-lowest border border-outline-variant/30 rounded-2xl overflow-hidden shrink-0 shadow-sm"
    >
      {activeCitation ? (
        /* Detailed Citation Inspection View */
        <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-200">
          {/* Header Section */}
          <div className="p-3.5 flex justify-between items-center border-b border-outline-variant/20 bg-surface-container/30">
            <div className="flex flex-col gap-1 overflow-hidden pr-2">
              <div
                className="flex items-center gap-1.5 text-xs text-primary font-medium cursor-pointer hover:underline"
                onClick={onBackFromCitation}
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                Danh sách nguồn
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                {activeCitation.sourceId && (
                  <span className="bg-primary/20 text-primary font-bold text-xs px-2 py-0.5 rounded-full border border-primary/30 shrink-0">
                    [{activeCitation.sourceId}]
                  </span>
                )}
                <h2 className="text-sm font-semibold text-on-surface truncate" title={activeCitation.fileName}>
                  {activeCitation.fileName}
                </h2>
              </div>
            </div>

            {activeCitation.fullText && (
              <button
                onClick={scrollToHighlight}
                className="flex items-center gap-1 text-xs text-primary bg-primary/10 hover:bg-primary/20 px-2.5 py-1.5 rounded-lg border border-primary/30 font-medium transition-colors shrink-0"
                title="Cuộn tới vị trí đoạn trích dẫn"
              >
                <span className="material-symbols-outlined text-[15px]">my_location</span>
                <span>Vị trí</span>
              </button>
            )}
          </div>

          {/* Document Content Scroll View */}
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth">
            {activeCitation.isLoadingFullText ? (
              <div className="flex flex-col items-center justify-center h-36 gap-3 text-on-surface-variant">
                <span className="material-symbols-outlined animate-spin text-[30px] text-primary">progress_activity</span>
                <span className="text-xs">Đang tải nội dung văn bản gốc...</span>
              </div>
            ) : (
              <div className="space-y-4">
                {activeCitation.tag === '[Ảnh]' && activeCitation.mediaUrl && (
                  <div className="rounded-xl overflow-hidden border border-outline-variant/30 bg-surface-container flex justify-center p-2">
                    <img src={activeCitation.mediaUrl} alt={activeCitation.fileName} className="max-h-60 object-contain rounded-lg" />
                  </div>
                )}

                {activeCitation.tag === '[Video]' && activeCitation.mediaUrl && (
                  <div className="rounded-xl overflow-hidden border border-outline-variant/30 bg-black flex justify-center">
                    <video src={activeCitation.mediaUrl} controls className="w-full max-h-60 object-contain" />
                  </div>
                )}

                {activeCitation.fullText ? (
                  <div className="text-[13.5px] text-on-surface leading-[1.7] whitespace-pre-wrap break-words font-sans p-3.5 bg-surface-container/30 rounded-xl border border-outline-variant/20">
                    {(() => {
                      const matchRange = findMatchRange(activeCitation.fullText, activeCitation.chunkText);
                      if (matchRange) {
                        const [start, end] = matchRange;
                        const before = activeCitation.fullText.substring(0, start);
                        const highlight = activeCitation.fullText.substring(start, end);
                        const after = activeCitation.fullText.substring(end);

                        return (
                          <>
                            {before}
                            <mark
                              id="highlight-chunk"
                              ref={highlightRef}
                              className="bg-yellow-200/60 dark:bg-yellow-400/60 text-inherit px-1 py-0.5 rounded transition-colors"
                            >
                              {highlight}
                            </mark>
                            {after}
                          </>
                        );
                      }

                      return activeCitation.fullText;
                    })()}
                  </div>
                ) : (
                  <div className="text-[13.5px] text-on-surface leading-[1.7] whitespace-pre-wrap break-words font-sans p-3 bg-surface-container/30 rounded-xl border border-outline-variant/20">
                    <mark className="bg-yellow-200/90 dark:bg-yellow-400/30 text-inherit px-1 py-0.5 rounded">
                      {activeCitation.chunkText}
                    </mark>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Source List & Selection Drawer */
        <div className="flex flex-col h-full">
          {/* Header Section */}
          <div className="p-1.5 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container/30">
            <h2 className="font-semibold text-sm text-on-surface whitespace-nowrap flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-primary">folder_open</span>
              Nguồn tri thức <span className="text-primary text-xs font-bold">({selectedSourceIds.length}/{sources.length})</span>
            </h2>
            <button
              onClick={onCloseSidebar}
              className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors flex items-center justify-center"
              title="Thu gọn cột nguồn"
            >
              <span className="material-symbols-outlined text-[18px]">left_panel_close</span>
            </button>
          </div>

          {/* Filter & Select All Section */}
          <div className="p-3 border-b border-outline-variant/20 space-y-2 bg-surface-container-low/50">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-on-surface-variant hover:text-on-surface">
                <input
                  type="checkbox"
                  aria-label={`Chọn tất cả ${filteredSources.length} nguồn tài liệu`}
                  checked={filteredSources.length > 0 && filteredSources.every((s) => selectedSourceIds.includes(s.id))}
                  onChange={(e) => onSelectAllSources(e.target.checked)}
                  className="rounded border-outline-variant text-primary focus:ring-primary h-3.5 w-3.5"
                />
                <span>Chọn tất cả ({filteredSources.length})</span>
              </label>
            </div>

            <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
              {['all', '[Tài liệu]', '[Ảnh]', '[Video]', '[Khác]'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => onFilterChange(tag)}
                  className={`px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors ${
                    sourceFilter === tag
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container-high text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {tag === 'all' ? 'Tất cả' : tag.replace('[', '').replace(']', '')}
                </button>
              ))}
            </div>
          </div>

          {/* Sources List Section */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredSources.length === 0 ? (
              <div className="text-center py-8 text-on-surface-variant text-xs">
                Không tìm thấy tài liệu phù hợp
              </div>
            ) : (
              filteredSources.map((src) => {
                const { icon, color } = getIconForTag(src.tag);
                const isSelected = selectedSourceIds.includes(src.id);

                return (
                  <div
                    key={src.id}
                    className={`flex items-center gap-2 p-2 rounded-xl border transition-all text-left ${
                      isSelected
                        ? 'border-primary/40 bg-primary/5 shadow-2xs'
                        : 'border-outline-variant/20 bg-surface-container/20 hover:bg-surface-container/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      aria-label={`Chọn nguồn trích dẫn: ${src.fileName}`}
                      checked={isSelected}
                      onChange={() => onToggleSelectSource(src.id)}
                      className="rounded border-outline-variant text-primary focus:ring-primary h-3.5 w-3.5 shrink-0"
                    />

                    <div
                      className="flex-1 min-w-0 cursor-pointer flex items-center gap-2"
                      onClick={() => onOpenSource(src)}
                    >
                      <span className={`material-symbols-outlined text-[18px] shrink-0 ${color}`}>
                        {icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-on-surface truncate" title={src.fileName}>
                          {src.fileName}
                        </p>
                        <p className="text-[10px] text-on-surface-variant truncate">
                          {src.tag}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};
