package com.antigravity.collaborativecoding.postgres.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_last_sessions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserLastSession {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "code_content", columnDefinition = "TEXT")
    private String codeContent;

    @Column(name = "chat_transcript", columnDefinition = "TEXT")
    private String chatTranscript;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
