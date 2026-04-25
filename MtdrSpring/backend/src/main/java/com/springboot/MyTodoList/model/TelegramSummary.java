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
@Table(name = "TELEGRAM_SUMMARY")
public class TelegramSummary {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "SUMMARYID")
    private Long summaryID;

    @Column(name = "CHATID", nullable = false)
    private Long chatId;

    @Column(name = "REQUESTEDBYTELEGRAMUSERID")
    private Long requestedByTelegramUserId;

    @Column(name = "REQUESTEDAT", nullable = false)
    private LocalDateTime requestedAt;

    @Column(name = "WINDOWSIZE", nullable = false)
    private Integer windowSize;

    @Lob
    @Column(name = "SUMMARYTEXT", nullable = false)
    private String summaryText;

    @Lob
    @Column(name = "DECISIONSTEXT")
    private String decisionsText;

    @Lob
    @Column(name = "ACTIONITEMSTEXT")
    private String actionItemsText;

    public Long getSummaryID() {
        return summaryID;
    }

    public void setSummaryID(Long summaryID) {
        this.summaryID = summaryID;
    }

    public Long getChatId() {
        return chatId;
    }

    public void setChatId(Long chatId) {
        this.chatId = chatId;
    }

    public Long getRequestedByTelegramUserId() {
        return requestedByTelegramUserId;
    }

    public void setRequestedByTelegramUserId(Long requestedByTelegramUserId) {
        this.requestedByTelegramUserId = requestedByTelegramUserId;
    }

    public LocalDateTime getRequestedAt() {
        return requestedAt;
    }

    public void setRequestedAt(LocalDateTime requestedAt) {
        this.requestedAt = requestedAt;
    }

    public Integer getWindowSize() {
        return windowSize;
    }

    public void setWindowSize(Integer windowSize) {
        this.windowSize = windowSize;
    }

    public String getSummaryText() {
        return summaryText;
    }

    public void setSummaryText(String summaryText) {
        this.summaryText = summaryText;
    }

    public String getDecisionsText() {
        return decisionsText;
    }

    public void setDecisionsText(String decisionsText) {
        this.decisionsText = decisionsText;
    }

    public String getActionItemsText() {
        return actionItemsText;
    }

    public void setActionItemsText(String actionItemsText) {
        this.actionItemsText = actionItemsText;
    }
}
