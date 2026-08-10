package com.antigravity.collaborativecoding.redis.repository;

import com.antigravity.collaborativecoding.redis.entity.RoomState;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RoomStateRepository extends CrudRepository<RoomState, String> {
}
