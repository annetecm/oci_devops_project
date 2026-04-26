package com.springboot.MyTodoList.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "TELEGRAM_ACCOUNT")
public class TelegramAccount {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "TELEGRAMACCOUNTID")
    private Long telegramAccountID;

    @Column(name = "USERID", nullable = false)
    private Integer userID;

    @Column(name = "TELEGRAMUSERID", nullable = false)
    private Long telegramUserId;

    public Long getTelegramAccountID() {
        return telegramAccountID;
    }

    public void setTelegramAccountID(Long telegramAccountID) {
        this.telegramAccountID = telegramAccountID;
    }

    public Integer getUserID() {
        return userID;
    }

    public void setUserID(Integer userID) {
        this.userID = userID;
    }

    public Long getTelegramUserId() {
        return telegramUserId;
    }

    public void setTelegramUserId(Long telegramUserId) {
        this.telegramUserId = telegramUserId;
    }
}
