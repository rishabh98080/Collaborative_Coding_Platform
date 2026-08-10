package com.antigravity.collaborativecoding.controller;

import com.antigravity.collaborativecoding.postgres.entity.User;
import com.antigravity.collaborativecoding.postgres.entity.UserLastSession;
import com.antigravity.collaborativecoding.service.SessionService;
import com.antigravity.collaborativecoding.service.UserService;
import com.antigravity.collaborativecoding.util.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/sessions")
public class SessionController {

    private final SessionService sessionService;
    private final UserService userService;
    private final JwtUtil jwtUtil;

    public SessionController(SessionService sessionService, UserService userService, JwtUtil jwtUtil) {
        this.sessionService = sessionService;
        this.userService = userService;
        this.jwtUtil = jwtUtil;
    }

    @PostMapping("/last")
    public ResponseEntity<?> saveLastSession(@CookieValue("token") String token, @RequestBody SaveSessionRequest request) {
        String username = jwtUtil.extractUsername(token);
        
        Optional<User> userOpt = userService.getUserByUsername(username);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body("User not found");
        }
        
        sessionService.saveOrUpdateLastSession(userOpt.get().getId(), request.getCodeContent(), request.getChatTranscript());
        return ResponseEntity.ok("Session saved successfully");
    }

    @GetMapping("/last")
    public ResponseEntity<?> getLastSession(@CookieValue("token") String token) {
        String username = jwtUtil.extractUsername(token);
        
        Optional<User> userOpt = userService.getUserByUsername(username);
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(401).body("User not found");
        }
        
        Optional<UserLastSession> sessionOpt = sessionService.getLastSession(userOpt.get().getId());
        if (sessionOpt.isPresent()) {
            return ResponseEntity.ok(sessionOpt.get());
        } else {
            return ResponseEntity.status(404).body("No past session found");
        }
    }

    public static class SaveSessionRequest {
        private String codeContent;
        private String chatTranscript;

        public String getCodeContent() { return codeContent; }
        public void setCodeContent(String codeContent) { this.codeContent = codeContent; }
        public String getChatTranscript() { return chatTranscript; }
        public void setChatTranscript(String chatTranscript) { this.chatTranscript = chatTranscript; }
    }
}
