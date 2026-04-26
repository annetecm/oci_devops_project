package com.springboot.MyTodoList.dto;

public class LoginStepResponse {
    private String sessionToken;
    private String message;

    public LoginStepResponse(String sessionToken, String message) {
        this.sessionToken = sessionToken;
        this.message = message;
    }

    public String getSessionToken() { return sessionToken; }
    public void setSessionToken(String sessionToken) { this.sessionToken = sessionToken; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
