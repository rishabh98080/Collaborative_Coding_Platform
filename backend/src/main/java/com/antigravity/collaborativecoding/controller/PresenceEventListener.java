package com.antigravity.collaborativecoding.controller;

import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class PresenceEventListener {

    private final SimpMessagingTemplate messagingTemplate;

    // Maps sessionId -> RoomId
    private final Map<String, String> sessionToRoomMap = new ConcurrentHashMap<>();
    
    // Maps RoomId -> Map<SessionId, UserIdentity>
    private final Map<String, Map<String, UserIdentity>> roomUsers = new ConcurrentHashMap<>();

    private static final List<String> NAMES = Arrays.asList("Alpha", "Beta", "Gamma", "Delta", "Echo", "Falcon", "Ghost", "Hawk", "Maverick", "Nova");
    private static final List<String> EMOJIS = Arrays.asList("🐼", "🦊", "🚀", "🦄", "🐉", "🐧", "🐙", "🦁", "🐯", "🤖");
    private final Random random = new Random();

    public PresenceEventListener(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @EventListener
    public void handleSessionSubscribeEvent(SessionSubscribeEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String destination = accessor.getDestination();
        String sessionId = accessor.getSessionId();

        if (destination != null && destination.startsWith("/topic/presence/")) {
            String roomId = destination.substring("/topic/presence/".length());
            
            String name = accessor.getFirstNativeHeader("name");
            String emoji = accessor.getFirstNativeHeader("emoji");
            if (name == null) name = NAMES.get(random.nextInt(NAMES.size()));
            if (emoji == null) emoji = EMOJIS.get(random.nextInt(EMOJIS.size()));
            
            UserIdentity identity = new UserIdentity(name, emoji, sessionId);

            sessionToRoomMap.put(sessionId, roomId);
            roomUsers.computeIfAbsent(roomId, k -> new ConcurrentHashMap<>()).put(sessionId, identity);

            broadcastPresence(roomId);
        }
    }

    @EventListener
    public void handleSessionDisconnectEvent(SessionDisconnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = accessor.getSessionId();

        String roomId = sessionToRoomMap.remove(sessionId);
        if (roomId != null) {
            Map<String, UserIdentity> users = roomUsers.get(roomId);
            if (users != null) {
                users.remove(sessionId);
                if (users.isEmpty()) {
                    roomUsers.remove(roomId);
                } else {
                    broadcastPresence(roomId);
                }
            }
        }
    }

    private void broadcastPresence(String roomId) {
        Map<String, UserIdentity> users = roomUsers.get(roomId);
        if (users != null) {
            messagingTemplate.convertAndSend("/topic/presence/" + roomId, users.values());
        }
    }

    public static class UserIdentity {
        private String name;
        private String emoji;
        private String id;

        public UserIdentity(String name, String emoji, String id) {
            this.name = name;
            this.emoji = emoji;
            this.id = id;
        }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getEmoji() { return emoji; }
        public void setEmoji(String emoji) { this.emoji = emoji; }
        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
    }
}
