package com.antigravity.collaborativecoding.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class HealthCheck {

    @GetMapping("/health")
    public ResponseEntity<String> health() {
        // Pure, simple 200 OK to tell the frontend "I'm awake!"
        return ResponseEntity.ok("OK");
    }
}
