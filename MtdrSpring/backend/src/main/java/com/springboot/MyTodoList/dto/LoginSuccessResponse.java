package com.springboot.MyTodoList.dto;

public class LoginSuccessResponse {
    private String role;
    private Integer userId;
    private Integer developerId;
    private Integer managerId;
    private String name;

    public LoginSuccessResponse(String role, Integer userId, Integer developerId, Integer managerId, String name) {
        this.role = role;
        this.userId = userId;
        this.developerId = developerId;
        this.managerId = managerId;
        this.name = name;
    }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public Integer getUserId() { return userId; }
    public void setUserId(Integer userId) { this.userId = userId; }

    public Integer getDeveloperId() { return developerId; }
    public void setDeveloperId(Integer developerId) { this.developerId = developerId; }

    public Integer getManagerId() { return managerId; }
    public void setManagerId(Integer managerId) { this.managerId = managerId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}
