package com.springboot.MyTodoList.controller;

import com.springboot.MyTodoList.dto.LoginRequest;
import com.springboot.MyTodoList.dto.LoginStepResponse;
import com.springboot.MyTodoList.dto.LoginSuccessResponse;
import com.springboot.MyTodoList.dto.OtpVerifyRequest;
import com.springboot.MyTodoList.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    /**
     * Step 1 – Validate email+password and send a 6-digit OTP to the user's email.
     * Returns a session token that must be supplied in the verify-otp call.
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        if (request.getEmail() == null || request.getEmail().isBlank()
                || request.getPassword() == null || request.getPassword().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email and password are required."));
        }

        try {
            LoginStepResponse response = authService.initiateLogin(
                    request.getEmail().trim(), request.getPassword());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Step 2 – Verify the OTP. On success, returns the user's role, userId, and (if developer) developerId.
     */
    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody OtpVerifyRequest request) {
        if (request.getSessionToken() == null || request.getSessionToken().isBlank()
                || request.getOtp() == null || request.getOtp().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Session token and OTP are required."));
        }

        try {
            LoginSuccessResponse response = authService.verifyOtp(
                    request.getSessionToken().trim(), request.getOtp().trim());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}
