package com.springboot.MyTodoList.service;

import com.springboot.MyTodoList.model.TelegramMessage;
import com.springboot.MyTodoList.repository.TelegramAccountRepository;
import com.springboot.MyTodoList.repository.TelegramMessageRepository;
import java.util.ArrayList;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class TelegramMessageService {
    private static final Logger logger = LoggerFactory.getLogger(TelegramMessageService.class);
    private static final int MAX_EMBEDDING_TEXT_LENGTH = 3500;

    private final TelegramMessageRepository telegramMessageRepository;
    private final TelegramAccountRepository telegramAccountRepository;

    @PersistenceContext
    private EntityManager entityManager;

    @Value("${oracle.vector.embedding-model}")
    private String embeddingModelName;

    public TelegramMessageService(
        TelegramMessageRepository telegramMessageRepository,
        TelegramAccountRepository telegramAccountRepository
    ) {
        this.telegramMessageRepository = telegramMessageRepository;
        this.telegramAccountRepository = telegramAccountRepository;
    }

    @Transactional
    public void saveIncomingMessage(Long chatId, Integer messageId, Long telegramUserId, String messageText, Integer telegramTimestamp) {
        if (chatId == null || messageId == null || telegramUserId == null || messageText == null || messageText.isBlank()) {
            return;
        }

        if (!telegramAccountRepository.existsByTelegramUserId(telegramUserId)) {
            return;
        }

        if (telegramMessageRepository.existsByChatIdAndMessageId(chatId, messageId)) {
            return;
        }

        try {
            TelegramMessage telegramMessage = new TelegramMessage();
            telegramMessage.setChatId(chatId);
            telegramMessage.setMessageId(messageId);
            telegramMessage.setTelegramUserId(telegramUserId);
            telegramMessage.setMessageText(messageText);
            telegramMessage.setCreatedAt(toLocalDateTime(telegramTimestamp));
            TelegramMessage savedMessage = telegramMessageRepository.saveAndFlush(telegramMessage);
            populateEmbedding(savedMessage.getTelegramMessageID());
        } catch (Exception ex) {
            logger.warn("Unable to persist Telegram message chatId={} messageId={}", chatId, messageId, ex);
        }
    }

    public List<TelegramMessage> findRecentMessages(Long chatId, int limit) {
        if (chatId == null || limit <= 0) {
            return List.of();
        }

        List<TelegramMessage> recentMessages = telegramMessageRepository.findByChatIdOrderByCreatedAtDescMessageIdDesc(
            chatId,
            PageRequest.of(0, limit)
        );

        List<TelegramMessage> orderedMessages = new ArrayList<>(recentMessages);
        Collections.reverse(orderedMessages);
        return orderedMessages;
    }

    public List<TelegramMessage> findRelatedMessages(Long chatId, List<TelegramMessage> recentMessages, int limit) {
        if (chatId == null || recentMessages == null || recentMessages.isEmpty() || limit <= 0) {
            return List.of();
        }

        List<Long> excludedIds = recentMessages.stream()
            .map(TelegramMessage::getTelegramMessageID)
            .collect(Collectors.toList());

        String queryText = recentMessages.stream()
            .map(TelegramMessage::getMessageText)
            .filter(text -> text != null && !text.isBlank())
            .collect(Collectors.joining(" "));

        if (queryText.isBlank()) {
            return List.of();
        }

        queryText = truncateForEmbedding(queryText);

        try {
            String sql = "SELECT * " +
                "FROM telegram_message tm " +
                "WHERE tm.chatId = :chatId " +
                "AND tm.embedding IS NOT NULL " +
                "AND tm.telegramMessageID NOT IN (" + buildInClausePlaceholders(excludedIds.size()) + ") " +
                "ORDER BY VECTOR_DISTANCE(tm.embedding, TO_VECTOR(VECTOR_EMBEDDING(" + sanitizeModelName(embeddingModelName) +
                " USING :queryText AS data)), COSINE), tm.createdAt DESC, tm.messageId DESC " +
                "FETCH FIRST " + limit + " ROWS ONLY";

            Query query = entityManager.createNativeQuery(sql, TelegramMessage.class);
            query.setParameter("chatId", chatId);
            query.setParameter("queryText", queryText);
            for (int i = 0; i < excludedIds.size(); i++) {
                query.setParameter("excludedId" + i, excludedIds.get(i));
            }
            @SuppressWarnings("unchecked")
            List<TelegramMessage> matches = query.getResultList();
            return matches;
        } catch (Exception ex) {
            logger.warn("Unable to retrieve related Telegram messages for chatId={}", chatId, ex);
            return List.of();
        }
    }

    private void populateEmbedding(Long telegramMessageId) {
        if (telegramMessageId == null) {
            return;
        }
        try {
            String sql = "UPDATE telegram_message " +
                "SET embedding = TO_VECTOR(VECTOR_EMBEDDING(" + sanitizeModelName(embeddingModelName) + " USING SUBSTR(messageText, 1, " + MAX_EMBEDDING_TEXT_LENGTH + ") AS data)) " +
                "WHERE telegramMessageID = :telegramMessageId";
            entityManager.createNativeQuery(sql)
                .setParameter("telegramMessageId", telegramMessageId)
                .executeUpdate();
        } catch (Exception ex) {
            logger.warn("Unable to populate embedding for telegramMessageId={}", telegramMessageId, ex);
        }
    }

    private String buildInClausePlaceholders(int size) {
        return java.util.stream.IntStream.range(0, size)
            .mapToObj(i -> ":excludedId" + i)
            .collect(Collectors.joining(", "));
    }

    private String sanitizeModelName(String modelName) {
        if (modelName == null || !modelName.matches("[A-Za-z0-9_]+")) {
            throw new IllegalArgumentException("Invalid Oracle embedding model name");
        }
        return modelName;
    }

    private String truncateForEmbedding(String text) {
        if (text == null || text.length() <= MAX_EMBEDDING_TEXT_LENGTH) {
            return text;
        }
        return text.substring(0, MAX_EMBEDDING_TEXT_LENGTH);
    }

    private LocalDateTime toLocalDateTime(Integer telegramTimestamp) {
        if (telegramTimestamp == null) {
            return LocalDateTime.now();
        }
        return LocalDateTime.ofInstant(Instant.ofEpochSecond(telegramTimestamp.longValue()), ZoneOffset.UTC);
    }
}
