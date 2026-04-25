package com.springboot.MyTodoList.dto;

public class OtpVerifyRequest {
    private String sessionToken;
    private String otp;

    public String getSessionToken() { return sessionToken; }
    public void setSessionToken(String sessionToken) { this.sessionToken = sessionToken; }

    public String getOtp() { return otp; }
    public void setOtp(String otp) { this.otp = otp; }
}
