package com.kbase.service;

import dev.langchain4j.data.segment.TextSegment;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class HierarchicalDocumentSplitterTest {

    private HierarchicalDocumentSplitter splitter;

    @BeforeEach
    void setUp() {
        splitter = new HierarchicalDocumentSplitter();
    }

    @Test
    @DisplayName("Kiểm tra hàm cleanText chuẩn hóa dấu xuống dòng và loại bỏ ký tự rác")
    void testCleanText_normalizesNewlinesAndRemovesNoise() {
        String input = "Dòng 1\r\nDòng 2\r\n\r\n\r\n\r\nDòng 3\u0000";
        String cleaned = splitter.cleanText(input);

        assertFalse(cleaned.contains("\r"));
        assertFalse(cleaned.contains("\u0000"));
        assertTrue(cleaned.contains("Dòng 1\nDòng 2\n\nDòng 3"));
    }

    @Test
    @DisplayName("Kiểm tra tài liệu rỗng hoặc null trả về danh sách rỗng")
    void testSplitDocument_emptyContentReturnsEmptyList() {
        HierarchicalDocumentSplitter.DocumentChunkConfig config = 
                new HierarchicalDocumentSplitter.DocumentChunkConfig("doc-1", "proj-1", "test.pdf");

        List<TextSegment> nullResult = splitter.splitDocument(null, config);
        List<TextSegment> emptyResult = splitter.splitDocument("   \n  ", config);

        assertTrue(nullResult.isEmpty());
        assertTrue(emptyResult.isEmpty());
    }

    @Test
    @DisplayName("Kiểm tra phân mảnh phân cấp Parent-Child và gắn Contextual Prefix Anthropic")
    void testSplitDocument_createsHierarchicalSegmentsWithMetadata() {
        String content = """
                # Giới thiệu hệ thống
                KBase là một nền tảng quản trị tri thức doanh nghiệp hiện đại.
                Nền tảng hỗ trợ lưu trữ và tra cứu tài liệu thông minh.
                
                # Điều 1: Phạm vi sử dụng
                Người dùng có thể tải lên các tài liệu PDF, Word và hình ảnh.
                Hệ thống sẽ tự động bóc tách và phân tích ngữ nghĩa.
                """;

        HierarchicalDocumentSplitter.DocumentChunkConfig config = 
                new HierarchicalDocumentSplitter.DocumentChunkConfig("doc-123", "proj-456", "Tai_lieu_KBase.pdf");

        List<TextSegment> segments = splitter.splitDocument(content, config);

        assertFalse(segments.isEmpty());

        for (TextSegment segment : segments) {
            String text = segment.text();
            assertTrue(text.startsWith("[Tài liệu: Tai_lieu_KBase.pdf"), "Mỗi child chunk phải có prefix tài liệu");
            assertEquals("doc-123", segment.metadata().getString("documentId"));
            assertEquals("proj-456", segment.metadata().getString("projectId"));
            assertNotNull(segment.metadata().getString("parentId"));
            assertNotNull(segment.metadata().getString("parentText"));
            assertNotNull(segment.metadata().getString("chunkIndex"));
        }
    }

    @Test
    @DisplayName("Kiểm tra phân mảnh tài liệu lớn vượt quá kích thước Parent và Child Chunk")
    void testSplitDocument_largeDocument_splitsIntoMultipleParentsAndChildren() {
        StringBuilder sb = new StringBuilder();
        sb.append("# Chương I: Tổng quan quy trình hoạt động\n\n");
        for (int i = 0; i < 25; i++) {
            sb.append("Đây là câu văn thứ ").append(i)
              .append(" giải thích chi tiết về quy trình nghiệp vụ với tham số số học 3.14 và phiên bản v2.0. ")
              .append("Hệ thống có khả năng tự động xử lý các tình huống phức tạp mà không bị gián đoạn hoạt động hay gặp sự cố!\n\n");
        }
        sb.append("## Mục 1.2: Các lưu ý đặc biệt khi sử dụng API?\n\n");
        for (int i = 0; i < 20; i++) {
            sb.append("Nội dung hướng dẫn chi tiết dành cho nhà phát triển số ").append(i)
              .append(" cần tuân thủ nghiêm ngặt theo các tiêu chuẩn bảo mật OWASP Top 10 và JWT token verification.\n\n");
        }

        HierarchicalDocumentSplitter.DocumentChunkConfig config = 
                new HierarchicalDocumentSplitter.DocumentChunkConfig("doc-999", "proj-999", "Large_Manual.md");

        List<TextSegment> segments = splitter.splitDocument(sb.toString(), config);

        assertNotNull(segments);
        assertTrue(segments.size() > 5, "Tài liệu dài phải được chia thành nhiều child segments");
        assertTrue(segments.stream().anyMatch(s -> s.metadata().getString("sectionTitle") != null));
    }
}
