package com.springboot.MyTodoList.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "TELEGRAM_MESSAGE")
public class TelegramMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "TELEGRAMMESSAGEID")
    private Long telegramMessageID;

    @Column(name = "CHATID", nullable = false)
    private Long chatId;

    @Column(name = "MESSAGEID", nullable = false)
    private Integer messageId;

    @Column(name = "TELEGRAMUSERID", nullable = false)
    private Long telegramUserId;

    @Lob
    @Column(name = "MESSAGETEXT", nullable = false)
    private String messageText;

    @Column(name = "CREATEDAT", nullable = false)
    private LocalDateTime createdAt;

    public Long getTelegramMessageID() {
        return telegramMessageID;
    }

    public void setTelegramMessageID(Long telegramMessageID) {
        this.telegramMessageID = telegramMessageID;
    }

    public Long getChatId() {
        return chatId;
    }

    public void setChatId(Long chatId) {
        this.chatId = chatId;
    }

    public Integer getMessageId() {
        return messageId;
    }

    public void setMessageId(Integer messageId) {
        this.messageId = messageId;
    }

    public Long getTelegramUserId() {
        return telegramUserId;
    }

    public void setTelegramUserId(Long telegramUserId) {
        this.telegramUserId = telegramUserId;
    }

    public String getMessageText() {
        return messageText;
    }

    public void setMessageText(String messageText) {
        this.messageText = messageText;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
