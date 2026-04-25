package com.springboot.MyTodoList.util;

public class TaskCreationState {
    private int step; // 1-8 for different stages
    private String name;
    private String description;
    private int projectId;
    private String taskType;
    private String priority;
    private int estimatedTime;
    private String deadline;
    private String status;
    private int sprint;

    public TaskCreationState() {
        this.step = 1;
        this.projectId = 1; // default
        this.status = "open"; // default
        this.sprint = 0; // default
    }

    public int getStep() {
        return step;
    }

    public void setStep(int step) {
        this.step = step;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public int getProjectId() {
        return projectId;
    }

    public void setProjectId(int projectId) {
        this.projectId = projectId;
    }

    public String getTaskType() {
        return taskType;
    }

    public void setTaskType(String taskType) {
        this.taskType = taskType;
    }

    public String getPriority() {
        return priority;
    }

    public void setPriority(String priority) {
        this.priority = priority;
    }

    public int getEstimatedTime() {
        return estimatedTime;
    }

    public void setEstimatedTime(int estimatedTime) {
        this.estimatedTime = estimatedTime;
    }

    public String getDeadline() {
        return deadline;
    }

    public void setDeadline(String deadline) {
        this.deadline = deadline;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public int getSprint() {
        return sprint;
    }

    public void setSprint(int sprint) {
        this.sprint = sprint;
    }

    public void nextStep() {
        this.step++;
    }

    public boolean isComplete() {
        return this.step > 8;
    }
}
