package com.kbase.service;

import dev.langchain4j.data.document.Metadata;
import dev.langchain4j.data.segment.TextSegment;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Service component responsible for intelligent document pre-processing and chunking.
 * Implements hierarchical Parent-Child chunking combined with Anthropic-style Contextual Retrieval
 * to optimize vector search precision while providing complete contextual background to the LLM.
 */
@Component
public class HierarchicalDocumentSplitter {

    private static final int DEFAULT_PARENT_CHUNK_SIZE = 1500;
    private static final int DEFAULT_CHILD_CHUNK_SIZE = 350;
    private static final int DEFAULT_CHILD_OVERLAP = 50;

    private static final Pattern HEADING_PATTERN = Pattern.compile("(?m)^(#{1,6}\\s+.+|[0-9]+(\\.[0-9]+)*\\s+[A-ZĐÀ-Ỹ].+|Chương\\s+[0-9IVXLCDM]+.*|Điều\\s+[0-9]+.*|Phần\\s+[0-9IVXLCDM]+.*)");
    private static final Pattern MULTIPLE_NEWLINES_PATTERN = Pattern.compile("\n{3,}");

    public record DocumentChunkConfig(String documentId, String projectId, String fileName) {}

    private record ParentChunk(String id, String text, String sectionTitle) {}

    /**
     * Splits a raw document into a list of enriched Child TextSegments containing Parent Context.
     *
     * @param rawContent the unformatted text content extracted from the document
     * @param config metadata container containing documentId, projectId, and fileName
     * @return list of TextSegments ready for embedding and persistence
     */
    public List<TextSegment> splitDocument(String rawContent, DocumentChunkConfig config) {
        if (rawContent == null || rawContent.trim().isEmpty()) {
            return List.of();
        }

        String cleanedText = cleanText(rawContent);
        List<ParentChunk> parentChunks = createParentChunks(cleanedText);
        List<TextSegment> childSegments = new ArrayList<>();

        int globalChunkIndex = 1;
        for (ParentChunk parent : parentChunks) {
            List<String> rawChildren = createChildChunks(parent.text());
            for (String rawChild : rawChildren) {
                String contextualPrefix = buildContextPrefix(config.fileName(), parent.sectionTitle());
                String enrichedChildText = contextualPrefix + rawChild;

                Metadata metadata = new Metadata();
                metadata.put("documentId", config.documentId());
                metadata.put("projectId", config.projectId());
                metadata.put("parentId", parent.id());
                metadata.put("parentText", parent.text());
                metadata.put("fileName", config.fileName());
                metadata.put("chunkIndex", String.valueOf(globalChunkIndex));
                if (parent.sectionTitle() != null && !parent.sectionTitle().isEmpty()) {
                    metadata.put("sectionTitle", parent.sectionTitle());
                }

                childSegments.add(TextSegment.from(enrichedChildText, metadata));
                globalChunkIndex++;
            }
        }

        return childSegments;
    }

    /**
     * Cleans and normalizes raw text while preserving Markdown structures and paragraphs.
     *
     * @param rawText original raw text
     * @return cleaned and normalized text
     */
    public String cleanText(String rawText) {
        if (rawText == null) {
            return "";
        }
        String normalized = rawText.replace("\r\n", "\n").replace("\r", "\n");
        normalized = normalized.replace("\u00AD", "");
        normalized = normalized.replaceAll("(?m)([a-zA-ZĐđÀ-ỹ]+)-\\s*\\n\\s*([a-zA-ZĐđÀ-ỹ]+)", "$1$2");
        normalized = normalized.replaceAll("[\\p{Cntrl}&&[^\r\n\t]]", "");
        normalized = MULTIPLE_NEWLINES_PATTERN.matcher(normalized).replaceAll("\n\n");
        return normalized.trim();
    }

    private List<ParentChunk> createParentChunks(String text) {
        List<ParentChunk> parents = new ArrayList<>();
        String[] paragraphs = text.split("\n\n");

        StringBuilder currentBuffer = new StringBuilder();
        String currentSectionTitle = "";

        for (String paragraph : paragraphs) {
            String trimmedPara = paragraph.trim();
            if (trimmedPara.isEmpty()) {
                continue;
            }

            Matcher headingMatcher = HEADING_PATTERN.matcher(trimmedPara);
            if (headingMatcher.find()) {
                String detectedTitle = headingMatcher.group().trim().replaceAll("^#+\\s*", "");
                if (currentBuffer.length() >= (DEFAULT_PARENT_CHUNK_SIZE / 2)) {
                    parents.add(new ParentChunk(UUID.randomUUID().toString(), currentBuffer.toString().trim(), currentSectionTitle));
                    currentBuffer.setLength(0);
                }
                currentSectionTitle = detectedTitle;
            }

            if (currentBuffer.length() + trimmedPara.length() > DEFAULT_PARENT_CHUNK_SIZE && currentBuffer.length() > 0) {
                parents.add(new ParentChunk(UUID.randomUUID().toString(), currentBuffer.toString().trim(), currentSectionTitle));
                currentBuffer.setLength(0);
            }

            if (currentBuffer.length() > 0) {
                currentBuffer.append("\n\n");
            }
            currentBuffer.append(trimmedPara);
        }

        if (currentBuffer.length() > 0) {
            parents.add(new ParentChunk(UUID.randomUUID().toString(), currentBuffer.toString().trim(), currentSectionTitle));
        }

        return parents;
    }

