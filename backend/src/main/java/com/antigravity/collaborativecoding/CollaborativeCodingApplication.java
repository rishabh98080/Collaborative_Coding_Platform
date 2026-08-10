package com.antigravity.collaborativecoding;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.data.redis.repository.configuration.EnableRedisRepositories;

@SpringBootApplication
@EnableJpaRepositories(basePackages = "com.antigravity.collaborativecoding.postgres.repository")
@EnableRedisRepositories(basePackages = "com.antigravity.collaborativecoding.redis.repository")
public class CollaborativeCodingApplication {

    public static void main(String[] args) {
        SpringApplication.run(CollaborativeCodingApplication.class, args);
    }

}
