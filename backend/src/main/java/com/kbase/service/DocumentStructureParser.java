package com.kbase.service;

import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Service component responsible for transforming raw unstructured document text
 * into semantically structured Markdown, normalizing table columns and hierarchical headings.
 */
@Component
public class DocumentStructureParser {

    private static final Pattern PAGE_NUMBER_PATTERN = Pattern.compile("(?i)^(trang|page)\\s+[0-9]+(\\s*(/|của|of)\\s*[0-9]+)?$|^[-—~]\\s*[0-9]+\\s*[-—~]$");
    private static final Pattern CSV_LINE_PATTERN = Pattern.compile("^[^,\t\n]+([,\t][^,\t\n]+){2,}$");
    private static final Pattern MULTI_SPACE_PATTERN = Pattern.compile("\\s{3,}");

    /**
     * Converts unformatted document text into structured Markdown with preserved tables and clean headings.
     *
     * @param rawText extracted raw text from file parsers
     * @param fileName original file name to guide file-specific heuristics
     * @return structured and cleaned Markdown text
     */
    public String parseToStructuredMarkdown(String rawText, String fileName) {
        if (rawText == null || rawText.isBlank()) {
            return "";
        }

        String extension = extractExtension(fileName);
        if ("csv".equalsIgnoreCase(extension) || "tsv".equalsIgnoreCase(extension)) {
            return convertDelimitedToMarkdownTable(rawText, "tsv".equalsIgnoreCase(extension) ? "\t" : ",");
        }

        return enhanceGeneralDocumentStructure(rawText);
    }

    private String enhanceGeneralDocumentStructure(String rawText) {
        String normalized = rawText.replace("\r\n", "\n").replace("\r", "\n");
        normalized = normalized.replace("\u00AD", "");
        normalized = normalized.replaceAll("(?m)([a-zA-ZĐđÀ-ỹ]+)-\\s*\\n\\s*([a-zA-ZĐđÀ-ỹ]+)", "$1$2");
        String[] lines = normalized.split("\n");
        List<String> outputLines = new ArrayList<>();
        List<String> tableBuffer = new ArrayList<>();

        for (String line : lines) {
            String trimmed = line.trim();

            if (PAGE_NUMBER_PATTERN.matcher(trimmed).matches()) {
                continue;
            }

            if (isLikelyTableRow(trimmed)) {
                tableBuffer.add(trimmed);
            } else {
                if (!tableBuffer.isEmpty()) {
                    outputLines.addAll(flushTableBuffer(tableBuffer));
                    tableBuffer.clear();
                }
                outputLines.add(line);
            }
        }

        if (!tableBuffer.isEmpty()) {
            outputLines.addAll(flushTableBuffer(tableBuffer));
        }

        return String.join("\n", outputLines);
    }

    private boolean isLikelyTableRow(String line) {
        if (line.isEmpty() || line.length() < 5) {
            return false;
        }
        if (line.startsWith("|") && line.endsWith("|")) {
            return true;
        }
        return MULTI_SPACE_PATTERN.matcher(line).find() && !line.startsWith("#") && !line.startsWith("- ");
    }

    private List<String> flushTableBuffer(List<String> tableLines) {
        if (tableLines.size() < 2) {
            return tableLines;
        }

        if (tableLines.get(0).startsWith("|") && tableLines.get(0).endsWith("|")) {
            return tableLines;
        }

        List<String[]> parsedRows = new ArrayList<>();
        int maxColumns = 0;

        for (String line : tableLines) {
            String[] cells = MULTI_SPACE_PATTERN.split(line);
            if (cells.length > 1) {
                parsedRows.add(cells);
                maxColumns = Math.max(maxColumns, cells.length);
            }
        }

        if (parsedRows.size() < 2 || maxColumns < 2) {
            return tableLines;
        }

        List<String> markdownTable = new ArrayList<>();
        for (int r = 0; r < parsedRows.size(); r++) {
            String[] row = parsedRows.get(r);
            StringBuilder sb = new StringBuilder("|");
            for (int c = 0; c < maxColumns; c++) {
                String cellValue = (c < row.length) ? row[c].trim() : "";
                sb.append(" ").append(cellValue).append(" |");
            }
            markdownTable.add(sb.toString());

            if (r == 0) {
                StringBuilder separator = new StringBuilder("|");
                for (int c = 0; c < maxColumns; c++) {
                    separator.append(" --- |");
                }
                markdownTable.add(separator.toString());
            }
        }

        return markdownTable;
    }

    private String convertDelimitedToMarkdownTable(String content, String delimiter) {
        String[] lines = content.replace("\r\n", "\n").split("\n");
        List<String> markdown = new ArrayList<>();
        int columnCount = 0;

        for (int i = 0; i < lines.length; i++) {
            String line = lines[i].trim();
            if (line.isEmpty()) {
                continue;
            }

            String[] cells = line.split(Pattern.quote(delimiter), -1);
            if (i == 0) {
                columnCount = cells.length;
            }

            StringBuilder sb = new StringBuilder("|");
            for (int c = 0; c < columnCount; c++) {
                String val = (c < cells.length) ? cells[c].trim().replace("|", "\\|") : "";
                sb.append(" ").append(val).append(" |");
            }
            markdown.add(sb.toString());

            if (i == 0) {
                StringBuilder sep = new StringBuilder("|");
                for (int c = 0; c < columnCount; c++) {
                    sep.append(" --- |");
                }
                markdown.add(sep.toString());
            }
        }

        return String.join("\n", markdown);
    }

    private String extractExtension(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            return "";
        }
        return fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase();
    }
}
