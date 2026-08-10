package com.antigravity.collaborativecoding.postgres.repository;

import com.antigravity.collaborativecoding.postgres.entity.UserLastSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserLastSessionRepository extends JpaRepository<UserLastSession, Long> {
}
