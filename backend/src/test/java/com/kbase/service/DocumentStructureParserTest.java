package com.kbase.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class DocumentStructureParserTest {

    private DocumentStructureParser parser;

    @BeforeEach
    void setUp() {
        parser = new DocumentStructureParser();
    }

    @Test
    @DisplayName("Kiểm tra file CSV được chuyển đổi chính xác sang Markdown Table có dòng tiêu đề")
    void testParseCsvToMarkdownTable() {
        String csvContent = "Mã hàng,Tên hàng,Đơn giá\nSP01,Áo sơ mi,250000\nSP02,Quần tây,350000";

        String result = parser.parseToStructuredMarkdown(csvContent, "bang_gia.csv");

        assertTrue(result.contains("| Mã hàng | Tên hàng | Đơn giá |"));
        assertTrue(result.contains("| --- | --- | --- |"));
        assertTrue(result.contains("| SP01 | Áo sơ mi | 250000 |"));
        assertTrue(result.contains("| SP02 | Quần tây | 350000 |"));
    }

    @Test
    @DisplayName("Kiểm tra bảng biểu căn cột bằng nhiều khoảng trắng được chuẩn hóa sang Markdown Table")
    void testParseMultiSpaceColumnsToMarkdownTable() {
        String rawReport = """
                Báo cáo doanh số quý 1
                Tháng    Mục tiêu    Thực tế
                Tháng 1    100M    120M
                Tháng 2    150M    145M
                """;

        String result = parser.parseToStructuredMarkdown(rawReport, "bao_cao.pdf");

        assertTrue(result.contains("| Tháng | Mục tiêu | Thực tế |"));
        assertTrue(result.contains("| --- | --- | --- |"));
        assertTrue(result.contains("| Tháng 1 | 100M | 120M |"));
    }

    @Test
    @DisplayName("Kiểm tra loại bỏ các dòng số trang thừa thãi")
    void testFilterPageNumbers() {
        String content = """
                Đoạn văn trang trước.
                Trang 1 / 10
                Đoạn văn trang sau.
                """;

        String result = parser.parseToStructuredMarkdown(content, "tai_lieu.docx");

        assertFalse(result.contains("Trang 1 / 10"));
        assertTrue(result.contains("Đoạn văn trang trước."));
        assertTrue(result.contains("Đoạn văn trang sau."));
    }
}
