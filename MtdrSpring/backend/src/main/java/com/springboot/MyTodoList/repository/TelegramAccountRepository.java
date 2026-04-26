package com.springboot.MyTodoList.repository;

import com.springboot.MyTodoList.model.TelegramAccount;
import java.util.List;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import jakarta.transaction.Transactional;

@Repository
@Transactional
@EnableTransactionManagement
public interface TelegramAccountRepository extends JpaRepository<TelegramAccount, Long> {
    interface TelegramUserDisplayProjection {
        Long getTelegramUserId();
        String getDisplayName();
    }

    boolean existsByTelegramUserId(Long telegramUserId);

    @Query(value = "SELECT ta.TELEGRAMUSERID as telegramUserId, " +
        "COALESCE(NULLIF(TRIM(ug.NAME || ' ' || ug.LASTNAME), ''), 'User ' || TO_CHAR(ta.TELEGRAMUSERID)) as displayName " +
        "FROM TELEGRAM_ACCOUNT ta " +
        "LEFT JOIN USERGENERAL ug ON ug.USERID = ta.USERID " +
        "WHERE ta.TELEGRAMUSERID IN (:telegramUserIds)", nativeQuery = true)
    List<TelegramUserDisplayProjection> findDisplayNamesByTelegramUserIds(@Param("telegramUserIds") List<Long> telegramUserIds);
}