    private List<String> createChildChunks(String parentText) {
        List<String> children = new ArrayList<>();
        if (parentText.length() <= DEFAULT_CHILD_CHUNK_SIZE) {
            children.add(parentText);
            return children;
        }

        int start = 0;
        int textLength = parentText.length();

        while (start < textLength) {
            while (start < textLength && Character.isWhitespace(parentText.charAt(start))) {
                start++;
            }
            if (start >= textLength) {
                break;
            }

            int end = Math.min(start + DEFAULT_CHILD_CHUNK_SIZE, textLength);

            if (end < textLength) {
                int boundary = findSentenceBoundary(parentText, end);
                if (boundary > start + (DEFAULT_CHILD_CHUNK_SIZE / 2)) {
                    end = boundary;
                } else {
                    end = snapToWordBoundary(parentText, end);
                }
            }

            String child = parentText.substring(start, end).trim();
            if (!child.isEmpty()) {
                children.add(child);
            }

            if (end >= textLength) {
                break;
            }

            int rawNextStart = Math.max(start + 1, end - DEFAULT_CHILD_OVERLAP);
            rawNextStart = snapToWordBoundary(parentText, rawNextStart);
            if (rawNextStart < textLength && rawNextStart > start + 1) {
                int boundary = findSentenceBoundary(parentText, rawNextStart);
                if (boundary > start && boundary < end) {
                    start = boundary;
                } else {
                    start = rawNextStart;
                }
            } else {
                start = rawNextStart;
            }
            start = snapToWordBoundary(parentText, start);
        }

        return children;
    }

    private int findSentenceBoundary(String text, int targetIndex) {
        int windowStart = Math.max(0, targetIndex - 80);
        int windowEnd = Math.min(text.length(), targetIndex + 30);

        int bestIndex = -1;
        for (int i = targetIndex; i >= windowStart; i--) {
            char c = text.charAt(i);
            if (c == '\n') {
                bestIndex = i + 1;
                break;
            }
            if ((c == '.' || c == '?' || c == '!') && isSentenceEnding(text, i)) {
                bestIndex = i + 1;
                break;
            }
        }

        if (bestIndex == -1) {
            for (int i = targetIndex; i < windowEnd; i++) {
                char c = text.charAt(i);
                if (c == '\n') {
                    bestIndex = i + 1;
                    break;
                }
                if ((c == '.' || c == '?' || c == '!') && isSentenceEnding(text, i)) {
                    bestIndex = i + 1;
                    break;
                }
            }
        }

        if (bestIndex != -1) {
            return snapToWordBoundary(text, bestIndex);
        }

        for (int i = targetIndex; i >= Math.max(0, targetIndex - 60); i--) {
            if (Character.isWhitespace(text.charAt(i))) {
                return snapToWordBoundary(text, i);
            }
        }
        for (int i = targetIndex; i < Math.min(text.length(), targetIndex + 60); i++) {
            if (Character.isWhitespace(text.charAt(i))) {
                return snapToWordBoundary(text, i);
            }
        }

        return snapToWordBoundary(text, targetIndex);
    }

    private boolean isSentenceEnding(String text, int index) {
        if (index > 0 && index + 1 < text.length()) {
            char prev = text.charAt(index - 1);
            char next = text.charAt(index + 1);
            if (Character.isDigit(prev) && Character.isDigit(next)) {
                return false;
            }
        }
        return true;
    }

    private int snapToWordBoundary(String text, int index) {
        if (index <= 0) {
            return 0;
        }
        if (index >= text.length()) {
            return text.length();
        }

        if (isWordChar(text.charAt(index - 1)) && isWordChar(text.charAt(index))) {
            int forward = index;
            while (forward < text.length() && isWordChar(text.charAt(forward))) {
                forward++;
            }
            int backward = index;
            while (backward > 0 && isWordChar(text.charAt(backward - 1))) {
                backward--;
            }
            return (index - backward <= forward - index) ? backward : forward;
        }

        return index;
    }

    private boolean isWordChar(char c) {
        return Character.isLetterOrDigit(c) || c == '_';
    }

    private String buildContextPrefix(String fileName, String sectionTitle) {
        StringBuilder sb = new StringBuilder();
        sb.append("[Tài liệu: ").append(fileName);
        if (sectionTitle != null && !sectionTitle.trim().isEmpty()) {
            sb.append(" | Mục: ").append(sectionTitle);
        }
        sb.append("]\n");
        return sb.toString();
    }
}
