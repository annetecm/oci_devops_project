package com.springboot.MyTodoList.service;

import com.springboot.MyTodoList.model.Task;
import com.springboot.MyTodoList.repository.TaskRepository;
import com.springboot.MyTodoList.util.TaskCreationState;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Service
public class TaskService {
    private final TaskRepository taskRepository;

    @Value("${bot.task.defaultProjectId:-1}")
    private int defaultProjectId;

    @Value("${bot.task.defaultDeveloperId:-1}")
    private int defaultDeveloperId;

    @Value("${bot.task.defaultTaskType:new-feature}")
    private String defaultTaskType;

    @Value("${bot.task.defaultPriority:MEDIUM}")
    private String defaultPriority;

    @Value("${bot.task.defaultEstimatedTime:1}")
    private int defaultEstimatedTime;

    @Value("${bot.task.defaultDeadlineDays:7}")
    private int defaultDeadlineDays;

    public TaskService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    public Task addTaskFromBot(String taskName) {
        if (defaultProjectId <= 0 || defaultDeveloperId <= 0) {
            throw new IllegalStateException("Missing bot.task.defaultProjectId or bot.task.defaultDeveloperId");
        }

        LocalDateTime now = LocalDateTime.now();
        Task task = new Task();
        task.setName(taskName);
        task.setDescription(taskName);
        task.setStatus("open");
        task.setTaskType(defaultTaskType);
        task.setStartDate(now);
        task.setDeadline(now.plusDays(defaultDeadlineDays));
        task.setDeveloperID(defaultDeveloperId);
        task.setEstimatedTime(defaultEstimatedTime);
        task.setPriority(defaultPriority);
        task.setProjectID(defaultProjectId);
        task.setCreatedAt(now);
        task.setUpdatedAt(now);
        return taskRepository.save(task);
    }

    public Task createTask(Task task) {
        LocalDateTime now = LocalDateTime.now();
        if (task.getStartDate() == null) {
            task.setStartDate(now);
        }
        task.setCreatedAt(now);
        task.setUpdatedAt(now);
        if (task.getStatus() == null || task.getStatus().isBlank()) {
            task.setStatus("open");
        }
        return taskRepository.save(task);
    }

    public List<Task> findAllTasks() {
        return taskRepository.findAll();
    }

    public List<Task> findPendingTasks() {
        return taskRepository.findPendingTasks();
    }

    public boolean isTelegramUserLinked(Long telegramUserId) {
        if (telegramUserId == null) {
            return false;
        }
        return taskRepository.countTelegramAccountByTelegramUserId(telegramUserId) > 0;
    }

    public boolean isTelegramUserDeveloper(Long telegramUserId) {
        if (telegramUserId == null) {
            return false;
        }
        return taskRepository.countDeveloperByTelegramUserId(telegramUserId) > 0;
    }

    public List<Task> findPendingTasksByTelegramUserId(Long telegramUserId) {
        if (telegramUserId == null) {
            return List.of();
        }
        return taskRepository.findPendingTasksByTelegramUserId(telegramUserId);
    }

    public Task createTaskFromBotWithAllFields(TaskCreationState state, Long telegramUserId) {
        // Resolve developer ID from Telegram user ID
        Integer developerID = taskRepository.findDeveloperIdByTelegramUserId(telegramUserId);
        if (developerID == null) {
            throw new IllegalStateException("Developer not found for Telegram user ID: " + telegramUserId);
        }

        LocalDateTime now = LocalDateTime.now();
        Task task = new Task();
        task.setName(state.getName());
        task.setDescription(state.getDescription());
        task.setStatus(state.getStatus());
        task.setTaskType(state.getTaskType());
        task.setStartDate(now);
        
        // Parse deadline from string (YYYY-MM-DD) to LocalDateTime
        try {
            LocalDate deadlineDate = LocalDate.parse(state.getDeadline());
            task.setDeadline(deadlineDate.atTime(LocalTime.of(23, 59, 59)));
        } catch (Exception e) {
            task.setDeadline(now.plusDays(7)); // fallback to 7 days from now
        }
        
        task.setDeveloperID(developerID);
        task.setEstimatedTime(state.getEstimatedTime());
        task.setPriority(state.getPriority());
        task.setProjectID(state.getProjectId());
        task.setSprint(state.getSprint());
        task.setCreatedAt(now);
        task.setUpdatedAt(now);
        
        return taskRepository.save(task);
    }

    public Optional<Task> findTaskById(int id) {
        return taskRepository.findById(id);
    }

    public void deleteTask(int id) {
        taskRepository.deleteCommentsByTaskId(id);
        taskRepository.deleteTaskLogsByTaskId(id);
        taskRepository.deleteById(id);
    }

    public Optional<Task> updateTask(int id, Task updates) {
        return taskRepository.findById(id).map(existing -> {
            if (updates.getName() != null) existing.setName(updates.getName());
            if (updates.getDescription() != null) existing.setDescription(updates.getDescription());
            if (updates.getStatus() != null) existing.setStatus(updates.getStatus());
            if (updates.getPriority() != null) existing.setPriority(updates.getPriority());
            if (updates.getDeadline() != null) existing.setDeadline(updates.getDeadline());
            if (updates.getEstimatedTime() != null) existing.setEstimatedTime(updates.getEstimatedTime());
            if (updates.getTimeSpent() != null) existing.setTimeSpent(updates.getTimeSpent());
            if (updates.getDeveloperID() != null) existing.setDeveloperID(updates.getDeveloperID());
            existing.setUpdatedAt(LocalDateTime.now());
            return taskRepository.save(existing);
        });
    }

    public Optional<Task> updateTaskStatus(int id, String status) {
        if (!"open".equals(status) && !"in_progress".equals(status) && !"closed".equals(status)) {
            throw new IllegalArgumentException("Invalid task status: " + status);
        }
        Optional<Task> taskOpt = taskRepository.findById(id);
        if (taskOpt.isEmpty()) {
            return Optional.empty();
        }
        Task task = taskOpt.get();
        task.setStatus(status);
        task.setUpdatedAt(LocalDateTime.now());
        return Optional.of(taskRepository.save(task));
    }
}
