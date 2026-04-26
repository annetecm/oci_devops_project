package com.springboot.MyTodoList.service;

import com.springboot.MyTodoList.dto.LoginStepResponse;
import com.springboot.MyTodoList.dto.LoginSuccessResponse;
import com.springboot.MyTodoList.model.UserGeneral;
import com.springboot.MyTodoList.repository.UserGeneralRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Random;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private static final long OTP_EXPIRY_SECONDS = 300; // 5 minutes

    @Autowired
    private UserGeneralRepository userGeneralRepository;

    // Optional: only wired when spring.mail.host is configured
    @Autowired(required = false)
    private JavaMailSender mailSender;

    // sessionToken -> pending OTP session
    private final ConcurrentHashMap<String, OtpSession> otpStore = new ConcurrentHashMap<>();

    /**
     * Validates email+password, generates an OTP, sends it to the user's email,
     * and returns a session token for the OTP verification step.
     */
    public LoginStepResponse initiateLogin(String email, String password) {
        UserGeneral user = userGeneralRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));

        if (!user.getPassword().equals(password)) {
            throw new IllegalArgumentException("Invalid credentials");
        }

        String otp = String.format("%06d", new Random().nextInt(1_000_000));
        String sessionToken = UUID.randomUUID().toString();
        Instant expiry = Instant.now().plusSeconds(OTP_EXPIRY_SECONDS);

        otpStore.put(sessionToken, new OtpSession(otp, user.getUserId(), expiry));

        sendOtp(user.getEmail(), user.getName(), otp);

        return new LoginStepResponse(sessionToken, "OTP sent to " + maskEmail(user.getEmail()));
    }

    /**
     * Verifies the OTP for the given session token and returns the authenticated user's role info.
     */
    public LoginSuccessResponse verifyOtp(String sessionToken, String otp) {
        OtpSession session = otpStore.get(sessionToken);

        if (session == null || Instant.now().isAfter(session.expiry())) {
            otpStore.remove(sessionToken);
            throw new IllegalArgumentException("OTP expired or invalid. Please log in again.");
        }

        if (!session.otp().equals(otp)) {
            throw new IllegalArgumentException("Incorrect OTP. Please try again.");
        }

        otpStore.remove(sessionToken);

        Integer userId = session.userId();
        UserGeneral user = userGeneralRepository.findById(userId)
                .orElseThrow(() -> new IllegalStateException("User not found"));

        Integer developerId = userGeneralRepository.findDeveloperIdByUserId(userId);
        Integer managerId = userGeneralRepository.findManagerIdByUserId(userId);

        String role;
        if (developerId != null) {
            role = "developer";
        } else if (managerId != null) {
            role = "manager";
        } else {
            throw new IllegalStateException("User has no assigned role.");
        }

        String fullName = user.getName() + " " + user.getLastName();
        return new LoginSuccessResponse(role, userId, developerId, managerId, fullName);
    }

    private void sendOtp(String toEmail, String name, String otp) {
        log.info("OTP for user [{}]: {}", toEmail, otp);

        if (mailSender == null) {
            log.warn("No mail sender configured (spring.mail.host not set). OTP logged above.");
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject("Synkra – Your verification code");
            message.setText(
                "Hi " + name + ",\n\n" +
                "Your Synkra verification code is:\n\n" +
                "  " + otp + "\n\n" +
                "This code expires in 5 minutes. Do not share it with anyone.\n\n" +
                "– The Synkra Team"
            );
            mailSender.send(message);
            log.info("OTP email sent to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send OTP email to {}: {}", toEmail, e.getMessage());
        }
    }

    private String maskEmail(String email) {
        int at = email.indexOf('@');
        if (at <= 1) return email;
        return email.charAt(0) + "***" + email.substring(at);
    }

    // ─── Internal record to hold pending OTP sessions ─────────────────────────

    private record OtpSession(String otp, Integer userId, Instant expiry) {}
}
