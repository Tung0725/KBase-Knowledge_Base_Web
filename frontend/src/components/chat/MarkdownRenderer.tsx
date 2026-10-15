import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { SourceCitation } from '../../services/chatService';

/**
 * MarkdownRenderer component
 * Responsible for rendering markdown text with citation chips, code blocks,
 * and expandable reasoning blocks for deep-thinking LLM responses.
 *
 * @prop content - Raw markdown text to render
 * @prop sources - Array of cited source documents
 * @prop onCitationClick - Handler when a citation number is clicked
 * @prop isStreaming - Boolean indicating whether the message is actively receiving tokens
 */
interface MarkdownRendererProps {
  content: string;
  sources?: SourceCitation[];
  onCitationClick?: (source: SourceCitation) => void;
  isStreaming?: boolean;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  sources,
  onCitationClick,
  isStreaming = false,
}) => {
  const processedContent = useMemo(() => {
    let text = content;
    
    if (sources && sources.length > 0) {
      text = text.replace(/\[(\d+)\]/g, (_, idStr) => {
        const id = parseInt(idStr, 10);
        return `[${id}](#citation-${id})`;
      });
    }

    // Process DeepSeek <think> tags to convert them into blockquotes
    // so the custom blockquote renderer can display the reasoning process.
    if (text.includes('<think>')) {
      const parts = text.split('<think>');
      let newText = parts[0];
      
      for (let i = 1; i < parts.length; i++) {
        const thinkPart = parts[i];
        const endIdx = thinkPart.indexOf('</think>');
        
        if (endIdx !== -1) {
          // Closed think block
          const reasoning = thinkPart.substring(0, endIdx);
          const rest = thinkPart.substring(endIdx + 8);
          const quotedReasoning = '> Tư duy:\n' + reasoning.split('\n').map(line => `> ${line}`).join('\n');
          newText += quotedReasoning + '\n\n' + rest;
        } else {
          // Open think block (streaming)
          const quotedReasoning = '> Tư duy:\n' + thinkPart.split('\n').map(line => `> ${line}`).join('\n');
          newText += quotedReasoning;
        }
      }
      text = newText;
    }

    return text;
  }, [content, sources]);

  return (
    <div className="prose dark:prose-invert max-w-none break-words relative text-on-surface prose-p:leading-relaxed prose-li:leading-relaxed prose-headings:font-medium text-[15px] prose-code:before:content-none prose-code:after:content-none">
      {/* Markdown Content Block */}
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children, ...props }) => {
            if (href?.startsWith('#citation-')) {
              const sourceId = parseInt(href.replace('#citation-', ''), 10);
              const source =
                sources?.find((s) => Number(s.sourceId) === sourceId) ||
                (sources && sources.length > 0 ? sources[(sourceId - 1) % sources.length] || sources[0] : undefined);

              if (source) {
                return (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onCitationClick?.(source);
                    }}
                    className="inline-flex items-center justify-center bg-primary/10 text-primary hover:bg-primary/25 active:scale-95 rounded-full px-2 py-0.5 text-[11px] cursor-pointer mx-1 align-middle border border-primary/25 font-semibold transition-all select-none shadow-2xs"
                    title={`Nguồn trích dẫn: ${source.fileName}`}
                  >
                    [{sourceId}]
                  </button>
                );
              }
            }
            return (
              <a href={href} className="text-primary hover:underline font-medium" target="_blank" rel="noreferrer" {...props}>
                {children}
              </a>
            );
          },
          blockquote: ({ node, children, ...props }: any) => {
            const rawText = node.children?.[0]?.children?.[0]?.value || '';
            const isThinking =
              rawText.includes('Tư duy') ||
              rawText.includes('suy luận') ||
              (node.children && node.children.some((c: any) => c.children?.some((cc: any) => cc.value?.includes('Tư duy'))));

            if (isThinking) {
              return (
                <details 
                  className="my-4 border border-outline-variant/40 bg-surface-container-lowest rounded-2xl shadow-sm group"
                  open={isStreaming}
                >
                  <summary className="px-4 py-3 text-[14px] font-medium text-on-surface-variant flex items-center gap-2 cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
                    <span className="material-symbols-outlined text-[18px] text-primary">psychology</span>
                    <span className="flex-1">Quá trình suy luận</span>
                    <span className="material-symbols-outlined text-[18px] transition-transform duration-300 group-open:rotate-180">keyboard_arrow_down</span>
                  </summary>
                  <div className="px-4 pb-4 pt-1 text-[14px] text-on-surface-variant italic leading-relaxed border-t border-outline-variant/20 mt-1">
                    {children}
                  </div>
                </details>
              );
            }
            return (
              <blockquote className="border-l-4 border-primary/70 pl-4 italic text-on-surface-variant my-3" {...props}>
                {children}
              </blockquote>
            );
          },
          pre: ({ children, ...props }: any) => (
            <pre className="not-prose bg-[#1e1e1e] text-[#d4d4d4] p-4 rounded-2xl overflow-x-auto text-[13.5px] font-mono my-4 shadow-sm border border-outline-variant/10" {...props}>
              {children}
            </pre>
          ),
          code({ inline, className: _className, children, ...props }: any) {
            if (inline) {
              return (
                <code className="bg-surface-variant/40 px-1.5 py-0.5 rounded-md text-on-surface text-[13.5px] font-mono" {...props}>
                  {children}
                </code>
              );
            }
            
            // Block code processing (allow citations inside code blocks like ascii diagrams)
            const textContent = Array.isArray(children) ? children.join('') : String(children);
            const parts = textContent.split(/(\[\d+\]\(#citation-\d+\))/g);
            
            return (
              <code className="text-inherit font-mono" {...props}>
                {parts.map((part, i) => {
                  const match = part.match(/\[(\d+)\]\(#citation-\d+\)/);
                  if (match) {
                    const sourceId = parseInt(match[1], 10);
                    const source = sources?.find((s) => Number(s.sourceId) === sourceId) ||
                                  (sources && sources.length > 0 ? sources[(sourceId - 1) % sources.length] || sources[0] : undefined);
                    if (source) {
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onCitationClick?.(source);
                          }}
                          className="inline-flex items-center justify-center bg-[#3b82f6]/20 text-[#60a5fa] hover:bg-[#3b82f6]/40 active:scale-95 rounded-full px-2 py-0.5 text-[11px] cursor-pointer mx-1 align-middle font-semibold transition-all select-none"
                          title={`Nguồn trích dẫn: ${source.fileName}`}
                        >
                          [{sourceId}]
                        </button>
                      );
                    }
                  }
                  return part;
                })}
              </code>
            );
          },
        }}
      >
        {processedContent}
      </ReactMarkdown>

      {/* Streaming Cursor */}
      {isStreaming && (
        <span className="inline-block w-2 h-4 ml-1 bg-primary align-middle animate-pulse rounded-sm" />
      )}
    </div>
  );
};
