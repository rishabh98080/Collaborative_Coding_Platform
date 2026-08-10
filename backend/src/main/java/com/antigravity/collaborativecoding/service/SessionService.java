package com.antigravity.collaborativecoding.service;

import com.antigravity.collaborativecoding.postgres.entity.UserLastSession;
import com.antigravity.collaborativecoding.postgres.repository.UserLastSessionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class SessionService {

    private final UserLastSessionRepository userLastSessionRepository;

    @Autowired
    public SessionService(UserLastSessionRepository userLastSessionRepository) {
        this.userLastSessionRepository = userLastSessionRepository;
    }

    @Transactional
    public void saveOrUpdateLastSession(Long userId, String codeContent, String chatTranscript) {
        UserLastSession session = userLastSessionRepository.findById(userId)
                .orElse(new UserLastSession());
                
        session.setUserId(userId);
        session.setCodeContent(codeContent);
        session.setChatTranscript(chatTranscript);
        session.setUpdatedAt(LocalDateTime.now());
        
        userLastSessionRepository.save(session);
    }

    public Optional<UserLastSession> getLastSession(Long userId) {
        return userLastSessionRepository.findById(userId);
    }
}
