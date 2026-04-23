package com.springboot.MyTodoList.repository;

import com.springboot.MyTodoList.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.EnableTransactionManagement;

import jakarta.transaction.Transactional;

@Repository
@Transactional
@EnableTransactionManagement
public interface TaskRepository extends JpaRepository<Task, Integer> {

    @Modifying
    @Query(value = "DELETE FROM comments WHERE taskID = :taskId", nativeQuery = true)
    void deleteCommentsByTaskId(@Param("taskId") int taskId);

    @Modifying
    @Query(value = "DELETE FROM task_log WHERE taskID = :taskId", nativeQuery = true)
    void deleteTaskLogsByTaskId(@Param("taskId") int taskId);
}
