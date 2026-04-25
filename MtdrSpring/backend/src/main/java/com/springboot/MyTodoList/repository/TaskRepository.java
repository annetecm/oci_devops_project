package com.springboot.MyTodoList.repository;

import com.springboot.MyTodoList.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import jakarta.transaction.Transactional;
import java.util.List;

@Repository
@Transactional
@EnableTransactionManagement
public interface TaskRepository extends JpaRepository<Task, Integer> {

    @Query(value = "SELECT * FROM task WHERE status IN ('open', 'in_progress') ORDER BY deadline, taskID", nativeQuery = true)
    List<Task> findPendingTasks();

    @Query(value = "SELECT COUNT(*) FROM telegram_account ta WHERE ta.telegramUserId = :telegramUserId", nativeQuery = true)
    long countTelegramAccountByTelegramUserId(@Param("telegramUserId") Long telegramUserId);

    @Query(value = "SELECT COUNT(*) " +
        "FROM telegram_account ta " +
        "JOIN developer d ON d.userID = ta.userID " +
        "WHERE ta.telegramUserId = :telegramUserId", nativeQuery = true)
    long countDeveloperByTelegramUserId(@Param("telegramUserId") Long telegramUserId);

    @Query(value = "SELECT t.* " +
        "FROM task t " +
        "JOIN developer d ON d.developerID = t.developerID " +
        "JOIN telegram_account ta ON ta.userID = d.userID " +
        "WHERE ta.telegramUserId = :telegramUserId " +
        "AND t.status IN ('open', 'in_progress') " +
        "ORDER BY t.deadline, t.taskID", nativeQuery = true)
    List<Task> findPendingTasksByTelegramUserId(@Param("telegramUserId") Long telegramUserId);

    @Query(value = "SELECT d.developerID " +
        "FROM developer d " +
        "JOIN telegram_account ta ON ta.userID = d.userID " +
        "WHERE ta.telegramUserId = :telegramUserId", nativeQuery = true)
    Integer findDeveloperIdByTelegramUserId(@Param("telegramUserId") Long telegramUserId);

    @Modifying
    @Query(value = "DELETE FROM comments WHERE taskID = :taskId", nativeQuery = true)
    void deleteCommentsByTaskId(@Param("taskId") int taskId);

    @Modifying
    @Query(value = "DELETE FROM task_log WHERE taskID = :taskId", nativeQuery = true)
    void deleteTaskLogsByTaskId(@Param("taskId") int taskId);
}
