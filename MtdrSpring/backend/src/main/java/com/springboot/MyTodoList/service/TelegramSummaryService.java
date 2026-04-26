package com.springboot.MyTodoList.service;

import com.springboot.MyTodoList.model.TelegramMessage;
import com.springboot.MyTodoList.model.TelegramSummary;
import com.springboot.MyTodoList.repository.TelegramSummaryRepository;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.regex.Matcher;
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
    private final GeminiService geminiService;

    public TelegramSummaryService(TelegramSummaryRepository telegramSummaryRepository, GeminiService geminiService) {
        this.telegramSummaryRepository = telegramSummaryRepository;
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
        StringBuilder prompt = new StringBuilder();
        prompt.append("You are summarizing a Telegram group discussion for a software team.\n");
        prompt.append("Reply only in English.\n");
        prompt.append("Always return exactly these three sections with these headings:\n");
        prompt.append("Summary\nDecisions\nAction Items\n");
        prompt.append("If a section has no content, write 'None identified'.\n");
        prompt.append("Do not invent decisions or action items.\n\n");
        prompt.append("Recent Messages:\n");

        for (TelegramMessage message : recentMessages) {
            prompt.append("[")
                .append(message.getCreatedAt() != null ? message.getCreatedAt().format(MESSAGE_TIME_FORMATTER) : "unknown-time")
                .append("] User ")
                .append(message.getTelegramUserId())
                .append(": ")
                .append(truncateForPrompt(message.getMessageText()))
                .append("\n");
        }

        prompt.append("\nRelated Older Context:\n");
        if (relatedMessages == null || relatedMessages.isEmpty()) {
            prompt.append("None identified.\n");
        } else {
            for (TelegramMessage message : relatedMessages) {
                prompt.append("[")
                    .append(message.getCreatedAt() != null ? message.getCreatedAt().format(MESSAGE_TIME_FORMATTER) : "unknown-time")
                    .append("] User ")
                    .append(message.getTelegramUserId())
                    .append(": ")
                    .append(truncateForPrompt(message.getMessageText()))
                    .append("\n");
            }
        }

        return prompt.toString();
    }

    private ParsedSummary parseSummary(String llmResponse) {
        String summary = extractSection(llmResponse, "Summary", "Decisions");
        String decisions = extractSection(llmResponse, "Decisions", "Action Items");
        String actionItems = extractSection(llmResponse, "Action Items", null);

        if (summary == null || summary.isBlank()) {
            summary = llmResponse == null || llmResponse.isBlank() ? "Summary unavailable." : llmResponse.trim();
        }

        return new ParsedSummary(summary.trim(), normalizeEmpty(decisions), normalizeEmpty(actionItems));
    }

    private String extractSection(String input, String sectionName, String nextSectionName) {
        if (input == null || input.isBlank()) {
            return null;
        }

        String patternText;
        if (nextSectionName == null) {
            patternText = "(?is)(?:^|\\n)\\s*#*\\s*\\*{0,2}" + Pattern.quote(sectionName) + "\\*{0,2}\\s*:?\\s*(.*)$";
        } else {
            patternText = "(?is)(?:^|\\n)\\s*#*\\s*\\*{0,2}" + Pattern.quote(sectionName) + "\\*{0,2}\\s*:?\\s*(.*?)\\s*(?:\\n\\s*#*\\s*\\*{0,2}" + Pattern.quote(nextSectionName) + "\\*{0,2}\\s*:?)";
        }

        Matcher matcher = Pattern.compile(patternText).matcher(input);
        if (matcher.find()) {
            return matcher.group(1).trim();
        }
        return null;
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
