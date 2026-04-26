package com.springboot.MyTodoList.service;

import com.springboot.MyTodoList.model.TelegramMessage;
import com.springboot.MyTodoList.model.TelegramSummary;
import com.springboot.MyTodoList.repository.TelegramAccountRepository;
import com.springboot.MyTodoList.repository.TelegramSummaryRepository;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class TelegramSummaryService {
    
    private static final Logger logger = LoggerFactory.getLogger(TelegramSummaryService.class);
    private static final DateTimeFormatter MESSAGE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
    private static final String NONE_IDENTIFIED = "None identified";
    private static final int MAX_PROMPT_MESSAGE_LENGTH = 500;

    private final TelegramSummaryRepository telegramSummaryRepository;
    private final TelegramAccountRepository telegramAccountRepository;
    private final GeminiService geminiService;

    public TelegramSummaryService(
        TelegramSummaryRepository telegramSummaryRepository,
        TelegramAccountRepository telegramAccountRepository,
        GeminiService geminiService
    ) {
        this.telegramSummaryRepository = telegramSummaryRepository;
        this.telegramAccountRepository = telegramAccountRepository;
        this.geminiService = geminiService;
    }

    public TelegramSummary generateAndSaveSummary(Long chatId, Long requestedByTelegramUserId, int windowSize, List<TelegramMessage> recentMessages) {
        return generateAndSaveSummary(chatId, requestedByTelegramUserId, windowSize, recentMessages, List.of());
    }

    public TelegramSummary generateAndSaveSummary(
        Long chatId,
        Long requestedByTelegramUserId,
        int windowSize,
        List<TelegramMessage> recentMessages,
        List<TelegramMessage> relatedMessages
    ) {
        try {
            logger.info("Generating summary using Gemini API for chat {}", chatId);
            String llmResponse = geminiService.generateText(buildPrompt(recentMessages, relatedMessages));
            ParsedSummary parsedSummary = parseSummary(llmResponse);

            TelegramSummary summary = new TelegramSummary();
            summary.setChatId(chatId);
            summary.setRequestedByTelegramUserId(requestedByTelegramUserId);
            summary.setRequestedAt(LocalDateTime.now());
            summary.setWindowSize(windowSize);
            summary.setSummaryText(parsedSummary.getSummaryText());
            summary.setDecisionsText(toNullableSection(parsedSummary.getDecisionsText()));
            summary.setActionItemsText(toNullableSection(parsedSummary.getActionItemsText()));
            
            logger.info("Summary generated and saved successfully for chat {}", chatId);
            return telegramSummaryRepository.save(summary);
        } catch (Exception ex) {
            logger.error("Error generating summary using Gemini API for chat {}", chatId, ex);
            throw new RuntimeException("Failed to generate summary: " + ex.getMessage(), ex);
        }
    }

    public String buildPrompt(List<TelegramMessage> recentMessages, List<TelegramMessage> relatedMessages) {
        Map<Long, String> displayNamesByTelegramUserId = resolveDisplayNames(recentMessages, relatedMessages);
        StringBuilder prompt = new StringBuilder();
        prompt.append("You are summarizing a Telegram group discussion for a software team.\n");
        prompt.append("Reply only in English.\n");
        prompt.append("Return only one section with this exact heading:\n");
        prompt.append("Summary:\n- ...\n");
        prompt.append("Write a concise, readable summary in 2 to 5 bullet points.\n");
        prompt.append("Mention important commitments, due dates, and newly created tasks inside the summary when relevant.\n");
        prompt.append("Do not add Decisions or Action Items sections.\n");
        prompt.append("Do not repeat the title inside the bullet content.\n\n");
        prompt.append("Recent Messages:\n");

        for (TelegramMessage message : recentMessages) {
            appendPromptMessage(prompt, message, displayNamesByTelegramUserId);
        }

        prompt.append("\nRelated Older Context:\n");
        if (relatedMessages == null || relatedMessages.isEmpty()) {
            prompt.append("None identified.\n");
        } else {
            for (TelegramMessage message : relatedMessages) {
                appendPromptMessage(prompt, message, displayNamesByTelegramUserId);
            }
        }

        return prompt.toString();
    }

    private void appendPromptMessage(StringBuilder prompt, TelegramMessage message, Map<Long, String> displayNamesByTelegramUserId) {
        prompt.append("[")
            .append(message.getCreatedAt() != null ? message.getCreatedAt().format(MESSAGE_TIME_FORMATTER) : "unknown-time")
            .append("] ")
            .append(resolveDisplayName(message.getTelegramUserId(), displayNamesByTelegramUserId))
            .append(": ")
            .append(truncateForPrompt(message.getMessageText()))
            .append("\n");
    }

    private Map<Long, String> resolveDisplayNames(List<TelegramMessage> recentMessages, List<TelegramMessage> relatedMessages) {
        LinkedHashSet<Long> telegramUserIds = new LinkedHashSet<>();
        collectTelegramUserIds(telegramUserIds, recentMessages);
        collectTelegramUserIds(telegramUserIds, relatedMessages);

        if (telegramUserIds.isEmpty()) {
            return Map.of();
        }

        return telegramAccountRepository.findDisplayNamesByTelegramUserIds(List.copyOf(telegramUserIds)).stream()
            .filter(row -> row.getTelegramUserId() != null)
            .collect(Collectors.toMap(
                TelegramAccountRepository.TelegramUserDisplayProjection::getTelegramUserId,
                TelegramAccountRepository.TelegramUserDisplayProjection::getDisplayName,
                (left, right) -> left
            ));
    }

    private void collectTelegramUserIds(LinkedHashSet<Long> target, List<TelegramMessage> messages) {
        if (messages == null || messages.isEmpty()) {
            return;
        }

        messages.stream()
            .map(TelegramMessage::getTelegramUserId)
            .filter(id -> id != null)
            .forEach(target::add);
    }

    private String resolveDisplayName(Long telegramUserId, Map<Long, String> displayNamesByTelegramUserId) {
        if (telegramUserId == null) {
            return "Unknown user";
        }

        String displayName = displayNamesByTelegramUserId.get(telegramUserId);
        if (displayName == null || displayName.isBlank()) {
            return "User " + telegramUserId;
        }

        return displayName.trim();
    }

    private ParsedSummary parseSummary(String llmResponse) {
        ParsedSummary parsed = parseStructuredSections(llmResponse);
        String summary = parsed.getSummaryText();

        if (summary == null || summary.isBlank()) {
            summary = llmResponse == null || llmResponse.isBlank() ? "Summary unavailable." : llmResponse.trim();
        }

        return new ParsedSummary(normalizeEmpty(summary), null, null);
    }

    private ParsedSummary parseStructuredSections(String input) {
        if (input == null || input.isBlank()) {
            return new ParsedSummary(null, null, null);
        }

        String normalized = input
            .replace("\r\n", "\n")
            .replace("```markdown", "")
            .replace("```text", "")
            .replace("```", "")
            .trim();

        String currentSection = null;
        List<String> summaryLines = new ArrayList<>();
        List<String> decisionLines = new ArrayList<>();
        List<String> actionItemLines = new ArrayList<>();

        for (String rawLine : normalized.split("\n")) {
            String line = rawLine == null ? "" : rawLine.trim();
            if (line.isBlank()) {
                continue;
            }

            String detectedSection = detectSection(line);
            if (detectedSection != null) {
                currentSection = detectedSection;
                String remainder = stripSectionHeading(line, detectedSection);
                if (!remainder.isBlank()) {
                    appendSectionLine(currentSection, remainder, summaryLines, decisionLines, actionItemLines);
                }
                continue;
            }

            if (currentSection != null) {
                appendSectionLine(currentSection, line, summaryLines, decisionLines, actionItemLines);
            }
        }

        return new ParsedSummary(
            cleanSectionText(summaryLines),
            cleanSectionText(decisionLines),
            cleanSectionText(actionItemLines)
        );
    }

    private String detectSection(String line) {
        String cleaned = normalizeHeadingText(line);
        if (cleaned.matches("(?i)^summary\\s*:?.*$")) {
            return "Summary";
        }
        if (cleaned.matches("(?i)^decisions\\s*:?.*$")) {
            return "Decisions";
        }
        if (cleaned.matches("(?i)^action\\s+items\\s*:?.*$")) {
            return "Action Items";
        }
        return null;
    }

    private String stripSectionHeading(String line, String sectionName) {
        String withoutMarkdown = line
            .replaceAll("^[#\\-*\\s]+", "")
            .replaceAll("[*_`#]+", "")
            .trim();

        String pattern;
        switch (sectionName) {
            case "Summary":
                pattern = "(?i)^summary\\s*:?\\s*";
                break;
            case "Decisions":
                pattern = "(?i)^decisions\\s*:?\\s*";
                break;
            case "Action Items":
                pattern = "(?i)^action\\s+items\\s*:?\\s*";
                break;
            default:
                pattern = "^";
                break;
        }

        return withoutMarkdown.replaceFirst(pattern, "").trim();
    }

    private String normalizeHeadingText(String line) {
        return line
            .replaceAll("^[#\\-*\\s]+", "")
            .replaceAll("[*_`#]+", "")
            .trim();
    }

    private void appendSectionLine(
        String sectionName,
        String line,
        List<String> summaryLines,
        List<String> decisionLines,
        List<String> actionItemLines
    ) {
        switch (sectionName) {
            case "Summary":
                summaryLines.add(line);
                break;
            case "Decisions":
                decisionLines.add(line);
                break;
            case "Action Items":
                actionItemLines.add(line);
                break;
            default:
                break;
        }
    }

    private String cleanSectionText(List<String> lines) {
        if (lines == null || lines.isEmpty()) {
            return null;
        }

        List<String> cleanedLines = lines.stream()
            .map(this::sanitizeSectionLine)
            .filter(line -> !line.isBlank())
            .collect(Collectors.toList());

        if (cleanedLines.isEmpty()) {
            return null;
        }

        return String.join("\n", cleanedLines).trim();
    }

    private String sanitizeSectionLine(String line) {
        if (line == null) {
            return "";
        }

        String cleaned = line.trim();
        cleaned = cleaned.replaceAll("^[*_#\\s]+", "").trim();

        if (cleaned.matches("(?i)^summary\\s*:?.*$")
            || cleaned.matches("(?i)^decisions\\s*:?.*$")
            || cleaned.matches("(?i)^action\\s+items\\s*:?.*$")) {
            return "";
        }

        return cleaned;
    }

    private String toNullableSection(String sectionText) {
        if (sectionText == null || sectionText.isBlank() || NONE_IDENTIFIED.equalsIgnoreCase(sectionText.trim())) {
            return null;
        }
        return sectionText.trim();
    }

    private String normalizeEmpty(String sectionText) {
        if (sectionText == null || sectionText.isBlank()) {
            return NONE_IDENTIFIED;
        }
        return sectionText.trim();
    }

    private String truncateForPrompt(String text) {
        if (text == null || text.isBlank()) {
            return "";
        }
        if (text.length() <= MAX_PROMPT_MESSAGE_LENGTH) {
            return text;
        }
        return text.substring(0, MAX_PROMPT_MESSAGE_LENGTH) + "...";
    }

    private static class ParsedSummary {
        private final String summaryText;
        private final String decisionsText;
        private final String actionItemsText;

        private ParsedSummary(String summaryText, String decisionsText, String actionItemsText) {
            this.summaryText = summaryText;
            this.decisionsText = decisionsText;
            this.actionItemsText = actionItemsText;
        }

        private String getSummaryText() {
            return summaryText;
        }

        private String getDecisionsText() {
            return decisionsText;
        }

        private String getActionItemsText() {
            return actionItemsText;
        }
    }
}
