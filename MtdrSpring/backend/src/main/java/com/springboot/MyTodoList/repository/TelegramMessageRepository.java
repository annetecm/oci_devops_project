package com.springboot.MyTodoList.repository;

import com.springboot.MyTodoList.model.TelegramMessage;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import jakarta.transaction.Transactional;

@Repository
@Transactional
@EnableTransactionManagement
public interface TelegramMessageRepository extends JpaRepository<TelegramMessage, Long> {
    boolean existsByChatIdAndMessageId(Long chatId, Integer messageId);

    List<TelegramMessage> findByChatIdOrderByCreatedAtDescMessageIdDesc(Long chatId, Pageable pageable);
}
