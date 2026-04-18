package com.springboot.MyTodoList.service;

import com.springboot.MyTodoList.model.Developer;
import com.springboot.MyTodoList.model.Task;
import com.springboot.MyTodoList.repository.DeveloperRepository;
import com.springboot.MyTodoList.repository.TaskRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final TaskRepository taskRepository;
    private final DeveloperRepository developerRepository;

    public DashboardService(TaskRepository taskRepository, DeveloperRepository developerRepository) {
        this.taskRepository = taskRepository;
        this.developerRepository = developerRepository;
    }

    public static class DeveloperStats {
        private Integer developerID;
        private Integer userID;
        private Integer teamID;
        private long assignedTasksCount;
        private long completedTasksCount;
        private int hoursWorked;
        private int estimatedHours;

        // Constructors, getters, setters
        public DeveloperStats() {}

        public DeveloperStats(Integer developerID, Integer userID, Integer teamID,
                            long assignedTasksCount, long completedTasksCount,
                            int hoursWorked, int estimatedHours) {
            this.developerID = developerID;
            this.userID = userID;
            this.teamID = teamID;
            this.assignedTasksCount = assignedTasksCount;
            this.completedTasksCount = completedTasksCount;
            this.hoursWorked = hoursWorked;
            this.estimatedHours = estimatedHours;
        }

        // Getters and setters
        public Integer getDeveloperID() { return developerID; }
        public void setDeveloperID(Integer developerID) { this.developerID = developerID; }

        public Integer getUserID() { return userID; }
        public void setUserID(Integer userID) { this.userID = userID; }

        public Integer getTeamID() { return teamID; }
        public void setTeamID(Integer teamID) { this.teamID = teamID; }

        public long getAssignedTasksCount() { return assignedTasksCount; }
        public void setAssignedTasksCount(long assignedTasksCount) { this.assignedTasksCount = assignedTasksCount; }

        public long getCompletedTasksCount() { return completedTasksCount; }
        public void setCompletedTasksCount(long completedTasksCount) { this.completedTasksCount = completedTasksCount; }

        public int getHoursWorked() { return hoursWorked; }
        public void setHoursWorked(int hoursWorked) { this.hoursWorked = hoursWorked; }

        public int getEstimatedHours() { return estimatedHours; }
        public void setEstimatedHours(int estimatedHours) { this.estimatedHours = estimatedHours; }
    }

    public static class SprintStats {
        private Integer sprintId;
        private Integer devId;
        private long assignedTasksCount;
        private long completedTasksCount;
        private int hoursWorked;

        // Constructors, getters, setters
        public SprintStats() {}

        public SprintStats(Integer sprintId, Integer devId, long assignedTasksCount,
                         long completedTasksCount, int hoursWorked) {
            this.sprintId = sprintId;
            this.devId = devId;
            this.assignedTasksCount = assignedTasksCount;
            this.completedTasksCount = completedTasksCount;
            this.hoursWorked = hoursWorked;
        }

        // Getters and setters
        public Integer getSprintId() { return sprintId; }
        public void setSprintId(Integer sprintId) { this.sprintId = sprintId; }

        public Integer getDevId() { return devId; }
        public void setDevId(Integer devId) { this.devId = devId; }

        public long getAssignedTasksCount() { return assignedTasksCount; }
        public void setAssignedTasksCount(long assignedTasksCount) { this.assignedTasksCount = assignedTasksCount; }

        public long getCompletedTasksCount() { return completedTasksCount; }
        public void setCompletedTasksCount(long completedTasksCount) { this.completedTasksCount = completedTasksCount; }

        public int getHoursWorked() { return hoursWorked; }
        public void setHoursWorked(int hoursWorked) { this.hoursWorked = hoursWorked; }
    }

    public static class SprintInfo {
        private Integer id;
        private String name;

        // Constructors, getters, setters
        public SprintInfo() {}

        public SprintInfo(Integer id, String name) {
            this.id = id;
            this.name = name;
        }

        // Getters and setters
        public Integer getId() { return id; }
        public void setId(Integer id) { this.id = id; }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
    }

    public static class DashboardData {
        private List<DeveloperStats> developers;
        private List<SprintStats> sprintStats;
        private List<SprintInfo> sprints;
        private List<Task> tasks;

        // Constructors, getters, setters
        public DashboardData() {}

        public DashboardData(List<DeveloperStats> developers, List<SprintStats> sprintStats,
                           List<SprintInfo> sprints, List<Task> tasks) {
            this.developers = developers;
            this.sprintStats = sprintStats;
            this.sprints = sprints;
            this.tasks = tasks;
        }

        // Getters and setters
        public List<DeveloperStats> getDevelopers() { return developers; }
        public void setDevelopers(List<DeveloperStats> developers) { this.developers = developers; }

        public List<SprintStats> getSprintStats() { return sprintStats; }
        public void setSprintStats(List<SprintStats> sprintStats) { this.sprintStats = sprintStats; }

        public List<SprintInfo> getSprints() { return sprints; }
        public void setSprints(List<SprintInfo> sprints) { this.sprints = sprints; }

        public List<Task> getTasks() { return tasks; }
        public void setTasks(List<Task> tasks) { this.tasks = tasks; }
    }

    public DashboardData getManagerDashboard(Integer projectID) {
        List<Task> tasks;
        List<Developer> developers;

        if (projectID != null) {
            tasks = taskRepository.findAll().stream()
                    .filter(task -> projectID.equals(task.getProjectID()))
                    .collect(Collectors.toList());
            developers = developerRepository.findAll().stream()
                    .filter(dev -> tasks.stream().anyMatch(task -> dev.getDeveloperID().equals(task.getDeveloperID())))
                    .collect(Collectors.toList());
        } else {
            tasks = taskRepository.findAll();
            developers = developerRepository.findAll();
        }

        // Calculate developer stats
        List<DeveloperStats> developerStats = developers.stream()
                .map(dev -> {
                    List<Task> devTasks = tasks.stream()
                            .filter(task -> dev.getDeveloperID().equals(task.getDeveloperID()))
                            .collect(Collectors.toList());

                    long assignedCount = devTasks.size();
                    long completedCount = devTasks.stream()
                            .filter(task -> "completed".equals(task.getStatus()))
                            .count();
                    int hoursWorked = devTasks.stream()
                            .mapToInt(task -> task.getTimeSpent() != null ? task.getTimeSpent() : 0)
                            .sum();
                    int estimatedHours = devTasks.stream()
                            .mapToInt(task -> task.getEstimatedTime() != null ? task.getEstimatedTime() : 0)
                            .sum();

                    return new DeveloperStats(dev.getDeveloperID(), dev.getUserID(), dev.getTeamID(),
                                            assignedCount, completedCount, hoursWorked, estimatedHours);
                })
                .collect(Collectors.toList());

        // Calculate sprint stats (simplified - assuming sprint field exists)
        List<SprintStats> sprintStats = tasks.stream()
                .filter(task -> task.getSprint() != null)
                .collect(Collectors.groupingBy(task -> task.getSprint()))
                .entrySet().stream()
                .flatMap(entry -> {
                    Integer sprintId = entry.getKey();
                    List<Task> sprintTasks = entry.getValue();

                    return sprintTasks.stream()
                            .collect(Collectors.groupingBy(Task::getDeveloperID))
                            .entrySet().stream()
                            .map(devEntry -> {
                                Integer devId = devEntry.getKey();
                                List<Task> devSprintTasks = devEntry.getValue();

                                long assignedCount = devSprintTasks.size();
                                long completedCount = devSprintTasks.stream()
                                        .filter(task -> "completed".equals(task.getStatus()))
                                        .count();
                                int hoursWorked = devSprintTasks.stream()
                                        .mapToInt(task -> task.getTimeSpent() != null ? task.getTimeSpent() : 0)
                                        .sum();

                                return new SprintStats(sprintId, devId, assignedCount, completedCount, hoursWorked);
                            });
                })
                .collect(Collectors.toList());

        // Get unique sprints
        List<SprintInfo> sprints = tasks.stream()
                .filter(task -> task.getSprint() != null)
                .map(task -> new SprintInfo(task.getSprint(), "Sprint " + task.getSprint()))
                .distinct()
                .collect(Collectors.toList());

        return new DashboardData(developerStats, sprintStats, sprints, tasks);
    }

    public DashboardData getDeveloperDashboard(Integer developerID, Integer projectID) {
        List<Task> tasks = taskRepository.findAll().stream()
                .filter(task -> developerID.equals(task.getDeveloperID()))
                .filter(task -> projectID == null || projectID.equals(task.getProjectID()))
                .collect(Collectors.toList());

        // For developer dashboard, we still need the same structure but filtered
        // Developers list will contain only this developer
        Optional<Developer> developer = developerRepository.findById(developerID);
        List<DeveloperStats> developerStats = developer.map(dev -> {
            long assignedCount = tasks.size();
            long completedCount = tasks.stream()
                    .filter(task -> "completed".equals(task.getStatus()))
                    .count();
            int hoursWorked = tasks.stream()
                    .mapToInt(task -> task.getTimeSpent() != null ? task.getTimeSpent() : 0)
                    .sum();
            int estimatedHours = tasks.stream()
                    .mapToInt(task -> task.getEstimatedTime() != null ? task.getEstimatedTime() : 0)
                    .sum();

            return new DeveloperStats(dev.getDeveloperID(), dev.getUserID(), dev.getTeamID(),
                                    assignedCount, completedCount, hoursWorked, estimatedHours);
        }).map(List::of).orElse(List.of());

        // Sprint stats for this developer
        List<SprintStats> sprintStats = tasks.stream()
                .filter(task -> task.getSprint() != null)
                .collect(Collectors.groupingBy(task -> task.getSprint()))
                .entrySet().stream()
                .map(entry -> {
                    Integer sprintId = entry.getKey();
                    List<Task> sprintTasks = entry.getValue();

                    long assignedCount = sprintTasks.size();
                    long completedCount = sprintTasks.stream()
                            .filter(task -> "completed".equals(task.getStatus()))
                            .count();
                    int hoursWorked = sprintTasks.stream()
                            .mapToInt(task -> task.getTimeSpent() != null ? task.getTimeSpent() : 0)
                            .sum();

                    return new SprintStats(sprintId, developerID, assignedCount, completedCount, hoursWorked);
                })
                .collect(Collectors.toList());

        // Get unique sprints
        List<SprintInfo> sprints = tasks.stream()
                .filter(task -> task.getSprint() != null)
                .map(task -> new SprintInfo(task.getSprint(), "Sprint " + task.getSprint()))
                .distinct()
                .collect(Collectors.toList());

        return new DashboardData(developerStats, sprintStats, sprints, tasks);
    }

    public Optional<Task> getTask(Integer taskID) {
        return taskRepository.findById(taskID);
    }

    public Optional<Task> updateTask(Integer taskID, String status, Integer timeSpent) {
        Optional<Task> taskOpt = taskRepository.findById(taskID);
        if (taskOpt.isPresent()) {
            Task task = taskOpt.get();
            if (status != null) {
                task.setStatus(status);
            }
            if (timeSpent != null) {
                task.setTimeSpent(timeSpent);
            }
            task.setUpdatedAt(java.time.LocalDateTime.now());
            return Optional.of(taskRepository.save(task));
        }
        return Optional.empty();
    }
}